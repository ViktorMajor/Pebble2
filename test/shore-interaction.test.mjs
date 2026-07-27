import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const holdPebbleSource = readFileSync(new URL('../src/features/shore/HoldPebble.tsx', import.meta.url), 'utf8');
const shoreTypesSource = readFileSync(new URL('../src/features/shore/shoreTypes.ts', import.meta.url), 'utf8');
const factorySource = readFileSync(new URL('../src/features/shore/pebbleFactory.ts', import.meta.url), 'utf8');
const shoreScreenSource = readFileSync(new URL('../src/features/shore/ShoreScreen.tsx', import.meta.url), 'utf8');

test('sending requires a deliberate hold of about one second', () => {
  assert.match(shoreTypesSource, /HOLD_DURATION_MS\s*=\s*1000/);
  assert.match(holdPebbleSource, /onPressIn=\{beginHold\}/);
  assert.match(holdPebbleSource, /onPressOut=\{endHold\}/);
  assert.doesNotMatch(holdPebbleSource, /onPress=\{.*complete/i);
});

test('incoming pebble touch stores only a boolean state', () => {
  assert.match(factorySource, /touched:\s*false/);
  assert.match(factorySource, /touched:\s*true/);
  assert.doesNotMatch(factorySource, /touchedAt|timestamp|Date\.now|new Date/);
  assert.doesNotMatch(shoreScreenSource, /touchedAt|timestamp|Date\.now|new Date/);
});

test('prototype source avoids forbidden interaction mechanics', () => {
  const combinedSource = [holdPebbleSource, factorySource, shoreScreenSource].join('\n').replace(/\.message/g, '');

  assert.doesNotMatch(combinedSource, /chat|message|reaction|streak|score|achievement|online|read receipt/i);
});
