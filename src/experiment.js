// Fixed assignment; each slot owns up to three fresh executions and exactly one terminal.
import { readFileSync, appendFileSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { MODEL, MOCK } from './llm.js';
import { validateTrial, validateExecution, validateConfig } from './validate.js';
import { domains } from './domains/index.js';
import { runAttempts } from './run.js';
import { sha256, promptBuilderHash } from './provenance.js';
import { PROTOCOL, readLog, setupResources, terminalFromChain, validateBatch } from './ledger.js';
import { resourcesFromAttempts } from './resources.js';

export async function runExperiment(cfg,{outputDir='runs',transport=null,runner=runAttempts,quiet=false}={}) {
  validateConfig(cfg,Object.fromEntries(Object.entries(domains).map(([k,d])=>[k,d.VERSION])));
  const scaffoldHashes={};
  // All setup/configuration checks precede any request or batch file.
  for(const c of cfg.conditions) {
    for(const seed of cfg.seeds)domains[c.domain].make(seed,c.opts||{});
    if(c.scaffold)scaffoldHashes[c.id]=sha256(readFileSync(c.scaffold,'utf8'));
  }
  outputDir=resolve(outputDir);mkdirSync(outputDir,{recursive:true});
  const out=join(outputDir,'experiment-'+cfg.name+'.jsonl');
  if(existsSync(out))throw new Error('batch file already exists: '+out);
  const header={type:'experiment-meta',schema:5,batchId:randomBytes(16).toString('hex'),config:cfg,scaffoldHashes,promptBuilderHash:promptBuilderHash(),protocol:PROTOCOL,model:MOCK?'mock':MODEL,startedAt:new Date().toISOString()};
  const records=[header], conds=Object.fromEntries(cfg.conditions.map(c=>[c.id,c]));
  writeFileSync(out,JSON.stringify(header)+'\n',{flag:'wx'});
  const append=r=>{appendFileSync(out,JSON.stringify(r)+'\n');records.push(r);};
  for(const c of cfg.conditions)for(const seed of cfg.seeds)for(let repeat=0;repeat<cfg.repeats;repeat++) {
    const chain=[],logs=[],inst=domains[c.domain].make(seed,c.opts||{});
    for(let executionIndex=0;executionIndex<=2;executionIndex++) {
      const runId=randomBytes(16).toString('hex'),logPath=join(outputDir,runId+'.jsonl');
      const slot={batchId:header.batchId,condition:c.id,seed,repeat,executionIndex,runId};
      let log=null,status,reason,logFile=null;
      try {
        await runner({domain:c.domain,seed,attempts:cfg.attempts,hint:c.hint??null,scaffold:c.scaffold??null,memory:c.memory||cfg.memory||'full',opts:c.opts||{},slot,runId,outputDir,transport,quiet:true});
        log=readLog(logPath);status=log.end.status;reason=log.end.reason??null;logFile=logPath;
      } catch(e) {
        if(existsSync(logPath)) {
          // A process-level interruption with a durable dispatch is recoverable evidence.
          // Malformed or already completed logs never become a fabricated setup failure.
          log=readLog(logPath); if(log.end.status!=='interrupted')throw e;
          status='interrupted';reason=log.end.reason;logFile=logPath;
        } else {status='setup-failed';reason='run setup: '+String(e?.message||e).slice(0,300);}
      }
      const execution={type:'slot-execution',...slot,status,reason,log:logFile,resources:log?resourcesFromAttempts(log.attempts):setupResources()};
      validateExecution(execution,cfg,header,conds);append(execution);chain.push(execution);logs.push(log);
      if(status!=='interrupted')break;
    }
    const terminal=terminalFromChain(header,c,seed,repeat,chain,logs,inst);
    validateTrial(terminal,cfg,header,conds);append(terminal);
    if(!quiet)console.log(c.id+' seed='+seed+' repeat='+repeat+': '+terminal.outcome+' ('+chain.length+' execution(s))');
  }
  validateBatch(records);
  return {out,records};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const path=process.argv[2];
  if(!path){console.error('usage: node src/experiment.js experiments/<config>.json');process.exitCode=1;}
  else runExperiment(JSON.parse(readFileSync(path,'utf8'))).then(r=>console.log('batch -> '+r.out)).catch(e=>{console.error(e.message);process.exitCode=2;});
}
