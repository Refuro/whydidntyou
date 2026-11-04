import {pathToFileURL} from 'node:url';
import {make,referenceCode,publicEvidence} from './domains/invariantGame.js';
import {evaluate,isSuccess} from './sandbox.js';
import {bfsCode,countNullspaceCode,WALL_BUDGETS} from './baselines/invariant-wall.js';

export const WALL_SPECS=[{family:'F-count'},{family:'F-abelian'},...['S3','Q8','D4','A4'].map(algebra=>({family:'F-nonabelian',algebra})),...[3,4].map(points=>({family:'F-monoid',points}))];
export async function invariantSelftest({seeds=[1,2],quiet=false}={}){
  const rows=[];
  for(const seed of seeds)for(const opts of WALL_SPECS){
    const inst=make(seed,opts),publicWorld=publicEvidence(inst);
    const scores={};
    for(const [name,code]of [['reference',referenceCode(inst)],['countNullspace',countNullspaceCode(publicWorld)],['bfs',bfsCode(publicWorld)]]){
      const pairs=name==='bfs'?inst.calibrationPairs.filter(p=>p.scale==='large'):inst.calibrationPairs;
      const result=await evaluate(code,inst,{evaluationPairs:pairs,purpose:'wall-selftest',outputCondition:name==='reference'?'quantity-requested':'unrestricted',timeoutMs:WALL_BUDGETS[name].totalSandboxMs});
      if(!result.ok)throw new Error(name+' did not return valid predictions: '+JSON.stringify({seed,opts,result}));
      scores[name]={accuracy:result.accuracy,success:isSuccess(result),smallAccuracy:result.smallAccuracy,largeAccuracy:result.largeAccuracy};
      if(name==='reference'&&(!isSuccess(result)||!result.quantity.conservation.proved||!result.quantity.partitionsAgree))throw new Error('reference/proof wall failure');
      if(name==='bfs'&&isSuccess(result))throw new Error('bounded BFS crossed large-state wall');
      if(name==='countNullspace'&&isSuccess(result)!==inst.submonoid.commutative)throw new Error('count nullspace wall disagrees with family');
    }
    const row={seed,...opts,worldDigest:inst.worldDigest,recoverable:inst.identifiabilityAudit.recoverable,scores};rows.push(row);if(!quiet)console.log(JSON.stringify(row));
  }
  return {status:'passed',scope:'B2 calibration wall, not sealed evaluation or portfolio coverage',budgets:WALL_BUDGETS,rows};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  invariantSelftest().then(()=>console.log('invariant selftest OK')).catch(e=>{console.error(e);process.exitCode=1;});
}
