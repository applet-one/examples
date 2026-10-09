import test from 'node:test';
import assert from 'node:assert/strict';
import {Script} from 'node:vm';
import {html} from '../generated/assets.js';
test('all inline frontend scripts compile after bundling and HTML insertion',()=>{let count=0;for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)){new Script(match[1],{filename:`inline-${count}.js`});count++;}assert.ok(count>=4);assert.ok(html.length<950000,'Unexpected bundle growth may mean replacement-string corruption');});
test('shared HTML uses OSM tiles and has no external script dependency',()=>{assert.ok(html.includes('https://tile.openstreetmap.org/{z}/{x}/{y}.png'));assert.ok(!/<script[^>]+src=/i.test(html));assert.ok(!html.includes('basemaps.cartocdn.com'));});
