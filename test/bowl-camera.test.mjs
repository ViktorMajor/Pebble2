import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateBowlFraming, measuredBowlViewport } from '../src/features/bowl/bowlComposition.ts';

test('measured Bowl viewport ignores transient invalid Android layouts', () => {
  const valid = measuredBowlViewport(393, 873, null);
  assert.deepEqual(valid, { width: 393, height: 873 });
  assert.equal(measuredBowlViewport(0, 873, valid), valid);
  assert.equal(measuredBowlViewport(Number.NaN, 873, valid), valid);
  assert.equal(measuredBowlViewport(393, Number.POSITIVE_INFINITY, valid), valid);
  assert.equal(measuredBowlViewport(393.2, 873.2, valid), valid);
});

test('actual camera calculation fits narrow, tall, Redmi-like, small, and landscape viewports', () => {
  const viewports = [
    [320, 640],
    [360, 800],
    [393, 873],
    [412, 915],
    [800, 360],
  ];
  for (const [width, height] of viewports) {
    const framing = calculateBowlFraming(width, height);
    assert.equal(framing.projectedWidthRatio, 0.74, `${width}×${height} targets 74%`);
    assert.ok(framing.sideMargin >= 24, `${width}×${height} keeps horizontal breathing room`);
    assert.ok(Number.isFinite(framing.cameraDistance) && framing.cameraDistance > 0);
    assert.ok(framing.cameraPosition.every(Number.isFinite));
  }
});
