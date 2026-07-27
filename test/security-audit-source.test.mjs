import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const config = readFileSync(new URL('../supabase/config.toml', import.meta.url), 'utf8');
const appEnvironment = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
const client = readFileSync(new URL('../src/lib/supabase.ts', import.meta.url), 'utf8');
const deliveryFunction = readFileSync(
  new URL('../supabase/functions/deliver-pebble-push/index.ts', import.meta.url),
  'utf8',
);
const deletionFunction = readFileSync(
  new URL('../supabase/functions/delete-pebble-account/index.ts', import.meta.url),
  'utf8',
);

test('Edge Functions require gateway JWT verification and independently authenticate callers', () => {
  assert.match(config, /\[functions\.deliver-pebble-push\]\s+verify_jwt = true/);
  assert.match(config, /\[functions\.delete-pebble-account\]\s+verify_jwt = true/);
  assert.match(deliveryFunction, /auth\.getUser\(\)/);
  assert.match(deletionFunction, /auth\.getUser\(\)/);
  assert.match(deliveryFunction, /uuidPattern\.test\(body\.pebbleId\)/);
});

test('mobile configuration exposes only publishable Supabase values', () => {
  assert.match(appEnvironment, /^EXPO_PUBLIC_SUPABASE_URL=/m);
  assert.match(appEnvironment, /^EXPO_PUBLIC_SUPABASE_ANON_KEY=/m);
  assert.doesNotMatch(appEnvironment, /SERVICE_ROLE|SUPABASE_SERVICE|EXPO_PUSH|PRIVATE_KEY/);
  assert.doesNotMatch(client, /SERVICE_ROLE|SUPABASE_SERVICE|EXPO_PUSH|PRIVATE_KEY/);
});

test('local Supabase operational analytics are disabled by product policy', () => {
  assert.match(config, /\[analytics\]\s+enabled = false/);
});
