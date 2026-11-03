// Offline review probes. Usage: node REVIEW-CHECKS-v3.mjs <repo-root> [results.json]
// Copies only source/test assets to a new working directory beside the results; never copies .env.
// No network calls: hints use the mock backend; post-mortems use a local fetch stub.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root=path.resolve(process.argv[2]);
const destination=path.resolve(process.argv[3]||'review-evidence-v3.json');
const work=fs.mkdtempSync(path.join(path.dirname(destination),'v3-probes-'));
for(const dir of ['src','hints','scaffolds','baselines'])fs.cpSync(path.join(root,dir),path.join(work,dir),{recursive:true});
fs.copyFileSync(path.join(root,'package.json'),path.join(work,'package.json'));
fs.mkdirSync(path.join(work,'runs'));
const evidence={node:process.version,platform:process.platform,work,sourceHashes:{},cases:[]};
for(const file of ['docs/PLAN.md','src/sandbox.js','src/report.js','src/hints.js','src/postmortem.js','src/llm.js','src/prompt.js'])evidence.sourceHashes[file]=createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const emit=(id,pass,details)=>{const item={id,pass,...details};evidence.cases.push(item);console.log(JSON.stringify(item));};
const run=(args,more={})=>spawnSync(process.execPath,args,{cwd:work,encoding:'utf8',timeout:12000,maxBuffer:2e6,env:{...process.env,LLM_MOCK:'1',ANTHROPIC_API_KEY:'offline-review-not-a-key'},...more});
const write=(file,data)=>fs.writeFileSync(path.join(work,file),typeof data==='string'?data:JSON.stringify(data));

write('sandbox-probe.mjs',`import {evaluate,isSuccess} from './src/sandbox.js';
import {make} from './src/domains/laggedRule.js';
const code=JSON.parse(process.argv[2]);
try { const result=evaluate(code,make(1),{timeoutMs:200});console.log(JSON.stringify({result,success:isSuccess(result)})); }
catch(e){console.log(JSON.stringify({uncaught:String(e?.message||e)}));}
`);
const sandboxCases={
 'original-stash':`var stash;function encode(s){stash=s.slice();return '';}function decode(){return stash||[];}`,
 'shared-Math':`function encode(s){Math.__reviewStash=s.slice();return '';}function decode(){return Math.__reviewStash;}`,
 'throwing-decoder-proxy':`function encode(){return '';}function decode(){return new Proxy([],{get(t,p){if(p==='length')throw new Error('probe');return t[p];}});}`,
 'looping-decoder-proxy':`function encode(){return '';}function decode(){return new Proxy([],{get(t,p){if(p==='length')for(;;){};return t[p];}});}`,
 'console-host-channel':`const host=console.log.constructor('return globalThis')();function encode(s){host.__v3Review=s.slice();return '';}function decode(){const s=host.__v3Review;delete host.__v3Review;return s;}`,
 'context-constructor-channel':`const host=globalThis.constructor.constructor('return globalThis')();function encode(s){host.__v3Review=s.slice();return '';}function decode(){const s=host.__v3Review;delete host.__v3Review;return s;}`,
 'thrown-message-getter':`function encode(){throw Object.defineProperty({},'message',{get(){for(;;){}}});}function decode(){return [];}`,
 'replaced-JSON-serializer':`JSON.stringify=()=>({toString(){for(;;){}}});function encode(){return '';}function decode(){return [];}`,
 'promise-timeout':`function encode(){Promise.resolve().then(()=>{for(;;){}});return '';}function decode(){return [];}`
};
for(const [name,code] of Object.entries(sandboxCases)){
 const r=run(['sandbox-probe.mjs',JSON.stringify(code)],{timeout:2500});
 let parsed;try{parsed=JSON.parse(r.stdout.trim().split('\n').at(-1));}catch{}
 emit('sandbox/'+name,!r.error&&r.status===0&&parsed?.result?.ok===false,{exit:r.status,supervisorTimeout:r.error?.code==='ETIMEDOUT',observed:parsed||null,stderr:r.stderr.slice(0,200)});
}

