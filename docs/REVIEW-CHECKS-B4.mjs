// Offline B4 review. No network, submitted code execution, sandbox probes, or repo edits.
// node REVIEW-CHECKS-B4.mjs <pinned-repo> <evidence.json> [independent-audit-dir]
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(process.argv[2]),output=resolve(process.argv[3]);
const imp=p=>import(pathToFileURL(join(root,p)).href);
const {checkWorld}=await imp('src/check-invariant-world.js');
const {make,identifiabilityAudit}=await imp('src/domains/invariantGame.js');
const {constructSealed}=await imp('src/sealed-sampler.js');
const {sealWorld,worldHash}=await imp('src/construction-ledger.js');
const {publicWorld}=await imp('src/portfolio/challenge-public.js');
const {runPortfolio,fitPublic,scorePrepared,MEMBERS}=await imp('src/portfolio/run.js');
const {publicEvidence}=await imp('src/domains/invariantGame.js');
const {sourceIdentity}=await imp('src/source-identity.js');
const json=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const records=p=>readFileSync(p,'utf8').trimEnd().split('\n').map(JSON.parse);
const sha=b=>createHash('sha256').update(b).digest('hex');
const bundle=json('examples/invariantGame-world-1.json'),w=bundle.world;
const evidence={reviewedCommit:'60cb737f29ee1ea223a64c057e5e620f0643c6aa',sourceIdentity:sourceIdentity(),scope:'offline host-side checks; no sandbox instantiation; no live model calls',checks:[]};
const record=(name,data)=>{evidence.checks.push({name,...data});console.log(name);};

// Independent implementation: exhaustive partitions, not production congruence closure.
function partitions(n){const out=[],p=[0];function go(i,max){if(i===n){out.push(p.slice());return;}for(let c=0;c<=max+1;c++){p[i]=c;go(i+1,Math.max(c,max));}}go(1,0);return out;}
function congruences(t){return partitions(t.length).filter(p=>new Set(p).size<t.length&&t.every((_,a)=>t.every((__,b)=>p[a]!==p[b]||t.every((___,x)=>p[t[a][x]]===p[t[b][x]]&&p[t[x][a]]===p[t[x][b]]))));}
function independentChecks(world){
 const {table:t,identity:id,images}=world.secret,n=t.length,alphabet=[...world.alphabet].sort();
 assert.ok(t.every((row,a)=>row.length===n&&row.every(x=>Number.isInteger(x)&&x>=0&&x<n)&&t[id][a]===a&&t[a][id]===a));
 for(let a=0;a<n;a++)for(let b=0;b<n;b++)for(let c=0;c<n;c++)assert.equal(t[t[a][b]][c],t[a][t[b][c]]);
 const fold=s=>[...s].reduce((v,c)=>t[v][images[c]],id);
 for(const r of world.rules)assert.equal(fold(r.u),fold(r.v));
 let counter=0;
 for(const s of alphabet){let x;do{x=createHash('sha256').update(`invariant-b3|${world.seed}|images|${world.secret.algebra}|${world.A}|${counter++}`).digest().readUInt32BE(0);}while(x>=Math.floor(2**32/n)*n);assert.equal(images[s],x%n);}
 const all=[...world.trainingPairs,...world.calibrationPairs,...world.sealedPairs,...world.naturalSealedPairs];
 for(const p of all){assert.equal(fold(p.a)===fold(p.b),p.label);if(p.label){let s=p.a;assert.equal(p.certificate.kind,'rewrite-path');for(const step of p.certificate.path){const rule=world.rules.find(r=>r.id===step.rule);assert.ok(rule);assert.ok([1,-1].includes(step.direction));const [from,to]=step.direction===1?[rule.u,rule.v]:[rule.v,rule.u];assert.ok(Number.isInteger(step.position)&&step.position>=0&&step.position<=s.length-from.length);assert.equal(s.slice(step.position,step.position+from.length),from);s=s.slice(0,step.position)+to+s.slice(step.position+from.length);}assert.equal(s,p.b);}else assert.deepEqual(p.certificate.values,[fold(p.a),fold(p.b)]);}
 const qs=congruences(t),hist=s=>alphabet.map(c=>[...s].filter(x=>x===c).length),maps=[new Map(),new Map(),new Map()];
 const edit=(a,b)=>{let prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(prev[j]+1,next[j-1]+1,prev[j-1]+Number(a[i-1]!==b[j-1]));prev=next;}return prev[b.length];};
 const lcs=(a,b)=>{let prev=Array(b.length+1).fill(0);for(const c of a){const next=[0];for(let j=1;j<=b.length;j++)next[j]=c===b[j-1]?prev[j-1]+1:Math.max(prev[j],next[j-1]);prev=next;}return prev[b.length];};
 for(const p of world.sealedPairs){const ha=hist(p.a),hb=hist(p.b),h=[ha,hb],features=[h,[h,qs.map(q=>[q[fold(p.a)],q[fold(p.b)]])],[p.a.length,p.b.length,ha.reduce((n,x,i)=>n+Math.abs(x-hb[i]),0),edit(p.a,p.b),lcs(p.a,p.b)]];features.forEach((f,i)=>{const k=JSON.stringify(f),counts=maps[i].get(k)??[0,0];counts[Number(p.label)]++;maps[i].set(k,counts);});}
 return {lawsTriples:n**3,labelsChecked:all.length,properCongruences:qs.length,U_hist:[...maps[0].values()].reduce((n,v)=>n+Math.max(...v),0)/200,jointFeatureCeiling:[...maps[1].values()].reduce((n,v)=>n+Math.max(...v),0)/200,nuisanceMaxImbalance:Math.max(...[...maps[2].values()].map(v=>Math.abs(v[0]-v[1])/200)),histogramConflictClasses:[...maps[0].values()].filter(v=>v.every(x=>x>0)).length};
}
record('example-independent-laws-images-certificates-ceilings',{result:independentChecks(w),production:checkWorld(bundle)});

