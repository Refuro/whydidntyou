// Offline review checks. Usage: node REVIEW-CHECKS-v4.mjs <repo> <evidence.json>
// Source-only copy, dummy credentials, intercepted model requests; one loopback-only broker.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync,spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(process.argv[2]), destination=path.resolve(process.argv[3]);
const work=fs.mkdtempSync(path.join(path.dirname(destination),'v4-probes-'));
for(const d of ['src','hints','scaffolds','baselines','experiments'])fs.cpSync(path.join(root,d),path.join(work,d),{recursive:true});
fs.copyFileSync(path.join(root,'package.json'),path.join(work,'package.json'));fs.mkdirSync(path.join(work,'runs'));
const ev={node:process.version,platform:process.platform,work,sourceHashes:{},cases:[]};
for(const f of ['docs/PLAN.md','docs/REVIEW-PROMPT-v4.md',...fs.readdirSync(path.join(root,'src'),{recursive:true}).filter(f=>fs.statSync(path.join(root,'src',f)).isFile()).map(f=>'src/'+f.replaceAll('\\','/'))])ev.sourceHashes[f]=createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
const flush=()=>fs.writeFileSync(destination,JSON.stringify(ev,null,2)+'\n');
const emit=(id,pass,details={})=>{const c={id,pass,...details};ev.cases.push(c);flush();console.log(JSON.stringify(c));};
const env={...process.env,LLM_MOCK:'1',ANTHROPIC_API_KEY:'offline-review-not-a-key',REVIEW_CANARY:'v4-inherited-test-marker'};
const run=(args,opts={})=>spawnSync(process.execPath,args,{cwd:work,encoding:'utf8',timeout:15000,maxBuffer:3e6,env,...opts});
const write=(f,v)=>fs.writeFileSync(path.join(work,f),typeof v==='string'?v:JSON.stringify(v));
const self=run(['src/selftest.js'],{timeout:30000});
emit('selftest/shipped',self.status===0&&self.stdout.includes('selftest OK'),{exit:self.status,stdout:self.stdout,stderr:self.stderr});
// The old harness is rerun verbatim. Schema-1 fixtures are expected to become obsolete.
const old=run([path.join(root,'docs/archive/review-v3-checks/REVIEW-CHECKS-v3.mjs'),root,path.join(work,'legacy-results.json')],{timeout:45000});
write('legacy-rerun.log',old.stdout+'\nSTDERR:\n'+old.stderr);
emit('legacy/harness-rerun',null,{exit:old.status,stdoutFile:path.join(work,'legacy-rerun.log'),stderr:old.stderr.slice(-1800),note:'Use schema-2 cases below for behavioral conclusions, not blanket legacy-schema refusals.'});

