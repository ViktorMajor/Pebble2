import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const sendService = readFileSync(new URL('../src/features/shore/sendPebbleService.ts', import.meta.url), 'utf8');
const holdPebble = readFileSync(new URL('../src/features/shore/HoldPebble.tsx', import.meta.url), 'utf8');
const migration = readFileSync(
  new URL('../supabase/migrations/20260727100000_phase_4_real_pebble_sending.sql', import.meta.url),
  'utf8',
);

test('client sends pebbles through server-controlled RPC only', () => {
  assert.match(sendService, /rpc\('send_pebble'/);
  assert.doesNotMatch(sendService, /\.from\('pebbles'\)\.insert/);
  assert.doesNotMatch(sendService, /sender_id/);
});

test('hold interaction sends before departure animation', () => {
  assert.match(holdPebble, /onSend\(\)\s*\n\s*\.then\(animateDeparture\)/);
  assert.doesNotMatch(holdPebble, /onPress=\{.*send/i);
});

test('database send operation protects sender and duplicate behavior', () => {
  assert.match(migration, /revoke insert on public\.pebbles from authenticated/);
  assert.match(migration, /current_user_id uuid := auth\.uid\(\)/);
  assert.match(migration, /insert into public\.pebbles \(pair_id, sender_id\)/);
  assert.match(migration, /unique \(user_id, request_key\)/);
  assert.match(migration, /interval '2 seconds'/);
  assert.doesNotMatch(migration, /\bmessage\b|\bcontent\b|\bmetadata\b|\bcaption\b|\bemoji\b|\breaction\b/);
});
