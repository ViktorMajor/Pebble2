import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const appConfig = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8'));
const widgetSource = readFileSync(new URL('../widgets/PebbleWidget.tsx', import.meta.url), 'utf8');
const widgetService = readFileSync(
  new URL('../src/features/widget/pebbleWidgetService.ios.ts', import.meta.url),
  'utf8',
);
const widgetCopy = readFileSync(new URL('../src/content/widgetCopy.ts', import.meta.url), 'utf8');
const widgetDocumentation = readFileSync(new URL('../WIDGETS.md', import.meta.url), 'utf8');

test('iOS widget is configured as an ambient deep-link surface', () => {
  const widgetsPlugin = appConfig.expo.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-widgets',
  );

  assert.ok(widgetsPlugin);
  assert.equal(widgetsPlugin[1].enableAndroid, undefined);
  assert.deepEqual(widgetsPlugin[1].widgets[0].ios.supportedFamilies, ['systemSmall', 'systemMedium']);
  assert.match(widgetSource, /createWidget<PebbleWidgetProps>\('PebbleWidget'/);
  assert.match(widgetSource, /widgetURL\('pebble:\/\/bowl'\)/);
  assert.match(widgetCopy, /A pebble arrived/);
  assert.match(widgetCopy, /Egy kavics érkezett/);
  assert.doesNotMatch(widgetSource, /Button|onPress|sendPebble|rpc\(/);
});

test('widget snapshots are updated from the iOS app runtime only', () => {
  assert.match(widgetService, /PebbleWidget\.updateSnapshot/);
  assert.match(widgetDocumentation, /does not run in Expo Go/);
  assert.match(widgetDocumentation, /does not enable Android widgets/);
  assert.match(widgetDocumentation, /never sends a pebble itself/);
});
