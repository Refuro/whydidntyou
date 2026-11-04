// B2 wall controls only. The broader frozen portfolio is built/challenged in B4.
export const WALL_BUDGETS=Object.freeze({bfs:{maxNodes:128,maxTransitions:4096,lengthSlack:6,totalSandboxMs:20000,primitiveLanguage:'bounded FIFO enumeration of single-rule string rewrites'},countNullspace:{primes:[2,3],totalSandboxMs:20000,primitiveLanguage:'Gaussian elimination over symbol-count rule differences modulo 2 and 3; equality of all nullspace coordinates'},reference:{totalSandboxMs:20000,primitiveLanguage:'fold the oracle multiplication table and symbol images; compare final products'}});
function nullspace(matrix,n,p){
  const mod=x=>((x%p)+p)%p,rows=matrix.map(r=>r.map(mod)),pivots=[];let row=0;
  for(let col=0;col<n&&row<rows.length;col++){
    const pivot=rows.findIndex((r,i)=>i>=row&&r[col]!==0);if(pivot<0)continue;
    [rows[row],rows[pivot]]=[rows[pivot],rows[row]];
    let inverse=1;while(mod(inverse*rows[row][col])!==1)inverse++;
    rows[row]=rows[row].map(x=>mod(x*inverse));
    for(let i=0;i<rows.length;i++)if(i!==row){const factor=rows[i][col];rows[i]=rows[i].map((x,j)=>mod(x-factor*rows[row][j]));}
    pivots.push(col);row++;
  }
  const basis=[];
  for(let free=0;free<n;free++)if(!pivots.includes(free)){
    const v=Array(n).fill(0);v[free]=1;pivots.forEach((pivot,i)=>{v[pivot]=mod(-rows[i][free]);});basis.push(v);
  }
  return basis;
}
export function countNullspaceCode(publicWorld){
  const alphabet=publicWorld.alphabet,rules=publicWorld.rules;
  const count=s=>alphabet.map(a=>[...s].filter(x=>x===a).length);
  const matrix=rules.map(r=>{const u=count(r.u),v=count(r.v);return u.map((x,i)=>x-v[i]);});
  const bases=WALL_BUDGETS.countNullspace.primes.flatMap(p=>nullspace(matrix,alphabet.length,p).map(weights=>({p,weights})));
  return `const alphabet=${JSON.stringify(alphabet)},bases=${JSON.stringify(bases)};
    function features(s){const c=alphabet.map(a=>{let n=0;for(const x of s)if(x===a)n++;return n;});return bases.map(b=>c.reduce((sum,n,i)=>sum+n*b.weights[i],0)%b.p);}
    function reachable(a,b){const x=features(a),y=features(b);return x.every((v,i)=>v===y[i]);}`;
}
export function bfsCode(publicWorld){
  const rules=publicWorld.rules.flatMap(r=>[[r.u,r.v],[r.v,r.u]]),budget=WALL_BUDGETS.bfs;
  return `const rules=${JSON.stringify(rules)};
    function reachable(a,b){if(a===b)return true;const queue=[a],seen=new Set(queue),maxLength=Math.max(a.length,b.length)+${budget.lengthSlack};let transitions=0;
      for(let head=0;head<queue.length;head++)for(const [from,to]of rules)for(let i=0;i<=queue[head].length-from.length;i++){
        if(++transitions>${budget.maxTransitions})return false;
        const s=queue[head];if(s.slice(i,i+from.length)!==from)continue;const next=s.slice(0,i)+to+s.slice(i+from.length);
        if(next===b)return true;if(next.length>maxLength||seen.has(next))continue;
        if(seen.size>=${budget.maxNodes})return false;seen.add(next);queue.push(next);
      }return false;}`;
}
