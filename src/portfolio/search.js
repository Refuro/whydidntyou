import {algebraFor,validateMonoid,fold} from '../algebra.js';
import {properCongruences} from '../invariant-features.js';
export class BudgetExceeded extends Error{}
export function counter(limit){
  const counts={operations:0,assignments:0,ruleChecks:0,exampleChecks:0,transitions:0,counterexamples:0};
  return {counts,tick:(kind,n=1)=>{if(counts.operations+n>limit)throw new BudgetExceeded('member-specific search budget exhausted');counts[kind]=(counts[kind]??0)+n;counts.operations+=n;}};
}
const cyclic=m=>({name:'C'+m,identity:0,table:Array.from({length:m},(_,a)=>Array.from({length:m},(_,b)=>(a+b)%m)),generators:[1]});
export function templates({monoids=false,quotients=false,meter}={}){
  const full=[...[2,3,4,5,6].map(cyclic),algebraFor('F-count'),algebraFor('F-abelian'),...['S3','Q8','D4','A4'].map(algebra=>algebraFor('F-nonabelian',{algebra})),...(monoids?[3,4].map(points=>algebraFor('F-monoid',{points})):[])];
  meter?.tick('catalogueTableCells',full.reduce((n,s)=>n+s.table.length**2,0));
  if(!quotients)return full;
  const out=[],seen=new Set();
  for(const spec of full)for(const q of properCongruences(spec,meter)){
    const representatives=[...new Set(q)].map(c=>q.indexOf(c)),table=representatives.map(a=>representatives.map(b=>q[spec.table[a][b]])),key=JSON.stringify(table);
    if(!seen.has(key)){seen.add(key);out.push({name:spec.name+'/quotient-'+out.length,table,identity:q[spec.identity],generators:[...new Set(spec.generators.map(g=>q[g]))]});}
  }
  return out;
}
export function fits(spec,view,examples,meter,{partial=false}={}){
  const known=word=>!partial||[...word].every(a=>Object.hasOwn(spec.images,a));
  const product=word=>{meter.tick('transitions',word.length);return fold(word,spec);};
  for(const r of view.rules)if(known(r.u)&&known(r.v)){meter.tick('ruleChecks');if(product(r.u)!==product(r.v))return false;}
  for(const p of examples)if(known(p.a)&&known(p.b)){meter.tick('exampleChecks');if((product(p.a)===product(p.b))!==p.label)return false;}
  return true;
}
export function imageSearch(view,{catalog=templates(),csp=false,examples=view.trainingPairs,meter=counter(2_000_000)}={}){
  const alphabet=view.alphabet.toSorted();
  if(csp)alphabet.sort((a,b)=>view.rules.reduce((n,r)=>n+[...r.u+r.v].filter(x=>x===b).length-[...r.u+r.v].filter(x=>x===a).length,0)||a.localeCompare(b));
  for(const table of catalog){
    validateMonoid(table);meter.tick('lawTriples',table.table.length**3);
    const spec={table:table.table,identity:table.identity,images:{},name:table.name};
    function search(depth){
      if(depth===alphabet.length){meter.tick('assignments');return fits(spec,view,examples,meter)?structuredClone(spec):null;}
      for(let value=0;value<table.table.length;value++){spec.images[alphabet[depth]]=value;meter.tick('imageChoices');if(!csp||fits(spec,view,examples,meter,{partial:true})){const solution=search(depth+1);if(solution)return solution;}}
      delete spec.images[alphabet[depth]];return null;
    }
    const result=search(0);if(result)return result;
  }
  return null;
}
export function positionalSearch(view,meter){
  for(const table of templates({monoids:true,meter})){
    const generators=table.points&&view.alphabet.length===2?[table.generators[0],table.generators[2]]:table.generators,spec={table:table.table,identity:table.identity,images:{},name:table.name};
    function visit(i){
      if(i===view.alphabet.length){meter.tick('assignments');return fits(spec,view,view.trainingPairs,meter)?structuredClone(spec):null;}
      const options=generators[i]===undefined?Array.from({length:table.table.length},(_,j)=>j):[generators[i]];
      for(const v of options){spec.images[view.alphabet[i]]=v;const found=visit(i+1);if(found)return found;}return null;
    }
    const result=visit(0);if(result)return result;
  }
  return null;
}
export const foldModel=spec=>({state:{kind:'fold',spec},predict:(a,b)=>fold(a,spec)===fold(b,spec),spec});
