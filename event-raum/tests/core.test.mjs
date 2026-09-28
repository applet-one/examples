import test from 'node:test';
import assert from 'node:assert/strict';
import { quote, canCancel } from '../src/lib.js';
const event = { member_price: 2000, guest_price: 4000, companion_price: 3000, early_until: '2099-01-01T00:00:00.000Z', early_member_price: 1500, early_guest_price: 3500, early_companion_price: 2500, discount_code: 'HELLO', discount_percent: 10 };
test('member plus companion, early-bird and discount are calculated in cents', () => { assert.deepEqual(quote(event, [{ kind: 'member' }, { kind: 'companion' }], 'hello', Date.parse('2098-01-01')), { lines: [{kind:'member',price:1500},{kind:'companion',price:2500}], subtotal:4000, discount:400, total:3600, early:true }); assert.throws(() => quote(event,[{kind:'guest'},{kind:'companion'}])); });
test('regular prices and invalid discount', () => { assert.equal(quote(event, [{kind:'guest'}], '', Date.parse('2100-01-01')).total,4000); assert.throws(() => quote(event,[{kind:'guest'}],'WRONG')); });
test('cancellation cutoff includes exactly 48 hours', () => { const start = '2030-01-04T12:00:00.000Z'; assert.equal(canCancel(start, Date.parse(start)-48*3600000),true); assert.equal(canCancel(start, Date.parse(start)-48*3600000+1),false); });
