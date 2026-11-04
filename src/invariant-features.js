import {fold} from './algebra.js';
const cache=new Map();
// Enumerate the congruence lattice by joining one pair and closing under left/right multiplication.
export function properCongruences({table},meter){
  const key=JSON.stringify(table);if(!meter&&cache.has(key))return cache.get(key);
  const n=table.length,normalize=p=>{const ids=new Map();return p.map(x=>{if(!ids.has(x))ids.set(x,ids.size);return ids.get(x);});};
  const close=(partition,a,b)=>{
    meter?.tick('congruenceClosures');
    const parent=partition.map((_,i)=>i),root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
    const merge=(a,b)=>{meter?.tick('congruenceMergeTests');a=root(a);b=root(b);if(a===b)return false;parent[b]=a;return true;};
    for(let i=0;i<n;i++)for(let j=0;j<i;j++)if(partition[i]===partition[j])merge(i,j);merge(a,b);
    let changed=true;while(changed){changed=false;for(let i=0;i<n;i++)for(let j=0;j<i;j++)if(root(i)===root(j))for(let k=0;k<n;k++){changed=merge(table[i][k],table[j][k])||changed;changed=merge(table[k][i],table[k][j])||changed;}}
    return normalize(parent.map((_,i)=>root(i)));
  };
  const lattice=[Array.from({length:n},(_,i)=>i)],seen=new Set([JSON.stringify(lattice[0])]);
  for(let i=0;i<lattice.length;i++)for(let a=0;a<n;a++)for(let b=0;b<a;b++)if(lattice[i][a]!==lattice[i][b]){const p=close(lattice[i],a,b),k=JSON.stringify(p);if(!seen.has(k)){seen.add(k);lattice.push(p);}}
  const proper=lattice.filter(p=>new Set(p).size<n).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));cache.set(key,proper);return proper;
}
export const counts=(word,alphabet)=>alphabet.toSorted().map(a=>{let n=0;for(const x of word)if(a===x)n++;return n;});
export function histogramKey(pair,alphabet){return JSON.stringify([counts(pair.a,alphabet),counts(pair.b,alphabet)]);}
export function editLcs(a,b){
  let edit=Array.from({length:b.length+1},(_,i)=>i),lcs=Array(b.length+1).fill(0);
  for(let i=1;i<=a.length;i++){const e=[i],l=[0];for(let j=1;j<=b.length;j++){e[j]=Math.min(edit[j]+1,e[j-1]+1,edit[j-1]+Number(a[i-1]!==b[j-1]));l[j]=a[i-1]===b[j-1]?lcs[j-1]+1:Math.max(lcs[j],l[j-1]);}edit=e;lcs=l;}
  return {edit:edit[b.length],lcs:lcs[b.length]};
}
export function nuisanceFeatures(pair,alphabet){
  const a=counts(pair.a,alphabet),b=counts(pair.b,alphabet),{edit,lcs}=editLcs(pair.a,pair.b);
  return [pair.a.length,pair.b.length,a.reduce((sum,x,i)=>sum+Math.abs(x-b[i]),0),edit,lcs];
}
export function jointKey(pair,spec,alphabet,quotients=properCongruences(spec)){
  const a=fold(pair.a,spec),b=fold(pair.b,spec);
  // Exact count vectors include every registered modular count feature.
  return JSON.stringify([counts(pair.a,alphabet),counts(pair.b,alphabet),quotients.map(q=>[q[a],q[b]])]);
}
export function publicStatistics(view){
  const histogram=new Map(),nuisance=new Map();
  for(const p of view.trainingPairs){const h=histogramKey(p,view.alphabet),n=JSON.stringify(nuisanceFeatures(p,view.alphabet));histogram.set(h,(histogram.get(h)||0)+1);nuisance.set(n,(nuisance.get(n)||0)+1);}
  return {alphabetSize:view.alphabet.length,ruleLengths:view.rules.map(r=>[r.u.length,r.v.length]).sort(),labels:view.trainingPairs.reduce((s,p)=>s+Number(p.label),0),histograms:[...histogram].sort(),nuisances:[...nuisance].sort()};
}
