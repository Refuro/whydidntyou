// Schema-5 report: all summaries derive from validated execution chains.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { validateBatch } from './ledger.js';
import { analyzeAssignment } from './analysis.js';

export function reportBatch(file) {
  const records=readFileSync(file,'utf8').trim().split('\n').map(JSON.parse),batch=validateBatch(records);
  const {header,cfg,terminals,expected,missing,coincident}=batch;
  const base=file.replace(/\.jsonl$/,''),analysis=analyzeAssignment(batch);
  writeFileSync(base+'.missing.json',JSON.stringify({batchId:header.batchId,expected:expected.length,present:terminals.filter(t=>t.outcome!=='unresolved').length,missing,coincidentWorlds:coincident},null,2)+'\n');
  writeFileSync(base+'.analysis.json',JSON.stringify(analysis,null,2)+'\n');
  if(terminals.length!==expected.length&&cfg.missingPolicy!=='exploratory')throw new Error('incomplete assignment: missing terminal records; ledger and conservative analysis saved');
  const pct=x=>(100*x).toFixed(2)+'%',interval=x=>'['+x.map(pct).join(', ')+']';
  const md=['# Report: '+cfg.name,'','Batch: '+header.batchId+'. Model: '+header.model+'. Schema 5.',
    'Configured: '+cfg.conditions.length+' conditions × '+cfg.seeds.length+' worlds × '+cfg.repeats+' repeats. Terminals: '+terminals.length+'. Unresolved/not started: '+missing.length+'.',
    cfg.missingPolicy==='exploratory'?'**EXPLORATORY BATCH. Development only.**':'Confirmatory analysis subject to the completeness gate and registered sampling assumptions.',
    '',analysis.endpoint+'. '+analysis.unit+'.',
    'The SHA-256 seed expansion is a computational approximation to simple random sampling. The finite-population bound assumes a fixed binary potential outcome per seed and the registered population; stochastic decoding or eligibility conditioning needs the separately frozen justification.',
    'Resources include every execution in a slot. Missing usage is unknown. Token fields: input_tokens + output_tokens + cache_creation_input_tokens + cache_read_input_tokens; nested cache breakdowns are not counted twice.',
    'Success-by-budget below describes the terminating completed run under the slot procedure; discarded retry costs remain in resource totals.'];
  if(coincident.length)md.push('','**Coincident worlds:** '+coincident.length+' coincident seed pairs are retained draws.');
  const budgets=[1,3,6,9,cfg.attempts].filter((b,i,a)=>b<=cfg.attempts&&a.indexOf(b)===i);
  md.push('','## Per condition','','| condition | resolved slots / assigned | success-by-budget '+budgets.join('/')+' | median tokens / slot | median seconds / slot |','|---|---|---|---|---|');
  const median=values=>values.some(v=>v==='unknown')?'unknown':values.length?values.toSorted((a,b)=>a-b)[Math.floor(values.length/2)]:'unknown';
  for(const c of cfg.conditions){
    const ts=terminals.filter(t=>t.condition===c.id),denom=cfg.seeds.length*cfg.repeats;
    const curves=budgets.map(b=>{const s=ts.filter(t=>t.success!==null&&t.success<=b).length,u=denom-ts.filter(t=>t.outcome!=='unresolved').length;return u?interval([s/denom,(s+u)/denom]):pct(s/denom);}).join(' / ');
    md.push('| '+c.id+' | '+ts.filter(t=>t.outcome!=='unresolved').length+' / '+denom+' | '+curves+' | '+median(ts.map(t=>t.tokens))+' | '+median(ts.map(t=>t.seconds))+' |');
  }
  md.push('','## Registered bounds by repeat stratum','','| condition / repeat | gate | n / s / u | hypergeometric upper (95%) | binomial approximation | resolved-only diagnostic |','|---|---|---|---|---|---|');
  for(const c of analysis.conditions)md.push('| '+c.condition+' / '+c.repeat+' | '+(c.gate.passed?'PASS':'FAIL')+' | '+[c.n,c.successes,c.unresolved].join(' / ')+' | '+pct(c.conservative)+' | '+pct(c.binomialApproximation)+' | '+(c.resolvedOnly===null?'unavailable':pct(c.resolvedOnly))+' |');
  md.push('','Resolved-only diagnostics assume resolution independent of potential outcome; that assumption is not established by disclosure. A failed gate withholds the primary population claim. The registered bound uses M = 2^32 and counts unresolved outcomes as possible successes.');
  md.push('','## Paired contrasts','');
  for(const c of analysis.contrasts){
    if(c.refused){md.push('- '+c.b+' − '+c.a+': REFUSED — '+c.refused);continue;}
    md.push('- '+(c.primary?'PRIMARY':'EXPLORATORY')+': '+c.b+' − '+c.a+': sample identification bounds '+interval(c.sampleIdentificationBounds)+'. '+(c.populationInterval?'95% population interval '+interval(c.populationInterval):'No population interval')+'; '+c.populationReason+'.');
    md.push('','| seed | possible difference |','|---|---|',...c.perWorld.map(w=>'| '+w.seed+' | '+interval(w.difference)+' |'),'');
  }
  const param=terminals.some(t=>t.secret.k!==undefined)?'k':terminals.some(t=>t.secret.L!==undefined)?'L':null;
  if(param){
    md.push('','## Success by hidden '+param+' (per condition)','','| condition | '+param+' | success / assigned slots |','|---|---|---|');
    for(const c of cfg.conditions){const ts=terminals.filter(t=>t.condition===c.id);for(const v of [...new Set(ts.map(t=>t.secret[param]))].sort((a,b)=>a-b)){const sub=ts.filter(t=>t.secret[param]===v);md.push('| '+c.id+' | '+v+' | '+sub.filter(t=>t.outcome==='success').length+' / '+sub.length+' (unresolved '+sub.filter(t=>t.outcome==='unresolved').length+') |');}}
  }
  const out=base.replace('experiment-','report-')+'.md';writeFileSync(out,md.join('\n')+'\n');
  return {out,batch,analysis};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{if(!process.argv[2])throw new Error('usage: node src/report.js runs/experiment-<name>.jsonl');console.log('report -> '+reportBatch(process.argv[2]).out);}
  catch(e){console.error('refusing: '+e.message);process.exitCode=2;}
}
