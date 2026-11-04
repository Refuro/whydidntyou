import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
process.env.LLM_MOCK='1';
const {runExperiment}=await import('../src/experiment.js');
const {validateBatch,readLog}=await import('../src/ledger.js');
const {reportBatch}=await import('../src/report.js');
const {drawSeeds,validateRunLog}=await import('../src/validate.js');
const {buildMessages,SYSTEM_BASE}=await import('../src/prompt.js');
const {make}=await import('../src/domains/laggedRule.js');
const {validateRequestArchive}=await import('../src/provenance.js');
const {resourcesFromAttempts}=await import('../src/resources.js');
const {analyzeAssignment}=await import('../src/analysis.js');
const raw='<idea>Offline record fixture</idea> No executable submission.';
const usage={input_tokens:10,output_tokens:10,cache_creation_input_tokens:3,cache_read_input_tokens:7};
function config(name='fixture'){return {name,attempts:2,repeats:1,seeds:drawSeeds('20261103',1),seedDraw:{master:'20261103',n:1},conditions:[{id:'a',domain:'laggedRule'}],missingPolicy:'refuse',generatorVersions:{laggedRule:'laggedRule-v2'}};}
const read=path=>readFileSync(path,'utf8').trim().split('\n').map(JSON.parse);
const write=(path,lines)=>writeFileSync(path,lines.map(JSON.stringify).join('\n')+'\n');
async function fixture({cfg=config(),failures=0,failAt=1,runner}={}){
 const outputDir=mkdtempSync(join(tmpdir(),'whydidntyou-schema5-'));let calls=0;
 const transport=async({logPath})=>{calls++;const dispatched=read(logPath).at(-1);assert.equal(dispatched.status,'dispatched');assert.equal(dispatched.raw,null);assert.equal(dispatched.result,null);if(calls>=failAt&&calls<failAt+failures)throw new Error('offline interruption');return {raw,usage};};
 const result=await runExperiment(cfg,{outputDir,transport,runner,quiet:true});return {...result,outputDir,calls};
}
for(const [name,failures,outcome,length]of [['interrupt-then-complete',1,'failure',2],['interrupt-twice-then-complete',2,'failure',3],['interrupt-three-times-unresolved',3,'unresolved',3],['complete-failed-no-retry',0,'failure',1]])test('A2 '+name,async()=>{
 const f=await fixture({failures});const batch=validateBatch(f.records),t=batch.terminals[0];assert.equal(t.outcome,outcome);assert.equal(t.chain.length,length);assert.equal(new Set(t.chain.map(e=>e.runId)).size,length);
 assert.equal(t.tokens,failures?'unknown':60);assert.equal(t.resources.requests,failures+(outcome==='failure'?2:0));
 const report=reportBatch(f.out);assert.equal(report.analysis.conditions[0].unresolved,outcome==='unresolved'?1:0);
});
test('A2 setup failure terminates without a retry',async()=>{
 const f=await fixture({runner:async()=>{throw new Error('offline setup failure');}});assert.equal(f.calls,0);const t=validateBatch(f.records).terminals[0];assert.equal(t.outcome,'unresolved');assert.equal(t.chain.length,1);assert.equal(t.chain[0].status,'setup-failed');
});
test('A2 interrupted execution then reference success ends the slot at attempt one',async()=>{
 const {referenceCode}=await import('../src/domains/laggedRule.js');
 const cfg=config(),outputDir=mkdtempSync(join(tmpdir(),'whydidntyou-success-'));let calls=0;
 const f=await runExperiment(cfg,{outputDir,quiet:true,transport:async()=>{if(++calls===1)throw new Error('offline interruption');return {raw:'<idea>Known images reference</idea><code>'+referenceCode(make(cfg.seeds[0]))+'</code>',usage};}});
 const t=validateBatch(f.records).terminals[0];assert.equal(calls,2);assert.equal(t.outcome,'success');assert.equal(t.success,1);assert.equal(t.chain.length,2);
});
test('A2 discarded completed attempts and requests count across the restart chain',async()=>{
 const f=await fixture({failAt:2,failures:1});assert.equal(f.calls,4);const t=validateBatch(f.records).terminals[0];assert.equal(t.resources.requests,4);assert.equal(t.tokens,'unknown');assert.equal(t.chain.length,2);
});
test('A2 dispatched-with-no-response and no end record is interrupted evidence',async()=>{
 const f=await fixture({failures:3});const execution=f.records[1],lines=read(execution.log);lines.pop();write(execution.log,lines);
 const log=readLog(execution.log);assert.equal(log.end.inferred,true);assert.equal(log.end.status,'interrupted');assert.equal(log.attempts[0].status,'dispatched');
 execution.reason=log.end.reason;f.records.at(-1).chain[0].reason=log.end.reason;validateBatch(f.records);
});
for(const name of ['terminal-with-missing-execution','execution-after-terminal','execution-after-completion','missing-index','four-executions','duplicate-terminal'])test('A2 refuses '+name,async()=>{
 const f=await fixture({failures:2});const r=structuredClone(f.records);
 if(name==='terminal-with-missing-execution')r.splice(1,1);
 if(name==='execution-after-terminal')r.push(r[1]);
 if(name==='execution-after-completion'){r[1].status='completed';r[1].reason=null;}
 if(name==='missing-index')r[1].executionIndex=1;
 if(name==='four-executions'){r.splice(-1,0,{...r[3],executionIndex:3});}
 if(name==='duplicate-terminal')r.push(r.at(-1));
 assert.throws(()=>validateBatch(r));
});
for(const mode of ['hint','scaffold','summary','last-code'])test('A3 treatment control '+mode,async()=>{
 const cfg=config();if(mode==='hint')cfg.conditions[0].hint='A registered hint.';else if(mode==='scaffold'){const dir=mkdtempSync(join(tmpdir(),'whydidntyou-scaffold-'));cfg.conditions[0].scaffold=join(dir,'scaffold.md');writeFileSync(cfg.conditions[0].scaffold,'Consider another representation.');}else cfg.conditions[0].memory=mode;
 const f=await fixture({cfg});validateBatch(f.records);
 const log=readLog(f.records[1].log);validateRequestArchive(log,make(cfg.seeds[0]));
});
for(const name of ['payload-hint-absent','payload-scaffold-absent','payload-memory-wrong','payload-feedback-wrong'])test('A3 refuses '+name,async()=>{
 const cfg=config();if(name==='payload-hint-absent')cfg.conditions[0].hint='A registered hint.';
 if(name==='payload-scaffold-absent'){const dir=mkdtempSync(join(tmpdir(),'whydidntyou-scaffold-'));cfg.conditions[0].scaffold=join(dir,'scaffold.md');writeFileSync(cfg.conditions[0].scaffold,'Consider another representation.');}
 if(name==='payload-memory-wrong')cfg.conditions[0].memory='summary';
 const f=await fixture({cfg}),path=f.records[1].log,lines=read(path);
 if(name==='payload-scaffold-absent')lines[0].system=SYSTEM_BASE;
 else if(name==='payload-feedback-wrong')lines[1].feedbackText='Unrelated feedback.';
 else for(let i=1;i<lines.length-1;i++)lines[i].messagesSent=buildMessages(make(cfg.seeds[0]),lines.slice(1,i),{hint:null,memory:'full'});
 write(path,lines);assert.throws(()=>validateBatch(f.records));assert.throws(()=>validateRequestArchive(validateRunLog(lines),make(cfg.seeds[0])));
});
test('A3 prompt source is frozen at batch and run level',async()=>{
 const f=await fixture();const r=structuredClone(f.records);r[0].promptBuilderHash='0'.repeat(64);assert.throws(()=>validateBatch(r),/prompt-builder/);
 const path=f.records[1].log,lines=read(path);lines[0].promptBuilderHash='0'.repeat(64);write(path,lines);assert.throws(()=>validateBatch(f.records),/prompt-builder/);
});
for(const field of ['tokens','seconds'])test('A4 refuses row-'+field+'-unbound',async()=>{
 const f=await fixture();for(const value of [1e9,-1,Infinity,NaN]){const r=structuredClone(f.records);r.at(-1)[field]=value;assert.throws(()=>validateBatch(r));}
});
test('A4 absence of usage remains unknown; all named cache fields count',()=>{
 assert.equal(resourcesFromAttempts([{usage:null,status:'dispatched'}]).tokens,'unknown');
 const r=resourcesFromAttempts([{usage:{...usage,seconds:2},status:'received',code:null}]);assert.equal(r.tokens,30);assert.equal(r.seconds,2);assert.equal(r.cache_read_input_tokens,7);
});
test('A5 unknown paired outcomes yield per-world and sample identification bounds',async()=>{
 const cfg=config();cfg.conditions.push({id:'b',domain:'laggedRule'});cfg.contrasts=[['a','b']];const f=await fixture({cfg,failures:3});const a=analyzeAssignment(validateBatch(f.records));
 assert.deepEqual(a.contrasts[0].sampleIdentificationBounds,[-1,0]);assert.equal(a.contrasts[0].populationInterval,null);assert.equal(a.conditions[0].gate.passed,false);
});
test('A5 repeat strata never inflate the number of independent worlds',async()=>{
 const cfg=config();cfg.repeats=2;const f=await fixture({cfg});const a=analyzeAssignment(validateBatch(f.records));assert.equal(a.conditions.length,2);assert.ok(a.conditions.every(c=>c.n===1));
 const report=reportBatch(f.out),markdown=readFileSync(report.out,'utf8');assert.match(markdown,/a \/ 0 \| PRIMARY/);assert.match(markdown,/a \/ 1 \| EXPLORATORY/);assert.match(markdown,/estimated-M_C reference/);
 assert.ok(report.analysis.conditions.every(c=>c.diagnostics.eligiblePopulation.proposed===1&&c.diagnostics.eligiblePopulation.eligible===1));
});
