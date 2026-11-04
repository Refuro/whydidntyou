import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {validateMonoid,fold,generatedSubmonoid,algebraFor} from './algebra.js';
import {realizedChecks} from './sealed-checks.js';
import {SAMPLER} from './sealed-sampler.js';
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
  validateMonoid(w.secret);
  const ambient=algebraFor(w.requestedFamily,{algebra:w.secret.algebra,points:w.secret.points??3,modulus:w.secret.algebra.startsWith('C2')?2:3});
  if(JSON.stringify(ambient.table)!==JSON.stringify(w.secret.table)||ambient.identity!==w.secret.identity)fail('ambient table differs from registration');
  const submonoid=generatedSubmonoid(w.secret,w.secret.images);
  if(JSON.stringify(submonoid)!==JSON.stringify(w.submonoid))fail('generated submonoid classification mismatch');
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
  const checks=realizedChecks(w.sealedPairs,w.secret,w.alphabet);
  if(!w.submonoid.commutative&&(checks.U_hist>SAMPLER.tau||checks.jointFeatureCeiling>SAMPLER.tau||checks.nuisanceMaxImbalance!==0||checks.histogramConflictClasses===0))fail('realized ceiling or nuisance failure');
  if(checks.count!==SAMPLER.pairs||checks.positive!==SAMPLER.pairs/2)fail('sealed balance/count failure');
  const digest=worldHash({generatorWorldDigest:w.generatorWorldDigest,sealedPairs:w.sealedPairs,naturalSealedPairs:w.naturalSealedPairs});
  if(w.worldDigest!==digest||w.instanceDigest!==worldHash({seed:w.seed,worldDigest:digest}))fail('sealed identity mismatch');
  if(e?.disposition!=='accepted'||!e.constructionValid||e.seed!==w.seed||e.worldDigest!==digest||e.kernelClasses!==1)fail('missing or inconsistent construction ledger entry');
  return {status:'passed',checks,conservation:'exhaustive laws and rule equations',labels:'all paths and inequalities checked'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{console.log(JSON.stringify(checkWorld(JSON.parse(readFileSync(process.argv[2],'utf8'))),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
