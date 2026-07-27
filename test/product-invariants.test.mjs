import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const invariants = readFileSync(new URL('../PRODUCT_INVARIANTS.md', import.meta.url), 'utf8');

test('all non-negotiable product invariants are documented', () => {
  const invariantIds = [...invariants.matchAll(/^P([1-9]|1[0-6])\./gm)].map((match) => match[0]);

  assert.equal(invariantIds.length, 16);
  assert.equal(new Set(invariantIds).size, 16);
});

test('anti-chat and anti-engagement boundaries are explicit', () => {
  assert.match(invariants, /There must be no chat\./);
  assert.match(invariants, /There must be no streaks, scores, achievements or engagement mechanics\./);
  assert.match(invariants, /Pebble never exposes online presence\./);
});
