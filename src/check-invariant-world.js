import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {validateMonoid,fold,generatedSubmonoid,algebraFor} from './algebra.js';
import {realizedChecks} from './sealed-checks.js';
import {SAMPLER} from './sealed-sampler.js';
import {identifiabilityAudit,publicEvidence} from './domains/invariantGame.js';
import {jointKey,nuisanceFeatures} from './invariant-features.js';
import {samplingStream,permute} from './sampling-stream.js';
import {supportSummary,analyticUniformOracle} from './sealed-sampler.js';
import {referenceFeatureChecks} from './check-invariant-reference.js';
import {worldHash} from './construction-ledger.js';
// Separate implementation of the registered public-listing derivation. Coincidental
// image/list alignment is legal; the old positional construction rule is not.
function expectedAlphabet(seed,A){
  const shuffle=(values,domain)=>{let counter=0;const out=values.slice();for(let i=out.length-1;i>0;i--){const n=i+1,limit=Math.floor(4294967296/n)*n;let word;do{word=createHash('sha256').update('invariant-b3|'+seed+'|'+domain+'|'+counter++).digest().readUInt32BE(0);}while(word>=limit);const j=word%n;[out[i],out[j]]=[out[j],out[i]];}return out;};
  return shuffle(shuffle([...'abcdefghijklmnopqrstuvwxyz'],'symbols').slice(0,A).sort(),'public-alphabet');
}
function pathValid(pair,rules){
  let s=pair.a;for(const step of pair.certificate?.path??[]){const rule=rules.find(r=>r.id===step.rule);if(!rule||![1,-1].includes(step.direction)||!Number.isInteger(step.position)||step.position<0)return false;const u=step.direction===1?rule.u:rule.v,v=step.direction===1?rule.v:rule.u;if(s.slice(step.position,step.position+u.length)!==u||step.position>s.length-u.length)return false;s=s.slice(0,step.position)+v+s.slice(step.position+u.length);}return s===pair.b;
}
export function checkWorld(bundle){
  const {world:w,construction:e}=bundle,fail=message=>{throw new Error(message);};
  if(w.generatorVersion!=='invariantGame-v2-b3'||w.sampling?.version!=='sha256-uniform-images-v1'||w.sampling.override||JSON.stringify(w.alphabet)!==JSON.stringify(expectedAlphabet(w.seed,w.A)))fail('unregistered positional alphabet/image convention');
  if(w.samplerVersion!==SAMPLER.version||w.sealedConstruction?.registration?.version!==SAMPLER.version)fail('historical or unknown sampler version is not admitted');
  validateMonoid(w.secret);
  const ambient=algebraFor(w.requestedFamily,{algebra:w.secret.algebra,points:w.secret.points??3,modulus:w.secret.algebra.startsWith('C2')?2:3});
  if(JSON.stringify(ambient.table)!==JSON.stringify(w.secret.table)||ambient.identity!==w.secret.identity)fail('ambient table differs from registration');
  if(w.sampling.ambient!==ambient.name||w.secret.algebra!==ambient.name)fail('image-stream ambient name differs from validated algebra');
  const submonoid=generatedSubmonoid(w.secret,w.secret.images);
  if(JSON.stringify(submonoid)!==JSON.stringify(w.submonoid))fail('generated submonoid classification mismatch');
  const family=submonoid.commutative&&['F-nonabelian','F-monoid'].includes(w.requestedFamily)?'F-abelian':w.requestedFamily;
  if(w.family!==family||e?.effectiveClassification!==family)fail('wrong effective family');
  const pub=publicEvidence(w),audit=identifiabilityAudit(w.secret,pub.alphabet,pub.rules,pub.trainingPairs);
  if(!audit.recoverable)fail('non-identifying public evidence');
  if(e?.kernelClasses!==audit.inequivalentRepresentations||e?.consistentAssignments!==audit.consistentAssignments||e?.assignmentSpace!==audit.assignmentsEnumerated)fail('construction audit counts differ from public identifiability');
  const core=Object.fromEntries(['family','requestedFamily','generatorVersion','A','alphabet','rules','trainingPairs','calibrationPairs','secret','sampling'].map(k=>[k,w[k]]));
  if(w.generatorWorldDigest!==worldHash(core))fail('core digest does not follow from artifact content');
  // Independently bind the latent images too, not just the public permutation.
  let counter=0;const size=w.secret.table.length,limit=Math.floor(4294967296/size)*size;
  for(const symbol of w.alphabet.toSorted()){let x;do{x=createHash('sha256').update(`invariant-b3|${w.seed}|images|${w.sampling.ambient}|${w.A}|${counter++}`).digest().readUInt32BE(0);}while(x>=limit);if(w.secret.images[symbol]!==x%size)fail('image assignment differs from uniform registered draw');}
  for(const r of w.rules)if(fold(r.u,w.secret)!==fold(r.v,w.secret))fail('nonconserving rule');
  for(const p of [...w.trainingPairs,...w.calibrationPairs,...w.sealedPairs,...w.naturalSealedPairs]){
    const a=fold(p.a,w.secret),b=fold(p.b,w.secret);
    if((a===b)!==p.label)fail('incorrect invariant label');
    if(p.label){if(p.certificate?.kind!=='rewrite-path'||!pathValid(p,w.rules))fail('invalid positive path');}
    else if(p.certificate?.kind!=='invariant-inequality'||JSON.stringify(p.certificate.values)!==JSON.stringify([a,b]))fail('invalid negative certificate');
  }
  checkStrata(w.trainingPairs,200,0,'training',fail);
  checkStrata(w.calibrationPairs,40,40,'calibration',fail);
  checkStrata(w.sealedPairs,100,100,'sealed',fail);
  checkStrata(w.naturalSealedPairs,100,100,'natural',fail);
  if(!submonoid.commutative)checkPadding(w,fail);
  const checks=realizedChecks(w.sealedPairs,w.secret,w.alphabet);
  if(!w.submonoid.commutative&&(checks.U_hist>SAMPLER.tau||checks.jointFeatureCeiling>SAMPLER.tau||checks.nuisanceMaxImbalance!==0||checks.histogramConflictClasses===0))fail('realized ceiling or nuisance failure');
  if(checks.count!==SAMPLER.pairs||checks.positive!==SAMPLER.pairs/2)fail('sealed balance/count failure');
  const digest=worldHash({generatorWorldDigest:w.generatorWorldDigest,samplerVersion:w.samplerVersion,sealedPairs:w.sealedPairs,naturalSealedPairs:w.naturalSealedPairs});
  if(w.worldDigest!==digest||w.instanceDigest!==worldHash({seed:w.seed,worldDigest:digest}))fail('sealed identity mismatch');
  if(e?.disposition!=='accepted'||!e.constructionValid||e.seed!==w.seed||e.worldDigest!==digest||e.kernelClasses!==1)fail('missing or inconsistent construction ledger entry');
  const independent=w.secret.table.length<=6?referenceFeatureChecks(w):null;
  if(independent)for(const k of ['quotients','U_hist','jointFeatureCeiling','nuisanceMaxImbalance','histogramConflictClasses'])if(independent[k]!==checks[k])fail('independent reference disagrees on '+k);
  return {status:'passed',samplerVersion:w.samplerVersion,effectiveFamily:family,identifiability:audit,checks,independentReference:independent,supportSummary:supportSummary(w.sealedPairs,!submonoid.commutative),conservation:'exhaustive laws and rule equations',labels:'all paths and inequalities checked'};
}
function checkStrata(pairs,small,large,name,fail){
  if(!Array.isArray(pairs)||pairs.length!==small+large)fail(name+' count mismatch');
  for(const [scale,n]of [['small',small],['large',large]]){
    const ps=pairs.filter(p=>p.scale===scale);
    if(ps.length!==n||ps.filter(p=>p.label).length!==n/2)fail(name+' stratum count/balance mismatch');
  }
}
function checkPadding(w,fail){
  const spec=w.secret,alphabet=w.alphabet.toSorted(),queue=[{v:spec.identity,s:''}],seen=new Set([spec.identity]);let id=null;
  for(let i=0;i<queue.length&&!id;i++)for(const a of alphabet){const v=spec.table[queue[i].v][spec.images[a]],s=queue[i].s+a;if(v===spec.identity){id=s;break;}if(!seen.has(v)){seen.add(v);queue.push({v,s});}}
  if(!id)fail('padding identity unavailable');const prefix=id.repeat(Math.ceil(SAMPLER.largePrefixMin/id.length));
  const lp=w.sealedConstruction.lp,support=lp?.support,K=support?.length/4;
  if(!Number.isInteger(K)||K<1||K>32||lp.multiplicities?.length!==4*K||lp.weights?.length!==4*K)fail('invalid matched/padded support');
  for(let i=0;i<2*K;i++){
    const a=support[i],b=support[i+2*K];
    if(a.scale!=='small'||a.a.length>4||a.b.length>4||a.label!==(i%2===1)||b.scale!=='large'||b.a!==prefix+a.a||b.b!==prefix+a.b||b.label!==a.label||lp.multiplicities[i]!==lp.multiplicities[i+2*K])fail('registered padding/support mismatch');
    if(i%2===0&&(jointKey(a,spec,alphabet)!==jointKey(support[i+1],spec,alphabet)||JSON.stringify(nuisanceFeatures(a,alphabet))!==JSON.stringify(nuisanceFeatures(support[i+1],alphabet))))fail('matched support class mismatch');
  }
  analyticUniformOracle(support,spec,alphabet,lp.weights);
  for(let i=0;i<4*K;i++){const expected=Math.floor(50/K)+(Math.floor((i%(2*K))/2)<50%K?1:0);if(lp.multiplicities[i]!==expected)fail('registered rounded multiplicity mismatch');}
  const expanded=support.flatMap((p,i)=>Array.from({length:lp.multiplicities[i]},()=>p));
  const expected=permute(expanded,samplingStream(w.seed,'sealed-matched-order-v2'));
  if(JSON.stringify(expected)!==JSON.stringify(w.sealedPairs))fail('final realized ordering/support differs from registered PRF permutation');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{console.log(JSON.stringify(checkWorld(JSON.parse(readFileSync(process.argv[2],'utf8'))),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
