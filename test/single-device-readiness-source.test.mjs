import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const onboarding = read('src/features/onboarding/OnboardingScreen.tsx');
const root = read('app/index.tsx');
const auth = read('src/features/auth/AuthScreen.tsx');
const shore = read('src/features/shore/ShoreScreen.tsx');
const en = read('src/i18n/en.ts');
const hu = read('src/i18n/hu.ts');

test('onboarding is local, skippable, persisted, and non-demanding', () => {
  assert.match(onboarding, /AsyncStorage\.setItem\(ONBOARDING_KEY, 'true'\)/);
  assert.match(onboarding, /t\('app\.skip'\)/);
  assert.match(root, /AsyncStorage\.getItem\(ONBOARDING_KEY\)/);
  assert.match(en, /Silence is allowed/);
  assert.match(hu, /A csendnek is van helye/);
});

test('auth and shore retain guarded, accessible single-device interactions', () => {
  assert.match(auth, /KeyboardAvoidingView/);
  assert.match(auth, /keyboardType="email-address"/);
  assert.match(auth, /password\.length >= 6/);
  assert.match(shore, /pebble\.origin !== 'other' \|\| pebble\.touched/);
  assert.match(shore, /touchingPebbleIds\.includes/);
  assert.match(shore, /t\('shore\.empty'\)/);
});