// Predictor receives ONLY the public ordered unlabeled pairs. Labels are used below for scoring.
function orderPredictions(pub){let previous=null,block=-1;return pub.sealedPairs.map(({a,b})=>{const key=JSON.stringify([a,b]);if(key!==previous){block++;previous=key;}return block%2===1;});}
function orderResult(world){const pub=publicWorld(world),pred=orderPredictions(pub),distinct=new Set(pub.sealedPairs.map(p=>JSON.stringify([p.a,p.b])));return {seed:world.seed,family:world.family,worldDigest:world.worldDigest,correct:pred.filter((v,i)=>v===world.sealedPairs[i].label).length,total:pred.length,distinctPairs:distinct.size};}
record('ordered-unlabeled-example-decoder',{result:orderResult(w)});
const reversedPublic=publicWorld(w);reversedPublic.sealedPairs.reverse();
record('order-reversal-control',{correct:orderPredictions(reversedPublic).filter((v,i)=>v===w.sealedPairs[199-i].label).length,total:200});
const sample=[];
for(const family of ['F-nonabelian','F-monoid']){
 const rs=records(join(root,'docs/B4-EVIDENCE',family+'.construction.jsonl'));
 for(const e of rs.filter(r=>r.type==='construction'&&r.constructionValid&&r.effectiveClassification===family).slice(0,12)){
  const p=rs[0].proposals[e.index],inst=make(p.seed,p.opts),world=sealWorld(inst,constructSealed(inst));assert.equal(world.worldDigest,e.worldDigest);sample.push(orderResult(world));
 }
}
record('ordered-unlabeled-decoder-24-additional-worlds',{worlds:sample,allPerfect:sample.every(x=>x.correct===x.total)});
const small=w.sealedPairs.filter(p=>p.scale==='small'),large=w.sealedPairs.filter(p=>p.scale==='large');
const lp=w.sealedConstruction.lp;
record('padding-and-lp-support',{smallCount:small.length,largeCount:large.length,largeIsPrefixClone:large.every((p,i)=>p.a.endsWith(small[i].a)&&p.b.endsWith(small[i].b)&&p.label===small[i].label&&p.a.slice(0,p.a.length-small[i].a.length)===p.b.slice(0,p.b.length-small[i].b.length)),lp:{status:lp.status,pivots:lp.pivots,matchedClasses:lp.matchedClasses,supportPoints:lp.support.length,minWeight:Math.min(...lp.weights),maxWeight:Math.max(...lp.weights),maxDeviationFromAnalyticUniform:Math.max(...lp.weights.map(x=>Math.abs(x-1/lp.support.length))),multiplicities:lp.multiplicities}});

