import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const tokenService = readFileSync(new URL('../src/features/notifications/pushTokenService.ts', import.meta.url), 'utf8');
const notificationHook = readFileSync(new URL('../src/features/notifications/usePushNotifications.ts', import.meta.url), 'utf8');
const deliveryFunction = readFileSync(
  new URL('../supabase/functions/deliver-pebble-push/index.ts', import.meta.url),
  'utf8',
);
const migration = readFileSync(
  new URL('../supabase/migrations/20260727105000_phase_7_push_notifications.sql', import.meta.url),
  'utf8',
);

test('device token writes remain owner-scoped and token reads are isolated', () => {
  assert.match(tokenService, /from\('device_push_tokens'\)\.upsert/);
  assert.match(migration, /device_push_tokens_select_own/);
  assert.match(migration, /using \(user_id = auth\.uid\(\)\)/);
  assert.doesNotMatch(tokenService, /\.select\(/);
});

test('push delivery happens in a protected server function', () => {
  assert.match(tokenService, /functions\.invoke\('deliver-pebble-push'/);
  assert.match(deliveryFunction, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(deliveryFunction, /auth\.getUser\(\)/);
  assert.match(deliveryFunction, /pebble\.sender_id !== userData\.user\.id/);
  assert.match(deliveryFunction, /pebble_push_deliveries/);
  assert.match(deliveryFunction, /pair\.status !== 'active'/);
  assert.match(deliveryFunction, /latestEvent\?\.id !== body\.pebbleId/);
  assert.match(deliveryFunction, /identity\?\.current_holder_id !== recipientMembership\.user_id/);
  assert.match(deliveryFunction, /https:\/\/exp\.host\/--\/api\/v2\/push\/send/);
  assert.match(deliveryFunction, /A pebble arrived\./);
  assert.doesNotMatch(deliveryFunction, /badge\s*:/);
  assert.doesNotMatch(tokenService, /SERVICE_ROLE|EXPO_PUSH|exp\.host/);
});

test('client notification handling covers permission, token changes, foreground, and app opening', () => {
  assert.match(notificationHook, /requestPermissionsAsync/);
  assert.match(notificationHook, /getExpoPushTokenAsync/);
  assert.match(notificationHook, /addPushTokenListener/);
  assert.match(notificationHook, /addNotificationReceivedListener/);
  assert.match(notificationHook, /addNotificationResponseReceivedListener/);
  assert.match(notificationHook, /getLastNotificationResponseAsync/);
  assert.doesNotMatch(notificationHook, /Come back|Respond now|waiting|streak|haven't sent/i);
});
