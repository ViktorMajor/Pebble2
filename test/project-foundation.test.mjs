import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const tsconfig = JSON.parse(readFileSync(new URL('../tsconfig.json', import.meta.url), 'utf8'));

test('Expo Router is the application entrypoint', () => {
  assert.equal(packageJson.main, 'expo-router/entry');
});

test('strict TypeScript is enabled', () => {
  assert.equal(tsconfig.compilerOptions.strict, true);
});
