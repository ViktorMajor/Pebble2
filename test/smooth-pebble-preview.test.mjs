import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const preview = read('src/features/bowl/pairingPreview.ts');
const hero = read('src/features/pairing/PairingHero.tsx');
const scene = read('src/features/bowl/BowlScene.tsx');
const fallback = read('src/features/bowl/BowlFallback.tsx');
const geometry = read('src/features/bowl/proceduralPebble.ts');
const lab = read('src/features/bowl/BowlLabScreen.tsx');

test('pairing uses exactly three visual-only preview stones', () => {
  assert.equal((preview.match(/\{ previewKey:/g) ?? []).length, 3);
  assert.match(preview, /visualVariant: 4/);
  assert.match(preview, /visualVariant: 2/);
  assert.match(preview, /visualVariant: 1/);
  assert.doesNotMatch(preview, /HeldPebble|transferEventId|incoming|touched|Supabase|persist/i);
  assert.match(hero, /previewPebbles=\{PAIRING_PREVIEW_PEBBLES\}/);
  assert.match(hero, /pebbles=\{\[\]\}/);
});

test('pairing preview shares PebbleVisual but has no domain interaction', () => {
  const previewComponent = scene.slice(scene.indexOf('function PairingPreviewStones'), scene.indexOf('function Stone'));
  assert.match(previewComponent, /<PebbleVisual/);
  assert.doesNotMatch(previewComponent, /onPointer|onSend|onTouch|Haptics|HeldPebble/);
  assert.match(scene, /composition === 'pairing-single'[\s\S]*<PairingPreviewStones/);
  assert.match(scene, /composition === 'pairing-two'[\s\S]*<PairingPreviewStones[\s\S]*<SecondaryBowl/);
  assert.equal((scene.match(/<PairingPreviewStones/g) ?? []).length, 2);
  assert.match(scene, /composition === 'bowl' \? assignments\.map/);
  assert.doesNotMatch([hero, preview].join('\n'), /from ['"].*(supabase|bowlService|useHeldPebbles)/i);
});

test('fallback preview is passive and keeps the second bowl empty', () => {
  assert.match(fallback, /importantForAccessibility="no-hide-descendants"/);
  assert.match(fallback, /pointerEvents="none"/);
  assert.match(fallback, /previewPebbles\.slice\(0, 3\)\.map/);
  const passivePreview = fallback.slice(fallback.indexOf("{composition !== 'bowl' ?"), fallback.indexOf('<View pointerEvents="none" style={styles.frontRim}'));
  assert.doesNotMatch(passivePreview, /Pressable|begin\(|end\(/);
  assert.match(fallback, /composition === 'pairing-two' \? <View pointerEvents="none" style=\{\[styles\.secondBowl/);
});

test('standard and diagnostic quality are geometry-only and preserve native DPR', () => {
  assert.match(geometry, /STANDARD_PEBBLE_DETAIL = 3/);
  assert.match(geometry, /LOW_QUALITY_PEBBLE_DETAIL = 2/);
  assert.match(scene, /pebbleDetailForQuality\(Boolean\(diagnostics\?\.lowQuality\)\)/);
  assert.match(lab, /Standard smooth/);
  assert.match(lab, /Low-quality diagnostic/);
  assert.doesNotMatch([scene, geometry, lab].join('\n'), /setPixelRatio\s*\(/);
});

test('procedural geometry is welded, smoothly shaded, finite, deterministic, and disposable', () => {
  assert.match(geometry, /const random = seededRandom\(seed\)/);
  assert.match(geometry, /welded\.setIndex\(indices\)/);
  assert.match(geometry, /source\.dispose\(\)/);
  assert.match(scene, /useEffect\(\(\) => \(\) => geometry\.dispose\(\), \[geometry\]\)/);
  assert.match(geometry, /geometry\.computeVertexNormals\(\)/);
  assert.match(geometry, /geometry\.normalizeNormals\(\)/);
  assert.match(geometry, /geometry\.computeBoundingBox\(\)/);
  assert.match(geometry, /geometry\.computeBoundingSphere\(\)/);
  assert.match(geometry, /Number\.isFinite\(bounds\.min\.x/);
  assert.match(geometry, /geometry\.dispose\(\);[\s\S]*throw new Error\('Invalid procedural pebble geometry\.'/);
  assert.equal((geometry.match(/color: '#[0-9A-F]{6}'/g) ?? []).length, 6);
});

test('smooth visual component keeps real pointer handlers and six-pebble domain unchanged', () => {
  assert.match(scene, /onPointerDown=\{start\} onPointerUp=\{end\} onPointerOut=\{cancel\}/);
  assert.match(scene, /flatShading=\{false\}/);
  assert.match(geometry, /deleteAttribute\('normal'\)/);
  assert.match(geometry, /deleteAttribute\('uv'\)/);
  assert.match(geometry, /weldPebbleVertices/);
  assert.match(geometry, /computeVertexNormals\(\)/);
  assert.match(geometry, /normalizeNormals\(\)/);
  assert.doesNotMatch([scene, hero, preview, geometry].join('\n'), /TOTAL_PAIR_PEBBLES\s*=|supabase\/migrations|setPixelRatio/);
});