// Semantic mutations with recomputed digests, not corruption/checksum tests.
function rebind(b){const x=b.world;const content=Object.fromEntries(['family','requestedFamily','generatorVersion','A','alphabet','rules','trainingPairs','calibrationPairs','secret','sampling'].map(k=>[k,x[k]]));x.generatorWorldDigest=worldHash(content);x.worldDigest=worldHash({generatorWorldDigest:x.generatorWorldDigest,sealedPairs:x.sealedPairs,naturalSealedPairs:x.naturalSealedPairs});x.instanceDigest=worldHash({seed:x.seed,worldDigest:x.worldDigest});b.construction.worldDigest=x.worldDigest;return b;}
for(const mutation of ['incorrect-effective-family','no-large-stratum','uninformative-training']){
 const b=structuredClone(bundle);
 if(mutation==='incorrect-effective-family'){b.world.family='F-count';b.construction.effectiveClassification='F-count';}
 if(mutation==='no-large-stratum')for(const p of b.world.sealedPairs)p.scale='small';
 if(mutation==='uninformative-training')b.world.trainingPairs=Array.from({length:200},()=>({a:'',b:'',label:true,scale:'small',certificate:{kind:'rewrite-path',path:[]}}));
 let outcome;try{checkWorld(rebind(b));outcome='accepted';}catch(e){outcome='rejected: '+e.message;}
 record('checker-semantic-mutation-'+mutation,{outcome,...(mutation==='uninformative-training'?{recomputedPublicAudit:identifiabilityAudit(b.world.secret,b.world.alphabet,b.world.rules,b.world.trainingPairs)}:{})});
}
record('example-portfolio',{result:runPortfolio(w)});
const operationCases=[];
for(const id of ['count-linear','joint-coarse']){
 const member=MEMBERS.find(m=>m.id===id),prepared=fitPublic(member,publicEvidence(w)),pair=w.sealedPairs[0];
 let visits=0;const wrapped=s=>({length:s.length,*[Symbol.iterator](){for(const c of s){visits++;yield c;}}});
 prepared.model.predict(wrapped(pair.a),wrapped(pair.b));
 const score=scorePrepared(prepared,[pair],member);
 operationCases.push({member:id,wordLengths:[pair.a.length,pair.b.length],alphabetSize:w.alphabet.length,actualCharacterVisits:visits,chargedOperations:score.resources.operations});
}
record('declared-conservative-score-costs',{cases:operationCases,nuisanceTrainingDPCells:w.trainingPairs.reduce((n,p)=>n+p.a.length*p.b.length,0),note:'Character visits measured through inert iterable wrappers. No submitted code or sandbox executes.'});

