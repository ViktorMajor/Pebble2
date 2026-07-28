import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { validateNativeSurface } from '../src/features/bowl/nativeSurfaceValidation.ts';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const scene = read('src/features/bowl/BowlScene.tsx');
const lab = read('src/features/bowl/BowlLabScreen.tsx');
const bowlRoute = read('app/(app)/bowl.tsx');
const pairingRoute = read('app/(app)/pairing.tsx');
const probeRoutes = ['app/gl-layout-probe.tsx', 'app/raw-glview-probe.tsx', 'app/r3f-viewport-probe.tsx'].map(read);

const nativeSnapshot = {
  logicalSize: { width: 375.4, height: 834.5 },
  expoBuffer: { width: 1220, height: 2712 },
  rendererBuffer: { width: 1219, height: 2712 },
  rendererPixelRatio: 3.2496,
  rendererViewport: { x: 0, y: 0, width: 375.4, height: 834.5 },
  rendererScissor: { x: 0, y: 0, width: 375.4, height: 834.5 },
  scissorTest: false,
};

test('native surface validation accepts the physically verified full renderer with rounding tolerance', () => {
  const result = validateNativeSurface(nativeSnapshot);
  assert.equal(result.bufferMatchesNativeSurface, true);
  assert.equal(result.viewportCoversRendererBuffer, true);
  assert.equal(result.scissorCoversRendererBuffer, true);
  assert.equal(result.completeNativeSurfaceCovered, true);
  assert.ok(Math.abs(result.nativeSurfacePixelRatio - 3.2496) < 0.001);
});

test('native surface validation rejects the verified capped-DPR partial buffer', () => {
  const result = validateNativeSurface({
    ...nativeSnapshot,
    rendererBuffer: { width: 506, height: 1126 },
    rendererPixelRatio: 1.35,
  });
  assert.equal(result.bufferMatchesNativeSurface, false);
  assert.equal(result.completeNativeSurfaceCovered, false);
});

test('enabled scissor must cover the complete renderer buffer', () => {
  const healthy = validateNativeSurface({ ...nativeSnapshot, scissorTest: true });
  const cropped = validateNativeSurface({
    ...nativeSnapshot,
    scissorTest: true,
    rendererScissor: { x: 0, y: 0, width: 160, height: 300 },
  });
  assert.equal(healthy.completeNativeSurfaceCovered, true);
  assert.equal(cropped.scissorCoversRendererBuffer, false);
  assert.equal(cropped.completeNativeSurfaceCovered, false);
});

test('BowlScene preserves native R3F DPR in CameraRig and Canvas initialization', () => {
  assert.doesNotMatch(scene, /setPixelRatio\s*\(/);
  assert.doesNotMatch(scene, /Math\.min\(PixelRatio\.get\(\),\s*(?:1\.35|1)\)/);
  assert.match(scene, /validateNativeSurface/);
  assert.match(scene, /context\.drawingBufferWidth/);
  assert.match(scene, /completeNativeSurfaceCovered/);
});

test('low-quality diagnostics reduce shadow cost without reducing renderer DPR', () => {
  assert.match(scene, /shadow-mapSize-width=\{diagnostics\?\.lowQuality \? 256 : 512\}/);
  assert.match(scene, /shadow-mapSize-height=\{diagnostics\?\.lowQuality \? 256 : 512\}/);
  assert.doesNotMatch(scene, /lowQuality[\s\S]{0,100}setPixelRatio|setPixelRatio[\s\S]{0,100}lowQuality/);
  assert.match(lab, /Low-quality diagnostic/);
});

test('repair introduces no screen-specific width workaround or camera compensation', () => {
  assert.doesNotMatch(scene, /translateX|scaleX|negativeMargin|deviceWidth|375\.4|1220|506|1126/);
  assert.match(scene, /new THREE\.PerspectiveCamera\(40, cameraAspectRatio, 0\.1, 60\)/);
  assert.match(scene, /calculateBowlFraming\(size\.width, size\.height\)/);
});

test('pointer interactions and production routes retain their existing architecture', () => {
  assert.match(scene, /onPointerDown=\{start\} onPointerUp=\{end\} onPointerOut=\{cancel\}/);
  assert.match(bowlRoute, /export default function BowlRoute/);
  assert.match(pairingRoute, /export default function PairingRoute/);
  assert.doesNotMatch([bowlRoute, pairingRoute].join('\n'), /setPixelRatio|nativeSurface|viewport workaround/i);
});

test('all renderer probes remain guarded from production', () => {
  for (const route of probeRoutes) assert.match(route, /if \(!__DEV__\) return <Redirect/);
});
