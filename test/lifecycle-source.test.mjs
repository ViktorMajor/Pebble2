import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const lifecycleService = readFileSync(new URL('../src/features/lifecycle/lifecycleService.ts', import.meta.url), 'utf8');
const bowlScreen = readFileSync(new URL('../src/features/bowl/BowlScreen.tsx', import.meta.url), 'utf8');
const lifecycleMigration = readFileSync(
  new URL('../supabase/migrations/20260727106000_phase_8_lifecycle.sql', import.meta.url),
  'utf8',
);
const deletionFunction = readFileSync(
  new URL('../supabase/functions/delete-pebble-account/index.ts', import.meta.url),
  'utf8',
);
const lifecycleDocument = readFileSync(new URL('../LIFECYCLE.md', import.meta.url), 'utf8');

test('connection closing is server-controlled and renders a static bowl state', () => {
  assert.match(lifecycleService, /rpc\('close_shore'/);
  assert.match(lifecycleMigration, /delete from public\.pair_invites/);
  assert.match(lifecycleMigration, /status = 'closed'/);
  assert.match(lifecycleMigration, /status = 'closed'/);
  assert.match(bowlScreen, /t\('bowl\.closed'\)/);
  assert.match(bowlScreen, /connectionStatus==='closed'/);
});

test('account deletion stays server-side and documents data minimization', () => {
  assert.match(lifecycleService, /functions\.invoke\('delete-pebble-account'/);
  assert.match(deletionFunction, /auth\.admin\.deleteUser/);
  assert.match(deletionFunction, /device_push_tokens/);
  assert.match(deletionFunction, /status: 'closed'/);
  assert.match(deletionFunction, /count === 0/);
  assert.match(deletionFunction, /device_push_tokens/);
  assert.match(lifecycleDocument, /Transfer events sent by the requester are removed/);
  assert.match(lifecycleDocument, /does not delete the other person's profile/);
});
