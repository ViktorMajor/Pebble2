import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const i18n = read('src/i18n/index.tsx');
const en = read('src/i18n/en.ts');
const hu = read('src/i18n/hu.ts');
const routes = read('app/index.tsx');
const profile = read('src/features/profile/profileService.ts');
const connection = read('src/features/settings/ConnectionScreen.tsx');
const migration = read('supabase/migrations/20260727120000_phase_16_app_shell_connections.sql');

test('app shell separates auth and authenticated routes', () => {
  assert.match(routes, /\(auth\)/);
  assert.match(routes, /\(app\)\/bowl/);
  assert.match(read('app/(app)/settings/index.tsx'), /SettingsScreen/);
  assert.match(routes, /connectionComplete/);
});

test('localization persists preference and has English/Hungarian fallback resources', () => {
  assert.match(i18n, /AsyncStorage\.getItem/);
  assert.match(i18n, /AsyncStorage\.setItem/);
  assert.match(i18n, /deviceLanguage.*=== 'hu'/);
  assert.match(en, /Settings/);
  assert.match(hu, /Beállítások/);
});

test('profile validation and updates use the existing owner-scoped profile table', () => {
  assert.match(profile, /value\.trim\(\)/);
  assert.match(profile, /length >= 1 && displayName\.length <= 80/);
  assert.match(profile, /\.update\(\{ display_name/);
  assert.match(profile, /\.eq\('id', userData\.user\.id\)/);
});

test('connection management preserves history and creates no partner replacement workflow', () => {
  assert.match(connection, /pastConnections/);
  assert.match(connection, /beginNew/);
  assert.doesNotMatch(connection, /replace partner|change partner|transfer connection/i);
  assert.match(migration, /User already has an active shore/);
  assert.match(migration, /pg_advisory_xact_lock/);
});
