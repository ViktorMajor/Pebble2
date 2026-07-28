import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const screen = read('src/features/development/RawGLViewProbeScreen.tsx');
const route = read('app/raw-glview-probe.tsx');
const settings = read('src/features/settings/SettingsScreen.tsx');
const note = read('docs/RAW_GLVIEW_PROBE.md');

test('Raw GLView Probe is isolated, in-app, and development-only', () => {
  assert.match(route, /if \(!__DEV__\) return <Redirect/);
  assert.match(settings, /__DEV__[\s\S]*\/gl-layout-probe[\s\S]*\/raw-glview-probe/);
  assert.match(screen, /import \{ GLView, type ExpoWebGLRenderingContext \} from 'expo-gl'/);
  assert.doesNotMatch(screen, /@react-three|from 'three|BowlScene|Supabase|ScrollView|useAppSession/);
});

test('raw GLView receives explicit full measured bounds and direct layout instrumentation', () => {
  assert.match(screen, /onLayout=\{onGLLayout\}/);
  assert.match(screen, /style=\{\[styles\.glView, \{ width, height \}\]\}/);
  assert.match(screen, /glView: \{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0/);
  assert.match(screen, /glOutline: \{ position: 'absolute'.*borderWidth: 2, borderColor: '#00FFFF'/);
  assert.match(screen, /rootOutline: \{ position: 'absolute'.*borderWidth: 2, borderColor: '#FF00FF'/);
  assert.match(screen, /root: \{ flex: 1, width: '100%'/);
  assert.equal((screen.match(/styles\.corner/g) ?? []).length, 4);
});

test('raw WebGL draws four scissored quadrants and a white buffer boundary', () => {
  assert.match(screen, /gl\.viewport\(0, 0, width, height\)/);
  assert.match(screen, /gl\.enable\(gl\.SCISSOR_TEST\)/);
  assert.match(screen, /gl\.clearColor\(1, 1, 1, 1\)/);
  for (const color of ['\[1, 0, 0, 1\]', '\[0, 1, 0, 1\]', '\[0, 0, 1, 1\]', '\[1, 1, 0, 1\]']) assert.match(screen, new RegExp(color.replaceAll('[', '\\[').replaceAll(']', '\\]')));
  assert.match(screen, /gl\.endFrameEXP\(\)/);
});

test('measurements and explicit rerender/remount controls remain distinct', () => {
  for (const label of ['Window', 'Root', 'GLView layout', 'GL buffer', 'Device DPR', 'Buffer/layout', 'Context ID', 'Mounts', 'Contexts', 'Observation']) assert.match(screen, new RegExp(label));
  assert.match(screen, /key=\{mountKey\}/);
  assert.match(screen, /const rerender = \(\) => \{ if \(context\.current\) draw\(context\.current\); \}/);
  assert.match(screen, /setMountKey\(\(value\) => value \+ 1\)/);
  assert.match(screen, /setContextCount\(\(value\) => value \+ 1\)/);
  assert.match(screen, /setMountCount\(\(value\) => value \+ 1\)/);
});

test('development note records all four physical interpretations', () => {
  for (const result of ['Result A', 'Result B', 'Result C', 'Result D']) assert.match(note, new RegExp(result));
  assert.match(note, /Device-verified by user/);
  assert.match(note, /React Three Fiber native Canvas integration/);
  assert.match(note, /Expo GLView\/native-view layout/);
  assert.match(note, /drawing-buffer size disagree/);
  assert.match(note, /reports 0×0/);
});
