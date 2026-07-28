import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const types=read('src/features/bowl/bowlTypes.ts');const layouts=read('src/features/bowl/bowlLayouts.ts');const service=read('src/features/bowl/bowlService.ts');
test('finite identity model stays bounded and spatial',()=>{assert.match(types,/TOTAL_PAIR_PEBBLES = 6/);for(let count=0;count<=6;count+=1)assert.match(layouts,new RegExp(`\\n  ${count}:`));assert.doesNotMatch(layouts,/\n  [78]:/);assert.match(service,/visual_seed/);assert.match(service,/visual_variant/);assert.doesNotMatch([types,layouts,service].join('\n'),/rarity|value|collectible|score|ranking/i);});
