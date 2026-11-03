// Checks the scorer with code that knows the secret, and with naive code that doesn't.
import { domains } from './domains/index.js';
import { evaluate, isSuccess } from './sandbox.js';

const naive = `
function encode(s){const W=Math.ceil(Math.log2(A));return s.map(x=>x.toString(2).padStart(W,'0')).join('');}
function decode(b,n){const W=Math.ceil(Math.log2(A));const s=[];for(let i=0;i<n;i++)s.push(parseInt(b.slice(i*W,i*W+W),2));return s;}`;

// order-1 context: predicts s[i] from s[i-1] via the most common successor seen so far (adaptive).
// Should FAIL on both families, since neither depends on the previous symbol.
const order1 = `
function encode(s){const W=Math.ceil(Math.log2(A));const T=Array.from({length:A},()=>Array(A).fill(0));let out='';
 for(let i=0;i<s.length;i++){if(i===0){out+=s[i].toString(2).padStart(W,'0');continue;}
  const row=T[s[i-1]];let best=0;for(let a=1;a<A;a++)if(row[a]>row[best])best=a;
  if(s[i]===best)out+='1';else out+='0'+s[i].toString(2).padStart(W,'0'); row[s[i]]++;} return out;}
function decode(b,n){const W=Math.ceil(Math.log2(A));const T=Array.from({length:A},()=>Array(A).fill(0));const s=[];let p=0;
 for(let i=0;i<n;i++){if(i===0){s.push(parseInt(b.slice(p,p+W),2));p+=W;continue;}
  const row=T[s[i-1]];let best=0;for(let a=1;a<A;a++)if(row[a]>row[best])best=a;
  let x;if(b[p++]==='1')x=best;else{x=parseInt(b.slice(p,p+W),2);p+=W;} s.push(x);row[x]++;} return s;}`;

// PPM-lite: blend orders 6..1, predict with the longest context seen before; flag-code the prediction.
// This is the stock tool a frontier model used to crack v1 of laggedRule. It must FAIL on v2.
const ppm = `
function mk(){return {T:new Map()};}
function pred(T,s,i){for(let o=6;o>=1;o--){if(i<o)continue;const key=o+':'+s.slice(i-o,i).join(',');const m=T.get(key);if(m){let best=-1,bc=0;for(const [a,c] of m)if(c>bc){bc=c;best=a;}if(best>=0)return best;}}return 0;}
function upd(T,s,i){for(let o=6;o>=1;o--){if(i<o)continue;const key=o+':'+s.slice(i-o,i).join(',');let m=T.get(key);if(!m){m=new Map();T.set(key,m);}m.set(s[i],(m.get(s[i])||0)+1);}}
function encode(s){const W=Math.ceil(Math.log2(A));const T=new Map();let out='';for(let i=0;i<s.length;i++){const p=pred(T,s,i);if(s[i]===p)out+='1';else out+='0'+s[i].toString(2).padStart(W,'0');upd(T,s,i);}return out;}
function decode(b,n){const W=Math.ceil(Math.log2(A));const T=new Map();const s=[];let pos=0;for(let i=0;i<n;i++){const p=pred(T,s,i);let x;if(b[pos++]==='1')x=p;else{x=parseInt(b.slice(pos,pos+W),2);pos+=W;}s.push(x);upd(T,s,i);}return s;}`;

// Side-channel regression test (review F5): an "encoder" that stashes the input and returns zero bits.
const sideChannel = `
var stash;
function encode(s){stash=s.slice();return '';}
function decode(b,n){return stash||(typeof __data!=='undefined'?__data:[]);}`;

import { readFileSync } from 'node:fs';
const sonnetLagBank = readFileSync('baselines/sonnet55-lagbank-2026-11-03.js', 'utf8');

let failed = 0;
{
  const r = evaluate(sideChannel, domains.laggedRule.make(1));
  if (r.ok) { console.error('FAIL: zero-bit side channel passed the verifier'); failed++; } else console.log(`side-channel regression: blocked (${r.stage}: ${r.error})`);
}
for (const [name, d] of Object.entries(domains)) {
  const inst = d.make(1);
  const rows = [['naive', naive], ['order1', order1], ['ppm-order6', ppm], ['sonnet-lagbank(real win)', sonnetLagBank], ['reference', d.referenceCode(inst)]].map(([label, code]) => {
    const r = evaluate(code, inst);
    return { label, ...(r.ok ? { bps: r.bitsPerSym.toFixed(3), ratio: r.ratioToBaseline.toFixed(3), success: isSuccess(r) } : { error: `${r.stage}: ${r.error}` }) };
  });
  console.log(`\n[${name}] seed=1 secret=${JSON.stringify(inst.secret)} baseline=${inst.baselineBitsPerSym} oracle=${inst.oracleBitsPerSym.toFixed(3)}`);
  console.table(rows);
  const ref = rows.find(r => r.label === 'reference'), o1 = rows.find(r => r.label === 'order1'), pp = rows.find(r => r.label === 'ppm-order6');
  if (!ref.success) { console.error('FAIL: reference solver should succeed'); failed++; }
  if (o1.success) { console.error('FAIL: order-1 solver should NOT succeed (wall not high enough)'); failed++; }
  if (pp.success) { console.error('FAIL: PPM order-6 solver should NOT succeed (wall not high enough)'); failed++; }
}
console.log(failed ? `\n${failed} check(s) failed` : '\nselftest OK');
process.exit(failed ? 1 : 0);
