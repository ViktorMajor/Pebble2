import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  applyRepairMode,
  expectedDrawingBuffer,
  formatDiagnosticReport,
  nativeSurfaceDpr,
  pointerToNdc,
  quadrantFromNdc,
} from '../src/features/development/r3fViewportProbe.ts';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const screen = read('src/features/development/R3FViewportProbeScreen.tsx');
const helpers = read('src/features/development/r3fViewportProbe.ts');
const route = read('app/r3f-viewport-probe.tsx');
const settings = read('src/features/settings/SettingsScreen.tsx');
const note = read('docs/R3F_VIEWPORT_PROBE.md');

test('R3F Viewport Probe is development-only and discoverable without replacing existing probes', () => {
  assert.match(route, /if \(!__DEV__\) return <Redirect/);
  assert.match(settings, /__DEV__[\s\S]*\/gl-layout-probe[\s\S]*\/raw-glview-probe[\s\S]*\/r3f-viewport-probe/);
  for (const path of ['/gl-layout-probe', '/raw-glview-probe', '/r3f-viewport-probe']) assert.match(settings, new RegExp(path));
});

test('probe is isolated from product and database dependencies', () => {
  assert.match(screen, /from '@react-three\/fiber\/native'/);
  assert.doesNotMatch(screen, /BowlScene|Supabase|useAppSession|useHeldPebbles|Pairing|ScrollView|texture|shadowMap/);
  assert.doesNotMatch(helpers, /Supabase|pairId|pebble ownership/i);
});

