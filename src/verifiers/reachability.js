import {validateMonoid,fold,words} from '../algebra.js';

export const SUCCESS_ACCURACY=.95;
export const OUTPUT_CONDITIONS=Object.freeze(['unrestricted','quantity-requested']);
export const reachabilityContract=Object.freeze({name:'reachability',score:evaluateReachability});
function canonical(value){
  if(value===null||typeof value==='boolean'||typeof value==='string')return JSON.stringify(value);
  if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  throw new Error('quantity must return finite JSON data');
}
export function contextChecks(inst){
  const contexts=words(inst.alphabet,3),edges=[];
  // Total surrounding-context length <= max rule length, for every rule and split.
  for(const x of contexts)for(const y of contexts)if(x.length+y.length<=3)for(const rule of inst.rules)edges.push([x+rule.u+y,x+rule.v+y]);
  return edges;
}
export async function evaluateReachability(code,inst,{runProgram,timeoutMs=10000,evaluationPairs,purpose,outputCondition='unrestricted'}={}){
  if(!OUTPUT_CONDITIONS.includes(outputCondition))return {ok:false,stage:'verify',error:'unregistered output condition'};
  const pairs=evaluationPairs??inst.sealedPairs;
  if(evaluationPairs&&purpose!=='wall-selftest')return {ok:false,stage:'verify',error:'evaluationPairs override is only for the registered wall selftest'};
  if(!Array.isArray(pairs)||!pairs.length)return {ok:false,stage:'verify',error:'sealed pairs are unavailable until B3 construction'};
  const deadline=Date.now()+timeoutMs;
  const call=async input=>{const remaining=deadline-Date.now();if(remaining<=0)throw new Error('total sandbox evaluation budget exhausted');const r=await runProgram(code,input,remaining);if(!r.ok)throw new Error(r.stage+': '+r.error);return r.value;};
  try{
    const inspect=await call({op:'inspect'});
    if(!inspect.hasReachable)throw new Error('reachable(a,b) must be a function');
    if(inspect.hasQuantity&&inspect.fold!==null)throw new Error('choose functional quantity or declarative quantityFold, not both');
    if(outputCondition==='quantity-requested'&&!inspect.hasQuantity&&inspect.fold===null)throw new Error('quantity-requested requires quantity(state) or quantityFold');
    let correct=0;const byScale={small:{n:0,correct:0},large:{n:0,correct:0}};
    for(const p of pairs){const value=await call({op:'reachable',a:p.a,b:p.b});if(typeof value!=='boolean')throw new Error('reachable must return boolean');correct+=Number(value===p.label);const s=byScale[p.scale||'small'];s.n++;s.correct+=Number(value===p.label);}
    let quantity={available:false,reason:'classifier-only condition'};
    if(outputCondition==='quantity-requested'){
      const spec=inspect.fold,proof=spec!==null;let laws=null;
      if(proof){laws=validateMonoid(spec);if(!spec.images||inst.alphabet.some(a=>!Number.isInteger(spec.images[a])||spec.images[a]<0||spec.images[a]>=spec.table.length))throw new Error('invalid quantityFold symbol images');}
      const edges=contextChecks(inst),states=[...new Set([...edges.flat(),...pairs.flatMap(p=>[p.a,p.b])])],values=new Map();
      for(const s of states)values.set(s,canonical(proof?fold(s,spec):await call({op:'quantity',state:s})));
      const conserved=edges.every(([a,b])=>values.get(a)===values.get(b));
      const equations=proof?inst.rules.every(r=>fold(r.u,spec)===fold(r.v,spec)):null;
      // Equality relations, never numeric or textual equality with the oracle's labels.
      const forward=new Map(),reverse=new Map();let partitionsAgree=true;
      for(const s of states){const q=values.get(s),truth=inst.quantity(s);if((forward.has(q)&&forward.get(q)!==truth)||(reverse.has(truth)&&reverse.get(truth)!==q))partitionsAgree=false;forward.set(q,truth);reverse.set(truth,q);}
      const predictionCorrect=pairs.filter(p=>(values.get(p.a)===values.get(p.b))===(inst.quantity(p.a)===inst.quantity(p.b))).length;
      quantity={available:true,source:proof?'declarative finite-monoid fold (host interpreter)':'submitted function (fresh sandbox per state)',conservation:{passed:conserved,proved:proof&&equations,method:proof?'exhaustive monoid laws plus rule equations':'bounded empirical conservation; exhaustive contexts within the bound, not a proof',contextLengthBound:3,applicationsChecked:edges.length,laws},partitionsAgree,partitionStates:states.length,inducedPredictionAccuracy:predictionCorrect/pairs.length};
    }
    const accuracy=correct/pairs.length,smallAccuracy=byScale.small.n?byScale.small.correct/byScale.small.n:null,largeAccuracy=byScale.large.n?byScale.large.correct/byScale.large.n:null;
    return {ok:true,contract:'reachability',outputCondition,correct,total:pairs.length,accuracy,smallAccuracy,largeAccuracy,generalizationGap:smallAccuracy===null||largeAccuracy===null?null:smallAccuracy-largeAccuracy,quantity,evaluationSet:evaluationPairs?'calibration-wall':'sealed',success:accuracy>=SUCCESS_ACCURACY};
  }catch(e){return {ok:false,stage:'verify',error:String(e.message||e).slice(0,500)};}
}
