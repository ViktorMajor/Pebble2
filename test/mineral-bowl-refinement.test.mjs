import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  assignPebblesToLayout,
  BOWL_LAYOUTS,
  estimateProjectedFootprintOverlap,
  IDENTITY_LAYOUT_ORDER,
  PEBBLE_LAYOUT_SCALE_MULTIPLIER,
} from '../src/features/bowl/bowlLayouts.ts';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const procedural = read('src/features/bowl/proceduralPebble.ts');
const scene = read('src/features/bowl/BowlScene.tsx');
const lab = read('src/features/bowl/BowlLabScreen.tsx');
const fallback = read('src/features/bowl/BowlFallback.tsx');
const packageJson = read('package.json');

const luminances = [0.2922, 0.2031, 0.1798, 0.1278, 0.2780, 0.0947];

test('zero-through-six layouts stay explicit, deterministic, open, and layered', () => {
  assert.equal(PEBBLE_LAYOUT_SCALE_MULTIPLIER, 1.15);
  assert.deepEqual(Object.keys(BOWL_LAYOUTS).map(Number), [0, 1, 2, 3, 4, 5, 6]);
  for (let count = 0; count <= 6; count += 1) {
    const layout = BOWL_LAYOUTS[count];
    assert.equal(layout.length, count);
    assert.ok(estimateProjectedFootprintOverlap(layout) <= 0.2, `count ${count} overlap`);
    for (const item of layout) {
      assert.ok(Math.hypot(item.position[0], item.position[2]) < 1.58);
      assert.ok(item.position.every(Number.isFinite));
      assert.ok(item.rotation.every(Number.isFinite));
    }
  }
  const six = BOWL_LAYOUTS[6];
  assert.ok(Math.max(...six.map((item) => item.position[1])) - Math.min(...six.map((item) => item.position[1])) >= 0.07);
  assert.equal(new Set(six.map((item) => item.layer)).size, 6);
});

test('identity-aware slot assignment is deterministic and alternates visual values', () => {
  assert.deepEqual(IDENTITY_LAYOUT_ORDER, [0, 5, 4, 3, 2, 1]);
  const pebbles = Array.from({ length: 6 }, (_, visualVariant) => ({ id: String(visualVariant), visualVariant }));
  const first = assignPebblesToLayout(pebbles);
  const second = assignPebblesToLayout([...pebbles].reverse());
  assert.deepEqual(first.map(({ pebble }) => pebble.visualVariant), second.map(({ pebble }) => pebble.visualVariant));
  assert.deepEqual(first.map(({ pebble }) => pebble.visualVariant), [...IDENTITY_LAYOUT_ORDER]);
  const adjacentSlotPairs = [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [1, 4], [2, 5]];
  for (const [a, b] of adjacentSlotPairs) {
    const variantA = first[a].pebble.visualVariant;
    const variantB = first[b].pebble.visualVariant;
    assert.ok(Math.abs(luminances[variantA] - luminances[variantB]) >= 0.02);
  }
});

test('mineral identities stay matte, restrained, distinct, and non-emissive at rest', () => {
  const identityBlock = procedural.slice(procedural.indexOf('export const PEBBLE_IDENTITIES'), procedural.indexOf('] as const;') + 11);
  const roughness = [...identityBlock.matchAll(/roughness: (0\.\d+)/g)].map((match) => Number(match[1]));
  const clearcoats = [...identityBlock.matchAll(/clearcoat: (0\.\d+)/g)].map((match) => Number(match[1]));
  const edge = [...identityBlock.matchAll(/edgeReflection: (0\.\d+)/g)].map((match) => Number(match[1]));
  assert.equal(roughness.length, 6);
  assert.ok(roughness.every((value) => value >= 0.76 && value <= 0.91));
  assert.ok(clearcoats.every((value) => value >= 0.005 && value <= 0.035));
  assert.ok(edge.every((value) => value >= 0.02 && value <= 0.05));
  assert.match(scene, /emissive=\{incoming \? '#A48F7D' : '#000000'\}/);
  assert.match(scene, /emissiveIntensity=\{incoming \? 0\.055 : 0\}/);
});

test('micro-normal textures are deterministic, cached, and reference-disposed', () => {
  assert.match(procedural, /generateMicroNormalData\(seed/);
  assert.match(procedural, /seededRandom\(seed \^ 0x51f15e\)/);
  assert.match(procedural, /new THREE\.DataTexture/);
  assert.match(procedural, /microNormalTextureCache\.get\(key\)/);
  assert.match(procedural, /entry\.references \+= 1/);
  assert.match(procedural, /current\.texture\.dispose\(\)/);
  assert.match(procedural, /microNormalTextureCache\.delete\(key\)/);
  assert.match(scene, /textureHandle\?\.release\(\)/);
  assert.doesNotMatch(packageJson, /normal-map|noise-texture|postprocessing/i);
});

test('every visual stone owns a non-interactive contact core and penumbra', () => {
  const shadow = scene.slice(scene.indexOf('function PebbleContactShadow'), scene.indexOf('function PebbleVisual'));
  assert.match(shadow, /shadowCoreScale/);
  assert.match(shadow, /shadowPenumbraScale/);
  assert.match(shadow, /shadowOpacity: \{ value: 0\.135 \}/);
  assert.match(shadow, /shadowOpacity: \{ value: 0\.045 \}/);
  assert.match(scene, /exp\(-radiusSquared\*softness\)/);
  assert.equal((shadow.match(/raycast=\{\(\) => undefined\}/g) ?? []).length, 2);
  assert.match(scene, /<PebbleContactShadow[\s\S]*<PebbleVisual/);
  assert.doesNotMatch(scene, /function ContactShadow/);
});

test('Bowl profile creates a finite deeper cavity and visible rim', () => {
  assert.match(procedural, /BOWL_INNER_FLOOR_Y = -0\.24/);
  assert.match(procedural, /BOWL_RIM_Y = 0\.69/);
  assert.match(procedural, /BOWL_CAVITY_DEPTH = BOWL_RIM_Y - BOWL_INNER_FLOOR_Y/);
  assert.match(procedural, /BOWL_RIM_THICKNESS = 0\.18/);
  assert.match(procedural, /BOWL_WIDTH_TO_DEPTH = 1\.14/);
  assert.match(procedural, /point\.x \*= irregularity \* BOWL_WIDTH_TO_DEPTH/);
  assert.match(procedural, /geometry\.computeVertexNormals\(\)/);
  assert.match(procedural, /geometry\.computeBoundingBox\(\)/);
  assert.match(procedural, /geometry\.computeBoundingSphere\(\)/);
  assert.match(procedural, /validBounds = bounds && Number\.isFinite/);
  assert.match(procedural, /validColors = vertexColors\.every\(Number\.isFinite\)/);
});

test('Bowl Lab keeps material inspection development-focused and collapsible', () => {
  assert.match(lab, /Object material inspection/);
  assert.match(lab, /expanded=\{materialExpanded\}/);
  for (const label of ['Current material', 'Flat color', 'No micro-normal', 'No edge reflection', 'Contact core only', 'Penumbra only', 'Hide contact shadows', 'Neutral white light']) {
    assert.match(lab, new RegExp(label));
  }
});

test('scope preserves native DPR, product data, and navigation', () => {
  assert.doesNotMatch([procedural, scene, lab, fallback].join('\n'), /setPixelRatio\s*\(/);
  assert.doesNotMatch([procedural, scene, fallback].join('\n'), /supabase|rpc\(|from\(['"]pair_pebbles/i);
  assert.doesNotMatch([procedural, scene, lab, fallback].join('\n'), /router\.|navigation\./);
});
