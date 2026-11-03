// Checks the scorer with code that knows the secret, and with naive code that doesn't.
import { domains } from './domains/index.js';
import { evaluate, isSuccess, runSide } from './sandbox.js';

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
import { createHash } from 'node:crypto';
const sonnetLagBank = readFileSync('baselines/sonnet55-lagbank-2026-11-03.js', 'utf8');
const SONNET_LAGBANK_SHA256 = '79d3ac622fc5bdabef0bf25ec49f457b4228655beaa81c9716aec1c8e528191a';

// Review-2 reproductions: shared host object as a channel; decoder returning a hostile proxy.
const sharedHostObject = `
function encode(s){ Math.__reviewStash = s.slice(); return ''; }
function decode(bits, n){ return Math.__reviewStash; }`;
const hostileProxy = `
function encode(s){ return ''; }
function decode(bits, n){ return new Proxy([], { get(t, p){ if (p === 'length') throw new Error('boom'); return t[p]; } }); }`;
const hostileWhile = `
function encode(s){ return ''; }
function decode(bits, n){ return new Proxy([], { get(t, p){ if (p === 'length') { for(;;){} } return t[p]; } }); }`;
// Review-3 reproductions: host escape via Function constructor; hangs outside the vm timeout.
const consoleEscape = `
const host = console.log.constructor('return globalThis')();
function encode(s){ host.__v3Review = s.slice(); return ''; }
function decode(){ const s = host.__v3Review; delete host.__v3Review; return s; }`;
const ctorEscape = `
const host = globalThis.constructor.constructor('return globalThis')();
function encode(s){ host.__v3b = s.slice(); return ''; }
function decode(){ return host.__v3b; }`;
const loopingErrorGetter = `
function encode(s){ const e = {}; Object.defineProperty(e, 'message', { get(){ for(;;){} } }); throw e; }
function decode(){ return []; }`;
const jsonTrap = `
JSON.stringify = function(){ return { toString(){ for(;;){} } }; };
function encode(s){ return ''; }
function decode(){ return []; }`;
const promiseLoop = `
function encode(s){ Promise.resolve().then(() => { for(;;){} }); throw new Error('x'); }
function decode(){ return []; }`;
const fileChannel = `
let fs; try { fs = process.binding('fs'); } catch {}
function encode(s){ try { require('fs').writeFileSync('/tmp/_ch', JSON.stringify(s)); } catch(e) {} return ''; }
function decode(){ try { return JSON.parse(require('fs').readFileSync('/tmp/_ch','utf8')); } catch(e) { return []; } }`;
const netGlobals = `
function encode(s){ if (typeof fetch === 'function' || typeof WebSocket === 'function') throw new Error('network globals present'); return ''; }
function decode(){ return []; }`;

// Review-4 reproductions (these opened channels through Node's own doors; a WASM sandbox has no doors).
const sqliteChannel = `
const p = console.log.constructor('return process')();
const { DatabaseSync } = p.getBuiltinModule('node:sqlite');
const db = new DatabaseSync('review-v4-channel.sqlite');
function encode(s){ db.exec('CREATE TABLE IF NOT EXISTS channel (id INTEGER PRIMARY KEY, payload TEXT)'); db.prepare('INSERT OR REPLACE INTO channel VALUES (1, ?)').run(JSON.stringify(s)); return ''; }
function decode(){ return JSON.parse(db.prepare('SELECT payload FROM channel WHERE id=1').get().payload); }`;
const killParent = `
const p = console.log.constructor('return process')();
function encode(){ p.kill(p.ppid, 'SIGTERM'); return ''; }
function decode(){ return []; }`;
const envRead = `
function encode(s){ const p = globalThis.constructor.constructor('return this')(); return typeof p.process === 'undefined' ? '' : '1'; }
function decode(){ return []; }`;
const memoryBomb = `
function encode(s){ const a = []; for(;;) a.push(new Array(1e6).fill(1)); }
function decode(){ return []; }`;
const clockProbe = `
function encode(s){ if (typeof Date !== 'undefined') return '1'; return ''; }
function decode(){ return []; }`;
// Review-5 reproductions: timing channel through retained Date aliases; recursion / deep nesting that
// previously surfaced as a host-side RangeError and aborted the attempt loop.
const timingChannel = `
const clock = Date.prototype.constructor;
function encode(s){ const target = s[0] * 1000 + 250; for(;;){ const phase = clock.now() % 2000; if (phase >= target && phase < target + 100) break; } return ''; }
function decode(){ return [clock.now() % 2000 < 1000 ? 0 : 1]; }`;
const recursion = `
function encode(){ function f(){ return f() + 1; } return f(); }
function decode(){ return []; }`;
const deepNesting = `
function encode(){ let a = []; for (let i = 0; i < 100000; i++) a = [a]; return JSON.stringify(a); }
function decode(){ return []; }`;

let failed = 0;

