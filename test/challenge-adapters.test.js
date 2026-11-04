import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,readdirSync,existsSync,appendFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildCorpus} from '../src/construction-ledger.js';
import {readRecords} from '../src/durable.js';
import {exportPublic,writePublicWorld} from '../src/portfolio/export-public.js';
import {publicWorld,loadPublicDirectory,hostIndexPath} from '../src/portfolio/challenge-public.js';
import {scoreExternal} from '../src/portfolio/score-external.js';
process.env.LLM_MOCK='1';
const scratch=mkdtempSync(join(tmpdir(),'llm-b4-challenge-')),ledger=join(scratch,'construction.jsonl');
const proposals=[{seed:1,opts:{family:'F-count'}},{seed:2,opts:{family:'F-count'}},{seed:1,opts:{family:'F-nonabelian'}},{seed:2,opts:{family:'F-monoid'}}];
const built=buildCorpus(ledger,proposals);
let next=0;
function exported(){const root=join(scratch,'case-'+next++),out=join(root,'public'),hostRoot=join(root,'host'),results=join(root,'results');const result=exportPublic(ledger,{out,hostRoot});return {root,out,hostRoot,results,result};}
function solver(f,source){const path=join(f.root,'solver.js');writeFileSync(path,source);return path;}
const publicCountSolver=`
if(Object.keys(publicWorld).sort().join('|')!=='alphabet|rules|rulesText|sealedPairs|trainingPairs|worldDigest')throw new Error('wrong public interface');
if(publicWorld.trainingPairs.length!==200||publicWorld.trainingPairs.some(p=>typeof p.label!=='boolean')||publicWorld.sealedPairs.some(p=>Object.keys(p).sort().join('|')!=='a|b'))throw new Error('wrong pair interface');
const alphabet=publicWorld.alphabet,features=[];
function counts(s){return alphabet.map(a=>{let n=0;for(const c of s)if(c===a)n++;return n;});}
for(const p of [2,3])for(let v=0;v<p**alphabet.length;v++){
  const weights=alphabet.map((_,i)=>Math.floor(v/p**i)%p),value=s=>counts(s).reduce((n,c,i)=>n+c*weights[i],0)%p;
  if(publicWorld.rules.every(r=>value(r.u)===value(r.v)))features.push({p,weights});
}
function reachable(a,b){const ca=counts(a),cb=counts(b);return features.every(({p,weights})=>ca.reduce((n,c,i)=>n+(c-cb[i])*weights[i],0)%p===0);}
`;

