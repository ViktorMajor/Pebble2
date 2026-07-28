import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const pairingService = readFileSync(new URL('../src/features/pairing/connectionService.ts', import.meta.url), 'utf8');
const pairingScreen = readFileSync(new URL('../src/features/pairing/PairingScreen.tsx', import.meta.url), 'utf8');
const migration = readFileSync(
  new URL('../supabase/migrations/20260727093000_phase_3_secure_pairing.sql', import.meta.url),
  'utf8',
);

test('pairing client uses server-controlled operations for mutations', () => {
  assert.match(pairingService, /rpc\('create_shore_with_invite'/);
  assert.match(pairingService, /rpc\('join_shore_with_invite'/);
  assert.doesNotMatch(pairingService, /\.from\('pairs'\)\.insert/);
  assert.doesNotMatch(pairingService, /\.from\('pair_members'\)\.insert/);
  assert.doesNotMatch(pairingService, /\.from\('pair_invites'\)/);
});

test('pairing UI does not generate or hash invitation tokens locally', () => {
  assert.doesNotMatch(pairingScreen, /Math\.random|randomUUID|getRandomValues|gen_random|digest\(/i);
});

test('invitation creator observes only membership completion before entering the bowl',()=>{
  assert.match(pairingScreen,/table: 'pair_members'/);
  assert.match(pairingScreen,/count: 'exact'/);
  assert.match(pairingScreen,/if \(\(count \?\? 0\) >= 2\) onPaired\(\)/);
});

test('invitation migration stores token hashes and not plaintext tokens', () => {
  const inviteTableDefinition = migration.slice(
    migration.indexOf('create table public.pair_invites'),
    migration.indexOf('create index pair_invites_pair_id_idx'),
  );

  assert.match(migration, /token_hash bytea not null unique/);
  assert.doesNotMatch(inviteTableDefinition, /\btoken\b text|\binvite_token\b text|\braw_token\b text/);
  assert.match(migration, /gen_random_bytes\(32\)/);
  assert.match(migration, /digest\(convert_to\(raw_token, 'utf8'\), 'sha256'\)/);
});
