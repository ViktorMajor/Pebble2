import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const lifecycleService = readFileSync(new URL('../src/features/lifecycle/lifecycleService.ts', import.meta.url), 'utf8');
const shoreScreen = readFileSync(new URL('../src/features/shore/ShoreScreen.tsx', import.meta.url), 'utf8');
const lifecycleMigration = readFileSync(
  new URL('../supabase/migrations/20260727106000_phase_8_lifecycle.sql', import.meta.url),
  'utf8',
);
const deletionFunction = readFileSync(
  new URL('../supabase/functions/delete-pebble-account/index.ts', import.meta.url),
  'utf8',
);
const lifecycleDocument = readFileSync(new URL('../LIFECYCLE.md', import.meta.url), 'utf8');

test('shore closing is server-controlled and renders a static shore state', () => {
  assert.match(lifecycleService, /rpc\('close_shore'/);
  assert.match(lifecycleMigration, /delete from public\.pair_invites/);
  assert.match(lifecycleMigration, /status = 'closed'/);
  assert.match(lifecycleMigration, /status = 'closed'/);
  assert.match(shoreScreen, /t\('shore\.closed'\)/);
  assert.match(shoreScreen, /isClosed \? <Text/);
});

test('account deletion stays server-side and documents data minimization', () => {
  assert.match(lifecycleService, /functions\.invoke\('delete-pebble-account'/);
  assert.match(deletionFunction, /auth\.admin\.deleteUser/);
  assert.match(deletionFunction, /device_push_tokens/);
  assert.match(deletionFunction, /status: 'closed'/);
  assert.match(deletionFunction, /count === 0/);
  assert.match(deletionFunction, /device_push_tokens/);
  assert.match(lifecycleDocument, /Their sent pebbles are deleted/);
  assert.match(lifecycleDocument, /does not delete another person's profile/);
});