const allRows=[],counts={};
for(const family of ['F-count','F-abelian','F-nonabelian','F-monoid']){
 const ledger=records(join(root,'docs/B4-EVIDENCE',family+'.construction.jsonl')),rows=records(join(root,'docs/B4-EVIDENCE',family+'.portfolio.jsonl')).slice(1),entries=ledger.filter(e=>e.type==='construction'),accepted=entries.filter(e=>e.constructionValid);
 assert.equal(ledger.length,1025);assert.equal(entries.length,512);assert.equal(rows.length,accepted.length);
 rows.forEach((r,i)=>{assert.equal(r.worldDigest,accepted[i].worldDigest);assert.equal(r.proposalIndex,accepted[i].index);assert.deepEqual(r.rows.map(m=>m.id),MEMBERS.map(m=>m.id));allRows.push({row:r,proposal:ledger[0].proposals[r.proposalIndex]});});
 counts[family]={proposed:512,accepted:rows.length,sourceHash:ledger[0].sourceHash};
}
record('builder-evidence-completeness',{counts,worlds:allRows.length,effective:Object.fromEntries(['F-count','F-abelian','F-nonabelian','F-monoid'].map(f=>[f,allRows.filter(x=>x.row.family===f).length])),cspSuccesses:allRows.filter(x=>x.row.rows.find(m=>m.id==='monoid-csp').sealed.success).length,selectorSuccesses:allRows.filter(x=>x.row.implementableSelector.sealedAccuracy>=.95).length,totalBudgetExhaustions:allRows.flatMap(x=>x.row.rows).reduce((n,r)=>n+r.sealed.resources.totalBudgetExhaustions+r.natural.resources.totalBudgetExhaustions,0)});
const depleted=allRows.flatMap(x=>x.row.rows.filter(m=>m.natural.resources.totalBudgetExhaustions>0&&m.sealed.resources.totalBudgetExhaustions===0).map(m=>({...x,member:m}))).slice(0,2);
const orderEffects=[];
for(const x of depleted){const inst=make(x.proposal.seed,x.proposal.opts),world=sealWorld(inst,constructSealed(inst)),member=MEMBERS.find(m=>m.id===x.member.id),prepared=fitPublic(member,publicEvidence(world));scorePrepared(prepared,world.trainingPairs,member);const naturalFirst=scorePrepared(prepared,world.naturalSealedPairs,member);orderEffects.push({seed:world.seed,family:world.family,member:member.id,archivedChallengeFirst:x.member.natural,naturalFirst});}
record('natural-score-order-effects',{cases:orderEffects});
if(process.argv[4]){
 const dir=resolve(process.argv[4]),comparisons=[];
 for(const family of Object.keys(counts)){
  const old=records(join(root,'docs/B4-EVIDENCE',family+'.construction.jsonl')),fresh=records(join(dir,family+'.construction.jsonl'));
  assert.deepEqual(fresh.slice(1),old.slice(1));
  const a=records(join(root,'docs/B4-EVIDENCE',family+'.portfolio.jsonl')).slice(1),b=records(join(dir,family+'.portfolio.jsonl')).slice(1);
  const differences=[];for(let i=0;i<a.length;i++)for(let m=0;m<a[i].rows.length;m++)for(const distribution of ['sealed','natural'])if(a[i].rows[m][distribution].accuracy!==b[i].rows[m][distribution].accuracy)differences.push({seed:a[i].seed,member:a[i].rows[m].id,distribution,builder:a[i].rows[m][distribution].accuracy,reproduced:b[i].rows[m][distribution].accuracy});
  comparisons.push({family,constructionDispositionsIdentical:true,worlds:b.length,scoreDifferences:differences});
 }
 record('full-independent-audit',{comparisons,summary:JSON.parse(readFileSync(join(dir,'summary.json'),'utf8'))});
}
evidence.fileHashes=Object.fromEntries(['docs/REVIEW-PROMPT-B4.md','docs/DECISIONS-B4.md','src/sealed-sampler.js','src/check-invariant-world.js','src/portfolio/run.js','src/portfolio/score-external.js','examples/invariantGame-world-1.json'].map(p=>[p,sha(readFileSync(join(root,p)))]));
writeFileSync(output,JSON.stringify(evidence,null,2)+'\n');
