import { nullBounds } from './bounds.js';
import { slotKey } from './ledger.js';

// Repeats are separate binary endpoint strata, never independent additional worlds.
export function analyzeAssignment(batch) {
  const {cfg,slots}=batch,conditions=[];
  const outcome=(condition,seed,repeat)=>slots.get(slotKey({condition,seed,repeat}))?.terminal?.outcome??'unresolved';
  for(const c of cfg.conditions)for(let repeat=0;repeat<cfg.repeats;repeat++) {
    const outcomes=cfg.seeds.map(s=>outcome(c.id,s,repeat));
    conditions.push({condition:c.id,repeat,...nullBounds({n:outcomes.length,successes:outcomes.filter(x=>x==='success').length,unresolved:outcomes.filter(x=>x==='unresolved').length})});
  }
  const contrasts=(cfg.contrasts||[]).map((ct,index)=>{
    const {a,b,sharedWorld=false}=Array.isArray(ct)?{a:ct[0],b:ct[1]}:ct;
    const ca=cfg.conditions.find(c=>c.id===a),cb=cfg.conditions.find(c=>c.id===b);
    if(ca.domain!==cb.domain||(!sharedWorld&&JSON.stringify(ca.opts||{})!==JSON.stringify(cb.opts||{})))return {a,b,refused:'world pairing is not registered for these conditions'};
    const interval=(c,s)=>{let lo=0,hi=0;for(let r=0;r<cfg.repeats;r++){const o=outcome(c,s,r);if(o==='success')lo++;if(o!=='failure')hi++;}return [lo/cfg.repeats,hi/cfg.repeats];};
    const perWorld=cfg.seeds.map(seed=>{const av=interval(a,seed),bv=interval(b,seed);return {seed,a:av,b:bv,difference:[bv[0]-av[1],bv[1]-av[0]]};});
    const mean=side=>perWorld.reduce((sum,w)=>sum+w.difference[side],0)/perWorld.length;
    const allResolved=perWorld.every(w=>w.difference[0]===w.difference[1]);
    let populationInterval=null,populationReason='unknown arm outcomes: sample identification bounds only';
    if(allResolved){
      const diffs=perWorld.map(w=>w.difference[0]);
      if(diffs.length<2||diffs.every(d=>d===diffs[0]))populationReason='paired bootstrap withheld: fewer than two worlds or identical differences';
      else {let state=12345;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/2**32;};const boots=[];for(let i=0;i<4000;i++){let sum=0;for(let j=0;j<diffs.length;j++)sum+=diffs[Math.floor(random()*diffs.length)];boots.push(sum/diffs.length);}boots.sort((x,y)=>x-y);populationInterval=[boots[100],boots[3899]];populationReason='nominal 95% paired world percentile bootstrap';}
    }
    return {a,b,primary:index===0,sharedWorld,perWorld,sampleIdentificationBounds:[mean(0),mean(1)],allResolved,populationInterval,populationReason};
  });
  return {endpoint:'success of the slot procedure (success in the terminating completed run)',unit:'world within each repeat stratum; repeats are not pooled as independent worlds',conditions,contrasts};
}
