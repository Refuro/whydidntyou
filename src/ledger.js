// The one evidence path used by writer fixtures and report: assignment -> execution logs -> terminal.
import { readFileSync } from 'node:fs';
import { getDomain, domains } from './domains/index.js';
import { validateConfig, validateExecution, validateTrial, validateRunLog, validateAttempt } from './validate.js';
import { validateRequestArchive, promptBuilderHash } from './provenance.js';
import { resourcesFromAttempts, sumResources } from './resources.js';
import { clusterIdeas } from './ideas.js';

export const PROTOCOL = Object.freeze({ retries: 2, transportTimeoutMs: 120000, history: 'fresh on every execution', scheduling: 'condition, seed, repeat; immediate restarts', decoding: 'provider fresh trajectory; no provider retries', endpoint: 'success of the slot procedure (success in the terminating completed run)' });
export const slotKey = r => `${r.condition}|${r.seed}|${r.repeat}`;
export const readLog = path => validateRunLog(readFileSync(path,'utf8').trim().split('\n').map(JSON.parse));
export const chainRef = r => Object.fromEntries(['executionIndex','status','reason','runId','log'].map(k=>[k,r[k]]));
export const setupResources = () => ({ ...resourcesFromAttempts([]), seconds: 'unknown' });
const equal = (a,b,label) => { if (JSON.stringify(a)!==JSON.stringify(b)) throw new Error(label); };

export function terminalFromChain(header, cond, seed, repeat, chain, logs, inst) {
  const last=chain.at(-1), log=logs.at(-1), resolved=last.status==='completed';
  const history=log?.attempts.filter(a=>a.status==='received')??[];
  const success=resolved?log.end.success:null;
  const resources=sumResources(chain.map(r=>r.resources));
  return {type:'slot-terminal',batchId:header.batchId,condition:cond.id,seed,repeat,domain:cond.domain,generatorVersion:inst.generatorVersion,secret:inst.secret,opts:cond.opts||{},memory:cond.memory||header.config.memory||'full',model:header.model,instanceDigest:inst.instanceDigest,worldDigest:inst.worldDigest,chain:chain.map(chainRef),outcome:resolved?(success===null?'failure':'success'):'unresolved',success,attemptsUsed:history.length,maxAttempts:header.config.attempts,budgetExhausted:resolved&&success===null,distinctIdeas:clusterIdeas(history.map(h=>h.idea)).length,resources,tokens:resources.tokens,seconds:resources.seconds};
}

export function bindLog(log, inst, execution, cond, header) {
  const m=log.meta, cfg=header.config;
  for (const [key,value] of Object.entries({runId:execution.runId,seed:execution.seed,domain:cond.domain,generatorVersion:inst.generatorVersion,worldDigest:inst.worldDigest,instanceDigest:inst.instanceDigest,n:inst.n,baseline:inst.baselineBitsPerSym,oracle:inst.oracleBitsPerSym,maxAttempts:cfg.attempts,model:header.model,memory:cond.memory||cfg.memory||'full',hint:cond.hint??null,scaffold:cond.scaffold??null,scaffoldHash:header.scaffoldHashes[cond.id]??null})) equal(m[key],value,`linked log ${key} differs from assigned instance/treatment`);
  equal(m.secret,inst.secret,'linked log secret mismatch'); equal(m.opts,cond.opts||{},'linked log options mismatch');
  equal(m.slot,{batchId:header.batchId,condition:execution.condition,seed:execution.seed,repeat:execution.repeat,executionIndex:execution.executionIndex,runId:execution.runId},'linked log execution slot mismatch');
  log.attempts.forEach((a,i)=>validateAttempt(a,i,{n:inst.n,baseline:inst.baselineBitsPerSym,oracle:inst.oracleBitsPerSym}));
  validateRequestArchive(log,inst,{hint:cond.hint??null,memory:cond.memory||cfg.memory||'full'},header.promptBuilderHash);
  equal(log.end.status,execution.status,'execution status contradicts linked log');
  equal(log.end.reason??null,execution.reason,'execution reason contradicts linked log');
  equal(execution.resources,resourcesFromAttempts(log.attempts),'execution resources contradict archived usage');
}

