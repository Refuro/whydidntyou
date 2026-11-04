// Schema-5 adaptation of the archived ordinary record fixtures. Archive files stay immutable.
// Usage: node test/REVIEW-CHECKS-v9.mjs <repo> <evidence.json>
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
process.env.LLM_MOCK='1';
const {runExperiment}=await import('../src/experiment.js');
const {validateBatch}=await import('../src/ledger.js');
const {drawSeeds}=await import('../src/validate.js');
const {buildMessages,SYSTEM_BASE}=await import('../src/prompt.js');
const {make}=await import('../src/domains/laggedRule.js');
const B=await import('../src/bounds.js');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(f,'utf8').trim().split('\n').map(JSON.parse);
const write=(f,v)=>writeFileSync(f,v.map(JSON.stringify).join('\n')+'\n');

export async function runReviewChecks(){
 const work=mkdtempSync(join(tmpdir(),'whydidntyou-v9-schema5-')),cases=[];
 const check=async(id,fn)=>{try{await fn();cases.push({id,passed:true});}catch(e){cases.push({id,passed:false,error:e.message});}};
 let seq=0;
 async function fixture(mode=null,failAt=0){
   const cfg={name:'v9-'+seq++,attempts:2,repeats:1,seeds:drawSeeds('20261103',1),seedDraw:{master:'20261103',n:1},conditions:[{id:'a',domain:'laggedRule'}],generatorVersions:{laggedRule:'laggedRule-v2'},missingPolicy:'refuse'};
   if(mode==='hint')cfg.conditions[0].hint='A registered hint.';
   if(mode==='summary'||mode==='last-code')cfg.conditions[0].memory=mode;
   if(mode==='scaffold'){cfg.conditions[0].scaffold=join(work,'scaffold.md');writeFileSync(cfg.conditions[0].scaffold,'Consider a second representation.');}
   let calls=0;
   const result=await runExperiment(cfg,{outputDir:work,quiet:true,transport:async()=>{if(++calls===failAt)throw new Error('offline fixture interruption');return {raw:'<idea>Offline record fixture</idea> No executable submission.',usage:{input_tokens:10,output_tokens:10}};}});
   return {...result,cfg,calls};
 }
 for(const mode of ['hint','scaffold','summary','last-code'])await check('report/positive-'+mode,async()=>validateBatch((await fixture(mode)).records));
 for(const [name,mode]of [['payload-hint-absent','hint'],['payload-scaffold-absent','scaffold'],['payload-memory-wrong','summary'],['payload-feedback-wrong',null]])await check('report/'+name,async()=>{
   const f=await fixture(mode),path=f.records[1].log,lines=read(path);
   if(name==='payload-scaffold-absent')lines[0].system=SYSTEM_BASE;
   else if(name==='payload-feedback-wrong')lines[1].feedbackText='Different feedback.';
   else for(let i=1;i<lines.length-1;i++)lines[i].messagesSent=buildMessages(make(f.cfg.seeds[0]),lines.slice(1,i),{memory:'full'});
   write(path,lines);assert.throws(()=>validateBatch(f.records));
 });
 await check('report/row-tokens-unbound',async()=>{const f=await fixture();f.records.at(-1).tokens=1e9;assert.throws(()=>validateBatch(f.records));});
 await check('retry/writer-stops-without-two-restarts',async()=>{const f=await fixture(null,2);assert.equal(f.calls,4);assert.equal(f.records.at(-1).chain.length,2);assert.equal(f.records.at(-1).outcome,'failure');validateBatch(f.records);});
 for(const input of [{n:100,successes:-1,unresolved:0},{n:100,successes:0,unresolved:101},{n:100.5,successes:0,unresolved:0},{n:100,successes:0,unresolved:0,alpha:2}])await check('bounds/invalid-'+JSON.stringify(input),()=>assert.throws(()=>B.nullBounds(input)));
 await check('bounds/cdf-endpoints',()=>{assert.equal(B.binomCdf(10,0,0),1);assert.equal(B.binomCdf(10,10,1),1);});
 // Retain v8/v9 metadata protections while upgrading their source records to schema 5.
 for(const [field,value]of [['baseline',100],['n',8000],['maxAttempts',1],['generatorVersion','historical-version'],['model','different-model'],['memory','summary'],['opts',{k:13}],['oracle',999],['hint','Unregistered hint']])await check('report/wrong-meta-'+field,async()=>{const f=await fixture(),p=f.records[1].log,l=read(p);l[0][field]=value;write(p,l);assert.throws(()=>validateBatch(f.records));});
 for(const [field,value]of [['batchId','different-batch'],['condition','b'],['seed',1],['repeat',1],['executionIndex',1]])await check('report/wrong-slot-'+field,async()=>{const f=await fixture(),p=f.records[1].log,l=read(p);l[0].slot[field]=value;write(p,l);assert.throws(()=>validateBatch(f.records));});
 for(const field of ['scaffoldHash','scaffold'])await check('report/wrong-'+field,async()=>{const f=await fixture('scaffold'),p=f.records[1].log,l=read(p);l[0][field]=field==='scaffoldHash'?'0'.repeat(64):'different-path.md';write(p,l);assert.throws(()=>validateBatch(f.records));});
 await check('sampling/adjacent-masters',()=>assert.ok(drawSeeds('20261103',40).filter(x=>drawSeeds('20261104',40).includes(x)).length<5));
 const historical=JSON.parse(readFileSync(join(root,'docs/archive/review-v9-checks/REVIEW-EVIDENCE-v9.json'),'utf8'));
 const absent=historical.cases.filter(c=>c.passed===false).map(c=>c.id);
 const absentProtections=absent.map(id=>({id,present:cases.some(c=>c.id===id&&c.passed)}));
 return {schema:5,scope:'offline schema-5 adaptation; original absent-protection case IDs retained',cases,absentProtections,allAbsentProtectionsPresent:absentProtections.every(c=>c.present),allPassed:cases.every(c=>c.passed),liveModelCalls:0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv[2]&&resolve(process.argv[2])!==root)throw new Error('run this adaptation from its own repository');
 const result=await runReviewChecks();if(process.argv[3])writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));if(!result.allPassed||!result.allAbsentProtectionsPresent)process.exitCode=1;
}