const baseConfig=(name)=>({name,seeds:[1,2],repeats:1,attempts:3,conditions:[{id:'a',domain:'laggedRule'},{id:'b',domain:'laggedRule'}],contrasts:[['a','b']]});
const trial=(condition,seed,success=null,extra={})=>({type:'trial',condition,seed,repeat:0,success,domain:'laggedRule',opts:{},tokens:1,attemptsUsed:3,maxAttempts:3,secret:{k:13},...extra});
function reportCase(id,cfg,rows,check,extraMeta=[]){
 const file='runs/experiment-'+id+'.jsonl';
 write(file,[{type:'experiment-meta',config:cfg},...extraMeta,...rows].map(x=>JSON.stringify(x)).join('\n')+'\n');
 const r=run(['src/report.js',file]);
 const outPath=path.join(work,file.replace('experiment-','report-').replace('.jsonl','.md'));
 const report=fs.existsSync(outPath)?fs.readFileSync(outPath,'utf8'):'';
 emit('report/'+id,check(r,report),{exit:r.status,stderr:r.stderr.trim().slice(0,500),lines:report.split('\n').filter(x=>x.startsWith('- PRIMARY')||x.startsWith('- secondary')||x.startsWith('- b')||x.startsWith('| a |')||x.includes('DEGENERATE')||x.startsWith('File:'))});
}
reportCase('paired-known',baseConfig('paired-known'),[trial('a',1),trial('a',2),trial('b',1,1),trial('b',2)],(r,s)=>r.status===0&&s.includes('50 pp'));
reportCase('mixed-batches',baseConfig('mixed-batches'),[],r=>r.status===2,[{type:'experiment-meta',config:baseConfig('second')}]);
reportCase('duplicate-trial',baseConfig('duplicate-trial'),[trial('a',1),trial('a',1)],r=>r.status===2);
const cross=baseConfig('config-cross-domain');cross.conditions[1].domain='hiddenPeriod';
reportCase('config-cross-domain',cross,[trial('a',1),trial('b',1,1,{domain:'hiddenPeriod'})],(r,s)=>s.includes('REFUSED, different domains'));
reportCase('row-domain-mismatch',baseConfig('row-domain-mismatch'),[trial('a',1),trial('a',2),trial('b',1,1,{domain:'hiddenPeriod'}),trial('b',2,1,{domain:'hiddenPeriod'})],(r,s)=>r.status!==0||s.includes('REFUSED'));
reportCase('row-options-mismatch',baseConfig('row-options-mismatch'),[trial('a',1),trial('a',2),trial('b',1,1,{opts:{k:40}}),trial('b',2,1,{opts:{k:40}})],(r,s)=>r.status!==0||s.includes('REFUSED'));
reportCase('generator-version-mismatch',baseConfig('generator-version-mismatch'),[trial('a',1,null,{generatorVersion:'v1'}),trial('a',2,null,{generatorVersion:'v1'}),trial('b',1,1,{generatorVersion:'v2'}),trial('b',2,1,{generatorVersion:'v2'})],(r,s)=>r.status!==0||s.includes('REFUSED'));
const optsCfg=baseConfig('undeclared-options-pairing');optsCfg.conditions[1].opts={k:40};
reportCase('undeclared-options-pairing',optsCfg,[trial('a',1),trial('a',2),trial('b',1,1,{opts:{k:40}}),trial('b',2,1,{opts:{k:40}})],(r,s)=>r.status!==0||s.includes('REFUSED'));
reportCase('zero-differences',baseConfig('zero-differences'),[trial('a',1),trial('a',2),trial('b',1),trial('b',2)],(r,s)=>s.includes('DEGENERATE'));
reportCase('constant-nonzero-differences',baseConfig('constant-nonzero-differences'),[trial('a',1),trial('a',2),trial('b',1,1),trial('b',2,1)],(r,s)=>!s.includes('no discordant worlds observed'));
const unequal=baseConfig('unequal-repeats');unequal.repeats=2;
reportCase('unequal-repeats',unequal,[trial('a',1,1),trial('a',1,1,{repeat:1}),trial('a',2),trial('b',1),trial('b',1,null,{repeat:1}),trial('b',2)],(r,s)=>s.split('\n').find(x=>x.startsWith('| a |'))?.includes('| 50% / 50% |'));
reportCase('both-arms-missing-world',baseConfig('both-arms-missing-world'),[trial('a',1),trial('b',1)],(r,s)=>r.status!==0||s.includes('laggedRule|2|'));
const repeatsCfg=baseConfig('invalid-repeat-indices');repeatsCfg.repeats=2;
reportCase('invalid-repeat-indices',repeatsCfg,[trial('a',1,1,{repeat:10}),trial('a',1,1,{repeat:11}),trial('b',1,null,{repeat:10}),trial('b',1,null,{repeat:11})],r=>r.status!==0);

