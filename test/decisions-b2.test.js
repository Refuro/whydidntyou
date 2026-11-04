import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeAssignment} from '../src/analysis.js';
import {nullBounds,hypergeometricUpperBound,POPULATION_APPROXIMATION} from '../src/bounds.js';

test('D1 primary contrast uses only repeat 0 even when later repeats reverse the effect',()=>{
  const cfg={conditions:[{id:'a',domain:'laggedRule'},{id:'b',domain:'laggedRule'}],seeds:[1,2],repeats:2,contrasts:[['a','b']]},slots=new Map();
  for(const c of cfg.conditions)for(const seed of cfg.seeds)for(let repeat=0;repeat<2;repeat++)slots.set(`${c.id}|${seed}|${repeat}`,{terminal:{outcome:(c.id==='b')===(repeat===0)?'success':'failure'}});
  const analysis=analyzeAssignment({cfg,slots});
  assert.equal(analysis.primaryRepeat,0);assert.ok(analysis.conditions.every(c=>c.n===2));
  assert.ok(analysis.conditions.every(c=>c.stratumRole===(c.repeat===0?'primary':'exploratory')));
  assert.equal(analysis.contrasts.filter(c=>c.primary).length,1);
  assert.deepEqual(analysis.contrasts.find(c=>c.primary).sampleIdentificationBounds,[1,1]);
  assert.deepEqual(analysis.contrasts.find(c=>c.repeat===1).sampleIdentificationBounds,[-1,-1]);
});
test('D2 both population references are reported from explicit proposal/eligible counts',()=>{
  const r=nullBounds({n:40,successes:2,unresolved:3,eligibilityCounts:{proposed:1000,eligible:500}});
  assert.equal(r.diagnostics.registered.M,2**32);assert.equal(r.diagnostics.eligiblePopulation.estimatedM,2**31);
  assert.equal(r.diagnostics.eligiblePopulation.upper,hypergeometricUpperBound(2**31,40,5)/(2**31));
  assert.equal(r.diagnostics.eligiblePopulation.withinPrintedPrecision,true);assert.match(r.diagnostics.eligiblePopulation.meaning,/does not establish/);
  assert.match(r.diagnostics.registered.interpretation,/not a fixed-K identity/);
  for(const counts of [{proposed:1,eligible:2},{proposed:100,eligible:39},{proposed:Infinity,eligible:40},{proposed:100.5,eligible:40}])assert.throws(()=>nullBounds({n:40,successes:0,unresolved:0,eligibilityCounts:counts}));
});
test('D2 registered printed-precision approximation across n<=100 at M_C=10^6',()=>{
  const M=2**32,Mc=1_000_000;
  for(let n=1;n<=100;n++)for(let count=0;count<=n;count++){
    const difference=Math.abs(hypergeometricUpperBound(M,n,count)/M-hypergeometricUpperBound(Mc,n,count)/Mc);
    assert.ok(difference<POPULATION_APPROXIMATION.printedProbabilityUnit,JSON.stringify({n,count,difference}));
  }
});
test('D2 mean-of-products zero-success bound is available only for resolved zero outcomes',()=>{
  const zero=nullBounds({n:40,successes:0,unresolved:0});
  assert.ok(Math.abs(zero.providerRandomness.zeroSuccessUpperBound-(1-.05**(1/40)))<1e-12);
  assert.match(zero.providerRandomness.justification,/mean of products/);
  for(const [successes,unresolved]of [[1,0],[0,1],[1,1]])assert.equal(nullBounds({n:40,successes,unresolved}).providerRandomness.zeroSuccessUpperBound,null);
  assert.equal(nullBounds({n:0,successes:0,unresolved:0}).providerRandomness.zeroSuccessUpperBound,null);
});
