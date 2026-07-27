import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const touchServiceSource = readFileSync(new URL('../src/features/shore/touchPebbleService.ts', import.meta.url), 'utf8');
const shoreScreenSource = readFileSync(new URL('../src/features/shore/ShoreScreen.tsx', import.meta.url), 'utf8');
const realtimeHookSource = readFileSync(new URL('../src/features/shore/useShorePebbles.ts', import.meta.url), 'utf8');
const touchMigration = readFileSync(
  new URL('../supabase/migrations/20260727103000_phase_5_touch_received_pebbles.sql', import.meta.url),
  'utf8',
);
const realtimeMigration = readFileSync(
  new URL('../supabase/migrations/20260727104000_phase_6_realtime_pebbles.sql', import.meta.url),
  'utf8',
);

test('touching uses the recipient-only server operation', () => {
  assert.match(touchServiceSource, /rpc\('touch_pebble'/);
  assert.doesNotMatch(touchServiceSource, /\.from\('pebbles'\)\.update/);
  assert.match(touchMigration, /revoke update \(touched\) on public\.pebbles from authenticated/);
  assert.match(touchMigration, /sender_id = current_user_id/);
  assert.match(touchMigration, /not public\.is_pair_member\(target_pebble\.pair_id, current_user_id\)/);
  assert.match(touchMigration, /old\.touched and not new\.touched/);
  assert.doesNotMatch(touchMigration, /touched_at/i);
});

test('shore receives pair-filtered realtime events and merges duplicates', () => {
  assert.match(realtimeHookSource, /filter: `pair_id=eq\.\$\{pairId\}`/);
  assert.match(realtimeHookSource, /mergePebble/);
  assert.match(realtimeHookSource, /existing\.touched && !next\.touched/);
  assert.match(realtimeHookSource, /AppState\.addEventListener/);
  assert.match(realtimeHookSource, /removeChannel\(channel\)/);
  assert.match(realtimeMigration, /add table public\.pebbles/);
});

test('shore touch feedback has no response-time or read-state UI', () => {
  assert.match(shoreScreenSource, /Haptics\.selectionAsync/);
  assert.doesNotMatch(shoreScreenSource, /touchedAt|seen at|read at|response time/i);
});
