import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const scene = read('src/features/bowl/BowlScene.tsx');
const composition = read('src/features/bowl/bowlComposition.ts');
const screen = read('src/features/bowl/BowlScreen.tsx');
const header = read('src/features/navigation/AppHeader.tsx');
const lab = read('src/features/bowl/BowlLabScreen.tsx');
const settings = read('src/features/settings/SettingsScreen.tsx');
const labRoute = read('app/(app)/bowl-lab.tsx');
const bowlRoute = read('app/(app)/bowl.tsx');
const pairingRoute = read('app/(app)/pairing.tsx');
const service = read('src/features/bowl/bowlService.ts');
const diagnosticsMigration = read('supabase/migrations/20260728122000_phase_19_bowl_development_diagnostics.sql');

test('BowlScene validates parent dimensions before creating an explicit full-size Canvas', () => {
  assert.match(composition, /Number\.isFinite\(width\).*Number\.isFinite\(height\).*width > 0.*height > 0/s);
  assert.match(composition, /if \(!isValidBowlViewport\(width, height\)\) return previous/);
  assert.match(scene, /onLayout=\{onLayout\}/);
  assert.match(scene, /\{viewport \? <View/);
  assert.match(scene, /width: viewport\.width, height: viewport\.height/);
  assert.match(scene, /container: \{ width: '100%', alignSelf: 'stretch', flex: 1,.*position: 'relative'/);
  assert.match(scene, /measuredLayer: \{ position: 'absolute', top: 0, left: 0 \}/);
  assert.match(scene, /fallbackLayer: \{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 \}/);
});

test('camera framing and Bowl width metrics use the validated Canvas viewport', () => {
  assert.match(scene, /calculateBowlFraming\(size\.width, size\.height\)/);
  assert.match(scene, /parentWidth: viewport\.width/);
  assert.match(scene, /canvasWidth: viewport\.width/);
  assert.match(scene, /viewportAspectRatio: viewport\.width \/ viewport\.height/);
  for (const [width, height] of [[320, 640], [360, 800], [393, 873], [412, 915], [800, 360]]) {
    const limited = Math.min(0.74, 0.78, (width - 48) / width);
    assert.ok(limited <= 0.78 && limited > 0, `${width}×${height} framing stays bounded`);
    assert.ok((width * (1 - limited)) / 2 >= 24, `${width}×${height} keeps side margins`);
  }
});

test('GL and React Native atmosphere form one seamless measured surface', () => {
  assert.match(scene, /gl\.setClearColor\(props\.environment\.backgroundEdge, 1\)/);
  assert.match(scene, /gl_Position=vec4\(position\.xy,1\.0,1\.0\)/);
  assert.match(scene, /backgroundColor: props\.environment\.backgroundEdge/);
  assert.match(scene, /<BowlFallback[^>]*environment=\{props\.environment\}/);
  assert.doesNotMatch(scene, /style=\{styles\.canvas\}[\s\S]*flex: 1/);
});

test('ordinary Bowl is a full-size layered composition with a shared settings control', () => {
  assert.match(screen, /scene:\{width:'100%',alignSelf:'stretch',flex:1/);
  assert.match(screen, /empty:\{position:'absolute'.*top:'12%'/);
  assert.match(header, /label=\{t\('app\.settings'\)\}/);
  assert.match(header, /router\.push\('\/\(app\)\/settings'\)/);
  assert.doesNotMatch(screen, /previewPebbles\?\?\[|fakePebbles|seeds\.slice/);
});

test('Bowl Lab is a full-width structured scrollable workbench', () => {
  assert.match(lab, /previewHeight = Math\.max\(300, Math\.min\(430, window\.height \* 0\.42\)\)/);
  assert.match(lab, /preview: \{ width: '100%', alignSelf: 'stretch'/);
  for (const heading of ['Pebble count', 'Motion and arrival', 'Lighting and season', 'Renderer diagnostics', 'Typography and accessibility', 'Data / connection inspector']) assert.match(lab, new RegExp(heading));
  assert.match(lab, /accessibilityState=\{\{ expanded \}\}/);
  assert.match(lab, /diagnosticsExpanded/);
  assert.match(lab, /metricsExpanded/);
  for (let count = 0; count <= 6; count += 1) assert.match(lab, /TOTAL_PAIR_PEBBLES \+ 1/);
  assert.match(lab, /<ScrollView/);
  assert.match(lab, /typePreview/);
});

test('Settings scrolls to a development-only Bowl Lab route that redirects in production', () => {
  assert.match(settings, /<ScrollView/);
  assert.match(settings, /paddingBottom: spacing\.xl \+ insets\.bottom/);
  assert.match(settings, /\{__DEV__ \?/);
  assert.match(settings, /settings\.developmentOnly/);
  assert.match(labRoute, /if\(!__DEV__\)return<Redirect/);
});

test('incomplete connection routing cannot masquerade as an empty Bowl', () => {
  assert.match(bowlRoute, /!state\.connectionComplete/);
  assert.match(pairingRoute, /appSession\.connectionComplete/);
  assert.match(pairingRoute, /existingPairId=\{appSession\.connectionId\}/);
});

test('development diagnostics are member-safe aggregates and never fabricate ownership', () => {
  assert.match(service, /get_bowl_development_diagnostics/);
  assert.match(diagnosticsMigration, /private\.is_pair_member/);
  assert.match(diagnosticsMigration, /held_elsewhere_count/);
  assert.match(diagnosticsMigration, /retired_count/);
  assert.doesNotMatch(diagnosticsMigration, /display_name|email|partner_id/);
  assert.doesNotMatch([service, lab].join('\n'), /insert\(|update\(|upsert\(/i);
});
