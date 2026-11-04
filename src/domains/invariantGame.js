import {createHash} from 'node:crypto';
import {assertSeed} from '../validate.js';
import {mulberry32,randInt,shuffle} from '../rng.js';
import {algebraFor,validateMonoid,fold,generatedSubmonoid,words,representationSignature} from '../algebra.js';
import {reachabilityContract} from '../verifiers/reachability.js';

export const VERSION='invariantGame-v1-b2.1';
export const name='invariantGame';
export const REGISTRATION=Object.freeze({alphabetMin:2,alphabetMax:4,maxRuleLength:3,trainingPairs:200,calibrationPairs:80,representationClass:'all symbol images into the same ambient monoid; kernels equivalent up to rooted transition-graph isomorphism',maxAssignments:1_000_000,calibration:'40 small (length 4–10), 40 large (length 96–128); balanced labels; half the noncommutative negatives are order witnesses',sealed:'not built until B3'});
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export class ConstructionDefect extends Error{constructor(seed,reason){super(`seed ${seed}: ${reason}`);this.name='ConstructionDefect';this.seed=seed;this.reason=reason;}}
export function assertIdentifiable(seed,audit){
  if(!audit.recoverable){const defect=new ConstructionDefect(seed,'non-identifiable');defect.audit=audit;throw defect;}
}
export function applications(state,rules,maxLength=Infinity){
  const out=[];
  for(const rule of rules)for(const direction of [1,-1]){
    const from=direction===1?rule.u:rule.v,to=direction===1?rule.v:rule.u;
    for(let position=0;position<=state.length-from.length;position++)if(state.slice(position,position+from.length)===from){const next=state.slice(0,position)+to+state.slice(position+from.length);if(next.length<=maxLength)out.push({state:next,rule:rule.id,direction,position});}
  }
  return out;
}
export function verifyPath(a,b,path,rules){
  let state=a;
  for(const step of path){const r=rules.find(r=>r.id===step.rule);if(!r||![1,-1].includes(step.direction)||!Number.isInteger(step.position)||step.position<0)return false;const from=step.direction===1?r.u:r.v,to=step.direction===1?r.v:r.u;if(step.position+from.length>state.length||state.slice(step.position,step.position+from.length)!==from)return false;state=state.slice(0,step.position)+to+state.slice(step.position+from.length);}
  return state===b;
}
function buildRules(spec,alphabet,rng,seed){
  const buckets=new Map();for(const w of words(alphabet,3)){const v=fold(w,spec);if(!buckets.has(v))buckets.set(v,[]);buckets.get(v).push(w);}
  const base=[],decoys=[],used=new Set();const key=(u,v)=>[u,v].sort().join('|');
  const add=(u,v)=>{const r={id:'r'+(base.length+decoys.length),u,v};base.push(r);used.add(key(u,v));return r;};
  const decoyCount=2+randInt(rng,2);
  for(const bucket of shuffle(rng,[...buckets.values()].filter(b=>b.length>=3))){
    if(decoys.length===decoyCount)break;
    const [u,v,w]=shuffle(rng,bucket);if([key(u,v),key(v,w),key(u,w)].some(k=>used.has(k)))continue;
    const r1=add(u,v),r2=add(v,w),d={id:'r'+(base.length+decoys.length),u,v:w,decoyProof:[{rule:r1.id,direction:1,position:0},{rule:r2.id,direction:1,position:0}]};decoys.push(d);used.add(key(u,w));
  }
  if(decoys.length!==decoyCount)throw new ConstructionDefect(seed,'insufficient short consequence rules');
  const candidates=[];for(const bucket of buckets.values())for(let i=0;i<bucket.length;i++)for(let j=i+1;j<bucket.length;j++)if(!used.has(key(bucket[i],bucket[j])))candidates.push([bucket[i],bucket[j]]);
  const target=8;for(const [u,v]of shuffle(rng,candidates).sort((a,b)=>a[0].length+a[1].length-b[0].length-b[1].length)){if(base.length>=target)break;add(u,v);}
  const rules=shuffle(rng,[...base,...decoys]);
  if(rules.length<6||rules.length>14)throw new ConstructionDefect(seed,'rule count outside registration');
  return rules;
}
export function proveConservation(spec,rules){
  const laws=validateMonoid(spec);
  for(const r of rules)if(fold(r.u,spec)!==fold(r.v,spec))throw new Error('rule equation does not preserve the fold');
  return {...laws,ruleEquations:rules.length,allContexts:true,argument:'I(xuy)=I(x) I(u) I(y)=I(x) I(v) I(y)=I(xvy) by associativity'};
}
function orderWitness(spec,alphabet){for(const a of alphabet)for(const b of alphabet)if(fold(a+b,spec)!==fold(b+a,spec))return [a+b,b+a];return null;}
function pairs(spec,alphabet,rules,rng,count,large,witness,seed){
  const out=[],idWord=witness?identityWordBounded(spec,alphabet):null;
  const state=length=>Array.from({length},()=>alphabet[randInt(rng,alphabet.length)]).join('');
  for(let i=0;i<count;i++){
    const label=i%2===0,length=large?96+randInt(rng,33):4+randInt(rng,7);let a=state(length),b,certificate;
    if(label){let current=a;const path=[];for(let step=0;step<(large?32:8);step++){const choices=applications(current,rules,large?160:24);if(!choices.length)break;const next=choices[randInt(rng,choices.length)];path.push({rule:next.rule,direction:next.direction,position:next.position});current=next.state;}b=current;certificate={kind:'rewrite-path',path};}
    else if(witness&&i%4===1&&idWord){const pad=idWord.repeat(Math.ceil((length-2)/idWord.length));a=pad+witness[0];b=pad+witness[1];certificate={kind:'invariant-inequality',values:[fold(a,spec),fold(b,spec)]};}
    else {for(let tries=0;tries<256;tries++){b=state(large?96+randInt(rng,33):4+randInt(rng,7));if(fold(a,spec)!==fold(b,spec))break;}if(fold(a,spec)===fold(b,spec))throw new ConstructionDefect(seed,'negative-pair budget exhausted');certificate={kind:'invariant-inequality',values:[fold(a,spec),fold(b,spec)]};}
    out.push({a,b,label,scale:large?'large':'small',certificate});
  }
  return shuffle(rng,out);
}
function identityWordBounded(spec,alphabet){
  // A nonempty identity word can be found by bounded BFS over (value,word), avoiding exponential enumeration.
  const queue=[{value:spec.identity,word:''}],seen=new Set([spec.identity]);
  for(let i=0;i<queue.length;i++)for(const a of alphabet){const value=spec.table[queue[i].value][spec.images[a]],word=queue[i].word+a;if(value===spec.identity)return word;if(!seen.has(value)){seen.add(value);queue.push({value,word});}}
  return null;
}
export function identifiabilityAudit(spec,alphabet,rules,trainingPairs){
  const size=spec.table.length,total=size**alphabet.length;
  if(total>REGISTRATION.maxAssignments)throw new Error('representation audit exceeds registered enumeration budget');
  const representations=new Set(),reference=representationSignature(spec,alphabet);let consistentAssignments=0;
  const candidate={table:spec.table,identity:spec.identity,images:{}};
  for(let number=0;number<total;number++){
    let value=number;for(const symbol of alphabet){candidate.images[symbol]=value%size;value=Math.floor(value/size);}
    if(rules.some(r=>fold(r.u,candidate)!==fold(r.v,candidate)))continue;
    if(trainingPairs.some(p=>(fold(p.a,candidate)===fold(p.b,candidate))!==p.label))continue;
    consistentAssignments++;representations.add(representationSignature(candidate,alphabet));
  }
  const generated=generatedSubmonoid(spec,spec.images),occupied=new Set(trainingPairs.flatMap(p=>[fold(p.a,spec),fold(p.b,spec)]));
  return {representationClass:REGISTRATION.representationClass,assignmentsEnumerated:total,consistentAssignments,inequivalentRepresentations:representations.size,referenceConsistent:representations.has(reference),recoverable:representations.size===1&&representations.has(reference),flag:representations.size===1&&representations.has(reference)?null:'invariant not uniquely recoverable in registered representation class',reachableStateOccupancy:{occupied:occupied.size,generated:generated.elements.length,fraction:occupied.size/generated.elements.length},referenceInformation:'oracle solver uses the secret table and symbol images; identifiability uses only public rules and 200 labels'};
}
export function privateRuleCoverage(rules,pairs){
  if(pairs.some(p=>!p.certificate||p.label&&!Array.isArray(p.certificate.path)))return {status:'unavailable',reason:'private path certificates missing'};
  return {status:'available',counts:Object.fromEntries(rules.map(r=>[r.id,pairs.reduce((sum,p)=>sum+(p.certificate.path||[]).filter(s=>s.rule===r.id).length,0)]))};
}
export function make(seed,opts={}){
  assertSeed(seed);for(const k of Object.keys(opts))if(!['family','A','algebra','points','modulus','images'].includes(k))throw new Error('unregistered invariant option '+k);
  const family=opts.family??'F-nonabelian',A=opts.A??3;if(!Number.isInteger(A)||A<2||A>4)throw new Error('registered alphabet size is 2..4');
  const rng=mulberry32(seed),ambient=algebraFor(family,opts);validateMonoid(ambient);
  const alphabet=shuffle(rng,[...'abcdefghijklmnopqrstuvwxyz']).slice(0,A);
  const generators=family==='F-monoid'&&A===2?[ambient.generators[0],ambient.generators[2]]:ambient.generators;
  const values=opts.images??Array.from({length:A},(_,i)=>generators[i]??randInt(rng,ambient.table.length));
  if(!Array.isArray(values)||values.length!==A||values.some(v=>!Number.isInteger(v)||v<0||v>=ambient.table.length))throw new Error('invalid symbol images');
  const images=Object.fromEntries(alphabet.map((s,i)=>[s,values[i]])),secret={table:ambient.table,identity:ambient.identity,images,algebra:ambient.name,elements:ambient.elements,points:ambient.points??null};
  const submonoid=generatedSubmonoid(secret,images),classifiedFamily=submonoid.commutative&&['F-nonabelian','F-monoid'].includes(family)?'F-abelian':family;
  if(submonoid.elements.length<2)throw new ConstructionDefect(seed,'constant invariant cannot supply negative labels');
  const rules=buildRules(secret,alphabet,rng,seed),conservationProof=proveConservation(secret,rules),witness=orderWitness(secret,alphabet);
  for(const r of rules.filter(r=>r.decoyProof))if(!verifyPath(r.u,r.v,r.decoyProof,rules.filter(r=>!r.decoyProof)))throw new ConstructionDefect(seed,'decoy consequence certificate failed');
  const trainingPairs=pairs(secret,alphabet,rules,mulberry32(seed^0x517cc1b7),200,false,witness,seed);
  const calibrationPairs=[...pairs(secret,alphabet,rules,mulberry32(seed^0x137a92ef),40,false,witness,seed),...pairs(secret,alphabet,rules,mulberry32(seed^0xa124b679),40,true,witness,seed)];
  const audit=identifiabilityAudit(secret,alphabet,rules,trainingPairs);
  assertIdentifiable(seed,audit);
  const rulesText=rules.map((r,i)=>`${i+1}. ${r.u||'ε'} ↔ ${r.v||'ε'}`).join('\n');
  const content={family:classifiedFamily,requestedFamily:family,generatorVersion:VERSION,A,alphabet,rules,trainingPairs,calibrationPairs,secret};
  return {...content,seed,contract:reachabilityContract,rulesText,sealedPairs:null,sealedStatus:'pending B3',quantity:state=>fold(state,secret),conservationProof,submonoid,identifiabilityAudit:audit,noncommutativityWitness:witness,worldDigest:hash(content),instanceDigest:hash({seed,content}),description:'Decide whether a and b are connected by the exposed reversible rewrites, on the stated promise distribution.'};
}
export function referenceCode(inst,{functionalQuantity=false,includeQuantity=true}={}){
  const spec=JSON.stringify({table:inst.secret.table,identity:inst.secret.identity,images:inst.secret.images});
  return `const spec=${spec}; function product(s){let v=spec.identity;for(const a of s)v=spec.table[v][spec.images[a]];return v;} function reachable(a,b){return product(a)===product(b);}`+(includeQuantity?(functionalQuantity?'function quantity(s){return product(s);}':'const quantityFold=spec;'):'');
}
// The only view intended for solver prompts/constructors. Proof certificates, secret
// invariant values, decoy annotations, calibration data and administrative IDs stay out.
export function publicEvidence(inst){
  return {alphabet:inst.alphabet.slice(),rules:inst.rules.map(({u,v})=>({u,v})),rulesText:inst.rulesText,trainingPairs:inst.trainingPairs.map(({a,b,label})=>({a,b,label}))};
}
