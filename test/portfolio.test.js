import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {make as historical,publicEvidence} from '../src/domains/invariantGame-b2.js';
import {make} from '../src/domains/invariantGame.js';
import {MEMBERS,REGISTRATION,fitPublic,scorePrepared,runPortfolio} from '../src/portfolio/run.js';
import {rewriteSearch,SEARCH_CURVES} from '../src/portfolio/bfs.js';
const variants=[{family:'F-count'},{family:'F-abelian'},...['S3','Q8','D4','A4'].map(algebra=>({family:'F-nonabelian',algebra})),...[3,4].map(points=>({family:'F-monoid',points}))];

test('B4 positional-template control solves the 16 historical worlds using only public evidence',()=>{
  const member=MEMBERS.find(m=>m.id==='positional-template');
  for(const opts of variants)for(const seed of [1,2]){const world=historical(seed,opts),p=fitPublic(member,publicEvidence(world));assert.equal(p.fit.status,'fitted');assert.equal(scorePrepared(p,world.calibrationPairs,member).accuracy,1);assert.ok(p.fit.primitiveCounts.assignments>0);}
});
test('B4 positional shortcut fails on the amended example; genuine public solvers pass',()=>{
  const {world}=JSON.parse(readFileSync(new URL('../examples/invariantGame-world-1.json',import.meta.url))),r=runPortfolio(world);
  assert.equal(r.rows.length,MEMBERS.length);
  for(const id of ['group-full','monoid-csp','finite-state','grammar-cegis'])assert.equal(r.rows.find(m=>m.id===id).sealed.accuracy,1,id);
  assert.equal(r.rows.find(m=>m.id==='count-linear').sealed.accuracy,.5);
  assert.equal(r.rows.find(m=>m.id==='positional-template').sealed.accuracy,.5);
  assert.equal(r.rows.find(m=>m.id==='joint-coarse').sealed.accuracy,.5);
  assert.equal(r.implementableSelector.member,'group-full');assert.equal(r.implementableSelector.sealedAccuracy,1);
  assert.match(r.oraclePortfolio.label,/ORACLE/);
  for(const row of r.rows){assert.ok(row.fit.primitiveCounts.operations<=REGISTRATION.fitOperations);assert.ok(row.natural.resources.totalOperations<=REGISTRATION.totalOperations);}
  const state=r.rows.find(x=>x.id==='finite-state').fit;assert.equal(state.statesBound,state.points**state.points);
  for(const curve of SEARCH_CURVES){const row=r.rows.find(x=>x.id==='bfs-'+curve.name);assert.ok(row.sealed.resources.testedPositions>0);assert.ok(row.sealed.resources.visitedNodes>0);assert.ok(row.sealed.resources.maxDepth>0);assert.ok(row.sealed.resources.budgetExhaustionFrequency>=0);}
});
test('B4 fitters receive certificate-free public evidence; fit budgets fail closed',()=>{
  const view=publicEvidence(make(1,{family:'F-nonabelian'}));
  assert.deepEqual(Object.keys(view),['alphabet','rules','rulesText','trainingPairs']);
  for(const member of MEMBERS.filter(m=>!m.search)){const p=fitPublic(member,view,{fitOperations:1});assert.equal(p.fit.status,'unavailable',member.id);assert.match(p.fit.reason,/budget/);}
});
test('B4 BFS counts unsuccessful candidate-position tests and respects every retained curve',()=>{
  for(const budget of SEARCH_CURVES){const r=rewriteSearch('abab','bbaa',[{u:'ab',v:'ba'}],budget);assert.equal(r.prediction,true);assert.ok(r.testedPositions>=1);assert.ok(r.visitedNodes<=budget.maxNodes);assert.ok(r.testedPositions<=budget.maxPositions);}
  const exhausted=rewriteSearch('aaaa','bbbb',[{u:'a',v:'ab'}],{maxNodes:2,maxPositions:2,lengthSlack:6});assert.equal(exhausted.prediction,false);assert.equal(exhausted.budgetExhausted,true);assert.ok(exhausted.testedPositions<=2);
});
