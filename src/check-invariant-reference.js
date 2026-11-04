// Deliberately small, independent reference: no production feature/congruence imports.
// Bell(6)=203 partitions; reject larger tables rather than pretend this is scalable.
export function referenceFeatureChecks(world){
  const {table,identity,images}=world.secret,n=table.length;
  if(n>6)throw new Error('independent reference limited to at most six states');
  const partitions=[],p=[0];
  function enumerate(i,max){if(i===n){partitions.push(p.slice());return;}for(let c=0;c<=max+1;c++){p[i]=c;enumerate(i+1,Math.max(max,c));}}enumerate(1,0);
  const qs=partitions.filter(q=>new Set(q).size<n&&table.every((_,a)=>table.every((__,b)=>q[a]!==q[b]||table.every((___,x)=>q[table[a][x]]===q[table[b][x]]&&q[table[x][a]]===q[table[x][b]]))));
  const alphabet=[...world.alphabet].sort(),fold=s=>[...s].reduce((v,c)=>table[v][images[c]],identity),count=s=>alphabet.map(c=>[...s].filter(x=>x===c).length);
  const edit=(a,b)=>{const d=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i===0?j:j===0?i:0));for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+Number(a[i-1]!==b[j-1]));return d[a.length][b.length];};
  const lcs=(a,b)=>{const d=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=a[i-1]===b[j-1]?d[i-1][j-1]+1:Math.max(d[i-1][j],d[i][j-1]);return d[a.length][b.length];};
  const maps=[new Map(),new Map(),new Map()];
  for(const pair of world.sealedPairs){const a=count(pair.a),b=count(pair.b),features=[[a,b],[a,b,qs.map(q=>[q[fold(pair.a)],q[fold(pair.b)]])],[pair.a.length,pair.b.length,a.reduce((s,x,i)=>s+Math.abs(x-b[i]),0),edit(pair.a,pair.b),lcs(pair.a,pair.b)]];
    features.forEach((f,i)=>{const key=JSON.stringify(f),v=maps[i].get(key)??[0,0];v[Number(pair.label)]++;maps[i].set(key,v);});}
  return {partitionsEnumerated:partitions.length,quotients:qs.length,U_hist:[...maps[0].values()].reduce((s,v)=>s+Math.max(...v),0)/world.sealedPairs.length,jointFeatureCeiling:[...maps[1].values()].reduce((s,v)=>s+Math.max(...v),0)/world.sealedPairs.length,nuisanceMaxImbalance:Math.max(0,...[...maps[2].values()].map(v=>Math.abs(v[0]-v[1]))),histogramConflictClasses:[...maps[0].values()].filter(v=>v.every(x=>x>0)).length};
}