test('minimal technical scene exposes four quadrants, border, cross, and pointer checks', () => {
  for (const color of ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FFFFFF']) assert.match(screen, new RegExp(color));
  for (const quadrant of ['top-left', 'top-right', 'bottom-left', 'bottom-right']) assert.match(screen, new RegExp(quadrant));
  assert.match(screen, /onPointerDown/);
  assert.match(screen, /event\.pointer\.x/);
  assert.match(screen, /Pointer expected/);
  assert.match(screen, /Pointer selected/);
});

test('all required repair modes use supported Three renderer semantics', () => {
  for (const mode of ['default', 'reset-scissor', 'resync-logical', 'resync-buffer', 'native-dpr']) assert.match(helpers, new RegExp(`'${mode}'`));
  assert.match(helpers, /setScissorTest\(false\)/);
  assert.match(helpers, /setPixelRatio\(CAPPED_RENDERER_DPR\)/);
  assert.match(helpers, /setSize\(layout\.width, layout\.height, false\)/);
  assert.match(helpers, /context\.drawingBufferWidth/);
  assert.match(helpers, /nativeSurfaceDpr/);
});

test('size, buffer, scissor, report, and pointer helpers are present and deterministic', () => {
  assert.match(helpers, /Math\.floor\(size\.width \* dpr\)/);
  assert.match(helpers, /renderer\.setScissor\(0, 0, width, height\)/);
  assert.match(helpers, /export function pointerToNdc/);
  assert.match(helpers, /export function quadrantFromNdc/);
  assert.match(helpers, /export function formatDiagnosticReport/);
  for (const label of ['Mode:', 'Observation:', 'Operations:', 'Packages:']) assert.match(helpers, new RegExp(label));
});

test('logical, buffer, pointer, and report calculations produce concrete diagnostic values', () => {
  assert.deepEqual(expectedDrawingBuffer({ width: 375.4, height: 834.5 }), { width: 506, height: 1126 });
  assert.ok(Math.abs(nativeSurfaceDpr({ width: 375.4, height: 834.5 }, { width: 1220, height: 2712 }) - 3.2496) < 0.001);
  assert.deepEqual(pointerToNdc(0, 0, { width: 400, height: 800 }), { x: -1, y: 1 });
  assert.deepEqual(pointerToNdc(200, 400, { width: 400, height: 800 }), { x: 0, y: 0 });
  assert.equal(quadrantFromNdc(-0.4, 0.6), 'top-left');
  assert.equal(quadrantFromNdc(0.4, -0.6), 'bottom-right');
  const report = formatDiagnosticReport({ mode: 'reset-scissor', observation: 'Cropped', operations: ['one'], measurements: { Width: 375.4 } });
  assert.match(report, /Mode: Reset scissor/);
  assert.match(report, /Observation: Cropped/);
  assert.match(report, /Width: 375.4/);
});

test('repair mode configuration changes one mounted renderer without undocumented context mutation', () => {
  const calls = [];
  const renderer = {
    getSize: (target) => target.set(375.4, 834.5),
    getPixelRatio: () => 3.25,
    getViewport: (target) => target.set(0, 0, 375.4, 834.5),
    getScissor: (target) => target.set(0, 0, 375.4, 834.5),
    getScissorTest: () => false,
    setPixelRatio: (value) => calls.push(['dpr', value]),
    setSize: (...values) => calls.push(['size', ...values]),
    setScissorTest: (value) => calls.push(['scissorTest', value]),
    setScissor: (...values) => calls.push(['scissor', ...values]),
    setViewport: (...values) => calls.push(['viewport', ...values]),
  };
  const baseline = { pixelRatio: 3.25, size: { width: 375.4, height: 834.5 }, viewport: [0, 0, 375.4, 834.5], scissor: [0, 0, 375.4, 834.5], scissorTest: false };
  applyRepairMode({ renderer, context: { drawingBufferWidth: 1220, drawingBufferHeight: 2712 }, layout: baseline.size, baseline, mode: 'native-dpr', initialDefault: false });
  assert.equal(calls[0][0], 'dpr');
  assert.ok(Math.abs(calls[0][1] - 3.2496) < 0.001);
  assert.deepEqual(calls[1], ['size', 375.4, 834.5, false]);
  assert.deepEqual(calls.at(-1), ['viewport', 0, 0, 375.4, 834.5]);
  assert.equal('drawingBufferWidth' in calls, false);
});

test('mode and observation changes do not key or remount Canvas', () => {
  assert.equal((screen.match(/<Canvas\b/g) ?? []).length, 1);
  assert.doesNotMatch(screen, /<Canvas[\s\S]{0,150}key=/);
  assert.match(screen, /frameloop="demand"/);
  assert.match(screen, /setNonce\(\(value\) => value \+ 1\)/);
  assert.doesNotMatch(screen, /requestAnimationFrame\([^)]*requestAnimationFrame|setInterval/);
});

test('diagnostics cover RN, R3F, Three, Expo GL, and lifecycle state', () => {
  for (const label of ['Window', 'Root', 'Canvas parent', 'Canvas component', 'Device DPR', 'R3F size', 'R3F viewport', 'Camera aspect', 'Renderer DPR', 'Renderer size', 'Renderer buffer', 'Renderer viewport', 'Renderer scissor', 'Scissor test', 'domElement', 'Expo GL buffer', 'Context ID', 'Buffer/layout ratio', 'Mounts', 'Contexts', 'Renderers', 'Disposals', 'Frame count', 'Last configuration']) assert.match(screen, new RegExp(label));
});

test('development note records source inspection, interpretations, and verification state', () => {
  assert.match(note, /react-three-fiber-native\.esm\.js/);
  assert.match(note, /dpr: PixelRatio\.get\(\)/);
  for (const outcome of ['Outcome 1', 'Outcome 2', 'Outcome 3', 'Outcome 4']) assert.match(note, new RegExp(outcome));
  assert.match(note, /Raw GLView Probe: Device-verified by user/);
  assert.match(note, /R3F native DPR: Device-verified by user/);
  assert.match(note, /R3F capped DPR 1\.35: Failed physical verification/);
  assert.match(note, /Production BowlScene repair: Device-verified by user/);
});
