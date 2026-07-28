import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const scene=read('src/features/bowl/BowlScene.tsx');const types=read('src/features/bowl/bowlTypes.ts');const screen=read('src/features/bowl/BowlScreen.tsx');
test('sending is a deliberate hold on a physical pebble',()=>{assert.match(types,/HOLD_DURATION_MS = 900/);assert.match(scene,/onPointerDown=\{start\}/);assert.match(scene,/onPointerUp=\{end\}/);assert.match(scene,/motion\.travel/);assert.match(scene,/invalidate\(\)/);assert.doesNotMatch(screen,/Send button|numeric|of 6/i);});
test('tap touch remains boolean-only and guarded',()=>{assert.match(scene,/pebble\.incoming && !pebble\.touched && pebble\.transferEventId/);assert.match(screen,/busy/);assert.doesNotMatch(screen,/touchedAt|timestamp|Date\.now|response time/i);});
