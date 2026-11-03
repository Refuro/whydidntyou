// Usage: node REVIEW-CHECKS-v5.mjs <repo> <evidence.json>
// Copies source and installed locked dependencies only; no .env, model calls or external services.
import fs from 'node:fs';import path from 'node:path';import{spawnSync}from'node:child_process';import{createHash}from'node:crypto';
const root=path.resolve(process.argv[2]),dest=path.resolve(process.argv[3]);const work=fs.mkdtempSync(path.join(path.dirname(dest),'v5-probes-'));
for(const dir of ['src','hints','scaffolds','baselines','experiments','node_modules'])fs.cpSync(path.join(root,dir),path.join(work,dir),{recursive:true});
for(const f of ['package.json','package-lock.json'])fs.copyFileSync(path.join(root,f),path.join(work,f));fs.mkdirSync(path.join(work,'runs'));
const ev={node:process.version,work,root,sourceHashes:{},cases:[]};
ev.dependencies={quickjs:JSON.parse(fs.readFileSync(path.join(work,'node_modules/quickjs-emscripten/package.json'),'utf8')).version,core:JSON.parse(fs.readFileSync(path.join(work,'node_modules/quickjs-emscripten-core/package.json'),'utf8')).version,wasmSha256:createHash('sha256').update(fs.readFileSync(path.join(work,'node_modules/@jitl/quickjs-wasmfile-release-sync/dist/emscripten-module.wasm'))).digest('hex')};
for(const f of ['docs/PLAN.md','docs/REVIEW-PROMPT-v5.md','package.json','package-lock.json',...fs.readdirSync(path.join(root,'src'),{recursive:true}).filter(f=>fs.statSync(path.join(root,'src',f)).isFile()).map(f=>'src/'+f.replaceAll('\\','/'))])ev.sourceHashes[f]=createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
const emit=(id,pass,details={})=>{ev.cases.push({id,pass,...details});fs.writeFileSync(dest,JSON.stringify(ev,null,2)+'\n');console.log(JSON.stringify(ev.cases.at(-1)));};
const env={...process.env,LLM_MOCK:'1',ANTHROPIC_API_KEY:'offline-review-not-a-key',REVIEW_CANARY:'v5-dummy-marker'};
const run=(args,opts={})=>spawnSync(process.execPath,args,{cwd:work,encoding:'utf8',env,timeout:8000,maxBuffer:3e6,...opts});
const write=(f,s)=>fs.writeFileSync(path.join(work,f),s);
write('probe.mjs',`import{evaluate,isSuccess,runSide}from'./src/sandbox.js';import{make}from'./src/domains/laggedRule.js';const spec=JSON.parse(process.argv[2]);try{const start=Date.now();const result=spec.mode==='side'?await runSide(spec.code,'encode',{A:8,dataJson:'[1,2,3]'},spec.ms||500):await evaluate(spec.code,spec.inst||make(1),{timeoutMs:spec.ms||200});console.log(JSON.stringify({result,success:spec.mode==='side'?null:isSuccess(result),elapsed:Date.now()-start}));}catch(e){console.log(JSON.stringify({uncaught:String(e),stack:String(e.stack).slice(0,500)}));}`);
const v4=fs.readFileSync(path.join(root,'docs/archive/review-v4-checks/REVIEW-CHECKS-v4.mjs'),'utf8');const literal=v4.slice(v4.indexOf('const codes=')+'const codes='.length,v4.indexOf('\nfor(const[id,code]of Object.entries(codes))'));const oldCodes=Function('return ('+literal.replace(/;\s*$/,'')+')')();
oldCodes['sqlite-file-channel']=`const p=console.log.constructor('return process')();const{DatabaseSync}=p.getBuiltinModule('node:sqlite');const db=new DatabaseSync('review-v5-channel.sqlite');function encode(s){db.exec('CREATE TABLE IF NOT EXISTS channel (id INTEGER PRIMARY KEY,payload TEXT)');db.prepare('INSERT OR REPLACE INTO channel VALUES(1,?)').run(JSON.stringify(s));return '';}function decode(){return JSON.parse(db.prepare('SELECT payload FROM channel WHERE id=1').get().payload);}`;
oldCodes['network-getBuiltinModule']=`const p=globalThis.constructor.constructor('return this')().process;function encode(){return typeof p.getBuiltinModule('http').request==='function'?'1':'';}function decode(){return [];}`;
for(const[id,code]of Object.entries(oldCodes)){const r=run(['probe.mjs',JSON.stringify({code})]);let out;try{out=JSON.parse(r.stdout.trim().split('\n').at(-1));}catch{}emit('prior/'+id,!r.error&&r.status===0&&out?.result?.ok===false,{exit:r.status,timeout:r.error?.code==='ETIMEDOUT',observed:out||null,stderr:r.stderr.slice(0,500)});}
const cap=`function has(f){try{return f()?'1':'0';}catch{return '0';}}function encode(){return has(()=>typeof process!=='undefined')+has(()=>typeof require!=='undefined')+has(()=>typeof console!=='undefined')+has(()=>typeof fetch!=='undefined')+has(()=>typeof globalThis.constructor.constructor('return this')().process!=='undefined')+has(()=>{const t=Date.now();for(let i=0;i<1000000;i++){}return Date.now()!==t;})+has(()=>typeof globalThis.constructor.constructor('return this')().getBuiltinModule!=='undefined');}function decode(){return [];}`;
const clocks=`function encode(){return [()=>__OrigDate.now()>0,()=>Date.prototype.constructor.now()>0,()=>new Date().constructor.now()>0].map(f=>{try{return f()?'1':'0';}catch{return'0';}}).join('');}function decode(){return[];}`;
for(const[id,code,expected]of[['capability-original',cap,'0000000'],['capability-clock-aliases',clocks,'000']]){const r=run(['probe.mjs',JSON.stringify({code,mode:'side',ms:5000})]);let out;try{out=JSON.parse(r.stdout.trim().split('\n').at(-1));}catch{}emit(id,out?.result?.ok===true&&out?.result?.bits===expected,{observed:out||null,expected,stderr:r.stderr.slice(0,300)});}
// Same submission, separate one-symbol inputs; timing carries the symbol, bitstring stays empty.
const timing=`const clock=Date.prototype.constructor;function encode(s){const target=s[0]*1000+250;for(;;){const phase=clock.now()%2000;if(phase>=target&&phase<target+100)break;}return '';}function decode(){return [clock.now()%2000<1000?0:1];}`;
write('timing-submission.js',timing);
for(const[trial,bit]of[0,1,1,0].entries()){const r=run(['probe.mjs',JSON.stringify({code:timing,ms:3500,inst:{A:2,test:[bit],baselineBitsPerSym:1,oracleBitsPerSym:1}})]);let out;try{out=JSON.parse(r.stdout.trim().split('\n').at(-1));}catch{}emit('timing-channel/trial-'+trial+'-input-'+bit,!r.error&&r.status===0&&out?.result?.ok===false,{observed:out||null,exit:r.status,timeout:r.error?.code==='ETIMEDOUT'});}
const extra={
 'regex-backtracking':`function encode(){/^(a+)+$/.test('a'.repeat(35)+'!');return '';}function decode(){return [];}`,
 'load-error-toJSON-loop':`throw {toJSON(){for(;;){}}};`,
 'load-error-message-loop':`throw Object.defineProperty({},'message',{get(){for(;;){}}});`,
 'load-error-proxy':`throw new Proxy({},{get(){for(;;){}}});`,
 'wrapper-json-object':`JSON.stringify=()=>({toString(){for(;;){}}});function encode(){return '';}function decode(){return [];}`,
 'data-global-setter':`Object.defineProperty(globalThis,'__dataJson',{set(){for(;;){}}});function encode(){return '';}function decode(){return [];}`,
 'deep-nested-array':`function encode(){let a=[];for(let i=0;i<100000;i++)a=[a];JSON.stringify(a);return '';}function decode(){return [];}`,
 'stack-recursion':`function encode(){function f(){return f()+1;}return f();}function decode(){return [];}`,
 'bounded-memory':`function encode(){let a=[];for(;;)a.push(new Array(100000).fill(1));}function decode(){return [];}`
};
for(const[id,code]of Object.entries(extra)){const r=run(['probe.mjs',JSON.stringify({code})],{timeout:4000});let out;try{out=JSON.parse(r.stdout.trim().split('\n').at(-1));}catch{}emit('new/'+id,!r.error&&r.status===0&&out?.result?.ok===false,{exit:r.status,timeout:r.error?.code==='ETIMEDOUT',observed:out||null,stderr:r.stderr.slice(0,600)});}
// Output records are saved progressively; shipped self-test runs last because real interpreters are slower.
const self=run(['src/selftest.js'],{timeout:55000,maxBuffer:3e6});emit('selftest/shipped',self.status===0&&self.stdout.includes('selftest OK'),{exit:self.status,timeout:self.error?.code==='ETIMEDOUT',stdout:self.stdout,stderr:self.stderr.slice(0,2500)});
console.log('Saved '+dest);