export function validateBatch(records, {loadLog=readLog}={}) {
  const header=records[0];
  if (header?.type!=='experiment-meta'||header.schema!==5||typeof header.batchId!=='string'||!header.batchId||typeof header.model!=='string'||!header.model) throw new Error('one schema-5 experiment header must be first');
  const cfg=header.config;
  validateConfig(cfg,Object.fromEntries(Object.entries(domains).map(([k,d])=>[k,d.VERSION])));
  if (header.promptBuilderHash!==promptBuilderHash()) throw new Error('batch prompt-builder hash differs from current source');
  equal(header.protocol,PROTOCOL,'batch restart protocol mismatch');
  if (!header.scaffoldHashes||typeof header.scaffoldHashes!=='object') throw new Error('batch scaffold hashes missing');
  for (const c of cfg.conditions) if (c.scaffold&&!/^[0-9a-f]{64}$/.test(header.scaffoldHashes[c.id])) throw new Error('batch configured scaffold hash missing');
  const conds=Object.fromEntries(cfg.conditions.map(c=>[c.id,c])), slots=new Map(), usedRuns=new Set(), instances=new Map();
  const instance=(c,s)=>{const k=c.id+'|'+s;if(!instances.has(k))instances.set(k,getDomain(c.domain).make(s,c.opts||{}));return instances.get(k);};
  for (const r of records.slice(1)) {
    if (!['slot-execution','slot-terminal'].includes(r.type)) throw new Error('unknown or duplicate header record');
    const key=slotKey(r), state=slots.get(key)||{chain:[],logs:[],terminal:null};
    if(state.terminal)throw new Error('execution or record after slot terminal');
    if (r.type==='slot-execution') {
      validateExecution(r,cfg,header,conds);
      if(r.executionIndex!==state.chain.length)throw new Error('execution indices must be contiguous starting at zero');
      if(state.chain.length&&state.chain.at(-1).status!=='interrupted')throw new Error('execution after terminal completion/setup failure');
      if(usedRuns.has(r.runId))throw new Error('run reused across executions or slots'); usedRuns.add(r.runId);
      let log=null;
      if(r.status==='setup-failed')equal(r.resources,setupResources(),'setup resources mismatch');
      else {log=loadLog(r.log);bindLog(log,instance(conds[r.condition],r.seed),r,conds[r.condition],header);}
      state.chain.push(r);state.logs.push(log);
    } else {
      validateTrial(r,cfg,header,conds);
      if(!state.chain.length)throw new Error('terminal with missing execution');
      if(state.chain.at(-1).status==='interrupted'&&state.chain.length!==3)throw new Error('terminal before authorized retries exhausted');
      const expected=terminalFromChain(header,conds[r.condition],r.seed,r.repeat,state.chain,state.logs,instance(conds[r.condition],r.seed));
      for(const [field,value]of Object.entries(expected))equal(r[field],value,`terminal ${field} contradicts execution chain`);
      state.terminal=r;
    }
    slots.set(key,state);
  }
  const expected=[],missing=[],terminals=[];
  for(const c of cfg.conditions)for(const seed of cfg.seeds)for(let repeat=0;repeat<cfg.repeats;repeat++) {
    const slot={condition:c.id,seed,repeat};expected.push(slot);
    const state=slots.get(slotKey(slot));
    if(!state?.terminal)missing.push({...slot,reason:state?'missing slot terminal':'not started'});
    else {terminals.push(state.terminal);if(state.terminal.outcome==='unresolved')missing.push({...slot,reason:state.chain.at(-1).reason});}
  }
  const coincident=[],byDigest=new Map();
  for(const c of cfg.conditions)for(const seed of cfg.seeds){const inst=instance(c,seed),k=c.id+'|'+inst.worldDigest;if(byDigest.has(k))coincident.push({condition:c.id,seeds:[byDigest.get(k),seed],worldDigest:inst.worldDigest});else byDigest.set(k,seed);}
  for(const ct of cfg.contrasts||[]){const [a,b]=Array.isArray(ct)?ct:[ct.a,ct.b];if(conds[a].domain===conds[b].domain&&JSON.stringify(conds[a].opts||{})===JSON.stringify(conds[b].opts||{}))for(const seed of cfg.seeds)equal(instance(conds[a],seed).worldDigest,instance(conds[b],seed).worldDigest,'paired world mismatch');}
  // Current schema-5 construction preflights every proposed seed and assigns all of
  // them, or refuses the batch. B3 exclusions must derive these counts from its
  // validated proposal/defect ledger instead of copying summary fields.
  const constructionCounts=Object.fromEntries(cfg.conditions.map(c=>[c.id,{proposed:cfg.seeds.length,eligible:cfg.seeds.length}]));
  return {header,cfg,slots,terminals,expected,missing,coincident,constructionCounts};
}
