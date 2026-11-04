// Fixed assignment; each slot owns up to three fresh executions and exactly one terminal.
import { readFileSync, appendFileSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { MODEL, MOCK } from './llm.js';
import { validateTrial, validateExecution, validateConfig } from './validate.js';
import { domains } from './domains/index.js';
import { runAttempts } from './run.js';
import { sha256, promptBuilderHash } from './provenance.js';
import { PROTOCOL, readLog, setupResources, terminalFromChain, validateBatch } from './ledger.js';
import {durableAppend,readRecords} from './durable.js';
import {sourceIdentity,validateResumeIdentity,digest,stateDigest} from './source-identity.js';
import {slotKey,bindLog} from './ledger.js';
import { resourcesFromAttempts } from './resources.js';

export async function runExperiment(cfg,{outputDir='runs',transport=null,runner=runAttempts,quiet=false,onBoundary=null}={}) {
  validateConfig(cfg,Object.fromEntries(Object.entries(domains).map(([k,d])=>[k,d.VERSION])));
  const scaffoldHashes={},constructionLedger=[];
  for(const c of cfg.conditions){for(const seed of cfg.seeds){const inst=domains[c.domain].make(seed,c.opts||{});constructionLedger.push({condition:c.id,seed,requestedFamily:c.domain,effectiveClassification:c.domain,assignmentSpace:null,consistentAssignments:null,kernelClasses:null,eligible:true,constructionValid:true,reason:null,instanceDigest:inst.instanceDigest});}if(c.scaffold)scaffoldHashes[c.id]=sha256(readFileSync(c.scaffold,'utf8'));}
  outputDir=resolve(outputDir);mkdirSync(outputDir,{recursive:true});
  const out=join(outputDir,'experiment-'+cfg.name+'.jsonl');
  if(existsSync(out))throw new Error('batch file already exists: '+out);
  const executionPlans={};
  for(const c of cfg.conditions)for(const seed of cfg.seeds)for(let repeat=0;repeat<cfg.repeats;repeat++)executionPlans[slotKey({condition:c.id,seed,repeat})]=Array.from({length:3},()=>randomBytes(16).toString('hex'));
  const header={type:'experiment-meta',schema:5,batchId:randomBytes(16).toString('hex'),config:cfg,scaffoldHashes,promptBuilderHash:promptBuilderHash(),protocol:PROTOCOL,model:MOCK?'mock':MODEL,startedAt:new Date().toISOString(),resumeVersion:1,sourceHash:sourceIdentity(),configHash:digest(JSON.stringify(cfg)),executionPlans,constructionLedger};
  durableAppend(out,header,{exclusive:true});
  return continueBatch(out,[header],{transport,runner,quiet,onBoundary});
}
async function continueBatch(out,records,{transport=null,runner=runAttempts,quiet=false,onBoundary=null}={}){
  const batch=validateBatch(records),{header,cfg}=batch,outputDir=dirname(out),conds=Object.fromEntries(cfg.conditions.map(c=>[c.id,c]));
  const append=r=>{durableAppend(out,r);records.push(r);};
  for(const c of cfg.conditions)for(const seed of cfg.seeds)for(let repeat=0;repeat<cfg.repeats;repeat++){
    const key=slotKey({condition:c.id,seed,repeat}),state=batch.slots.get(key);
    if(state?.terminal)continue;
    const chain=state?.chain.slice()??[],logs=state?.logs.slice()??[],inst=domains[c.domain].make(seed,c.opts||{});
    while(chain.length<3&&(!chain.length||chain.at(-1).status==='interrupted')){
      const executionIndex=chain.length,runId=header.executionPlans[key][executionIndex],logPath=join(outputDir,runId+'.jsonl');
      const slot={batchId:header.batchId,condition:c.id,seed,repeat,executionIndex,runId};
      let log=null,status,reason,logFile=null;
      try{
        await runner({domain:c.domain,seed,attempts:cfg.attempts,hint:c.hint??null,scaffold:c.scaffold??null,memory:c.memory||cfg.memory||'full',opts:c.opts||{},slot,runId,outputDir,transport,quiet:true,resumeExisting:existsSync(logPath),onBoundary});
        log=readLog(logPath);status=log.end.status;reason=log.end.reason??null;logFile=logPath;
      }catch(e){
        if(existsSync(logPath)){
          log=readLog(logPath);
          // Received work is recovered in place, never converted into an API retry.
          if(log.attempts.some(a=>a.status==='received-unscored')||log.end.status!=='interrupted')throw e;
          status='interrupted';reason=log.end.reason;logFile=logPath;
        }else{status='setup-failed';reason='run setup: '+String(e?.message||e).slice(0,300);}
      }
      await onBoundary?.('before-execution-record',{logPath,slot});
      const execution={type:'slot-execution',...slot,status,reason,log:logFile,resources:log?resourcesFromAttempts(log.attempts):setupResources()};
      validateExecution(execution,cfg,header,conds);append(execution);chain.push(execution);logs.push(log);
    }
    const terminal=terminalFromChain(header,c,seed,repeat,chain,logs,inst);
    validateTrial(terminal,cfg,header,conds);append(terminal);
    await onBoundary?.('after-terminal',{terminal});
    if(!quiet)console.log(c.id+' seed='+seed+' repeat='+repeat+': '+terminal.outcome+' ('+chain.length+' execution(s))');
  }
  validateBatch(records);return {out,records};
}
export async function resumeExperiment(file,options={}){
  const out=resolve(file),disposition=out+'.disposition.json';
  if(existsSync(disposition))throw new Error('batch already abandoned: '+disposition);
  let records;
  try{
    records=readRecords(out);validateResumeIdentity(records[0]);
    if(options.config&&digest(JSON.stringify(options.config))!==records[0].configHash)throw new Error('requested config hash differs from batch');
    const batch=validateBatch(records);
    // Validate every orphan before mutating anything or dispatching unfinished slots.
    for(const c of batch.cfg.conditions)for(const seed of batch.cfg.seeds)for(let repeat=0;repeat<batch.cfg.repeats;repeat++){
      const key=slotKey({condition:c.id,seed,repeat}),state=batch.slots.get(key),ids=batch.header.executionPlans[key];
      if(!Array.isArray(ids)||ids.length!==3||new Set(ids).size!==3)throw new Error('invalid execution plan');
      for(let i=state?.chain.length??0;i<3;i++){
        const path=join(dirname(out),ids[i]+'.jsonl');if(!existsSync(path))continue;
        if(state?.terminal||state?.chain.length&&state.chain.at(-1).status!=='interrupted'||i!==(state?.chain.length??0))throw new Error('orphan log outside unfinished execution');
        const log=readLog(path),inst=domains[c.domain].make(seed,c.opts||{});
        bindLog(log,inst,{runId:ids[i],seed,condition:c.id,repeat,executionIndex:i,status:log.end.status,reason:log.end.reason??null,resources:resourcesFromAttempts(log.attempts)},c,batch.header);
      }
    }
    if(batch.terminals.length===batch.expected.length)return {out,records,idempotent:true};
  }catch(e){
    durableAppend(disposition,{type:'batch-disposition',status:'abandoned',reason:e.message,priorStateDigest:digest(readFileSync(out)),recordedAt:new Date().toISOString()},{exclusive:true});
    throw e;
  }
  const event={type:'batch-resume',batchId:records[0].batchId,resumedFrom:stateDigest(records),at:new Date().toISOString()};
  durableAppend(out,event);records.push(event);
  return continueBatch(out,records,options);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const path=process.argv[2],job=path==='--resume'?resumeExperiment(process.argv[3]):path?runExperiment(JSON.parse(readFileSync(path,'utf8'))):Promise.reject(new Error('usage: node src/experiment.js <config.json> | --resume <batch.jsonl>'));
  job.then(r=>console.log('batch -> '+r.out)).catch(e=>{console.error(e.message);process.exitCode=2;});
}