write('hints/audit.json',[{text:'Look farther back.',category:'strategy'},{text:'Check a different idea.',category:'content-free'}]);
function hintRun(id,args){
 const before=fs.existsSync(path.join(work,'runs/hint-effects.jsonl'))?fs.readFileSync(path.join(work,'runs/hint-effects.jsonl'),'utf8').trim().split('\n').length:0;
 const r=run(['src/hints.js','--domain','laggedRule','--seed','1','--k','36','--attempts','1','--repeats','2','--memory','summary','--ladder','hints/audit.json',...args]);
 const lines=fs.existsSync(path.join(work,'runs/hint-effects.jsonl'))?fs.readFileSync(path.join(work,'runs/hint-effects.jsonl'),'utf8').trim().split('\n'):[];
 const out=lines.length>before?JSON.parse(lines.at(-1)):null;
 const metas=out?.results.filter(x=>x.runId).map(x=>JSON.parse(fs.readFileSync(path.join(work,'runs',x.runId+'.jsonl'),'utf8').split('\n')[0]))||[];
 return {r,out,metas};
}
const h1=hintRun('valid',['--order-seed','7']);
emit('hints/options-and-coverage',h1.r.status===0&&h1.metas.length===8&&h1.metas.every(m=>m.memory==='summary'&&m.secret.k===36)&&h1.out.estimand==='prompted-restart'&&h1.out.summary.every(s=>s.n===2),{exit:h1.r.status,memory:h1.metas.map(m=>m.memory),lags:h1.metas.map(m=>m.secret.k),executionOrder:h1.out?.executionOrder,categories:h1.out?.summary.map(s=>s.category)});
const h2=hintRun('order',['--order-seed','8']);
emit('hints/order-seed',JSON.stringify(h1.out?.executionOrder)!==JSON.stringify(h2.out?.executionOrder),{executionOrder:h2.out?.executionOrder});
const frac=hintRun('fractional',['--repeats','1.5']);
emit('hints/fractional-repeats',frac.r.status!==0,{exit:frac.r.status,declaredRepeats:frac.out?.repeats,actualJobs:frac.out?.results.length,actualPerArm:frac.out?.summary.map(s=>s.n)});

