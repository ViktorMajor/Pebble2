import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const supabaseClient = readFileSync(new URL('../src/lib/supabase.ts', import.meta.url), 'utf8');
const appRoute = readFileSync(new URL('../app/index.tsx', import.meta.url), 'utf8');
const shoreRoute = readFileSync(new URL('../app/(app)/shore.tsx', import.meta.url), 'utf8');
const holdPebble = readFileSync(new URL('../src/features/shore/HoldPebble.tsx', import.meta.url), 'utf8');
const sendService = readFileSync(new URL('../src/features/shore/sendPebbleService.ts', import.meta.url), 'utf8');
const shoreScreen = readFileSync(new URL('../src/features/shore/ShoreScreen.tsx', import.meta.url), 'utf8');
const authService = readFileSync(new URL('../src/features/auth/authService.ts', import.meta.url), 'utf8');

test('sessions persist securely and root routing selects an authenticated route group', () => {
  assert.match(supabaseClient, /@react-native-async-storage\/async-storage/);
  assert.match(supabaseClient, /persistSession: true/);
  assert.match(supabaseClient, /storage: AsyncStorage/);
  assert.match(appRoute, /Redirect href="\/\(auth\)"/);
  assert.match(appRoute, /shore\.pairId \? '\/\(app\)\/shore' : '\/\(app\)\/pairing'/);
});

test('release flows keep authenticated routing and duplicate-send safeguards', () => {
  assert.match(shoreRoute, /useCurrentShore/);
  assert.match(holdPebble, /const sending = useRef\(false\)/);
  assert.match(holdPebble, /disabled=\{isSending\}/);
  assert.match(shoreScreen, /requestPebblePushDelivery\(sentPebble\.id\)\.catch/);
});

test('profile setup and request idempotency avoid client-side trust and weak randomness', () => {
  assert.match(authService, /data:\s*\{\s*display_name:/s);
  assert.doesNotMatch(authService, /from\('profiles'\)/);
  assert.match(sendService, /getRandomValues/);
  assert.doesNotMatch(sendService, /Math\.random/);
});
