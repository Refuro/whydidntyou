import {fold} from '../algebra.js';
import {counts,jointKey} from '../invariant-features.js';
import {nuisanceVector} from './features.js';
import {rewriteSearch,canonicalModel} from './bfs.js';
// Exact loop visits for the registered implementations; these units are member-specific.
export function predictState(state,a,b,meter={}){
  const s=state,chars=a.length+b.length;
  if(s.kind==='constant')return s.value;
  if(s.kind==='count'){
    meter.characterVisits=chars*s.alphabet.length;
    const feature=w=>{const c=counts(w,s.alphabet);return s.basis.map(({p,weights})=>c.reduce((n,x,i)=>n+x*weights[i],0)%p);};
    return JSON.stringify(feature(a))===JSON.stringify(feature(b));
  }
  if(s.kind==='fold'){meter.characterVisits=chars;return fold(a,s.spec)===fold(b,s.spec);}
  if(s.kind==='joint'){
    meter.characterVisits=chars*(s.alphabet.length+1);
    const n=new Map(s.table).get(jointKey({a,b},s.spec,s.alphabet,s.quotients));return n?n[1]>n[0]:false;
  }
  if(s.kind==='finite-state'){
    meter.characterVisits=chars;meter.pointTransitions=chars*s.points;
    const run=w=>{let state=Array.from({length:s.points},(_,i)=>i);for(const c of w)state=state.map(x=>Math.floor(s.images[c]/s.points**x)%s.points);return state.join(',');};return run(a)===run(b);
  }
  if(s.kind==='bfs'){const r=rewriteSearch(a,b,s.rules,s.budget,{bidirectional:s.bidirectional});Object.assign(meter,r);delete meter.prediction;return r.prediction;}
  if(s.kind==='canonical'){meter.positionLimit=2*s.maxPositions;return canonicalModel(s,{maxSteps:s.maxSteps,maxPositions:s.maxPositions}).predict(a,b);}
  if(s.kind==='nuisance'){
    meter.dpCells=a.length*b.length;meter.characterVisits=chars*s.alphabet.length+a.length;
    meter.bigramPositions=(Math.max(0,a.length-1)+Math.max(0,b.length-1))*s.alphabet.length**2;
    return (nuisanceVector({a,b},s)[s.stump.index]<=s.stump.threshold)===s.stump.direction;
  }
  throw new Error('unknown serialized reference model');
}