const {make}=await import(pathToFileURL(path.join(work,'src/domains/laggedRule.js')));
const secret=make(1,{k:36}).secret;
write('scaffolds/audit.md','ORIGINAL_SCAFFOLD_SENTINEL');
const raw='<idea>RAW_SENTINEL only adjacent contexts</idea>\n<code>const CODE_SENTINEL=1;function encode(s){return "";}function decode(){return [];}</code>';
const pmMeta={type:'meta',runId:'audit-failed',domain:'laggedRule',seed:1,opts:{k:36},secret,model:'review-responder',attempts:1,memory:'full',scaffold:'scaffolds/audit.md'};
const pmAttempt={type:'attempt',attempt:1,raw,code:'const CODE_SENTINEL=1;',idea:'only adjacent contexts',result:{ok:false,stage:'verify',error:'VERIFIER_SENTINEL'}};
const pmEnd={type:'end',success:null,attemptsUsed:1};
write('postmortem-stub.mjs',`import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
process.env.LLM_MOCK='0';process.env.ANTHROPIC_API_KEY='offline-review-not-a-key';process.env.ANTHROPIC_MODEL='review-responder';
const input=process.argv[2], capture=process.argv[3], mode=process.argv[4]; const requests=[];
globalThis.fetch=async (url,options)=>{ const body=JSON.parse(options.body);requests.push(body);
 const value=requests.length===1?'I tested adjacent symbols only.':JSON.stringify({claim:'FABRICATED_CLAIM',assessment:'contradicted',evidence:'attempt 999: FABRICATED_EVIDENCE',categories:['invalid-category']});
 return {ok:true,json:async()=>({content:[{type:'text',text:value}],usage:{},stop_reason:'end_turn'})}; };
process.on('exit',()=>fs.writeFileSync(capture,JSON.stringify(requests)));
process.argv=[process.execPath,path.resolve('src/postmortem.js'),'--log',input,'--judge-model','review-judge'];
await import(pathToFileURL(path.resolve('src/postmortem.js')));
`);
function postmortemCase(id,records){
 const file=`runs/${id}.jsonl`,capture=`runs/${id}-requests.json`;
 write(file,records.map(x=>JSON.stringify(x)).join('\n')+'\n');
 const r=run(['postmortem-stub.mjs',file,capture]);
 const requests=JSON.parse(fs.readFileSync(path.join(work,capture),'utf8'));
 let rec=null;if(requests.length&&fs.existsSync(path.join(work,'runs/postmortems.jsonl')))rec=JSON.parse(fs.readFileSync(path.join(work,'runs/postmortems.jsonl'),'utf8').trim().split('\n').at(-1));
 return {r,requests,rec};
}
for(const [id,records] of [
 ['incomplete',[pmMeta,pmAttempt]],
 ['successful',[pmMeta,pmAttempt,{...pmEnd,success:1}]],
 ['wrong-secret',[{...pmMeta,secret:{...secret,k:35}},pmAttempt,pmEnd]]
]){const x=postmortemCase(id,records);emit('postmortem/'+id,x.r.status===2&&x.requests.length===0,{exit:x.r.status,requests:x.requests.length,stderr:x.r.stderr.trim()});}
const pm=postmortemCase('valid-failed',[pmMeta,pmAttempt,pmEnd]);
const responseText=JSON.stringify(pm.requests[0]),judgeText=JSON.stringify(pm.requests[1]);
emit('postmortem/full-raw-history',responseText.includes('RAW_SENTINEL')&&responseText.includes('CODE_SENTINEL')&&judgeText.includes('RAW_SENTINEL')&&judgeText.includes('CODE_SENTINEL'),{responseHasRaw:responseText.includes('RAW_SENTINEL'),responseHasCode:responseText.includes('CODE_SENTINEL'),judgeHasRaw:judgeText.includes('RAW_SENTINEL'),judgeHasCode:judgeText.includes('CODE_SENTINEL'),responseHasVerifier:responseText.includes('VERIFIER_SENTINEL'),judgeHasVerifier:judgeText.includes('VERIFIER_SENTINEL'),responseHasOriginalScaffold:responseText.includes('ORIGINAL_SCAFFOLD_SENTINEL')});
emit('postmortem/judge-model-forwarding',pm.requests[1]?.model===pm.rec?.judgeModel,{requested:'review-judge',actualRequests:pm.requests.map(r=>r.model),loggedJudge:pm.rec?.judgeModel});
emit('postmortem/quote-and-schema-validation',!!pm.rec?.judgeError||!pm.rec?.judged,{accepted:pm.rec?.judged,judgeError:pm.rec?.judgeError});
const malformed=postmortemCase('missing-attempt-record',[{...pmMeta,attempts:2},pmAttempt,{...pmEnd,attemptsUsed:2}]);
emit('postmortem/end-count-validation',malformed.r.status!==0&&malformed.requests.length===0,{exit:malformed.r.status,requests:malformed.requests.length});
fs.writeFileSync(destination,JSON.stringify(evidence,null,2)+'\n');
console.log('Evidence: '+destination);
