import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {buildCorpus,worldHash,sealWorld} from '../src/construction-ledger.js';
import {drawSeeds} from '../src/validate.js';
import {make,publicEvidence} from '../src/domains/invariantGame.js';
import {constructSealed} from '../src/sealed-sampler.js';
import {checkWorld} from '../src/check-invariant-world.js';
import {samplingStream,permute} from '../src/sampling-stream.js';
import {fitOnce,scorePairs,BUDGET} from '../src/portfolio/contract.js';
import {fitPublic,MEMBERS,runPortfolio} from '../src/portfolio/run.js';
import {predictState} from '../src/portfolio/reference-predict.js';
const built=buildCorpus(mkdtempSync(tmpdir()+'/b4r-fixtures-')+'/ledger.jsonl',[{seed:1,opts:{family:'F-nonabelian'}}]);
const bundle=JSON.parse(JSON.stringify({world:built.accepted[0].world,construction:built.accepted[0].entry})),w=bundle.world;
function rebind(b){const x=b.world;x.generatorWorldDigest=worldHash(Object.fromEntries(['family','requestedFamily','generatorVersion','A','alphabet','rules','trainingPairs','calibrationPairs','secret','sampling'].map(k=>[k,x[k]])));x.worldDigest=worldHash({generatorWorldDigest:x.generatorWorldDigest,samplerVersion:x.samplerVersion,sealedPairs:x.sealedPairs,naturalSealedPairs:x.naturalSealedPairs});x.instanceDigest=worldHash({seed:x.seed,worldDigest:x.worldDigest});b.construction.worldDigest=x.worldDigest;return b;}
test('B4r admission rejects the three semantic fixtures even with recomputed hashes',()=>{
  assert.equal(checkWorld(bundle).independentReference.partitionsEnumerated,203);
  for(const [mutate,reason]of [
    [b=>{b.world.family='F-count';b.construction.effectiveClassification='F-count';},/effective family/],
    [b=>b.world.sealedPairs.forEach(p=>p.scale='small'),/stratum/],
    [b=>b.world.trainingPairs=Array.from({length:200},()=>({a:'',b:'',label:true,scale:'small',certificate:{kind:'rewrite-path',path:[]}})),/non-identifying/],
    [b=>b.world.sampling.ambient='Q8',/ambient name/],
    [b=>b.world.sealedConstruction.lp.support.at(-1).a='a',/padding/]
  ]){const b=structuredClone(bundle);mutate(b);assert.throws(()=>checkWorld(rebind(b)),reason);}
  const b=structuredClone(bundle);b.world.rules[0].id='changed';assert.throws(()=>checkWorld(b),/core digest/);
  assert.equal(w.sealedConstruction.analyticOracle.uniformWeight,1/128);
  assert.ok(w.sealedConstruction.analyticOracle.maxDeviationFromLP<1e-10);
  assert.equal(w.sealedConstruction.supportSummary.pairedDependence.independentRows,false);
});
function decoder(pairs){let previous=null,block=-1;return pairs.map(({a,b})=>{const key=JSON.stringify([a,b]);if(key!==previous){block++;previous=key;}return block%2===1;});}
const correct=ps=>decoder(ps).filter((v,i)=>v===ps[i].label).length;
test('B4r order decoder historical witness, fresh worlds, reversal and permutation controls',()=>{
  const old=JSON.parse(readFileSync(new URL('../examples/invariantGame-world-1.json',import.meta.url))).world;
  assert.equal(correct(old.sealedPairs),200);assert.equal(correct(old.sealedPairs.toReversed()),0);
  const all=[];
  // Fixed reviewer sample selected by construction admission alone, never by decoder score.
  for(const family of ['F-nonabelian','F-monoid']){
    const records=readFileSync(new URL('../docs/B4-EVIDENCE/'+family+'.construction.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
    for(const e of records.filter(r=>r.type==='construction'&&r.constructionValid&&r.effectiveClassification===family).slice(0,12)){
      const p=records[0].proposals[e.index],world=sealWorld(make(p.seed,p.opts),constructSealed(make(p.seed,p.opts)));all.push(world);
    }
  }
  // Fresh seed draw, fixed before observing any decoder output; retain every disposition.
  const fresh=buildCorpus(mkdtempSync(tmpdir()+'/b4r-order-')+'/ledger.jsonl',['F-nonabelian','F-monoid'].flatMap(family=>drawSeeds('2026110403',32).map(seed=>({seed,opts:{family}}))));
  assert.equal(Object.values(fresh.summary.counts).reduce((n,c)=>n+c.proposed,0),64);
  const freshWorlds=fresh.accepted.map(x=>x.world).filter(x=>!x.submonoid.commutative);
  assert.ok(freshWorlds.length>=24);
  for(const transform of [p=>p,p=>p.toReversed(),p=>permute(p,samplingStream(20261104,'order-regression'))]){
    for(const sample of [all,freshWorlds]){const accuracy=sample.reduce((n,w)=>n+correct(transform(w.sealedPairs)),0)/(200*sample.length);assert.ok(accuracy>.45&&accuracy<.55,String(accuracy));}
  }
  const original=w.sealedConstruction.lp.support.flatMap((p,i)=>Array.from({length:w.sealedConstruction.lp.multiplicities[i]},()=>p));
  assert.deepEqual(w.sealedPairs,permute(original,samplingStream(w.seed,'sealed-matched-order-v2')));
  assert.notDeepEqual(w.sealedPairs,original);
});
test('B4r fit once, isolated inference, no order input, equal independent budgets',async()=>{
  const source=`let fitCalls=0,predictCalls=0;function fit(v){if(Object.keys(v).sort().join('|')!=='alphabet|rules|rulesText|trainingPairs')throw Error('fit input');if(++fitCalls!==1)throw Error('refit');return JSON.stringify({fitCalls});}function predict(s,a,b){if(arguments.length!==3||++predictCalls!==1||fitCalls!==0||JSON.parse(s).fitCalls!==1)throw Error('context');return a===b;}`;
  const p=await fitOnce(source,{...publicEvidence(w),sealedPairs:w.sealedPairs});
  for(const pairs of [w.sealedPairs,w.sealedPairs.toReversed(),permute(w.sealedPairs,samplingStream(3,'control'))]){const r=await scorePairs(p,pairs);assert.equal(r.status,'scored');assert.equal(r.resources.calls,200);assert.equal(r.accuracy,.5);}
  const q=await fitOnce(source,publicEvidence(w),{budget:{...BUDGET,maxInferenceCalls:1}});
  for(let i=0;i<2;i++){const r=await scorePairs(q,w.sealedPairs);assert.equal(r.accuracy,null);assert.equal(r.resources.calls,1);}
  assert.equal((await fitOnce('function fit(){return {};}',publicEvidence(w))).state,null);
});
test('B4r 12/4 and 16/4 character visits and explicitly metered preparation',async()=>{
  const old=JSON.parse(readFileSync(new URL('../examples/invariantGame-world-1.json',import.meta.url))).world,pair=old.sealedPairs[0];
  assert.equal(pair.a.length+pair.b.length,4);
  for(const [id,expected]of [['count-linear',12],['joint-coarse',16]]){
    const p=await fitPublic(MEMBERS.find(m=>m.id===id),publicEvidence(w)),state=JSON.parse(p.state).state;
    let visits=0;const wrap=s=>({length:s.length,*[Symbol.iterator](){for(const c of s){visits++;yield c;}}}),meter={};
    predictState(state,wrap(pair.a),wrap(pair.b),meter);assert.equal(visits,expected);assert.equal(meter.characterVisits,expected);
    const r=await scorePairs(p,[pair]);assert.equal(r.resources.memberSpecificSearchCounters.characterVisits,expected);
  }
  const n=await fitPublic(MEMBERS.find(m=>m.id==='nuisance-stumps'),publicEvidence(w));assert.equal(n.fit.memberSpecificSearchCounters.featureDpCells,18620);
  const q=await fitPublic(MEMBERS.find(m=>m.id==='group-quotients'),publicEvidence(w));assert.ok(q.fit.memberSpecificSearchCounters.congruenceMergeTests>0);assert.ok(q.fit.memberSpecificSearchCounters.catalogueTableCells>0);
});
test('B4r reference wall and selector total include all public fits and selections',async()=>{
  const r=await runPortfolio(w),chosen=r.rows.find(x=>x.id===r.implementableSelector.member),cost=r.implementableSelector.resources;
  for(const id of ['group-full','monoid-csp','finite-state','grammar-cegis'])assert.equal(r.rows.find(x=>x.id===id).sealed.accuracy,1,id);
  for(const id of ['count-linear','joint-coarse','positional-template'])assert.equal(r.rows.find(x=>x.id===id).sealed.accuracy,.5,id);
  assert.equal(cost.allMemberFitMs,r.rows.reduce((n,m)=>n+m.fit.ms,0));assert.equal(cost.challengeTotalMs,cost.allMemberFitMs+cost.allMemberPublicInferenceMs+chosen.sealed.resources.ms);
  for(const row of r.rows){assert.equal(row.fit.calls,1);assert.equal(row.natural.resources.cacheHits,0);assert.equal(row.sealed.resources.calls,200);assert.ok(row.fit.ms>0);assert.equal(typeof row.sealed.paddingRobustnessGap,'number');}
});
