// Finite tables are proof objects: every law is checked exhaustively.
export function validateMonoid({table,identity}) {
  const size=table?.length;
  if(!Number.isInteger(size)||size<1||size>256||!Number.isInteger(identity)||identity<0||identity>=size)throw new Error('invalid finite monoid size/identity');
  for(const row of table)if(!Array.isArray(row)||row.length!==size||row.some(x=>!Number.isInteger(x)||x<0||x>=size))throw new Error('monoid closure failed');
  for(let a=0;a<size;a++){
    if(table[identity][a]!==a||table[a][identity]!==a)throw new Error('monoid identity failed');
    for(let b=0;b<size;b++)for(let c=0;c<size;c++)if(table[table[a][b]][c]!==table[a][table[b][c]])throw new Error('monoid associativity failed');
  }
  return {closure:true,identity:true,associativity:true,triplesChecked:size**3};
}
export function fold(state,{table,identity,images}) {
  let value=identity;
  for(const symbol of state){if(!Object.hasOwn(images,symbol))throw new Error('unknown symbol');value=table[value][images[symbol]];}
  return value;
}
export function generatedSubmonoid({table,identity},images) {
  const values=[identity],seen=new Set(values),generators=Object.values(images);
  for(let i=0;i<values.length;i++)for(const g of generators){const x=table[values[i]][g];if(!seen.has(x)){seen.add(x);values.push(x);}}
  let witness=null;for(const a of values)for(const b of values)if(table[a][b]!==table[b][a])witness??=[a,b];
  return {elements:values,commutative:witness===null,witness};
}
const compose=(a,b)=>a.map(x=>b[x]);
function transformationClosure(points,generators,name){
  const elements=[Array.from({length:points},(_,i)=>i)],index=new Map([[elements[0].join(','),0]]);
  for(let i=0;i<elements.length;i++)for(const g of generators){const v=compose(elements[i],g),key=v.join(',');if(!index.has(key)){index.set(key,elements.length);elements.push(v);}}
  const table=elements.map(a=>elements.map(b=>index.get(compose(a,b).join(','))));
  return {name,points,elements,identity:0,table,generators:generators.map(g=>index.get(g.join(',')))};
}
export function algebraFor(family,{algebra='S3',points=3,modulus}={}){
  if(family==='F-count'||family==='F-abelian'){
    const m=modulus??(family==='F-count'?2:3);if(![2,3].includes(m))throw new Error('registered modulus is 2 or 3');
    const elements=Array.from({length:m*m},(_,i)=>[i%m,Math.floor(i/m)]);
    return {name:`C${m}xC${m}`,identity:0,elements,table:elements.map(a=>elements.map(b=>(a[0]+b[0])%m+m*((a[1]+b[1])%m))),generators:[1,m],modulus:m};
  }
  if(family==='F-monoid'){
    if(![3,4].includes(points))throw new Error('registered transformation monoids act on 3 or 4 points');
    // Dihedral permutations plus all constants: size 9 (q=3) or 12 (q=4).
    return transformationClosure(points,[Array.from({length:points},(_,i)=>(i+1)%points),Array.from({length:points},(_,i)=>(points-i)%points),Array(points).fill(0)],`D${points}-with-constants`);
  }
  if(family!=='F-nonabelian')throw new Error('unknown invariant family');
  if(algebra==='Q8'){
    const basis=[[0,1,2,3],[1,0,3,2],[2,3,0,1],[3,2,1,0]],neg=[[0,0,0,0],[0,1,0,1],[0,1,1,0],[0,0,1,1]];
    return {name:'Q8',identity:0,elements:['1','-1','i','-i','j','-j','k','-k'],generators:[2,4],table:Array.from({length:8},(_,a)=>Array.from({length:8},(_,b)=>2*basis[a>>1][b>>1]+((a%2)^(b%2)^neg[a>>1][b>>1])))};
  }
  if(algebra==='S3')return transformationClosure(3,[[1,0,2],[1,2,0]],'S3');
  if(algebra==='D4')return transformationClosure(4,[[1,2,3,0],[0,3,2,1]],'D4');
  if(algebra==='A4')return transformationClosure(4,[[1,2,0,3],[1,0,3,2]],'A4');
  throw new Error('registered groups are S3, Q8, D4, A4');
}
export function words(alphabet,maxLength){const out=[''];let layer=[''];for(let n=1;n<=maxLength;n++){layer=layer.flatMap(w=>alphabet.map(a=>w+a));out.push(...layer);}return out;}
// Canonical rooted transition graph: two folds have the same kernel iff these signatures agree.
export function representationSignature(spec,alphabet){
  const states=[spec.identity],ids=new Map([[spec.identity,0]]),rows=[];
  for(let i=0;i<states.length;i++){const row=[];for(const s of alphabet){const next=spec.table[states[i]][spec.images[s]];if(!ids.has(next)){ids.set(next,states.length);states.push(next);}row.push(ids.get(next));}rows.push(row);}
  return JSON.stringify(rows);
}
