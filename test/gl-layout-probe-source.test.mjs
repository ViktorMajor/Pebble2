import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const screen = read('src/features/bowl/GLLayoutProbeScreen.tsx');
const scene = read('src/features/bowl/BowlScene.tsx');
const route = read('app/gl-layout-probe.tsx');
const settings = read('src/features/settings/SettingsScreen.tsx');

test('GL Layout Probe is isolated and development-only', () => {
  assert.match(route, /if \(!__DEV__\) return <Redirect/);
  assert.match(settings, /__DEV__[\s\S]*\/gl-layout-probe/);
  assert.doesNotMatch(screen, /ScrollView|Supabase|Pairing|useAppSession|application data/i);
  assert.equal((screen.match(/<BowlScene\b/g) ?? []).length, 1);
});

test('probe uses three deterministic mock pebbles and no application data', () => {
  assert.equal((screen.match(/id: 'gl-probe-/g) ?? []).length, 3);
  assert.match(screen, /visualSeed: 112358/);
  assert.match(screen, /visualSeed: 271828/);
  assert.match(screen, /visualSeed: 314159/);
  assert.match(screen, /disabled/);
  assert.match(screen, /reducedMotion/);
});

test('probe exposes every independent layout layer and renderer measurement', () => {
  for (const label of ['Window', 'Root red', 'Bowl parent green', 'Canvas RN blue', 'R3F size', 'GL buffer', 'Native DPR', 'Renderer DPR', 'Expo GL buffer', 'Renderer buffer', 'Native surface', 'Camera aspect', 'Renderer mounts', 'Status']) {
    assert.match(screen, new RegExp(label));
  }
  assert.match(scene, /onCanvasLayout/);
  assert.match(scene, /r3fWidth: size\.width/);
  assert.match(scene, /r3fHeight: size\.height/);
  assert.match(scene, /getDrawingBufferSize/);
  assert.match(scene, /cameraAspectRatio/);
  assert.match(scene, /devicePixelRatio: PixelRatio\.get\(\)/);
});

test('probe makes viewport boundaries visible without changing camera fitting', () => {
  assert.match(screen, /borderWidth: 2, borderColor: '#FF0000'/);
  assert.match(screen, /borderWidth: 2, borderColor: '#00A000'/);
  assert.match(scene, /borderWidth: 2, borderColor: '#0066FF'/);
  assert.equal((screen.match(/styles\.corner/g) ?? []).length, 4);
  assert.match(screen, /bowlParent: \{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0/);
  assert.match(scene, /calculateBowlFraming\(size\.width, size\.height\)/);
});
