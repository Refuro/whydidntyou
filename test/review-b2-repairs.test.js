import test from 'node:test';
import assert from 'node:assert/strict';
import {getDomain} from '../src/domains/index.js';
import {validateResult,validateAttempt,drawSeeds} from '../src/validate.js';
import {isSuccess,evaluate} from '../src/sandbox.js';
import {make,publicEvidence,identifiabilityAudit,privateRuleCoverage} from '../src/domains/invariantGame-b2.js';
import {seedManifest,sourceHexToMaster,validateSeedSource} from '../src/seed-manifest.js';
import {nullBounds,upperBound} from '../src/bounds.js';

test('R1 compression success is bound to the trusted instance; contract confusion refuses',()=>{
  const inst=getDomain('laggedRule').make(1),result=bits=>({ok:true,bits,bitsPerSym:bits/inst.n,baseline:inst.baselineBitsPerSym,oracle:inst.oracleBitsPerSym,ratioToBaseline:bits/inst.n/inst.baselineBitsPerSym,ratioToOracle:bits/inst.n/inst.oracleBitsPerSym});
  const failure=result(inst.n*inst.baselineBitsPerSym),passing=result(0);
  validateResult(failure,'control',inst);assert.equal(isSuccess(failure,inst),false);assert.equal(isSuccess(passing,inst),true);
  for(const extra of [{contract:'reachability',accuracy:1},{accuracy:1}]){
    assert.throws(()=>validateResult({...failure,...extra},'compression-result-contract-confusion',inst));
    assert.throws(()=>isSuccess({...failure,...extra},inst));
  }
  const rec={type:'attempt',attempt:1,status:'received',messagesSent:[{role:'user',content:'task'}],usage:null,raw:'no code',code:null,idea:'',feedbackText:'ok',result:passing};
  assert.throws(()=>validateAttempt(rec,0,null,'impossible',inst),/without parsed code/);
});
test('R1 genuine reachability result uses the reachability contract',async()=>{
  const inst=make(1,{family:'F-count'});
  const code='function reachable(a,b){return a===b;}';
  const r=await evaluate(code,inst,{evaluationPairs:[{a:'',b:'',label:true}],purpose:'wall-selftest'});
  validateResult(r,'reachability control',inst);assert.equal(isSuccess(r,inst),true);
  assert.throws(()=>isSuccess(r,getDomain('laggedRule').make(1)),/contract/);
  assert.throws(()=>validateResult({...r,bits:0},'foreign field',inst),/foreign/);
});
test('R2 canonical 78-digit master and exact source bytes survive manifest round trip',()=>{
  assert.equal(drawSeeds('0',1).length,1);
  for(const bad of ['00','01','+1','-1',' 1','1 ','9'.repeat(79)])assert.throws(()=>drawSeeds(bad,1));
  for(const sourceHex of ['f'.repeat(64),'0020000000000001','00']){
    const m=JSON.parse(JSON.stringify(seedManifest({sourceHex,n:2})));validateSeedSource(m.seedDraw);
    assert.equal(BigInt(m.seedDraw.master),BigInt('0x'+sourceHex));
    assert.deepEqual(m.seedDraw.sourceBytes,[...Buffer.from(sourceHex,'hex')]);
    assert.equal(m.seedDraw.sourceHex,sourceHex);
  }
  assert.equal(sourceHexToMaster('f'.repeat(64)).length,78);
  assert.equal(sourceHexToMaster('0020000000000001'),'9007199254740993');
  assert.throws(()=>seedManifest({sourceHex:'01',master:'01',n:1}),/differs/);
});
const variants=[{family:'F-count'},{family:'F-abelian'},...['S3','Q8','D4','A4'].map(algebra=>({family:'F-nonabelian',algebra})),... [3,4].map(points=>({family:'F-monoid',points}))];
test('R3 all 16 development worlds have identical public/private/altered-certificate audits',()=>{
  for(const opts of variants)for(const seed of [1,2]){
    const inst=make(seed,opts),pub=publicEvidence(inst),audit=pairs=>identifiabilityAudit(inst.secret,pub.alphabet,pub.rules,pairs);
    assert.deepEqual(audit(pub.trainingPairs),audit(inst.trainingPairs));
    assert.deepEqual(audit(pub.trainingPairs),audit(inst.trainingPairs.map(p=>({...p,certificate:{path:'deliberately invalid'}}))));
    assert.equal(privateRuleCoverage(inst.rules,pub.trainingPairs).status,'unavailable');
    assert.equal(privateRuleCoverage(inst.rules,inst.trainingPairs).status,'available');
  }
});
test('R4 hypergeometric midpoint noncoverage explains diagnostic-only status',()=>{
  const r=nullBounds({n:100,successes:0,unresolved:0}),hyper=r.diagnostics.hypergeometricReference,bin=upperBound(100,0),p=(hyper+bin)/2;
  assert.ok(hyper<p&&p<bin);assert.ok(Math.abs((1-p)**100-.050000001120062525)<1e-12);
  assert.equal(r.diagnostics.inferentialValidity,'none');assert.equal(r.inference.status,'available');assert.equal(r.inference.upperBound,bin);
  assert.equal('conservative' in r,false);
  for(const [successes,unresolved]of [[1,0],[0,1],[1,1]]){
    const x=nullBounds({n:100,successes,unresolved});assert.equal(x.inference.status,'unavailable');assert.equal(x.inference.upperBound,1);
    assert.equal(x.gate.passed,unresolved===0);
  }
});
