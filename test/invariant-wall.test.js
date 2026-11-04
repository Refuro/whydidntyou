import test from 'node:test';
import assert from 'node:assert/strict';
import {invariantSelftest} from '../src/invariant-selftest.js';
test('B2 registered BFS/count/reference walls across eight algebra variants and two seeds',async()=>{
 const evidence=await invariantSelftest({quiet:true});assert.equal(evidence.status,'passed');assert.equal(evidence.rows.length,16);
});
