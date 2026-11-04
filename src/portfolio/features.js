import {counts,nuisanceFeatures,jointKey,properCongruences} from '../invariant-features.js';
export function countModel(view){
  const alphabet=view.alphabet.toSorted(),basis=[];
  for(const p of [2,3]){
    const mod=x=>(x%p+p)%p,matrix=view.rules.map(r=>counts(r.u,alphabet).map((n,i)=>mod(n-counts(r.v,alphabet)[i]))),pivots=[];let row=0;
    for(let c=0;c<alphabet.length&&row<matrix.length;c++){
      const pivot=matrix.findIndex((r,i)=>i>=row&&r[c]);if(pivot<0)continue;[matrix[row],matrix[pivot]]=[matrix[pivot],matrix[row]];
      let inverse=1;while(mod(inverse*matrix[row][c])!==1)inverse++;matrix[row]=matrix[row].map(x=>mod(x*inverse));
      for(let i=0;i<matrix.length;i++)if(i!==row){const factor=matrix[i][c];matrix[i]=matrix[i].map((x,j)=>mod(x-factor*matrix[row][j]));}pivots.push(c);row++;
    }
    for(let free=0;free<alphabet.length;free++)if(!pivots.includes(free)){const weights=Array(alphabet.length).fill(0);weights[free]=1;pivots.forEach((v,i)=>{weights[v]=mod(-matrix[i][free]);});basis.push({p,weights});}
  }
  const feature=s=>{const c=counts(s,alphabet);return basis.map(({p,weights})=>c.reduce((n,x,i)=>n+x*weights[i],0)%p);};
  return {state:{kind:'count',alphabet,basis},basis,predict:(a,b)=>JSON.stringify(feature(a))===JSON.stringify(feature(b))};
}
export function featureDictionary(view,spec,meter){
  const quotients=properCongruences(spec,meter),table=new Map();
  const key=p=>jointKey(p,spec,view.alphabet,quotients);
  for(const p of view.trainingPairs){meter?.tick('featureCharacterVisits',(p.a.length+p.b.length)*(view.alphabet.length+1));const k=key(p),n=table.get(k)??[0,0];n[Number(p.label)]++;table.set(k,n);}
  return {state:{kind:'joint',alphabet:view.alphabet,spec,quotients,table:[...table]},predict:(a,b)=>{const n=table.get(key({a,b}));return n? n[1]>n[0]:false;},classes:table.size};
}
export function nuisanceVector(pair,view){
  const basic=nuisanceFeatures(pair,view.alphabet),agreement=[...pair.a].reduce((n,c,i)=>n+Number(c===pair.b[i]),0),alphabet=view.alphabet.toSorted();
  const patterns=alphabet.flatMap(a=>alphabet.map(b=>a+b));
  const count=(word,p)=>{let n=0;for(let i=0;i+1<word.length;i++)n+=Number(word.slice(i,i+2)===p);return n;};
  return [...basic,agreement,agreement/Math.max(1,pair.a.length,pair.b.length),...patterns.map(p=>Math.abs(count(pair.a,p)-count(pair.b,p)))];
}
export function nuisanceModel(view,meter){
  meter.tick('featureDpCells',view.trainingPairs.reduce((n,p)=>n+p.a.length*p.b.length,0));
  meter.tick('featureCharacterVisits',view.trainingPairs.reduce((n,p)=>n+(p.a.length+p.b.length)*view.alphabet.length+p.a.length,0));
  meter.tick('bigramPositions',view.trainingPairs.reduce((n,p)=>n+(Math.max(0,p.a.length-1)+Math.max(0,p.b.length-1))*view.alphabet.length**2,0));
  const rows=view.trainingPairs.map(p=>({x:nuisanceVector(p,view),y:p.label}));meter.tick('featureCells',rows.reduce((n,r)=>n+r.x.length,0));
  let best={score:-1,index:0,threshold:0,direction:true};
  for(let j=0;j<rows[0].x.length;j++)for(const threshold of [...new Set(rows.map(r=>r.x[j]))])for(const direction of [true,false]){
    meter.tick('stumpComparisons',rows.length);const score=rows.reduce((n,r)=>n+Number(((r.x[j]<=threshold)===direction)===r.y),0);
    if(score>best.score)best={score,index:j,threshold,direction};
  }
  return {state:{kind:'nuisance',alphabet:view.alphabet,stump:best},stump:best,predict:(a,b)=>(nuisanceVector({a,b},view)[best.index]<=best.threshold)===best.direction};
}