// POSITIVE CONTROL: a program that REPORTS the sandbox's capabilities as bits. This distinguishes
// "capability denied" from "program failed for another reason": the probe must run and return
// exactly the expected bit pattern. Order: process, require, console, fetch, Function-escape-to-process, clock-moves, fs-via-any-route.
const capabilityProbe = `
function has(f){ try { return f() ? '1' : '0'; } catch (e) { return '0'; } }
function encode(s){
  return has(() => typeof process !== 'undefined')
       + has(() => typeof require !== 'undefined')
       + has(() => typeof console !== 'undefined')
       + has(() => typeof fetch !== 'undefined')
       + has(() => typeof globalThis.constructor.constructor('return this')().process !== 'undefined')
       + has(() => { const t = Date.now(); let x = 0; for (let i = 0; i < 1e6; i++) x += i; return Date.now() !== t; })
       + has(() => typeof globalThis.constructor.constructor('return this')().getBuiltinModule !== 'undefined')
       + has(() => typeof Date !== 'undefined')
       + has(() => typeof __OrigDate !== 'undefined')
       + has(() => typeof Object.getPrototypeOf(globalThis).constructor !== 'undefined' && typeof globalThis.constructor.constructor('return typeof Date')() !== 'undefined' && globalThis.constructor.constructor('return typeof Date')() !== 'undefined');
}
function decode(){ return []; }`;
{
  const probe = await runSide(capabilityProbe, 'encode', { A: 8, dataJson: '[1,2,3]' }, 5000);
  const expected = '0000000000';
  if (!probe.ok) { console.error(`FAIL: capability probe did not run: ${probe.stage}: ${probe.error}`); failed++; }
  else if (probe.bits !== expected) { console.error(`FAIL: capability probe reports ${probe.bits}, expected ${expected} (process,require,console,fetch,escape->process,Date.now moves,getBuiltinModule,Date exists,__OrigDate exists,Date via escape)`); failed++; }
  else console.log(`capability probe: ${probe.bits} (all ten capabilities absent; positive control ran)`);
}
for (const [label, code] of [['zero-bit stash', sideChannel], ['shared host object', sharedHostObject], ['throwing proxy', hostileProxy], ['looping proxy', hostileWhile], ['console.log.constructor escape', consoleEscape], ['globalThis.constructor escape', ctorEscape], ['looping error getter', loopingErrorGetter], ['JSON.stringify trap', jsonTrap], ['promise loop', promiseLoop], ['file channel via require', fileChannel], ['network globals absent', netGlobals], ['sqlite channel (review 4)', sqliteChannel], ['kill parent (review 4)', killParent], ['env/process read', envRead], ['memory bomb', memoryBomb], ['clock absent', clockProbe], ['timing channel (review 5)', timingChannel], ['recursion (review 5)', recursion], ['deep nesting (review 5)', deepNesting]]) {
  let r; try { r = await evaluate(code, domains.laggedRule.make(1), { timeoutMs: 1500 }); } catch (e) { console.error(`FAIL: ${label}: evaluate() threw on the host: ${e.message}`); failed++; continue; }
  if (r.ok) { console.error(`FAIL: ${label} passed the verifier`); failed++; continue; }
  if (label === 'network globals absent' && !/decode returned 0 items/.test(r.error)) { console.error(`FAIL: ${label}: encode threw (${r.error}), so a network global WAS present`); failed++; continue; }
  if (label === 'clock absent' && !/decode returned 0 items/.test(r.error)) { console.error(`FAIL: ${label}: Date exists inside the sandbox`); failed++; continue; }
  if ((label.startsWith('recursion') || label.startsWith('deep nesting')) && /host boundary/.test(r.error)) { console.error(`FAIL: ${label}: reached the host boundary instead of failing inside the sandbox (${r.error})`); failed++; continue; }
  console.log(`regression [${label}]: blocked (${r.stage}: ${r.error.slice(0, 70)})`);
}
{
  const h = createHash('sha256').update(sonnetLagBank).digest('hex');
  console.log(`baseline sonnet55-lagbank sha256=${h.slice(0, 16)}…`);
  if (SONNET_LAGBANK_SHA256 !== 'PINNED_AT_FIRST_RUN' && h !== SONNET_LAGBANK_SHA256) { console.error('FAIL: baseline program hash changed'); failed++; }
}
for (const [name, d] of Object.entries(domains)) {
  const inst = d.make(1);
  const rows = []; for (const [label, code] of [['naive', naive], ['order1', order1], ['ppm-order6', ppm], ['sonnet-lagbank(real win)', sonnetLagBank], ['reference', d.referenceCode(inst)]]) {
    const r = await evaluate(code, inst, { timeoutMs: 60000 });
    rows.push({ label, ...(r.ok ? { bps: r.bitsPerSym.toFixed(3), ratio: r.ratioToBaseline.toFixed(3), success: isSuccess(r) } : { error: `${r.stage}: ${r.error}` }) });
  }
  console.log(`\n[${name}] seed=1 secret=${JSON.stringify(inst.secret)} baseline=${inst.baselineBitsPerSym} oracle=${inst.oracleBitsPerSym.toFixed(3)}`);
  console.table(rows);
  const ref = rows.find(r => r.label === 'reference'), o1 = rows.find(r => r.label === 'order1'), pp = rows.find(r => r.label === 'ppm-order6'), sl = rows.find(r => r.label === 'sonnet-lagbank(real win)');
  if (sl.error) { console.error('FAIL: real winning program did not run: ' + sl.error); failed++; }
  if (name === 'laggedRule' && !sl.success) { console.error('FAIL: real winning program should still succeed on laggedRule seed 1 (k=13)'); failed++; }
  if (name === 'hiddenPeriod' && sl.success) { console.error('FAIL: real laggedRule winner should NOT succeed on hiddenPeriod (held-out wall too low)'); failed++; }
  if (!ref.success) { console.error('FAIL: reference solver should succeed'); failed++; }
  if (o1.success) { console.error('FAIL: order-1 solver should NOT succeed (wall not high enough)'); failed++; }
  if (pp.success) { console.error('FAIL: PPM order-6 solver should NOT succeed (wall not high enough)'); failed++; }
}
console.log(failed ? `\n${failed} check(s) failed` : '\nselftest OK');
process.exit(failed ? 1 : 0);
