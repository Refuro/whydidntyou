// Usage: node REVIEW-CHECKS-v9.mjs <repo> <evidence.json>
// Ordinary offline record fixtures ONLY. No sandbox calls, selftests, executable submissions or live API requests.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(process.argv[2]), dest=path.resolve(process.argv[3]);
const work=fs.mkdtempSync(path.join(path.dirname(dest),'v9-records-'));
for(const d of ['src','node_modules'])fs.cpSync(path.join(root,d),path.join(work,d),{recursive:true});
for(const f of ['package.json','package-lock.json'])fs.copyFileSync(path.join(root,f),path.join(work,f));
fs.mkdirSync(path.join(work,'runs'));
const hash=x=>createHash('sha256').update(x).digest('hex');
const ev={node:process.version,root,work,scope:'Source inspection and ordinary offline record fixtures; no sandbox execution.',sourceHashes:{},cases:[],workerCalls:[]};
for(const f of ['docs/PLAN.md','docs/REVIEW-PROMPT-v9.md','package.json','package-lock.json',...fs.readdirSync(path.join(root,'src'),{recursive:true}).filter(f=>fs.statSync(path.join(root,'src',f)).isFile()).map(f=>'src/'+f.replaceAll('\\','/'))])ev.sourceHashes[f]=hash(fs.readFileSync(path.join(root,f)));
const write=(f,v)=>fs.writeFileSync(path.join(work,f),typeof v==='string'?v:JSON.stringify(v,null,2));
const emit=(id,passed,details={})=>{ev.cases.push({id,passed,...details});fs.writeFileSync(dest,JSON.stringify(ev,null,2)+'\n');console.log(JSON.stringify(ev.cases.at(-1)));};
const readLines=f=>fs.readFileSync(path.resolve(work,f),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const saveLines=(f,lines)=>write(f,lines.map(JSON.stringify).join('\n')+'\n');
const clone=x=>structuredClone(x);
const {make}=await import(pathToFileURL(path.join(work,'src/domains/laggedRule.js')));
const {make:makePeriod}=await import(pathToFileURL(path.join(work,'src/domains/hiddenPeriod.js')));
const V=await import(pathToFileURL(path.join(work,'src/validate.js')));
const P=await import(pathToFileURL(path.join(work,'src/prompt.js')));
const B=await import(pathToFileURL(path.join(work,'src/bounds.js')));
const master=20261103,seeds=V.drawSeeds(master,2),[s1,s2]=seeds,version=make(s1).generatorVersion;
const cfg=id=>({name:id,seedDraw:{master,n:2},seeds:[...seeds],repeats:1,attempts:2,conditions:[{id:'a',domain:'laggedRule'},{id:'b',domain:'laggedRule'}],generatorVersions:{laggedRule:version},missingPolicy:'refuse',contrasts:[['a','b']]});
const checked=(id,fn,shouldAccept)=>{let accepted=true,error=null,value;try{value=fn();}catch(e){accepted=false;error=e.message;}emit(id,accepted===shouldAccept,{accepted,error,value});};
write('record-worker.mjs',`import fs from 'node:fs';import path from 'node:path';import{pathToFileURL}from'node:url';
const spec=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const requests=[];let wasmCalls=0;
process.env.LLM_MOCK='0';process.env.ANTHROPIC_MODEL='review-offline';process.env.ANTHROPIC_API_KEY='offline-not-a-key';
for(const name of ['instantiate','instantiateStreaming'])WebAssembly[name]=async()=>{wasmCalls++;throw new Error('No WASM execution permitted in record fixtures');};
process.on('exit',()=>fs.writeFileSync(spec.capture,JSON.stringify({requests,wasmCalls})));
globalThis.fetch=async(url,options)=>{requests.push(JSON.parse(options.body));if(spec.failAll||spec.failAt===requests.length)throw new Error('offline fixture request failure');const answer='<idea>Offline record fixture</idea> No executable submission.';return{ok:true,json:async()=>({content:[{type:'text',text:answer}],usage:{input_tokens:10,output_tokens:10},stop_reason:'end_turn'})};};
if(spec.kind==='run'){const{runAttempts}=await import('./src/run.js');try{const r=await runAttempts(spec.input);console.log(JSON.stringify({reviewResult:{runId:r.runId,logPath:r.logPath,interrupted:r.interrupted,success:r.success}}));}catch(e){console.log(JSON.stringify({reviewError:e.message}));}}
else{const entry=path.resolve('src/'+spec.kind+'.js');process.argv=[process.execPath,entry,...spec.args];await import(pathToFileURL(entry));}
`);
let seq=0;
function worker(kind,props){const id=++seq,spec={kind,capture:path.join(work,`capture-${id}.json`),...props};const file=`spec-${id}.json`;write(file,spec);const r=spawnSync(process.execPath,['record-worker.mjs',file],{cwd:work,encoding:'utf8',timeout:15000,maxBuffer:2e6,env:{...process.env,LLM_MOCK:'0',ANTHROPIC_API_KEY:'offline-not-a-key'}});const capture=fs.existsSync(spec.capture)?JSON.parse(fs.readFileSync(spec.capture,'utf8')):{requests:[],wasmCalls:null};if(capture.wasmCalls!==0)throw new Error('Worker did not confirm zero WASM calls');ev.workerCalls.push({id,kind,requests:capture.requests.length,wasmCalls:capture.wasmCalls});return{r,capture};}
const normal={domain:'laggedRule',seed:s1,attempts:2,memory:'full',opts:{},quiet:true,slot:{batchId:'batch',condition:'a',seed:s1,repeat:0}};
const base=worker('run',{input:{...normal,tag:'v9-base'}});const baseResult=JSON.parse(base.r.stdout.trim().split('\n').at(-1)).reviewResult;const baseLog=readLines(baseResult.logPath);
V.validateRunLog(baseLog);emit('writer/valid-parse-failure-run',baseLog.at(-1).status==='completed'&&base.capture.requests.length===2,{requests:base.capture.requests.length,end:baseLog.at(-1),wasmCalls:base.capture.wasmCalls});
const scaffold='fixture-scaffold.md',scaffoldText='Consider a second representation before your final attempt.';write(scaffold,scaffoldText);
function header(c){return{type:'experiment-meta',schema:4,batchId:'batch',model:'review-offline',config:c,scaffoldHashes:Object.fromEntries(c.conditions.filter(z=>z.scaffold).map(z=>[z.id,hash(fs.readFileSync(path.resolve(work,z.scaffold),'utf8'))]))};}
function row(c,condition,seed,repeat=0){const cond=c.conditions.find(z=>z.id===condition),inst=(cond.domain==='hiddenPeriod'?makePeriod:make)(seed,cond.opts||{}),runId=`fixture-${++seq}`,log=`runs/${runId}.jsonl`;const memory=cond.memory||c.memory||'full';const meta={...clone(baseLog[0]),runId,domain:cond.domain,generatorVersion:inst.generatorVersion,seed,opts:cond.opts||{},secret:inst.secret,n:inst.n,baseline:inst.baselineBitsPerSym,oracle:inst.oracleBitsPerSym,instanceDigest:inst.instanceDigest,worldDigest:inst.worldDigest,attempts:c.attempts,maxAttempts:c.attempts,hint:cond.hint??null,memory,scaffold:cond.scaffold??null,scaffoldHash:cond.scaffold?hash(fs.readFileSync(path.resolve(work,cond.scaffold),'utf8')):null,system:P.SYSTEM_BASE+(cond.scaffold?'\n\n'+fs.readFileSync(path.resolve(work,cond.scaffold),'utf8'):''),slot:{batchId:'batch',condition,seed,repeat}};
 const history=[];for(let i=0;i<c.attempts;i++)history.push({...clone(baseLog[1]),attempt:i+1,messagesSent:P.buildMessages(inst,history,{hint:meta.hint,memory})});
 const end={type:'end',status:'completed',success:null,attemptsUsed:c.attempts,maxAttempts:c.attempts,budgetExhausted:true,reason:null};V.validateRunLog([meta,...history,end]);saveLines(log,[meta,...history,end]);
 return{type:'trial',experiment:c.name,batchId:'batch',condition,domain:cond.domain,generatorVersion:inst.generatorVersion,seed,repeat,secret:inst.secret,opts:cond.opts||{},memory,model:'review-offline',runId,instanceDigest:inst.instanceDigest,worldDigest:inst.worldDigest,log,success:null,attemptsUsed:c.attempts,maxAttempts:c.attempts,budgetExhausted:true,distinctIdeas:1,bestBps:null,tokens:20*c.attempts,seconds:0.01};}
const rows=c=>c.conditions.flatMap(z=>c.seeds.flatMap(s=>Array.from({length:c.repeats},(_,i)=>row(c,z.id,s,i))));
function report(id,c,rs,expected='reject',additional=[],h=header(c)){const f=`runs/experiment-${id}.jsonl`;saveLines(f,[h,...rs,...additional]);const r=spawnSync(process.execPath,['src/report.js',f],{cwd:work,encoding:'utf8',timeout:15000,maxBuffer:1e6});const mf=path.join(work,f.replace('.jsonl','.missing.json')),rf=path.join(work,f.replace('experiment-','report-').replace('.jsonl','.md'));const missing=fs.existsSync(mf)?JSON.parse(fs.readFileSync(mf,'utf8')):null,md=fs.existsSync(rf)?fs.readFileSync(rf,'utf8'):'';const passed=expected==='accept'?r.status===0:expected==='ledger'?r.status===2&&!!missing:r.status===2;emit('report/'+id,passed,{expected,exit:r.status,stderr:r.stderr.trim().slice(0,900),missing,lines:md.split('\n').filter(l=>l.startsWith('Configured:')||l.startsWith('- PRIMARY')||l.startsWith('| a |')||l.includes('Coincident worlds'))});return{r,missing,md};}
function edit(r,fn){const log=readLines(r.log);fn(log);saveLines(r.log,log);}
function syntheticSuccess(r,changes={}){const records=readLines(r.log),m={...records[0],...changes},bits=changes.baseline||changes.n?12000:4000;const result={ok:true,bits,bitsPerSym:bits/m.n,baseline:m.baseline,oracle:m.oracle,ratioToBaseline:bits/m.n/m.baseline,ratioToOracle:bits/m.n/m.oracle};const a={...records[1],result,feedbackText:'Synthetic arithmetic fixture; no submission executed.'},end={type:'end',status:'completed',success:1,attemptsUsed:1,maxAttempts:m.maxAttempts,budgetExhausted:false};V.validateRunLog([m,a,end]);saveLines(r.log,[m,a,end]);return{...r,success:1,attemptsUsed:1,budgetExhausted:false};}
{const c=cfg('valid');report('valid',c,rows(c),'accept');}
// Re-run v8 failures with valid v9 seed manifests, slots and treatment metadata.
for(const[id,changes]of[['v8-log-baseline',{baseline:100}],['v8-log-length',{n:8000}],['v8-log-budget',{attempts:1,maxAttempts:1}]]){const c=cfg(id),rs=rows(c);rs[0]=syntheticSuccess(rs[0],changes);report(id,c,rs);}
{const c=cfg('v8-generator-version'),rs=rows(c);edit(rs[0],l=>l[0].generatorVersion='historical-version');report(c.name,c,rs);}
{const c=cfg('v8-wrong-hint'),rs=rows(c);c.conditions[1].hint='A registered hint.';report(c.name,c,rs);}
{const c=cfg('v8-reused-condition'),rs=rows(c);rs[2]={...rs[0],condition:'b'};rs[3]={...rs[1],condition:'b'};report(c.name,c,rs);}
{const c=cfg('v8-reused-repeat');c.repeats=2;const rs=rows(c);rs[1]={...rs[0],repeat:1};report(c.name,c,rs);}
const failure=(r,extra={})=>({type:'trial-failed',batchId:'batch',condition:r.condition,seed:r.seed,repeat:r.repeat,stage:'interrupted',runId:r.runId,log:r.log,reason:'offline fixture request failure',...extra});
{const c=cfg('v8-completed-as-interrupted'),rs=rows(c);c.missingPolicy='exploratory';report(c.name,c,rs.slice(1),'reject',[failure(rs[0])]);}
function experiment(id,mut={},transport={}){const c={...cfg(id),seedDraw:{master,n:1},seeds:[s1],conditions:[{id:'a',domain:'laggedRule'}],contrasts:[],...mut};write(`config-${id}.json`,c);const x=worker('experiment',{args:[`config-${id}.json`],...transport});const file=`runs/experiment-${id}.jsonl`,entries=fs.existsSync(path.join(work,file))?readLines(file):[];return{...x,c,file,entries};}
{const x=experiment('v8-missing-scaffold',{conditions:[{id:'a',domain:'laggedRule'},{id:'b',domain:'laggedRule',scaffold:'absent-fixture.md'}]});emit('experiment/v8-missing-scaffold',x.capture.requests.length===0&&x.entries.length===0,{requests:x.capture.requests.length,records:x.entries.length,exit:x.r.status,stderr:x.r.stderr.trim()});}
checked('options/v8-k-without-n',()=>make(s1,{k:3000}),false);
checked('options/v8-k-explicit-n',()=>make(s1,{k:3000,n:4000}),false);
checked('options/L-without-n',()=>makePeriod(s1,{L:5000}),false);
{const x=experiment('v8-duplicate-seeds',{seeds:[s1,s1],seedDraw:{master,n:2}});emit('experiment/v8-duplicate-seeds',x.r.status!==0&&x.capture.requests.length===0&&x.entries.length===0,{exit:x.r.status,requests:x.capture.requests.length,stderr:x.r.stderr.trim()});}
// Additional ordinary metadata inconsistencies, with passing treatment controls.
for(const mode of ['hint','scaffold','summary','last-code']){const c=cfg('positive-'+mode);if(mode==='hint')c.conditions[0].hint='A registered hint.';else if(mode==='scaffold')c.conditions[0].scaffold=scaffold;else c.conditions[0].memory=mode;report(c.name,c,rows(c),'accept');}
for(const[field,value]of[['batchId','different-batch'],['condition','b'],['seed',s2],['repeat',1]]){const c=cfg('wrong-slot-'+field),rs=rows(c);edit(rs[0],l=>l[0].slot[field]=value);report(c.name,c,rs);}
for(const[field,value]of[['model','different-model'],['memory','summary'],['opts',{k:13}],['oracle',999]]){const c=cfg('wrong-meta-'+field),rs=rows(c);edit(rs[0],l=>l[0][field]=value);report(c.name,c,rs);}
{const c=cfg('wrong-scaffold-hash');c.conditions[0].scaffold=scaffold;const rs=rows(c);edit(rs[0],l=>l[0].scaffoldHash='a'.repeat(64));report(c.name,c,rs);}
{const c=cfg('wrong-scaffold-path');c.conditions[0].scaffold=scaffold;const rs=rows(c);edit(rs[0],l=>l[0].scaffold='different-path.md');report(c.name,c,rs);}
// These discrepancies concern archived request content, not false labels alone. No real treatment is run.
{const c=cfg('payload-hint-absent');c.conditions[0].hint='A registered hint.';const rs=rows(c);edit(rs[0],l=>{const i=make(s1);for(let j=1;j<l.length-1;j++)l[j].messagesSent=P.buildMessages(i,l.slice(1,j),{hint:null,memory:'full'});});report(c.name,c,rs);}
{const c=cfg('payload-scaffold-absent');c.conditions[0].scaffold=scaffold;const rs=rows(c);edit(rs[0],l=>l[0].system=P.SYSTEM_BASE);report(c.name,c,rs);}
{const c=cfg('payload-memory-wrong');c.conditions[0].memory='summary';const rs=rows(c);edit(rs[0],l=>{const i=make(s1);for(let j=1;j<l.length-1;j++)l[j].messagesSent=P.buildMessages(i,l.slice(1,j),{hint:null,memory:'full'});});report(c.name,c,rs);}
{const c=cfg('payload-feedback-wrong'),rs=rows(c);edit(rs[0],l=>l[1].feedbackText='A different archived feedback message.');report(c.name,c,rs);}
{const c=cfg('row-tokens-unbound'),rs=rows(c);rs[0].tokens=1000000000;report(c.name,c,rs);}
// Writer interruption and retry accounting: ordinary offline error, no solver code.
const xi=experiment('interrupted-writer',{}, {failAt:2});emit('retry/writer-stops-without-two-restarts',xi.capture.requests.length===4&&xi.entries.some(z=>z.type==='trial'),{expected:'One interrupted run followed by one fresh completed restart (the transport fails only once)',requests:xi.capture.requests.length,records:xi.entries.map(z=>({type:z.type,stage:z.stage,runId:z.runId})),stderr:xi.r.stderr.trim()});
{const r=spawnSync(process.execPath,['src/report.js',xi.file],{cwd:work,encoding:'utf8',timeout:15000});emit('retry/incomplete-confirmatory-ledger',r.status===2&&fs.existsSync(path.join(work,xi.file.replace('.jsonl','.missing.json'))),{exit:r.status,stderr:r.stderr.trim()});}
{const c=cfg('valid-interrupted'),rs=rows(c);edit(rs[0],l=>{l.splice(2,1);l[2]={type:'end',status:'interrupted',success:null,attemptsUsed:1,maxAttempts:2,budgetExhausted:false,reason:'offline fixture request failure'};});c.missingPolicy='exploratory';report(c.name,c,rs.slice(1),'accept',[failure(rs[0])]);}
{const c=cfg('interrupted-wrong-slot'),rs=rows(c);edit(rs[0],l=>{l.splice(2,1);l[0].slot.condition='b';l[2]={type:'end',status:'interrupted',success:null,attemptsUsed:1,maxAttempts:2,budgetExhausted:false,reason:'offline fixture request failure'};});c.missingPolicy='exploratory';report(c.name,c,rs.slice(1),'reject',[failure(rs[0])]);}
{const c=cfg('retry-chain-unrepresentable'),rs=rows(c),prior=row(c,'a',s1);edit(prior,l=>{l.splice(2,1);l[2]={type:'end',status:'interrupted',success:null,attemptsUsed:1,maxAttempts:2,budgetExhausted:false,reason:'offline fixture request failure'};});report(c.name,c,rs,'reject',[failure(prior)]);}
// Registered draw checks, small valid finite-support collision example.
checked('sampling/recomputed-list',()=>V.validateConfig(cfg('draw-valid'),{laggedRule:version}),true);
{const c=cfg('handpicked');delete c.seedDraw;checked('sampling/handpicked-refused',()=>V.validateConfig(c,{laggedRule:version}),false);}
{const c=cfg('changed-list');c.seeds[0]=1;checked('sampling/changed-list-refused',()=>V.validateConfig(c,{laggedRule:version}),false);}
const draw40=V.drawSeeds(master,40),draw41=V.drawSeeds(master,41),adjacent=V.drawSeeds(master+1,40);emit('sampling/adjacent-masters',null,{draw40,adjacent,overlap:draw40.filter(s=>adjacent.includes(s)).length,isShiftedWindow:JSON.stringify(adjacent)===JSON.stringify(draw41.slice(1)),log2NumberOf40Subsets:Array.from({length:40},(_,i)=>Math.log2(2**32-i)-Math.log2(i+1)).reduce((a,b)=>a+b,0),maximumInternalStateBits:64});
{const c=cfg('coincident-worlds');c.seedDraw.n=4;c.seeds=V.drawSeeds(master,4);c.conditions=[{id:'a',domain:'hiddenPeriod',opts:{A:2,p:1,L:1,n:100}}];c.generatorVersions={hiddenPeriod:makePeriod(s1).generatorVersion};c.contrasts=[];report(c.name,c,rows(c),'accept');}
// Independent binomial-CDF calculation, used only on finite numerical examples.
function cdf(n,k,p){let term=(1-p)**n,total=term;for(let i=1;i<=k;i++){term*=((n-i+1)/i)*(p/(1-p));total+=term;}return total;}
function upper(n,k,alpha=.05){if(k>=n)return 1;let lo=0,hi=1;for(let i=0;i<100;i++){const p=(lo+hi)/2;if(cdf(n,k,p)>alpha)lo=p;else hi=p;}return(hi+lo)/2;}
for(const[n,s,u]of[[100,0,10],[100,0,0],[100,5,10],[100,0,100],[1,0,0],[59,0,0],[32,0,0],[40,0,0]]){const actual=B.nullBounds({n,successes:s,unresolved:u}),expected=upper(n,s+u);emit(`bounds/n${n}-s${s}-u${u}`,Math.abs(actual.conservative-expected)<1e-12,{actual,independentConservative:expected,independentResolvedOnly:s===0&&n>u?1-.05**(1/(n-u)):null});}
// A finite-population example: the zero-count inequality alone does not establish
// conservatism of the binomial upper bound at EVERY nonzero count under SRSWOR.
{const M=79,K=77,n=2,p=K/M,binomialUpper=B.upperBound(n,1),noncoverage=1-(K/M)*((K-1)/(M-1));emit('bounds/nonzero-without-replacement-counterexample',null,{M,K,n,p,binomialUpperAtOne:binomialUpper,noncoverage,exceedsFivePercent:noncoverage>.05&&p>binomialUpper});}
for(const input of [{n:100,successes:-1,unresolved:0},{n:100,successes:0,unresolved:101},{n:100.5,successes:0,unresolved:0},{n:100,successes:0,unresolved:0,alpha:2}])checked('bounds/invalid-'+JSON.stringify(input),()=>B.nullBounds(input),false);
emit('bounds/cdf-endpoints',B.binomCdf(10,0,0)===1&&B.binomCdf(10,10,1)===1,{cdfZero:String(B.binomCdf(10,0,0)),cdfAllAtOne:String(B.binomCdf(10,10,1))});
// Pure host recurrence/hash only: never import or run selftest.js.
{let a=0x9E3779B9|0,b=0x7F4A7C15|0,c=0xF39CC060|0,d=0x5CEDC834|0,vector='';for(let i=0;i<16;i++){let t=d;t^=t<<11;t^=t>>>8;d=c;c=b;b=a;t^=a;t^=a>>>19;a=t;vector+=(t>>>0).toString(2).padStart(32,'0');}const text=fs.readFileSync(path.join(work,'src/selftest.js'),'utf8'),pin=text.match(/const EXPECTED_RNG_SHA256 = '([0-9a-f]{64})'/)?.[1];emit('rng/source-pin-host-hash',pin===hash(vector),{pin,computed:hash(vector),runtimeSandboxTested:false});}
const changed=Object.entries(ev.sourceHashes).filter(([f,h])=>hash(fs.readFileSync(path.join(root,f)))!==h).map(([f])=>f);emit('safety/source-unchanged',changed.length===0,{changed});emit('safety/all-workers-no-wasm',ev.workerCalls.every(x=>x.wasmCalls===0),{workerCalls:ev.workerCalls.length,totalOfflineRequests:ev.workerCalls.reduce((s,x)=>s+x.requests,0),liveRequests:0});
console.log('Saved '+dest);
