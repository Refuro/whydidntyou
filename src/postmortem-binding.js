import {readdirSync,readFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {validateBatch} from './ledger.js';

// Slotted runs must recover their registered treatment from their batch, not trust their own labels.
export function validatePostmortemBatch(logPath,log,batchPath=null) {
  if(log.meta.slot===null)return;
  const candidates=batchPath?[batchPath]:readdirSync(dirname(resolve(logPath))).filter(f=>/^experiment-.*\.jsonl$/.test(f)).map(f=>join(dirname(resolve(logPath)),f));
  const matching=[];
  for(const path of candidates){const records=readFileSync(path,'utf8').trim().split('\n').map(JSON.parse);if(records[0]?.batchId===log.meta.slot.batchId)matching.push(records);}
  if(matching.length!==1)throw new Error('postmortem needs exactly one matching registered batch (use --batch path if moved)');
  const batch=validateBatch(matching[0]);
  const executions=[...batch.slots.values()].flatMap(s=>s.chain);
  if(!executions.some(e=>e.runId===log.meta.runId&&resolve(e.log||'')===resolve(logPath)))throw new Error('postmortem run is not a linked execution in its registered batch');
}
