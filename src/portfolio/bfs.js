export const SEARCH_CURVES=Object.freeze([{name:'b2',maxNodes:128,maxPositions:4096,lengthSlack:6},{name:'4x',maxNodes:512,maxPositions:16384,lengthSlack:6},{name:'16x',maxNodes:2048,maxPositions:65536,lengthSlack:6}]);
export function rewriteSearch(a,b,rules,budget,{bidirectional=false}={}){
  const stats={visitedNodes:1,testedPositions:0,maxDepth:0,budgetExhausted:false};
  if(a===b)return {prediction:true,...stats};
  const edges=rules.flatMap(r=>[[r.u,r.v],[r.v,r.u]]),queues=[[{s:a,depth:0}],[{s:b,depth:0}]],seen=[new Set([a]),new Set([b])],heads=[0,0],maxLength=Math.max(a.length,b.length)+budget.lengthSlack;
  if(bidirectional)stats.visitedNodes=2;
  for(;;){
    const side=bidirectional?(queues[0].length-heads[0]<=queues[1].length-heads[1]?0:1):0;
    if(heads[side]>=queues[side].length)return {prediction:false,...stats};
    const {s,depth}=queues[side][heads[side]++];stats.maxDepth=Math.max(stats.maxDepth,depth);
    for(const [from,to]of edges)for(let position=0;position<=s.length-from.length;position++){
      if(stats.testedPositions>=budget.maxPositions)return {prediction:false,...stats,budgetExhausted:true};stats.testedPositions++;
      if(s.slice(position,position+from.length)!==from)continue;
      const next=s.slice(0,position)+to+s.slice(position+from.length);
      if(next.length>maxLength)continue;
      if((bidirectional?seen[1-side].has(next):next===b))return {prediction:true,...stats,maxDepth:Math.max(stats.maxDepth,depth+1)};
      if(seen[side].has(next))continue;
      if(stats.visitedNodes>=budget.maxNodes)return {prediction:false,...stats,budgetExhausted:true};
      seen[side].add(next);queues[side].push({s:next,depth:depth+1});stats.visitedNodes++;
    }
  }
}
export function canonicalModel(view,{maxSteps=128,maxPositions=16384}={}){
  const rules=view.rules.map(({u,v})=>u.length>v.length||u.length===v.length&&u>v?[u,v]:[v,u]);
  const normalize=word=>{let used=0;for(let step=0;step<maxSteps;step++){let changed=false;for(const [from,to]of rules){for(let i=0;i<=word.length-from.length;i++){if(++used>maxPositions)return word;if(word.slice(i,i+from.length)===from){word=word.slice(0,i)+to+word.slice(i+from.length);changed=true;break;}}if(changed)break;}if(!changed)break;}return word;};
  return {state:{kind:'canonical',rules:view.rules,maxSteps,maxPositions},predict:(a,b)=>normalize(a)===normalize(b)};
}
