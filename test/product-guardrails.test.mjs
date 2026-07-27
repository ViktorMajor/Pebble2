import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { test } from 'node:test';

const forbiddenPebbleColumns = ['message', 'content', 'caption', 'emoji', 'reaction', 'read_at', 'seen_at', 'touched_at'];
const prohibitedVocabulary = ['streak', 'score', 'last seen', 'last online', 'active now', 'response time', 'relationship score'];
const suspiciousFeatureNames = ['ChatScreen', 'MessageComposer', 'ReactionPicker', 'Leaderboard', 'EngagementDashboard', 'RelationshipScore'];

function filesRecursively(directoryUrl) {
  return readdirSync(directoryUrl, { withFileTypes: true }).flatMap((entry) => {
    const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directoryUrl);
    return entry.isDirectory() ? filesRecursively(entryUrl) : [entryUrl];
  });
}

test('pebbles schema cannot acquire authored, reaction, or read-tracking columns', () => {
  const migrationDirectory = new URL('../supabase/migrations/', import.meta.url);
  const migrationFiles = filesRecursively(migrationDirectory).filter((file) => file.pathname.endsWith('.sql'));
  const baseSchema = readFileSync(
    migrationFiles.find((file) => file.pathname.endsWith('20260727090000_phase_2_base_schema.sql')),
    'utf8',
  );
  const pebblesDefinition = baseSchema.match(/create table public\.pebbles \(([\s\S]*?)\n\);/);

  assert.ok(pebblesDefinition, 'Expected the public.pebbles table definition.');

  for (const column of forbiddenPebbleColumns) {
    assert.doesNotMatch(pebblesDefinition[1], new RegExp(`\\b${column}\\b`, 'i'));
  }

  const laterMigrations = migrationFiles
    .filter((file) => !file.pathname.endsWith('20260727090000_phase_2_base_schema.sql'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');

  for (const column of forbiddenPebbleColumns) {
    assert.doesNotMatch(
      laterMigrations,
      new RegExp(`alter\\s+table\\s+public\\.pebbles[\\s\\S]{0,300}add\\s+column\\s+${column}\\b`, 'i'),
    );
  }
});

test('user-facing content is free of engagement and surveillance vocabulary', () => {
  const contentDirectory = new URL('../src/content/', import.meta.url);
  const contentFiles = filesRecursively(contentDirectory).filter((file) => ['.ts', '.tsx', '.json'].includes(extname(file.pathname)));

  assert.ok(contentFiles.length > 0, 'Expected at least one user-facing content file.');

  for (const file of contentFiles) {
    const content = readFileSync(file, 'utf8');
    for (const phrase of prohibitedVocabulary) {
      assert.doesNotMatch(content, new RegExp(phrase, 'i'), `${file.pathname} contains prohibited copy: ${phrase}`);
    }
  }
});

test('feature structure cannot introduce messaging or engagement surfaces', () => {
  const featureDirectory = new URL('../src/features/', import.meta.url);
  const featureFiles = filesRecursively(featureDirectory);

  for (const file of featureFiles) {
    const fileName = basename(file.pathname, extname(file.pathname));
    assert.ok(!suspiciousFeatureNames.includes(fileName), `Suspicious product feature: ${fileName}`);
  }
});
