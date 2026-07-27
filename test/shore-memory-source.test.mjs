import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const memoryService = readFileSync(new URL('../src/features/shore/shoreMemoryService.ts', import.meta.url), 'utf8');
const memoryHook = readFileSync(new URL('../src/features/shore/useShorePebbles.ts', import.meta.url), 'utf8');
const foundation = readFileSync(new URL('../src/features/shore/ShoreFoundation.tsx', import.meta.url), 'utf8');
const shoreScreen = readFileSync(new URL('../src/features/shore/ShoreScreen.tsx', import.meta.url), 'utf8');
const migration = readFileSync(
  new URL('../supabase/migrations/20260727107000_phase_9_shore_memory.sql', import.meta.url),
  'utf8',
);

test('shore history uses bounded recent pebbles and a capped foundation', () => {
  assert.match(memoryService, /RECENT_PEBBLE_LIMIT = 24/);
  assert.match(memoryService, /MAX_FOUNDATION_PEBBLES = 96/);
  assert.match(memoryHook, /getShoreMemory/);
  assert.match(memoryHook, /slice\(0, RECENT_PEBBLE_LIMIT\)/);
  assert.match(foundation, /pointerEvents="none"/);
  assert.match(foundation, /Array\.from\(\{ length: visiblePebbles \}/);
});

test('shore memory remains spatial and does not expose engagement statistics', () => {
  assert.match(shoreScreen, /ShoreFoundation color=\{environment\.foundation\} density=\{foundationDensity\}/);
  assert.match(migration, /limit 24/);
  assert.match(migration, /least\(96/);
  const combined = [memoryService, memoryHook, foundation, shoreScreen].join('\n');
  assert.doesNotMatch(combined, /daily total|weekly total|percentage|response rate|streak|score|ranking|total pebbles/i);
});
