import test from 'node:test';
import assert from 'node:assert/strict';
import {runReviewChecks} from './REVIEW-CHECKS-v9.mjs';
test('schema-5 adaptation: every v9 absent protection is now present',async()=>{
 const result=await runReviewChecks();assert.ok(result.allPassed,JSON.stringify(result.cases.filter(c=>!c.passed)));assert.equal(result.absentProtections.length,11);assert.ok(result.allAbsentProtectionsPresent);
});
