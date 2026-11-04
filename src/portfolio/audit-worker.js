import {parentPort,workerData} from 'node:worker_threads';
import {join} from 'node:path';
import {readRecords,durableAppend} from '../durable.js';
import {buildCorpus,constructionSummary,sealWorld} from '../construction-ledger.js';
import {make} from '../domains/invariantGame.js';
import {constructSealed} from '../sealed-sampler.js';
import {checkWorld} from '../check-invariant-world.js';
import {sourceIdentity} from '../source-identity.js';
import {runPortfolio} from './run.js';
const {phase,directory,family,proposals,shard=0,shards=1}=workerData,ledger=join(directory,family+'.construction.jsonl');
try{
  if(phase==='construct'){
    const result=buildCorpus(ledger,proposals,{retainWorlds:false,onProgress:p=>{if(p.index%32===0)parentPort.postMessage({type:'progress',phase,family,...p});}});
    parentPort.postMessage({type:'complete',phase,family,counts:result.summary.counts});
  }else{
    const records=readRecords(ledger),header=records[0],summary=constructionSummary(records),accepted=summary.entries.filter(e=>e.constructionValid).filter((_,i)=>i%shards===shard);
    if(header.sourceHash!==sourceIdentity())throw new Error('audit source changed after construction');
    const out=join(directory,family+'.part-'+shard+'.portfolio.jsonl');
    durableAppend(out,{type:'portfolio-audit-meta',shard,shards,sourceHash:header.sourceHash,family,constructionLedger:ledger,accepted:accepted.length},{exclusive:true});
    for(const [index,entry]of accepted.entries()){
      const proposal=header.proposals[entry.index],inst=make(proposal.seed,proposal.opts),world=sealWorld(inst,constructSealed(inst));
      if(world.worldDigest!==entry.worldDigest)throw new Error('regenerated audit world mismatch');
      const checked=checkWorld({world,construction:entry});
      durableAppend(out,{type:'portfolio-world',proposalIndex:entry.index,opts:proposal.opts,checks:checked.checks,...await runPortfolio(world)});
      if((index+1)%16===0)parentPort.postMessage({type:'progress',phase,family,shard,index:index+1,total:accepted.length});
    }
    if(header.sourceHash!==sourceIdentity())throw new Error('audit source changed during scoring');
    parentPort.postMessage({type:'complete',phase,family,shard,scored:accepted.length});
  }
}catch(error){parentPort.postMessage({type:'error',phase,family,error:error.stack});process.exitCode=1;}
