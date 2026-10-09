import test from 'node:test';
import assert from 'node:assert/strict';
import {places} from '../src/data.js';
import {searchPlaces} from '../src/domain.js';
test('curated collection has unique places and enough for Bonn demo',()=>{assert.ok(places.length>=20);assert.equal(new Set(places.map(p=>p.id)).size,places.length);assert.ok(searchPlaces(places,{city:'Bonn',radius:100}).total>=10);assert.ok(searchPlaces(places,{city:'Bonn',radius:100,outdoor:true}).total>=3);});
test('each imported destination is usable and source-backed',()=>{for(const p of places){assert.ok(p.name&&p.description&&p.whyVisit,p.id);assert.ok(p.lat>47&&p.lat<56,p.id);assert.ok(p.lng>5&&p.lng<16,p.id);assert.ok(['nature','industrial','museums','architecture'].includes(p.category),p.id);assert.ok(p.durationMinutes>0,p.id);assert.match(p.wikipedia,/^https:\/\/\w+\.wikipedia\.org\//);assert.match(p.image,/^https:\/\/upload\.wikimedia\.org\//);assert.ok(p.imageCredit,p.id+' credit');assert.ok(p.imageLicense,p.id+' license');assert.ok(p.imageSource,p.id+' source');}});
