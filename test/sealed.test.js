import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {simplex} from '../src/simplex.js';
import {make,publicEvidence,identifiabilityAudit} from '../src/domains/invariantGame.js';
import {make as historical} from '../src/domains/invariantGame-b2.js';
import {constructSealed} from '../src/sealed-sampler.js';
import {buildCorpus,constructionSummary} from '../src/construction-ledger.js';
import {checkWorld} from '../src/check-invariant-world.js';
import {publicStatistics,properCongruences} from '../src/invariant-features.js';
import {readRecords} from '../src/durable.js';
import {algebraFor} from '../src/algebra.js';

test('B3 two-phase simplex handles a negative RHS, bounded optimum, infeasible and unbounded problems',()=>{
  const r=simplex([[1,1],[-1,0],[0,-1]],[4,-1,-1],[3,2]);assert.equal(r.status,'optimal');assert.ok(Math.abs(r.value-11)<1e-7);assert.deepEqual(r.x,[3,1]);
  assert.equal(simplex([[1],[-1]],[0,-1],[1]).status,'infeasible');assert.equal(simplex([[-1]],[-1],[1]).status,'unbounded');
});
test('B3 public alphabet permutations preserve every registered public statistic and identifiability count',()=>{
  for(const family of ['F-count','F-abelian','F-nonabelian','F-monoid']){
    const inst=make(family==='F-monoid'?3:1,{family}),view=publicEvidence(inst),other={...view,alphabet:view.alphabet.toReversed()};
    assert.deepEqual(publicStatistics(view),publicStatistics(other));
    assert.deepEqual(identifiabilityAudit(inst.secret,view.alphabet,view.rules,view.trainingPairs),identifiabilityAudit(inst.secret,other.alphabet,other.rules,other.trainingPairs));
    assert.notEqual(inst.generatorVersion,historical(1,{family}).generatorVersion);
  }
});
test('B3 all proper congruences include the known S3 and Q8 quotients and satisfy both-sided closure',()=>{
  for(const [algebra,count]of [['S3',2],['Q8',5]]){
    const spec=algebraFor('F-nonabelian',{algebra}),qs=properCongruences(spec);assert.equal(qs.length,count);
    for(const q of qs)for(let a=0;a<q.length;a++)for(let b=0;b<q.length;b++)if(q[a]===q[b])for(let x=0;x<q.length;x++){assert.equal(q[spec.table[a][x]],q[spec.table[b][x]]);assert.equal(q[spec.table[x][a]],q[spec.table[x][b]]);}
  }
});
test('B3 durable proposal ledger retains defects; independent checker recomputes rounded ceilings and certificates',()=>{
  const file=join(mkdtempSync(join(tmpdir(),'llm-construction-')),'ledger.jsonl');
  const proposals=[{seed:1,opts:{family:'F-nonabelian'}},{seed:2,opts:{family:'F-monoid'}},{seed:3,opts:{family:'F-monoid'}},{seed:1,opts:{family:'F-count'}}];
  const result=buildCorpus(file,proposals),rows=readRecords(file),summary=constructionSummary(rows);
  assert.equal(summary.counts['F-monoid'].proposed,2);assert.equal(summary.counts['F-monoid'].constructionValid,1);assert.equal(rows.length,9);
  for(const {world,entry} of result.accepted){
    const bundle=JSON.parse(JSON.stringify({world,construction:entry})),checked=checkWorld(bundle);assert.equal(checked.status,'passed');
    if(!world.submonoid.commutative){assert.equal(checked.checks.U_hist,.5);assert.equal(checked.checks.jointFeatureCeiling,.5);assert.equal(checked.checks.nuisanceMaxImbalance,0);}
    const tampered=structuredClone(bundle);tampered.world.sealedPairs[0].label=!tampered.world.sealedPairs[0].label;assert.throws(()=>checkWorld(tampered));
    const old=structuredClone(bundle);old.world.sampling.version='positional-b2';assert.throws(()=>checkWorld(old),/positional/);
    const listed=structuredClone(bundle);listed.world.alphabet.reverse();assert.throws(()=>checkWorld(listed),/positional/);
  }
  const bad=structuredClone(rows);bad[2].kernelClasses++;assert.throws(()=>constructionSummary(bad),/audit/);
  assert.throws(()=>buildCorpus(file,proposals),/already exists/);
});
test('B3 natural control families mark the histogram challenge inapplicable',()=>{
  for(const family of ['F-count','F-abelian']){const r=constructSealed(make(1,{family}));assert.match(r.challenge,/inapplicable/);assert.equal(r.lp,null);assert.equal(r.checks.U_hist,1);}
});
