// One solver execution. Slot restarts are owned by experiment.js.
import { appendFileSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getDomain } from './domains/index.js';
import { evaluate, isSuccess } from './sandbox.js';
import { complete, MODEL, MOCK, getLastUsage } from './llm.js';
import { SYSTEM_BASE, buildMessages, parseResponse, describeResult } from './prompt.js';
import { normalizeRunInput, validateMeta, validateAttempt, validateEnd, validateRunLog } from './validate.js';
import {durableAppend,durableReplace,readRecords} from './durable.js';
import {validateRequestArchive} from './provenance.js';
import { sha256, promptBuilderHash } from './provenance.js';

export function parseArgs(argv) {
  const a = {}; for (let i=0;i<argv.length;i++) if (argv[i].startsWith('--')) { const k=argv[i].slice(2); a[k]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true; } return a;
}
export async function runAttempts({ domain, seed, attempts, hint=null, scaffold=null, memory='full', opts={}, slot=null, quiet=false, outputDir='runs', runId=randomBytes(16).toString('hex'), transport=null, resumeExisting=false, onBoundary=null }) {
  ({seed,attempts,memory,opts}=normalizeRunInput({seed,attempts,memory,opts}));
  if (hint!==null && (typeof hint!=='string'||!hint)) throw new Error('hint must be null or nonempty text');
  const inst=getDomain(domain).make(seed,opts);
  const scaffoldText=scaffold?readFileSync(scaffold,'utf8'):null;
  const scaffoldHash=scaffoldText===null?null:sha256(scaffoldText);
  const system=SYSTEM_BASE+(scaffoldText===null?'':'\n\n'+scaffoldText);
  if (slot) slot={...slot,runId};
  let meta={type:'meta',schema:5,runId,domain,generatorVersion:inst.generatorVersion,seed,model:MOCK?'mock':MODEL,attempts,maxAttempts:attempts,hint,scaffold,scaffoldText,scaffoldHash,promptBuilderHash:promptBuilderHash(),slot,memory,opts,system,secret:inst.secret,instanceDigest:inst.instanceDigest,worldDigest:inst.worldDigest,n:inst.n,baseline:inst.baselineBitsPerSym,oracle:inst.oracleBitsPerSym,startedAt:new Date().toISOString()};
  validateMeta(meta); mkdirSync(outputDir,{recursive:true});
  const logPath=join(outputDir,runId+'.jsonl');
  let history=[],archived=[],success=null;
  if(resumeExisting){
    const prior=validateRunLog(readRecords(logPath));
    for(const key of Object.keys(meta))if(key!=='startedAt'&&JSON.stringify(meta[key])!==JSON.stringify(prior.meta[key]))throw new Error('resume run metadata differs: '+key);
    validateRequestArchive(prior,inst);meta=prior.meta;archived=prior.attempts;history=archived.filter(a=>a.status==='received');success=prior.end.success;
    if(prior.hasEnd)return {runId,logPath,success,interrupted:prior.end.status==='interrupted',history,archived,inst};
  }else durableAppend(logPath,meta,{exclusive:true});
  const writeEnd=(status,reason=null)=>{
    const end={type:'end',status,success,attemptsUsed:history.length,requestsDispatched:archived.length,maxAttempts:attempts,budgetExhausted:status==='completed'&&success===null&&history.length===attempts,reason,endedAt:new Date().toISOString()};
    validateEnd(end,meta,archived,inst); durableAppend(logPath,end); return end;
  };
  if(resumeExisting&&archived.at(-1)?.status==='dispatched'){
    const end=writeEnd('interrupted','process ended with an unreceived dispatched request');
    return {runId,logPath,success,interrupted:true,reason:end.reason,history,archived,inst};
  }
  if(success!==null||history.length===attempts){writeEnd('completed');return {runId,logPath,success,interrupted:false,history,archived,inst};}
  for(let attempt=history.length+1;attempt<=attempts;attempt++){
    const messages=buildMessages(inst,history,{hint,memory});
    let receipt=archived[attempt-1];
    if(!receipt){
      const dispatched={type:'attempt',attempt,status:'dispatched',messagesSent:messages,raw:null,result:null,feedbackText:null,idea:null,code:null,assumption:null,newObject:null,usage:null,ts:new Date().toISOString()};
      validateAttempt(dispatched,attempt-1,meta);archived.push(dispatched);durableAppend(logPath,dispatched);
      const started=performance.now();let raw,usage;
      try{
        if(transport){const reply=await transport({system,messages,logPath,attempt,slot});raw=reply.raw;usage=reply.usage??null;}
        else{raw=await complete({system,messages});usage=getLastUsage();}
        if(typeof raw!=='string')throw new Error('transport returned non-text response');
      }catch(e){const end=writeEnd('interrupted','api: '+String(e?.message||e).slice(0,300));return {runId,logPath,success:null,interrupted:true,reason:end.reason,history,archived,inst};}
      if(usage!==null)usage={...usage,seconds:(performance.now()-started)/1000};
      receipt={...dispatched,status:'received-unscored',raw,usage,receivedAt:new Date().toISOString()};
      validateAttempt(receipt,attempt-1,meta);archived[attempt-1]=receipt;durableReplace(logPath,[meta,...archived]);
      await onBoundary?.('received-unscored',{logPath,attempt,slot});
    }
    const {raw,usage}=receipt;
    const parsed=parseResponse(raw);
    const truncated=usage?.stop_reason==='max_tokens'&&!/<\/code>/.test(raw);
    const result=truncated?{ok:false,stage:'truncated',error:'output hit the '+usage.output_tokens+'-token limit before </code>'}
      :parsed.code?await evaluate(parsed.code,inst).catch(e=>({ok:false,stage:'verify',error:'host boundary: '+String(e?.message||e).slice(0,200)}))
      :{ok:false,stage:'parse',error:'no <code> block in response'};
    const rec={type:'attempt',attempt,status:'received',messagesSent:messages,...parsed,raw,result,feedbackText:describeResult(result),usage,ts:receipt.ts,receivedAt:receipt.receivedAt};
    validateAttempt(rec,attempt-1,meta); archived[archived.length-1]=rec;
    durableReplace(logPath,[meta,...archived]); history.push(rec);
    if (!quiet) console.log('#'+attempt+' '+describeResult(result));
    if (isSuccess(result,inst)) {success=attempt;break;}
  }
  writeEnd('completed');
  return {runId,logPath,success,interrupted:false,history,archived,inst};
}
if (process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const a=parseArgs(process.argv.slice(2));
  if (!a.domain) {console.error('usage: node src/run.js --domain laggedRule --seed 1 --attempts 20');process.exitCode=1;}
  else runAttempts({domain:a.domain,seed:a.seed??1,attempts:a.attempts??20,hint:a.hint||null,scaffold:a.scaffold||null,memory:a.memory||'full',opts:a.k?{k:Number(a.k)}:{}})
    .then(r=>console.log('log: '+r.logPath)).catch(e=>{console.error(e);process.exitCode=1;});
}
