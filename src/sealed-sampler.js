import {words,fold} from './algebra.js';
import {applications,naturalPairs,ConstructionDefect} from './domains/invariantGame.js';
import {mulberry32,randInt} from './rng.js';
import {samplingStream,permute} from './sampling-stream.js';
import {jointKey,nuisanceFeatures,properCongruences} from './invariant-features.js';
import {realizedChecks} from './sealed-checks.js';
import {simplex} from './simplex.js';
export const SAMPLER=Object.freeze({version:'sealed-matched-padded-v2',name:'matched/padded challenge',order:'fully realized lists permuted by separate sealed-matched-order-v2 and sealed-natural-order-v2 PRF streams',maxWordLength:4,walksPerStart:12,walkSteps:8,maxMatchedClasses:32,pairs:200,tau:.70,nuisanceTolerance:0,largePrefixMin:96,maxPivots:10000,support:'first representative per label in each matched class; all unequal-fold ordered pairs of words length 1..4; positive seeded rule walks length <=4; retain joint-feature AND nuisance classes containing both labels, at most 32 classes in a seeded order; duplicate each with an identity prefix for the large stratum',quotients:'all proper two-sided congruences of the ambient monoid, jointly with exact ordered symbol-count vectors',matching:'exact joint length/length/histogram-L1/edit/LCS class balance within the LP',objective:'maximize the minimum support-point weight to avoid a four-pair extreme-point artifact',rounding:'largest remainders independently by label and scale, then independently verify every ceiling and nuisance equality; no repair'});
function identityWord(spec,alphabet){
  const queue=[{v:spec.identity,w:''}],seen=new Set([spec.identity]);
  for(const x of queue)for(const a of alphabet){const v=spec.table[x.v][spec.images[a]],w=x.w+a;if(v===spec.identity)return w;if(!seen.has(v)){seen.add(v);queue.push({v,w});}}return null;
}
export function constructSealed(inst){
  const fail=reason=>{const e=new ConstructionDefect(inst.seed,reason);e.audit=inst.identifiabilityAudit;e.effectiveClassification=inst.family;throw e;};
  const alphabet=inst.alphabet.toSorted(),spec=inst.secret;
  const naturalUnordered=[...naturalPairs(spec,alphabet,inst.rules,mulberry32(inst.seed^0x734eb49a),100,false,inst.noncommutativityWitness,inst.seed),...naturalPairs(spec,alphabet,inst.rules,mulberry32(inst.seed^0x18ee4927),100,true,inst.noncommutativityWitness,inst.seed)];
  const natural=permute(naturalUnordered,samplingStream(inst.seed,'sealed-natural-order-v2'));
  if(inst.submonoid.commutative){const pairs=permute(naturalUnordered,samplingStream(inst.seed,'sealed-matched-order-v2'));return {pairs,naturalPairs:natural,challenge:'inapplicable: feature-separable',registration:SAMPLER,checks:realizedChecks(pairs,spec,alphabet),supportSummary:supportSummary(pairs,false),lp:null,analyticOracle:null};}
  const id=identityWord(spec,alphabet);if(!id)fail('B3: no bounded identity padding word for large challenge stratum');
  const quotients=properCongruences(spec),strings=words(alphabet,SAMPLER.maxWordLength).filter(Boolean),buckets=new Map(),rng=mulberry32(inst.seed^0x4f6a18ab);
  const insert=p=>{const key=jointKey(p,spec,alphabet,quotients)+'|'+JSON.stringify(nuisanceFeatures(p,alphabet));const bucket=buckets.get(key)??[null,null];bucket[Number(p.label)]??=p;buckets.set(key,bucket);};
  for(const a of strings)for(let trial=0;trial<SAMPLER.walksPerStart;trial++){
    let b=a;const path=[];
    for(let step=0;step<SAMPLER.walkSteps;step++){const choices=applications(b,inst.rules,SAMPLER.maxWordLength);if(!choices.length)break;const x=choices[randInt(rng,choices.length)];b=x.state;path.push({rule:x.rule,direction:x.direction,position:x.position});}
    insert({a,b,label:true,scale:'small',certificate:{kind:'rewrite-path',path}});
  }
  const values=new Map(strings.map(s=>[s,fold(s,spec)]));
  for(const a of strings)for(const b of strings)if(values.get(a)!==values.get(b))insert({a,b,label:false,scale:'small',certificate:{kind:'invariant-inequality',values:[values.get(a),values.get(b)]}});
  const matched=[...buckets.values()].filter(pair=>pair.every(Boolean)),selected=permute(matched,samplingStream(inst.seed,'sealed-support')).slice(0,SAMPLER.maxMatchedClasses);
  if(!selected.length)fail('B3: infeasible registered matched string support');
  const prefix=id.repeat(Math.ceil(SAMPLER.largePrefixMin/id.length)),support=selected.flat();
  support.push(...support.map(p=>({...p,a:prefix+p.a,b:prefix+p.b,scale:'large',certificate:p.label?{kind:'rewrite-path',path:p.certificate.path.map(s=>({...s,position:s.position+prefix.length}))}:p.certificate})));
  const nuisanceKeys=support.map(p=>JSON.stringify(nuisanceFeatures(p,alphabet))),jointKeys=support.map(p=>jointKey(p,spec,alphabet,quotients));
  const keys=[...new Set(jointKeys)],N=support.length,total=N+keys.length+1,A=[],b=[];
  const row=()=>Array(total).fill(0),inequality=(r,v)=>{A.push(r);b.push(v);},equality=(r,v)=>{inequality(r,v);inequality(r.map(x=>-x),-v);};
  for(const label of [false,true]){const r=row();support.forEach((p,i)=>{r[i]=Number(p.label===label);});equality(r,.5);}
  for(const scale of ['small','large']){const r=row();support.forEach((p,i)=>{r[i]=Number(p.scale===scale);});equality(r,.5);}
  for(const key of [...new Set(nuisanceKeys)]){const r=row();support.forEach((p,i)=>{if(nuisanceKeys[i]===key)r[i]=p.label?1:-1;});equality(r,0);}
  keys.forEach((key,j)=>{for(const label of [false,true]){const r=row();support.forEach((p,i)=>{if(p.label===label&&jointKeys[i]===key)r[i]=1;});r[N+j]=-1;inequality(r,0);}});
  const cap=row();keys.forEach((_,i)=>{cap[N+i]=1;});inequality(cap,SAMPLER.tau);
  for(let i=0;i<N;i++){const r=row();r[i]=-1;r[total-1]=1;inequality(r,0);}
  const objective=row();objective[total-1]=1;
  const solved=simplex(A,b,objective,{maxPivots:SAMPLER.maxPivots});if(solved.status!=='optimal')fail('B3: LP '+solved.status);
  const multiplicities=Array(N).fill(0);
  for(const label of [false,true])for(const scale of ['small','large']){
    const indices=support.flatMap((p,i)=>p.label===label&&p.scale===scale?[i]:[]),mass=indices.reduce((sum,i)=>sum+solved.x[i],0);
    if(Math.abs(mass-.25)>1e-7)fail('B3: LP stratum mass mismatch');
    const target=SAMPLER.pairs/4;for(const i of indices)multiplicities[i]=Math.floor(solved.x[i]*SAMPLER.pairs+1e-8);
    const remainder=target-indices.reduce((sum,i)=>sum+multiplicities[i],0);
    indices.sort((i,j)=>{const difference=(solved.x[j]*SAMPLER.pairs-multiplicities[j])-(solved.x[i]*SAMPLER.pairs-multiplicities[i]);return Math.abs(difference)<1e-8?i-j:difference;});
    for(let k=0;k<remainder;k++)multiplicities[indices[k]]++;
  }
  const expanded=support.flatMap((p,i)=>Array.from({length:multiplicities[i]},()=>structuredClone(p))),pairs=permute(expanded,samplingStream(inst.seed,'sealed-matched-order-v2')),checks=realizedChecks(pairs,spec,alphabet);
  if(checks.count!==SAMPLER.pairs||checks.positive!==SAMPLER.pairs/2||checks.U_hist>SAMPLER.tau||checks.jointFeatureCeiling>SAMPLER.tau||checks.nuisanceMaxImbalance>SAMPLER.nuisanceTolerance||!checks.histogramConflictClasses)fail('B3: realized rounded ceilings or nuisance constraints failed');
  return {pairs,naturalPairs:natural,challenge:'matched/padded',registration:SAMPLER,checks,supportSummary:supportSummary(pairs,true),analyticOracle:analyticUniformOracle(support,spec,alphabet,solved.x.slice(0,N)),lp:{status:solved.status,pivots:solved.pivots,enumeratedStrings:strings.length,matchedClasses:matched.length,support,weights:solved.x.slice(0,N),multiplicities}};
}

