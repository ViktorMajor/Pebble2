import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  INSPECTION_DRAG_THRESHOLD_PX,
  INSPECTION_RADIANS_PER_PIXEL,
  SELECTED_PEBBLE_LIFT,
  SEND_PREPARATION_LIFT,
  inspectionRotationAfterDrag,
  isInspectionDrag,
} from '../src/features/bowl/bowlInteraction.ts';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const scene = read('src/features/bowl/BowlScene.tsx');
const screen = read('src/features/bowl/BowlScreen.tsx');
const fallback = read('src/features/bowl/BowlFallback.tsx');
const service = read('src/features/bowl/bowlService.ts');

test('horizontal inspection uses a deliberate threshold and permits a full turn', () => {
  assert.equal(INSPECTION_DRAG_THRESHOLD_PX, 6);
  assert.equal(INSPECTION_RADIANS_PER_PIXEL, 0.012);
  assert.equal(isInspectionDrag(20, 25), false);
  assert.equal(isInspectionDrag(20, 26), true);
  assert.ok(inspectionRotationAfterDrag(0, 600) > Math.PI * 2);
  assert.equal(inspectionRotationAfterDrag(1.2, -100), 0);
});

test('selection is singular, background-clearable, and lifted without camera orbit', () => {
  assert.equal(SELECTED_PEBBLE_LIFT, 0.84);
  assert.equal(SEND_PREPARATION_LIFT, 1.02);
  assert.match(scene, /selectedPebbleId === pebble\.id/);
  assert.match(scene, /onSelectedPebbleChange\?\.\(id\)/);
  assert.match(scene, /onBackgroundPress=\{clearSelection\}/);
  assert.match(scene, /onPointerMissed=\{\(\) => onSelectedPebbleChange\(null\)\}/);
  assert.match(scene, /currentPhase === 'preparing' \? SEND_PREPARATION_LIFT/);
  assert.match(scene, /currentPhase === 'selected' \|\| currentPhase === 'rotating' \? SELECTED_PEBBLE_LIFT/);
  assert.doesNotMatch(scene, /OrbitControls|camera\.rotation|camera\.zoom/);
});

test('rotation cancels send preparation and only a selected pebble starts the timer', () => {
  assert.match(scene, /if \(!selectedRef\.current\)[\s\S]*onSelect\(pebble\.id\)[\s\S]*return;/);
  assert.match(scene, /onPointerMove=\{move\}/);
  assert.match(scene, /if \(timer\.current\) clearTimeout\(timer\.current\);[\s\S]*targetInspectionYaw\.current = inspectionRotationAfterDrag/);
  assert.match(scene, /pointerMoved\.current \|\| !selectedRef\.current/);
  assert.match(scene, /HOLD_DURATION_MS/);
  assert.doesNotMatch(scene, /autoRotate|angularVelocity|setInterval/);
});

test('inspection angle stays client-local and secure transfer behavior is unchanged', () => {
  assert.doesNotMatch([scene, fallback, service].join('\n'), /rotation_angle|inspection_yaw|orientation_metadata/i);
  assert.match(service, /rpc\('send_pebble'/);
  assert.match(scene, /onSend\(pebble\.id\)/);
  assert.match(scene, /onTouch\(pebble\.transferEventId\)/);
});

test('screen-reader users receive explicit select and send actions', () => {
  assert.match(screen, /accessibilityState=\{\{selected\}\}/);
  assert.match(screen, /accessibilityActions=\{\[\{name:selected\?'send':'select'/);
  assert.match(screen, /onAccessibilityAction/);
  assert.match(screen, /actionName==='select'/);
  assert.match(screen, /actionName==='send'&&selected/);
  assert.match(fallback, /onSelectedPebbleChange\(null\)/);
});
