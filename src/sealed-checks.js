// Independent recomputation on realized integer multiplicities, never LP summary weights.
import {histogramKey,jointKey,nuisanceFeatures,properCongruences} from './invariant-features.js';
export function realizedChecks(pairs,spec,alphabet){
  const hist=new Map(),joint=new Map(),nuisance=new Map(),quotients=properCongruences(spec);let positive=0;
  const add=(map,key,label)=>{const n=map.get(key)??[0,0];n[Number(label)]++;map.set(key,n);};
  for(const p of pairs){positive+=Number(p.label);add(hist,histogramKey(p,alphabet),p.label);add(joint,jointKey(p,spec,alphabet,quotients),p.label);add(nuisance,JSON.stringify(nuisanceFeatures(p,alphabet)),p.label);}
  const ceiling=map=>[...map.values()].reduce((sum,[a,b])=>sum+Math.max(a,b),0)/pairs.length;
  return {count:pairs.length,positive,negative:pairs.length-positive,U_hist:ceiling(hist),jointFeatureCeiling:ceiling(joint),quotients:quotients.length,nuisanceMaxImbalance:Math.max(0,...[...nuisance.values()].map(([a,b])=>Math.abs(a-b))),histogramConflictClasses:[...hist.values()].filter(([a,b])=>a&&b).length};
}
