import test from 'node:test';
import assert from 'node:assert/strict';
import {make,proveConservation,verifyPath,identifiabilityAudit,referenceCode,ConstructionDefect} from '../src/domains/invariantGame.js';
import {validateMonoid,algebraFor,generatedSubmonoid,representationSignature} from '../src/algebra.js';
import {evaluate,isSuccess} from '../src/sandbox.js';
export const specimens=[{family:'F-count'},{family:'F-abelian'},...['S3','Q8','D4','A4'].map(algebra=>({family:'F-nonabelian',algebra})),...[3,4].map(points=>({family:'F-monoid',points}))];

for(const opts of specimens)test('B1 proof, certificates, identifiability and reference: '+JSON.stringify(opts),async()=>{
 const inst=make(1,opts);assert.equal(inst.trainingPairs.length,200);assert.equal(inst.calibrationPairs.length,80);assert.equal(inst.sealedPairs,null);
 assert.ok(inst.rules.length>=6&&inst.rules.length<=14);assert.ok(inst.rules.every(r=>r.u.length<=3&&r.v.length<=3&&r.u!==r.v));
 assert.ok(inst.rules.filter(r=>r.decoyProof).length>=2);assert.equal(inst.conservationProof.allContexts,true);assert.equal(inst.conservationProof.triplesChecked,inst.secret.table.length**3);
 for(const r of inst.rules.filter(r=>r.decoyProof))assert.ok(verifyPath(r.u,r.v,r.decoyProof,inst.rules.filter(r=>!r.decoyProof)));
 for(const p of [...inst.trainingPairs,...inst.calibrationPairs]){assert.equal(inst.quantity(p.a)===inst.quantity(p.b),p.label);if(p.label)assert.ok(verifyPath(p.a,p.b,p.certificate.path,inst.rules));else assert.notEqual(...p.certificate.values);}
 assert.equal(inst.identifiabilityAudit.referenceConsistent,true);assert.equal(inst.identifiabilityAudit.recoverable,true);
 assert.equal(inst.worldDigest,make(1,opts).worldDigest);assert.notEqual(inst.instanceDigest,make(2,opts).instanceDigest);
 const r=await evaluate(referenceCode(inst),inst,{evaluationPairs:inst.calibrationPairs,purpose:'wall-selftest',timeoutMs:20000});assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.accuracy,1);assert.ok(isSuccess(r));assert.equal(r.quantity.conservation.proved,true);assert.equal(r.quantity.partitionsAgree,true);assert.equal(r.generalizationGap,0);
});
test('B1 finite table laws reject invalid proofs',()=>{
 const spec=algebraFor('F-nonabelian',{algebra:'S3'});const bad=structuredClone(spec);bad.table[1][1]=999;assert.throws(()=>validateMonoid(bad),/closure/);
 const wrongIdentity=structuredClone(spec);wrongIdentity.identity=1;assert.throws(()=>validateMonoid(wrongIdentity),/identity/);
 const notAssociative={identity:0,table:[[0,1,2],[1,0,1],[2,2,0]]};assert.throws(()=>validateMonoid(notAssociative),/associativity/);
 const i=make(1);assert.throws(()=>proveConservation(i.secret,[{u:i.noncommutativityWitness[0],v:i.noncommutativityWitness[1]}]),/rule equation/);
});
test('B1 generated commuting images are classified as abelian',()=>{
 const i=make(7,{family:'F-nonabelian',algebra:'S3',images:[1,1,1]});assert.equal(i.family,'F-abelian');assert.equal(i.submonoid.commutative,true);
 assert.throws(()=>make(1,{images:[0,0,0]}),ConstructionDefect);
});
test('B1 ambiguity is counted and flagged without filtering the world',()=>{
 const i=make(1,{family:'F-nonabelian',algebra:'S3'}),audit=identifiabilityAudit(i.secret,i.alphabet,[],[]);
 assert.ok(audit.inequivalentRepresentations>1);assert.equal(audit.recoverable,false);assert.match(audit.flag,/not uniquely recoverable/);
 const sub=generatedSubmonoid(i.secret,i.secret.images);assert.equal(sub.commutative,false);assert.equal(sub.elements.length,6);
 assert.equal(typeof representationSignature(i.secret,i.alphabet),'string');
});
test('B1 verifier fails closed without B3 sealed data',async()=>{
 const i=make(1);assert.equal((await evaluate(referenceCode(i),i)).ok,false);
 assert.equal((await evaluate(referenceCode(i),i,{evaluationPairs:i.calibrationPairs})).ok,false);
});
test('B1 functional quantity compares partitions, not oracle labels; bounded evidence is not proof',async()=>{
 const i=make(1,{family:'F-count'}),code=referenceCode(i,{functionalQuantity:true}).replace('return product(s);',"return 'renamed-'+product(s);");
 const r=await evaluate(code,i,{evaluationPairs:i.calibrationPairs,purpose:'wall-selftest',timeoutMs:30000});assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.quantity.conservation.passed,true);assert.equal(r.quantity.conservation.proved,false);assert.equal(r.quantity.partitionsAgree,true);
});
test('B1 a constant conserved fold does not identify the oracle partition',async()=>{
 const i=make(1),code='const quantityFold='+JSON.stringify({identity:0,table:[[0]],images:Object.fromEntries(i.alphabet.map(a=>[a,0]))})+';function reachable(){return false;}';
 const r=await evaluate(code,i,{evaluationPairs:i.calibrationPairs,purpose:'wall-selftest',timeoutMs:20000});assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.quantity.conservation.proved,true);assert.equal(r.quantity.partitionsAgree,false);assert.equal(r.accuracy,.5);
});
