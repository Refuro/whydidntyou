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

let failed = 0;
for (const [name, d] of Object.entries(domains)) {
  const inst = d.make(1);
  const rows = [['naive', naive], ['order1', order1], ['reference', d.referenceCode(inst)]].map(([label, code]) => {
    const r = evaluate(code, inst);
    return { label, ...(r.ok ? { bps: r.bitsPerSym.toFixed(3), ratio: r.ratioToBaseline.toFixed(3), success: isSuccess(r) } : { error: `${r.stage}: ${r.error}` }) };
  });
  console.log(`\n[${name}] seed=1 secret=${JSON.stringify(inst.secret)} baseline=${inst.baselineBitsPerSym} oracle=${inst.oracleBitsPerSym.toFixed(3)}`);
  console.table(rows);
  const ref = rows.find(r => r.label === 'reference'), o1 = rows.find(r => r.label === 'order1');
  if (!ref.success) { console.error('FAIL: reference solver should succeed'); failed++; }
  if (o1.success) { console.error('FAIL: order-1 solver should NOT succeed (wall not high enough)'); failed++; }
}
console.log(failed ? `\n${failed} check(s) failed` : '\nselftest OK');
process.exit(failed ? 1 : 0);
