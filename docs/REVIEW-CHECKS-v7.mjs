// Usage: node REVIEW-CHECKS-v7.mjs <repo> <evidence.json>
// Ordinary record fixtures only. No sandbox/selftest calls, executable submissions, or live API calls.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(process.argv[2]), dest=path.resolve(process.argv[3]);
const work=fs.mkdtempSync(path.join(path.dirname(dest),'v7-records-'));
for(const d of ['src','node_modules'])fs.cpSync(path.join(root,d),path.join(work,d),{recursive:true});
for(const f of ['package.json','package-lock.json'])fs.copyFileSync(path.join(root,f),path.join(work,f));
fs.mkdirSync(path.join(work,'runs'));
const hash=x=>createHash('sha256').update(x).digest('hex');
const ev={node:process.version,root,work,scope:'Source inspection and ordinary offline record fixtures; no sandbox execution.',sourceHashes:{},cases:[]};
for(const f of ['docs/PLAN.md','docs/REVIEW-PROMPT-v7.md','package.json','package-lock.json',...fs.readdirSync(path.join(root,'src'),{recursive:true}).filter(f=>fs.statSync(path.join(root,'src',f)).isFile()).map(f=>'src/'+f.replaceAll('\\','/'))])ev.sourceHashes[f]=hash(fs.readFileSync(path.join(root,f)));
const write=(f,v)=>fs.writeFileSync(path.join(work,f),typeof v==='string'?v:JSON.stringify(v,null,2));
const emit=(id,pass,details={})=>{ev.cases.push({id,pass,...details});fs.writeFileSync(dest,JSON.stringify(ev,null,2)+'\n');console.log(JSON.stringify(ev.cases.at(-1)));};
const readLines=f=>fs.readFileSync(f,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const {make}=await import(pathToFileURL(path.join(work,'src/domains/laggedRule.js')));
const {make:makePeriod}=await import(pathToFileURL(path.join(work,'src/domains/hiddenPeriod.js')));
const V=await import(pathToFileURL(path.join(work,'src/validate.js')));
const version=make(1).generatorVersion;
const normal={domain:'laggedRule',seed:1,attempts:2,memory:'full',opts:{},quiet:true};
const clone=x=>structuredClone(x);
const checked=(id,f,shouldAccept)=>{let accepted=true,error=null;try{f();}catch(e){accepted=false;error=e.message;}emit(id,accepted===shouldAccept,{accepted,error});};

// Worker stubs the entire transport. All attempt responses lack a code block, so evaluate is never called.
write('record-worker.mjs',`import fs from 'node:fs';import path from 'node:path';import{pathToFileURL}from'node:url';
const spec=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const requests=[];let wasmCalls=0;
process.env.LLM_MOCK='0';process.env.ANTHROPIC_MODEL='review-offline';process.env.ANTHROPIC_API_KEY='offline-not-a-key';
for(const name of ['instantiate','instantiateStreaming'])WebAssembly[name]=async()=>{wasmCalls++;throw new Error('No WASM execution permitted in record fixtures');};
process.on('exit',()=>fs.writeFileSync(spec.capture,JSON.stringify({requests,wasmCalls})));
globalThis.fetch=async(url,options)=>{requests.push(JSON.parse(options.body));if(spec.failAll||spec.failAt===requests.length)throw new Error('offline fixture request failure');let answer=spec.kind==='postmortem'?(requests.length===1?spec.why:JSON.stringify(spec.judge)):'<idea>Offline record fixture</idea> No executable submission.';if(answer.includes('<code>'))throw new Error('Executable response prohibited');return{ok:true,json:async()=>({content:[{type:'text',text:answer}],usage:{input_tokens:10,output_tokens:10},stop_reason:'end_turn'})};};
if(spec.kind==='run'){const{runAttempts}=await import('./src/run.js');try{const r=await runAttempts(spec.input);console.log(JSON.stringify({reviewResult:{runId:r.runId,logPath:r.logPath,interrupted:r.interrupted,success:r.success}}));}catch(e){console.log(JSON.stringify({reviewError:e.message}));}}
else{const entry=path.resolve('src/'+spec.kind+'.js');process.argv=[process.execPath,entry,...spec.args];await import(pathToFileURL(entry));}
`);
let seq=0;
function worker(kind,props){const id=++seq,spec={kind,capture:path.join(work,`capture-${id}.json`),...props};const file=`spec-${id}.json`;write(file,spec);const r=spawnSync(process.execPath,['record-worker.mjs',file],{cwd:work,encoding:'utf8',timeout:15000,maxBuffer:2e6,env:{...process.env,LLM_MOCK:'0',ANTHROPIC_API_KEY:'offline-not-a-key'}});const capture=fs.existsSync(spec.capture)?JSON.parse(fs.readFileSync(spec.capture,'utf8')):{requests:[],wasmCalls:null};if(capture.wasmCalls)throw new Error('Fixture attempted WASM execution');return{r,capture};}
function runFixture(id,changes,expectValid,extra={}){const x=worker('run',{input:{...normal,...changes,tag:id},...extra});let obj;try{obj=JSON.parse(x.r.stdout.trim().split('\n').at(-1));}catch{}const log=obj?.reviewResult?readLines(path.join(work,obj.reviewResult.logPath)):null;let valid=null;if(log){try{V.validateRunLog(log);valid=true;}catch{valid=false;}}emit('writer/'+id,expectValid?valid===true:!!obj?.reviewError&&x.capture.requests.length===0,{exit:x.r.status,requests:x.capture.requests.length,wasmCalls:x.capture.wasmCalls,error:obj?.reviewError,recordTypes:log?.map(z=>z.type),metaSeed:log?.[0].seed,end:log?.at(-1)});return{...x,obj,log};}
for(const [id,changes]of[['budget-zero',{attempts:0}],['budget-fraction',{attempts:1.5}],['budget-text',{attempts:'bad'}],['budget-over-max',{attempts:1001}],['seed-null',{seed:null}],['seed-bool',{seed:true}],['seed-over-domain',{seed:4294967297}],['memory-invalid',{memory:'invalid'}]])runFixture(id,changes,false);
const numeric=runFixture('numeric-cli-input',{seed:'1',attempts:'2'},true);
const interrupted=runFixture('interrupted-before-first',{},true,{failAll:true});
const interruptedLater=runFixture('interrupted-after-first',{},true,{failAt:2});

const baseLog=clone(numeric.log), baseMeta=baseLog[0];
for(const value of ['1',true,null])checked('schema/stored-seed-'+String(value),()=>V.validateRunLog([{...baseMeta,seed:value},...baseLog.slice(1)]),false);
checked('schema/result-missing-scores',()=>V.validateResult({ok:true},'fixture'),false);
checked('schema/message-missing-content',()=>V.validateMessages([{role:'user'}],'fixture'),false);
checked('schema/message-wrong-first-role',()=>V.validateMessages([{role:'assistant',content:'x'}],'fixture'),false);
const score={ok:true,bits:12000,bitsPerSym:3,baseline:3,oracle:1,ratioToBaseline:0,ratioToOracle:3};
checked('schema/inconsistent-score-ratio',()=>V.validateResult(score,'fixture'),false);
const goodScore={ok:true,bits:4000,bitsPerSym:1,baseline:3,oracle:1,ratioToBaseline:1/3,ratioToOracle:1};
const winner={...baseLog[1],result:goodScore,feedbackText:'1.000 bits/symbol (33% of fixed-length)'};
checked('schema/success-beyond-budget',()=>V.validateRunLog([{...baseMeta,attempts:1,maxAttempts:1},baseLog[1],{...winner,attempt:2},{type:'end',status:'completed',success:2,attemptsUsed:2,maxAttempts:1,budgetExhausted:false}]),false);
checked('schema/interrupted-after-success',()=>V.validateRunLog([{...baseMeta,attempts:1,maxAttempts:1},winner,{type:'end',status:'interrupted',success:1,attemptsUsed:1,maxAttempts:1,budgetExhausted:false,reason:'fixture'}]),false);
checked('schema/interrupted-after-budget',()=>V.validateRunLog([...baseLog.slice(0,-1),{...baseLog.at(-1),status:'interrupted',budgetExhausted:false,reason:'fixture'}]),false);
checked('schema/reader-budget-over-writer-max',()=>V.validateMeta({...baseMeta,attempts:1001,maxAttempts:1001}),false);
checked('options/invalid-domain-values',()=>V.normalizeRunInput({...normal,opts:{A:1,p:2,n:-1,k:0}}),false); // normalization only; never generates this input
checked('options/unknown-key',()=>V.normalizeRunInput({...normal,opts:{unknown:1}}),false);

const cfg=id=>({name:id,seeds:[1,2],repeats:1,attempts:2,conditions:[{id:'a',domain:'laggedRule'},{id:'b',domain:'laggedRule'}],generatorVersions:{laggedRule:version},missingPolicy:'refuse',contrasts:[['a','b']]});
const row=(condition,seed,extras={})=>{const inst=make(seed,extras.opts||{});return{type:'trial',experiment:'fixture',batchId:'batch',condition,domain:'laggedRule',generatorVersion:version,seed,repeat:0,secret:inst.secret,opts:{},memory:'full',model:'review-offline',runId:`fixture-${condition}-${seed}-${extras.repeat??0}`,instanceDigest:inst.instanceDigest,worldDigest:inst.worldDigest,log:numeric.obj.reviewResult.logPath,success:null,attemptsUsed:2,maxAttempts:2,budgetExhausted:true,distinctIdeas:1,bestBps:null,tokens:40,seconds:0.01,...extras};};
const rows=()=>[row('a',1),row('a',2),row('b',1),row('b',2)];
function report(id,c,rs,expected='reject',additional=[]){const f=`runs/experiment-${id}.jsonl`;write(f,[{type:'experiment-meta',schema:4,batchId:'batch',model:'review-offline',config:c},...rs,...additional].map(JSON.stringify).join('\n')+'\n');const r=spawnSync(process.execPath,['src/report.js',f],{cwd:work,encoding:'utf8',timeout:15000,maxBuffer:1e6});const mf=path.join(work,f.replace('.jsonl','.missing.json'));const missing=fs.existsSync(mf)?JSON.parse(fs.readFileSync(mf,'utf8')):null;const rf=path.join(work,f.replace('experiment-','report-').replace('.jsonl','.md'));const md=fs.existsSync(rf)?fs.readFileSync(rf,'utf8'):'';const pass=expected==='accept'?r.status===0:expected==='ledger'?r.status===2&&!!missing:r.status===2;emit('report/'+id,pass,{exit:r.status,stderr:r.stderr.slice(0,600),missing,lines:md.split('\n').filter(l=>l.startsWith('Configured:')||l.startsWith('- PRIMARY')||l.startsWith('| a |'))});return{r,missing,md};}
report('valid',cfg('valid'),rows(),'accept');
for(const f of ['instanceDigest','worldDigest']){const rs=rows();rs[0][f]='a'.repeat(64);report('arbitrary-'+f,cfg('bad-'+f),rs);}
{const c=cfg('repeats');c.repeats=2;const rs=rows().flatMap(r=>[r,{...r,repeat:1,runId:r.runId+'-r1'}]);rs[1].worldDigest='b'.repeat(64);report('inconsistent-repeat-digest',c,rs);}
{const rs=rows();rs[2].worldDigest=make(2).worldDigest;report('paired-different-digest',cfg('pair'),rs);}
{const a=make(1),b=make(1,{A:8,p:0.85,n:4000});emit('identity/default-canonicalization',a.worldDigest===b.worldDigest&&a.instanceDigest!==b.instanceDigest,{sameSemantic:a.worldDigest===b.worldDigest,sameProvenance:a.instanceDigest===b.instanceDigest});}
// Small, valid support provides genuine collisions, without changing generator source.
{const opts={A:2,p:1,L:1,n:1};const seen=new Map();let pair;for(let s=1;s<=8;s++){const i=makePeriod(s,opts);if(seen.has(i.worldDigest)){pair=[seen.get(i.worldDigest),i];break;}seen.set(i.worldDigest,i);}if(!pair)throw new Error('Expected two-state toy collision');const [a,b]=pair;emit('identity/same-content-distinct-seeds',a.worldDigest===b.worldDigest&&a.instanceDigest!==b.instanceDigest,{seeds:[a.seed,b.seed],opts,secret:a.secret,sample:a.sample,test:a.test,worldDigest:a.worldDigest});const c={...cfg('collision'),seeds:[a.seed,b.seed],conditions:[{id:'a',domain:'hiddenPeriod',opts}],generatorVersions:{hiddenPeriod:a.generatorVersion},contrasts:[]};const rs=pair.map(i=>({...row('a',i.seed),domain:'hiddenPeriod',opts,secret:i.secret,generatorVersion:i.generatorVersion,worldDigest:i.worldDigest,instanceDigest:i.instanceDigest}));report('actual-toy-world-collision',c,rs);}
// Reader can accept a summary whose supplied run log has two failed attempts.
{const rs=rows();rs[0]={...rs[0],runId:baseMeta.runId,success:1,attemptsUsed:1,budgetExhausted:false};report('summary-contradicts-linked-run',cfg('linked'),rs);}
{const rs=rows();rs[0].secret={k:999};report('secret-contradicts-regenerated-world',cfg('secret'),rs);}
const failrow={type:'trial-failed',batchId:'batch',condition:'a',seed:1,repeat:0,reason:'offline fixture request failure'};
{const c=cfg('failed');c.missingPolicy='exploratory';report('valid-interruption-exploratory',c,rows().slice(1),'accept',[failrow]);}
report('valid-interruption-default-ledger',cfg('failed-refuse'),rows().slice(1),'ledger',[failrow]);
{const c=cfg('forged-failed');c.missingPolicy='exploratory';report('foreign-batch-failure',c,rows().slice(1),'reject',[{...failrow,batchId:'other-batch'}]);}
report('completed-plus-failed-same-slot',cfg('conflict'),rows(),'reject',[failrow]);
{const c=cfg('duplicate-failure');c.missingPolicy='exploratory';report('duplicate-failed-slot',c,rows().slice(1),'reject',[failrow,{...failrow,reason:'second reason'}]);}

function experiment(id,mutate={},transport={}){const c={...cfg(id),conditions:[{id:'a',domain:'laggedRule'}],seeds:[1],contrasts:[],...mutate};write(`config-${id}.json`,c);const x=worker('experiment',{args:[`config-${id}.json`],...transport});const file=`runs/experiment-${id}.jsonl`;const entries=fs.existsSync(path.join(work,file))?readLines(path.join(work,file)):[];let read=null;if(entries.length){const rr=spawnSync(process.execPath,['src/report.js',file],{cwd:work,encoding:'utf8',timeout:15000,maxBuffer:1e6});read={exit:rr.status,stderr:rr.stderr.slice(0,400)};}return{...x,entries,read};}
for(const [id,mut]of[['unpinned-version',{generatorVersions:undefined}],['wrong-version',{generatorVersions:{laggedRule:'wrong'}}],['invalid-missing-policy',{missingPolicy:'typo'}],['invalid-coupling',{contrasts:[{a:'a',b:'a',sharedWorld:'false'}]}]]){const x=experiment(id,mut);emit('experiment/'+id,x.capture.requests.length===0&&x.r.status!==0,{writerExit:x.r.status,requests:x.capture.requests.length,records:x.entries.map(r=>r.type),reader:x.read});}
{const x=experiment('late-invalid-memory',{conditions:[{id:'a',domain:'laggedRule'},{id:'b',domain:'laggedRule',memory:'invalid'}]});emit('experiment/preflight-all-conditions',x.capture.requests.length===0,{requests:x.capture.requests.length,records:x.entries.map(r=>({type:r.type,condition:r.condition,reason:r.reason})),reader:x.read});}
{const x=experiment('request-interruption',{missingPolicy:'exploratory'},{failAll:true});const mfile=path.join(work,'runs/experiment-request-interruption.missing.json');const missing=fs.existsSync(mfile)?JSON.parse(fs.readFileSync(mfile,'utf8')):null;emit('experiment/request-interruption',x.r.status===0&&x.entries[1]?.type==='trial-failed'&&missing?.missing[0]?.reason?.includes('offline fixture'),{requests:x.capture.requests.length,records:x.entries,reader:x.read,missing});}

// Judge fixtures check instruction delivery and output handling, not actual model compliance.
function post(id,log,why,judge){const file=`runs/pm-${id}.jsonl`;write(file,log.map(JSON.stringify).join('\n')+'\n');const x=worker('postmortem',{args:['--log',file,'--judge-model','review-judge'],why,judge});let saved=null;const output=path.join(work,'runs/postmortems.jsonl');if(x.r.status===0&&fs.existsSync(output))saved=readLines(output).at(-1);return{...x,saved};}
{const x=post('interrupted',interrupted.log,'x',{});emit('postmortem/refuse-interrupted',x.r.status===2&&x.capture.requests.length===0,{exit:x.r.status,requests:x.capture.requests.length,stderr:x.r.stderr.slice(0,300)});}
const claim='The task prompt told me to test lag thirteen.';const scoped=clone(baseLog);scoped[1].raw=claim;
for(const assessment of ['unverifiable','supported']){const judge={claim,assessment,evidenceAttempt:assessment==='unverifiable'?null:1,evidence:assessment==='unverifiable'?'':claim,categories:['unknown']};const x=post('scope-'+assessment,scoped,claim,judge);const text=JSON.stringify(x.capture.requests[1]||{});const instruction=text.includes('must be rated')&&text.includes('unverifiable')&&text.includes('even if an attempt happens to repeat it');emit('postmortem/scope-'+assessment,assessment==='unverifiable'?instruction&&x.saved?.assessment==='unverifiable':null,{kind:assessment==='supported'?'semantic-enforcement-boundary':'instruction-delivery',exit:x.r.status,scopeInstructionReceived:instruction,assessment:x.saved?.assessment,validationProblems:x.saved?.validationProblems});}
// Hints consumer must preserve interruption, not count it as a completed failed solve.
write('one-hint.json',[{text:'Think carefully.',category:'content-free'}]);
{const x=worker('hints',{args:['--domain','laggedRule','--seed','1','--attempts','1','--repeats','1','--ladder','one-hint.json'],failAll:true});const out=readLines(path.join(work,'runs/hint-effects.jsonl')).at(-1);emit('hints/interrupted-not-completed',out.summary.every(s=>s.completed===0&&s.failed===1&&s.n===0),{exit:x.r.status,requests:x.capture.requests.length,summary:out.summary,results:out.results});}
console.log('Saved '+dest);