test('B4 exporter emits exactly the accepted public projections, never private fields or sealed labels',()=>{
  const f=exported();assert.equal(f.result.worlds,3);assert.equal(built.accepted.length,3);
  const files=readdirSync(f.out).sort();assert.equal(files.length,3);
  files.forEach((file,i)=>{
    const w=JSON.parse(readFileSync(join(f.out,file),'utf8'));assert.deepEqual(w,publicWorld(built.accepted[i].world));
    assert.deepEqual(Object.keys(w),['alphabet','rules','rulesText','trainingPairs','sealedPairs','worldDigest']);
    assert.equal(w.trainingPairs.length,200);assert.equal(w.sealedPairs.length,200);
    for(const p of w.sealedPairs)assert.deepEqual(Object.keys(p),['a','b']);
    assert.ok(!/secret|certificate|calibration|defect|decoyProof|requestedFamily/.test(JSON.stringify(w)));
  });
  const before=files.map(file=>readFileSync(join(f.out,file),'utf8'));
  assert.equal(exportPublic(ledger,{out:f.out,hostRoot:f.hostRoot}).idempotent,true);
  assert.deepEqual(files.map(file=>readFileSync(join(f.out,file),'utf8')),before);
  assert.equal(loadPublicDirectory(f.out,{hostRoot:f.hostRoot}).worlds.length,3);
  assert.ok(existsSync(hostIndexPath(f.out,f.hostRoot)));
});
test('B4 export writer refuses injected private fields before creating a file',()=>{
  const base=publicWorld(built.accepted[0].world);
  for(const inject of [w=>{w.secret={};},w=>{w.calibrationPairs=[];},w=>{w.defect='bad';},w=>{w.rules[0].certificate={};},w=>{w.rules[0].decoyProof=[];},w=>{w.trainingPairs[0].certificate={};},w=>{w.sealedPairs[0].label=true;},w=>{w.sealedPairs[0].scale='large';},w=>{w.rulesText+=' private annotation';}]){
    const w=structuredClone(base);inject(w);const path=join(scratch,'must-not-exist-'+next+++'.json');assert.throws(()=>writePublicWorld(path,w));assert.equal(existsSync(path),false);
  }
  assert.throws(()=>exportPublic(ledger,{out:join(scratch,'nested-public'),hostRoot:join(scratch,'nested-public','private')}),/outside/);
});
test('B4 export binds regenerated worlds to historical digests despite new adapter source files',()=>{
  const out=join(scratch,'historical-public'),hostRoot=join(scratch,'historical-host');
  const result=exportPublic(fileURLToPath(new URL('../examples/invariantGame-world-1.construction.jsonl',import.meta.url)),{out,hostRoot});
  assert.equal(result.worlds,1);assert.equal(loadPublicDirectory(out,{hostRoot}).worlds[0].public.worldDigest,built.accepted[2].world.worldDigest);
});
test('B4 external public-only solver uses the existing contract and reports world/family accuracy and charged work',async()=>{
  const f=exported(),path=solver(f,publicCountSolver),result=await scoreExternal(path,f.out,{hostRoot:f.hostRoot,outputDir:f.results});
  assert.equal(result.summary.worlds,3);assert.equal(result.summary.byFamily['F-count'].worlds,2);assert.equal(result.summary.byFamily['F-count'].successes,2);
  assert.equal(result.summary.byFamily['F-count'].meanAccuracyScoredWorlds,1);assert.equal(result.summary.byFamily['F-nonabelian'].meanAccuracyScoredWorlds,.5);
  for(const row of result.summary.worldResults){assert.equal(row.status,'scored');assert.equal(row.work.sandboxCalls,201);assert.equal(row.work.completedSandboxCalls,201);assert.equal(row.work.inspectCalls,1);assert.equal(row.work.reachableCalls,200);assert.ok(row.work.sandboxMs>0);assert.ok(row.work.chargedProgramBytes>201*Buffer.byteLength(publicCountSolver));assert.ok(row.work.chargedInputBytes>0);assert.equal(row.work.primitiveOperations,null);}
  assert.equal(readFileSync(result.solverArchive,'utf8'),publicCountSolver);assert.equal(readRecords(result.log).at(-1).status,'completed');
  assert.ok(!/certificate|calibrationPairs|secret|sealedPairs/.test(readFileSync(result.report,'utf8')));
  assert.equal(result.summary.liveModelCalls,0);
});
test('B4 every budget setting is retained; exhausted calls produce failed worlds with unavailable accuracy',async()=>{
  const f=exported(),path=solver(f,'function reachable(){return false;}');
  const a=await scoreExternal(path,f.out,{hostRoot:f.hostRoot,outputDir:f.results,maxSandboxCalls:1});
  const b=await scoreExternal(path,f.out,{hostRoot:f.hostRoot,outputDir:f.results,maxSandboxCalls:201});
  assert.notEqual(a.runId,b.runId);assert.equal(readdirSync(f.results).length,6);
  for(const row of a.summary.worldResults){assert.equal(row.status,'failed');assert.equal(row.accuracy,null);assert.equal(row.success,false);assert.equal(row.work.sandboxCalls,1);assert.match(row.failure.reason,/call budget exhausted/);}
  assert.deepEqual(a.summary.byFamily['F-count'].accuracyBoundsAcrossAllWorlds,[0,1]);assert.equal(a.summary.byFamily['F-count'].failedWorlds,2);
  assert.ok(b.summary.worldResults.every(row=>row.accuracy===.5&&row.work.sandboxCalls===201));
});
test('B4 invalid outside contract output is scored as failure, not a fabricated zero or omitted world',async()=>{
  const f=exported(),path=solver(f,'function reachable(){return "not a boolean";}');
  const result=await scoreExternal(path,f.out,{hostRoot:f.hostRoot,outputDir:f.results});
  assert.equal(result.summary.worldResults.length,3);assert.ok(result.summary.worldResults.every(r=>r.accuracy===null&&r.work.sandboxCalls===2&&r.status==='failed'));
});
test('B4 public tampering, missing/extra files and changed host ledgers refuse before outside code runs',async()=>{
  for(const mutation of ['private-field','pair-swap','extra-file','missing-assignment','ledger-change']){
    const f=exported(),path=solver(f,'function reachable(){return false;}'),file=join(f.out,readdirSync(f.out)[0]);
    if(mutation==='extra-file')writeFileSync(join(f.out,'unregistered.json'),'{}');
    else if(mutation==='missing-assignment'){
      const index=hostIndexPath(f.out,f.hostRoot),rows=readRecords(index);rows[0].worlds.pop();writeFileSync(index,JSON.stringify(rows[0])+'\n');
    }else if(mutation==='ledger-change'){
      const index=hostIndexPath(f.out,f.hostRoot),rows=readRecords(index),copy=join(f.root,'changed-ledger.jsonl');writeFileSync(copy,readFileSync(ledger));appendFileSync(copy,'\n');rows[0].ledgers[0].path=copy;writeFileSync(index,JSON.stringify(rows[0])+'\n');
    }else{const w=JSON.parse(readFileSync(file));if(mutation==='private-field')w.sealedPairs[0].label=true;else [w.sealedPairs[0],w.sealedPairs[1]]=[w.sealedPairs[1],w.sealedPairs[0]];writeFileSync(file,JSON.stringify(w));}
    await assert.rejects(scoreExternal(path,f.out,{hostRoot:f.hostRoot,outputDir:f.results}));assert.equal(existsSync(f.results),false);
  }
});
test('B4 documented exporter/scorer CLI pair works without exposing a host index in the public directory',()=>{
  const out=join(scratch,'cli-public'),hostRoot=join(scratch,'cli-host'),results=join(scratch,'cli-results'),path=join(scratch,'cli-solver.js');writeFileSync(path,'function reachable(){return false;}');
  const repo=fileURLToPath(new URL('..',import.meta.url)),options={cwd:repo,encoding:'utf8',env:{...process.env,LLM_MOCK:'1'}};
  const exported=JSON.parse(execFileSync(process.execPath,['src/portfolio/export-public.js',ledger,'--out',out,'--host-root',hostRoot],options));assert.equal(exported.worlds,3);
  const scored=JSON.parse(execFileSync(process.execPath,['src/portfolio/score-external.js',path,out,'--host-root',hostRoot,'--out',results,'--max-calls','1'],options));assert.equal(scored.worlds,3);assert.ok(existsSync(scored.report));assert.equal(readdirSync(out).length,3);
});