write('sandbox-probe.mjs',`import {evaluate,isSuccess} from './src/sandbox.js';import{make}from'./src/domains/laggedRule.js';
const result=evaluate(JSON.parse(process.argv[2]),make(1),{timeoutMs:200});console.log(JSON.stringify({result,success:isSuccess(result)}));`);
const codes={
 'original-stash':`var stash;function encode(s){stash=s.slice();return '';}function decode(){return stash||[];}`,
 'shared-Math':`function encode(s){Math.__reviewStash=s.slice();return '';}function decode(){return Math.__reviewStash;}`,
 'throwing-decoder-proxy':`function encode(){return '';}function decode(){return new Proxy([],{get(t,p){if(p==='length')throw new Error('probe');return t[p];}});}`,
 'looping-decoder-proxy':`function encode(){return '';}function decode(){return new Proxy([],{get(t,p){if(p==='length')for(;;){};return t[p];}});}`,
 'console-host-channel':`const host=console.log.constructor('return globalThis')();function encode(s){host.__v3Review=s.slice();return '';}function decode(){return host.__v3Review;}`,
 'context-constructor-channel':`const host=globalThis.constructor.constructor('return globalThis')();function encode(s){host.__v3Review=s.slice();return '';}function decode(){return host.__v3Review;}`,
 'thrown-message-getter':`function encode(){throw Object.defineProperty({},'message',{get(){for(;;){}}});}function decode(){return [];}`,
 'replaced-JSON-serializer':`JSON.stringify=()=>({toString(){for(;;){}}});function encode(){return '';}function decode(){return [];}`,
 'promise-timeout':`function encode(){Promise.resolve().then(()=>{for(;;){}});return '';}function decode(){return [];}`,
 'thrown-tostringtag-getter':`function encode(){throw {[Symbol.toStringTag]: 'x',get message(){return 'm';},get [Symbol.toStringTag](){for(;;){}}};}function decode(){return [];}`,
 'error-descriptor-proxy':`function encode(){throw new Proxy({},{getOwnPropertyDescriptor(){for(;;){}}});}function decode(){return [];}`,
 'terminate-evaluator-parent':`const p=console.log.constructor('return process')();function encode(){p.kill(p.ppid,'SIGTERM');return '';}function decode(){return [];}`,
 'inherited-environment':`const p=console.log.constructor('return process')();function encode(){throw new Error('CANARY:'+p.env.REVIEW_CANARY);}function decode(){return [];}`,
 'permission-fs-write':`const p=console.log.constructor('return process')();function encode(){try{p.getBuiltinModule('fs').writeFileSync('review-write-test.txt','test');throw new Error('WRITE_ALLOWED');}catch(e){throw new Error('FS:'+e.code);}}function decode(){return [];}`
};
for(const[id,code]of Object.entries(codes)){
 const r=run(['sandbox-probe.mjs',JSON.stringify(code)],{timeout:6000});let out;try{out=JSON.parse(r.stdout.trim().split('\n').at(-1));}catch{}
 let pass=!r.error&&r.status===0&&out?.result?.ok===false;
 if(id==='inherited-environment')pass=pass&&!out?.result?.error?.includes('v4-inherited-test-marker');
 if(id==='permission-fs-write')pass=pass&&out?.result?.error?.includes('ERR_ACCESS_DENIED');
 emit('sandbox/'+id,pass,{exit:r.status,supervisorTimeout:r.error?.code==='ETIMEDOUT',observed:out||null,stderr:r.stderr.slice(0,300)});
}
// Broker runs in its own process so the synchronous evaluator cannot block its event loop.
write('broker.mjs',`import http from 'node:http';let value='[]',requests=0;const server=http.createServer((req,res)=>{requests++;if(req.method==='POST'){let b='';req.on('data',c=>{b+=c;if(b.length>100000)req.destroy();});req.on('end',()=>{value=b;res.end('ok');});}else{res.end(value);}});server.listen(0,'127.0.0.1',()=>console.log(server.address().port));setTimeout(()=>{server.close();process.exit(0);},12000);`);
const broker=spawn(process.execPath,['broker.mjs'],{cwd:work,env,stdio:['ignore','pipe','pipe'],windowsHide:true});
let brokerErr='';broker.stderr.on('data',b=>brokerErr+=b);
try{
 const port=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('broker start timeout')),3000);broker.stdout.once('data',d=>{clearTimeout(timer);resolve(Number(String(d).trim()));});broker.once('error',e=>{clearTimeout(timer);reject(e);});});
 const networkCode=`const h=console.log.constructor('return globalThis')();const p=h.process;const http=p.getBuiltinModule('node:http');const send=p.stdout.write.bind(p.stdout),quit=p.exit.bind(p);p.stdout.write=()=>true;p.exit=()=>{};function finish(o){send(h.JSON.stringify(o));quit(0);}function encode(s){const req=http.request({host:'127.0.0.1',port:${port},method:'POST',path:'/'},res=>{res.resume();res.on('end',()=>finish({ok:true,bits:''}));});req.on('error',()=>finish({ok:false,error:'broker unavailable'}));req.end(h.JSON.stringify(s));return '';}function decode(){http.get({host:'127.0.0.1',port:${port},path:'/'},res=>{let s='';res.on('data',c=>s+=c);res.on('end',()=>finish({ok:true,symbols:h.JSON.parse(s)}));}).on('error',()=>finish({ok:false,error:'broker unavailable'}));return [];}`;
 write('network-submission.js',networkCode);
 const r=run(['sandbox-probe.mjs',JSON.stringify(networkCode)],{timeout:6000});let out;try{out=JSON.parse(r.stdout.trim().split('\n').at(-1));}catch{}
 emit('sandbox/loopback-network-channel',out?.success?false:null,{exit:r.status,observed:out||null,brokerError:brokerErr,submission:path.join(work,'network-submission.js'),note:'A failed connection is inconclusive until the independent control in the extra checks runs.'});
}catch(e){emit('sandbox/loopback-network-channel',null,{error:String(e),brokerError:brokerErr});}finally{broker.kill();}

