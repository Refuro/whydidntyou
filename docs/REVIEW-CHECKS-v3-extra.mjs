// Additional offline probes, reusing the source copy recorded by REVIEW-CHECKS-v3.mjs.
// Usage: node REVIEW-CHECKS-v3-extra.mjs <evidence.json>
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const file=path.resolve(process.argv[2]);
const evidence=JSON.parse(fs.readFileSync(file,'utf8'));const work=evidence.work;
const run=(args)=>spawnSync(process.execPath,args,{cwd:work,encoding:'utf8',timeout:10000,maxBuffer:2e6,env:{...process.env,LLM_MOCK:'1',ANTHROPIC_API_KEY:'offline-review-not-a-key'}});
const add=(id,pass,details)=>{const row={id,pass,...details};const i=evidence.cases.findIndex(c=>c.id===id);if(i>=0)evidence.cases[i]=row;else evidence.cases.push(row);console.log(JSON.stringify(row));};
const selftest=run(['src/selftest.js']);
add('selftest/shipped-regressions-and-real-winner',selftest.status===0&&selftest.stdout.includes('selftest OK'),{exit:selftest.status,stdout:selftest.stdout,stderr:selftest.stderr});
const missing=run(['src/report.js','runs/experiment-both-arms-missing-world.jsonl']);
const missingText=fs.readFileSync(path.join(work,'runs/report-both-arms-missing-world.md'),'utf8');
add('report/both-arms-missing-world',missing.status!==0||missingText.includes('laggedRule|2|'),{exit:missing.status,containsConfiguredMissingWorld:missingText.includes('laggedRule|2|'),lines:missingText.split('\n').filter(l=>l.startsWith('File:')||l.startsWith('- PRIMARY'))});
const config={name:'multiplicity',seeds:[1,2,3,4],repeats:1,attempts:3,conditions:['a','b','c','d'].map(id=>({id,domain:'laggedRule'})),contrasts:[['a','b'],['a','c'],['a','d']]};
const rows=config.conditions.flatMap((c,i)=>config.seeds.map(seed=>({type:'trial',condition:c.id,seed,repeat:0,domain:'laggedRule',opts:{},success:seed<=i?1:null,tokens:1,secret:{k:13}})));
fs.writeFileSync(path.join(work,'runs/experiment-multiplicity.jsonl'),[{type:'experiment-meta',config},...rows].map(x=>JSON.stringify(x)).join('\n')+'\n');
const mr=run(['src/report.js','runs/experiment-multiplicity.jsonl']);const mt=fs.readFileSync(path.join(work,'runs/report-multiplicity.md'),'utf8');
add('report/secondary-family-multiplicity',mr.status===0&&mt.includes('95.0% CI')&&(mt.match(/97\.5% CI/g)||[]).length===2,{exit:mr.status,lines:mt.split('\n').filter(l=>l.startsWith('- PRIMARY')||l.startsWith('- secondary'))});
fs.writeFileSync(path.join(work,'hints-failure-stub.mjs'),`import fs from 'node:fs';import path from 'node:path';import{pathToFileURL}from'node:url';
process.env.LLM_MOCK='0';process.env.ANTHROPIC_MODEL='offline-review';process.env.ANTHROPIC_API_KEY='offline-review-not-a-key';let calls=0;
globalThis.fetch=async()=>{if(++calls===1)throw new Error('injected-first-call-failure');return{ok:true,json:async()=>({content:[{type:'text',text:'<idea>baseline</idea><code>function encode(s){return s.map(x=>x.toString(2).padStart(3,"0")).join("");}function decode(b,n){return Array.from({length:n},(_,i)=>parseInt(b.slice(3*i,3*i+3),2));}</code>'}],usage:{},stop_reason:'end_turn'})};};
process.argv=[process.execPath,path.resolve('src/hints.js'),'--domain','laggedRule','--seed','2','--attempts','1','--repeats','1','--ladder','hints/audit.json','--order-seed','7'];await import(pathToFileURL(path.resolve('src/hints.js')));
`);
const partialPath=path.join(work,'runs/hint-effects.partial.jsonl');const before=fs.readFileSync(partialPath,'utf8').trim().split('\n').length;
const hr=run(['hints-failure-stub.mjs']);
const after=fs.readFileSync(partialPath,'utf8').trim().split('\n').length;
const outcome=JSON.parse(fs.readFileSync(path.join(work,'runs/hint-effects.jsonl'),'utf8').trim().split('\n').at(-1));
add('hints/partial-api-failure',hr.status===0&&outcome.results.length===4&&outcome.results.filter(r=>r.error).length===1&&after-before===4,{exit:hr.status,jobs:outcome.results.length,errors:outcome.results.filter(r=>r.error).length,partialRecordsAdded:after-before,summary:outcome.summary.map(s=>({id:s.id,n:s.n}))});
const hist=s=>{const h={};for(const a of s)h[a]=(h[a]||0)+1;return Object.entries(h).sort();};
function ceiling(rows){const m=new Map;for(const [a,b,y]of rows){const key=JSON.stringify([hist(a),hist(b)]);const v=m.get(key)||[0,0];v[y]++;m.set(key,v);}return [...m.values()].reduce((sum,v)=>sum+Math.max(...v),0)/rows.length;}
add('formal/histogram-conflict-ceilings',true,{withinPairHistogramEqualityOnly:ceiling([['ab','ab',1],['aabb','abab',0]]),matchedPairFeatureConflict:ceiling([['ab','ab',1],['ab','ba',0]]),balancedConflictMassPointOneCeiling:1-.1/2});
fs.writeFileSync(file,JSON.stringify(evidence,null,2)+'\n');
