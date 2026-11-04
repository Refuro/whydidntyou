import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,appendFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
process.env.LLM_MOCK='1';
const {runExperiment,resumeExperiment}=await import('../src/experiment.js');
const {readRecords}=await import('../src/durable.js');
const {validateBatch}=await import('../src/ledger.js');
const {stateDigest}=await import('../src/source-identity.js');
const cfg=()=>({name:'resume',attempts:2,repeats:1,seeds:[1,2],conditions:[{id:'a',domain:'laggedRule'}],missingPolicy:'exploratory'});
async function interrupted(boundary){
  const outputDir=mkdtempSync(join(tmpdir(),'llm-resume-')),out=join(outputDir,'experiment-resume.jsonl');let calls=0;
  const transport=async()=>{calls++;return {raw:'<idea>Offline receipt</idea>',usage:{input_tokens:7,output_tokens:2}};};
  await assert.rejects(runExperiment(cfg(),{outputDir,transport,quiet:true,onBoundary:(name,info)=>{if(name===boundary){if(name==='received-unscored'){const receipt=readRecords(info.logPath).at(-1);assert.equal(receipt.status,name);assert.equal(receipt.result,null);assert.match(receipt.raw,/Offline receipt/);}throw new Error('fixture process interruption');}}}),/fixture process/);
  return {out,transport,calls:()=>calls};
}
for(const boundary of ['received-unscored','before-execution-record','after-terminal'])test('B3 resume preserves work at '+boundary+' and repeated resume is idempotent',async()=>{
  const f=await interrupted(boundary),prefix=readRecords(f.out),digest=stateDigest(prefix);
  const result=await resumeExperiment(f.out,{transport:f.transport,quiet:true}),batch=validateBatch(result.records);
  assert.equal(f.calls(),4);assert.equal(batch.terminals.length,2);assert.ok(batch.terminals.every(t=>t.chain.length===1));
  assert.equal(result.records.find(r=>r.type==='batch-resume').resumedFrom,digest);
  const bytes=readFileSync(f.out,'utf8');
  assert.equal((await resumeExperiment(f.out,{transport:f.transport})).idempotent,true);
  assert.equal((await resumeExperiment(f.out,{transport:f.transport})).idempotent,true);
  assert.equal(readFileSync(f.out,'utf8'),bytes);assert.equal(f.calls(),4);
});
test('B3 completed final terminal requires no resume event or dispatch',async()=>{
  const outputDir=mkdtempSync(join(tmpdir(),'llm-resume-done-')),config={...cfg(),seeds:[1]};let calls=0;
  await assert.rejects(runExperiment(config,{outputDir,quiet:true,transport:async()=>{calls++;return {raw:'offline',usage:null};},onBoundary:name=>{if(name==='after-terminal')throw new Error('stopped after terminal');}}));
  const out=join(outputDir,'experiment-resume.jsonl'),before=readFileSync(out,'utf8');
  await resumeExperiment(out,{transport:()=>{throw new Error('must not dispatch');}});assert.equal(calls,2);assert.equal(readFileSync(out,'utf8'),before);
});
for(const defect of ['partial-final-record','changed-source','changed-config','orphan-partial-record'])test('B3 abandons without repairing '+defect,async()=>{
  const f=await interrupted('before-execution-record');
  if(defect==='partial-final-record')appendFileSync(f.out,'{"type":');
  else if(defect==='orphan-partial-record'){
    const header=readRecords(f.out)[0],id=header.executionPlans['a|1|0'][0];
    appendFileSync(join(f.out.replace(/[^\\/]+$/,''),id+'.jsonl'),'{');
  }else{
    const rows=readRecords(f.out);if(defect==='changed-source')rows[0].sourceHash='0'.repeat(64);else rows[0].config.attempts=3;
    writeFileSync(f.out,rows.map(JSON.stringify).join('\n')+'\n');
  }
  const before=readFileSync(f.out,'utf8'),calls=f.calls();
  await assert.rejects(resumeExperiment(f.out,{transport:f.transport}));
  assert.equal(readFileSync(f.out,'utf8'),before);assert.equal(f.calls(),calls);assert.equal(existsSync(f.out+'.disposition.json'),true);
  assert.equal(readRecords(f.out+'.disposition.json')[0].status,'abandoned');
  await assert.rejects(resumeExperiment(f.out),/already abandoned/);
});