const version=(await import(pathToFileURL(path.join(work,'src/domains/laggedRule.js')))).make(1).generatorVersion;
const cfg=(name)=>({name,seeds:[1,2],repeats:1,attempts:3,conditions:[{id:'a',domain:'laggedRule'},{id:'b',domain:'laggedRule'}],contrasts:[['a','b']]});
const row=(c,s,success=null,extra={})=>({type:'trial',batchId:'batch',condition:c,seed:s,repeat:0,success,domain:'laggedRule',opts:{},memory:'full',model:'mock',generatorVersion:version,tokens:1,attemptsUsed:3,maxAttempts:3,secret:{k:13},...extra});
const standard=()=>[row('a',1),row('a',2),row('b',1,1),row('b',2)];
function report(id,config,rows,check,metaExtra={},more=[]){const file='runs/experiment-'+id+'.jsonl';write(file,[{type:'experiment-meta',schema:2,batchId:'batch',model:'mock',config,...metaExtra},...more,...rows].map(x=>JSON.stringify(x)).join('\n')+'\n');const r=run(['src/report.js',file]);const out=path.join(work,file.replace('experiment-','report-').replace('.jsonl','.md'));const text=fs.existsSync(out)?fs.readFileSync(out,'utf8'):'';emit('report/'+id,check(r,text),{exit:r.status,stderr:r.stderr.trim().slice(0,600),lines:text.split('\n').filter(s=>s.startsWith('- PRIMARY')||s.startsWith('- exploratory')||s.startsWith('| a |')||s.startsWith('| seed')||s.startsWith('Configured:')||s.startsWith('File:'))});}
report('paired-known',cfg('paired-known'),standard(),(r,s)=>r.status===0&&s.includes('50 pp'));
for(const[field,value]of[['domain','hiddenPeriod'],['opts',{k:40}],['memory','summary'],['model','wrong'],['batchId','other'],['repeat',10],['seed',999],['condition','unknown']]){const rows=standard();rows[2][field]=value;report('forged-'+field,cfg('forged-'+field),rows,r=>r.status===2);}
{const rows=standard();rows[2].generatorVersion='wrong';report('mixed-generator-version',cfg('mixed-version'),rows,r=>r.status===2);}
{const rows=standard();for(const r of rows)delete r.generatorVersion;report('missing-all-generator-versions',cfg('missing-version'),rows,r=>r.status===2);}
{const c=cfg('wrong-pinned-version');c.conditions.forEach(x=>x.generatorVersion=version);report('uniform-wrong-generator-version',c,standard().map(r=>({...r,generatorVersion:'forged'})),r=>r.status===2,{generatorVersions:{laggedRule:version}});}
report('duplicate-trial',cfg('dup'),[...standard(),row('a',1)],r=>r.status===2);
report('mixed-meta',cfg('mix'),standard(),r=>r.status===2,{},[{type:'experiment-meta',schema:2}]);
{const c=cfg('unequal');c.repeats=2;report('unequal-repeats',c,[row('a',1,1),row('a',1,1,{repeat:1}),row('a',2),row('b',1),row('b',1,null,{repeat:1}),row('b',2)],(r,s)=>r.status===0&&s.split('\n').find(x=>x.startsWith('| a |'))?.includes('50% / 50%'));}
report('both-arms-missing',cfg('missing'),[row('a',1),row('b',1)],(r,s)=>s.includes('a/s2/r0')&&s.includes('b/s2/r0')&&s.includes('| seed 2 | — | — |'));
for(const[value,id]of[[null,'zero-differences'],[1,'constant-nonzero']])report(id,cfg(id),[row('a',1),row('a',2),row('b',1,value),row('b',2,value)],(r,s)=>s.includes('interval withheld')&&!/95% CI \[/.test(s)&&(value===null||!s.includes('No discordant worlds observed')));
for(const[declaration,id,accepted]of[[undefined,'options-undeclared',false],[true,'options-declared',true],['false','options-string-false',false]]){const c=cfg(id);c.conditions[1].opts={k:40};c.contrasts=[{a:'a',b:'b',...(declaration===undefined?{}:{sharedWorld:declaration})}];const rows=standard().map(r=>r.condition==='b'?{...r,opts:{k:40}}:r);report(id,c,rows,(r,s)=>accepted?s.includes('50 pp')&&!s.includes('REFUSED'):r.status===2||s.includes('REFUSED'));}
for(const[value,id]of[[-1,'negative-success'],[99,'success-beyond-budget'],['yes','string-success']]){const rows=standard();rows[2].success=value;report(id,cfg(id),rows,r=>r.status===2);}
{const c=cfg('duplicate-seeds');c.seeds=[1,1,2];report('duplicate-config-seeds',c,standard(),r=>r.status===2);}
{const rows=standard();rows[2].attemptsUsed=99;rows[2].maxAttempts=99;report('wrong-attempt-budget',cfg('wrong-attempt-budget'),rows,r=>r.status===2);}
{const c=cfg('missingness-policy');c.missingPolicy='refuse';report('missingness-policy-not-enforced',c,[row('a',1),row('b',1)],r=>r.status===2);}
{const c=cfg('secondary');c.conditions.push({id:'c',domain:'laggedRule'});c.contrasts.push(['a','c']);report('secondary-exploratory',c,[...standard(),row('c',1,1),row('c',2)],(r,s)=>s.includes('EXPLORATORY')&&s.includes('- exploratory:'));}
flush();console.log('Saved '+destination);
