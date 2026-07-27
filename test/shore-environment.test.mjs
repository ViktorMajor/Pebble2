import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const environmentSource = readFileSync(new URL('../src/features/shore/shoreEnvironment.ts', import.meta.url), 'utf8');
const shoreScreenSource = readFileSync(new URL('../src/features/shore/ShoreScreen.tsx', import.meta.url), 'utf8');

function lightFor(hour) {
  return hour < 6 || hour >= 20 ? 'night' : hour < 10 ? 'morning' : hour < 17 ? 'day' : 'sunset';
}

function seasonFor(month) {
  return month === 11 || month <= 1 ? 'winter' : month <= 4 ? 'spring' : month <= 7 ? 'summer' : 'autumn';
}

test('environment logic maps local calendar time to calm light and seasonal states', () => {
  assert.equal(lightFor(8), 'morning');
  assert.equal(lightFor(13), 'day');
  assert.equal(lightFor(18), 'sunset');
  assert.equal(lightFor(22), 'night');
  assert.equal(seasonFor(0), 'winter');
  assert.equal(seasonFor(4), 'spring');
  assert.equal(seasonFor(7), 'summer');
  assert.equal(seasonFor(10), 'autumn');
  assert.match(environmentSource, /date\.getHours\(\)/);
  assert.match(environmentSource, /date\.getMonth\(\)/);
});

test('environment rendering has no relationship or engagement input', () => {
  assert.match(shoreScreenSource, /useShoreEnvironment/);
  assert.match(shoreScreenSource, /ShoreFoundation color=\{environment\.foundation\}/);
  assert.match(environmentSource, /AppState\.addEventListener/);
  assert.doesNotMatch(environmentSource, /pebble|pair|activity|engagement|streak|response|count|score/i);
});