export function supportSummary(pairs,padded){
  const distinct=ps=>new Set(ps.map(p=>JSON.stringify([p.a,p.b]))).size;
  const small=pairs.filter(p=>p.scale==='small'),large=pairs.filter(p=>p.scale==='large');
  return {rows:pairs.length,distinctPairs:distinct(pairs),smallDistinctPairs:distinct(small),largeDistinctPairs:distinct(large),pairedDependence:padded?{kind:'neutral-prefix copies of the same short cores',pairedRows:Math.min(small.length,large.length),independentRows:false}: {kind:'natural sampling; repeated rows possible',pairedRows:0,independentRows:false},sizeEstimand:padded?'padding robustness':'natural small/large descriptive scores'};
}
export function analyticUniformOracle(support,spec,alphabet,lpWeights){
  const K=support.length/4;if(!Number.isInteger(K)||K<1||K>SAMPLER.maxMatchedClasses)throw new Error('invalid matched support');
  const checks=realizedChecks(support,spec,alphabet),weight=1/support.length;
  if(checks.positive!==support.length/2||checks.U_hist!==.5||checks.jointFeatureCeiling!==.5||checks.nuisanceMaxImbalance!==0)throw new Error('analytic uniform balance failed');
  const maxDeviation=Math.max(...lpWeights.map(x=>Math.abs(x-weight)));if(maxDeviation>1e-7)throw new Error('LP disagrees with analytic max-min optimum');
  return {status:'verified',matchedClasses:K,supportPoints:support.length,uniformWeight:weight,maxMinOptimum:weight,maxDeviationFromLP:maxDeviation,U_hist:.5,jointFeatureCeiling:.5,nuisanceMaxImbalance:0,argument:'4K weights sum to one, so min weight <=1/(4K); paired uniform weights attain it'};
}
