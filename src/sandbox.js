// Verifier on a WebAssembly-hosted JavaScript interpreter (QuickJS via quickjs-emscripten).
// A WASM module can only affect the world through imports the host provides; we provide none, and
// the interpreter's own built-ins are the only facilities inside. The Date intrinsic is NOT created
// (the v5 review showed a timing channel through a retained Date constructor), so the sandbox has no
// clock. Each side runs in its own WASM instance; the only encoder→decoder channel is the counted
// bitstring. Timeouts: interrupt handler (cooperative) — callers that promise hard wall time must add
// an external supervisor. Memory and stack are capped below the WASM stack so overflow is an
// in-sandbox error. Every boundary value is a string built inside the sandbox; the host parses it and
// never calls into sandbox objects. Every host-side failure is caught and returned as a bounded
// failure result; evaluate() never throws.
//   encode(symbols: number[]) -> string of '0'/'1'
//   decode(bits: string, n: number) -> number[]
import { newQuickJSWASMModule, shouldInterruptAfterDeadline, DefaultIntrinsics } from 'quickjs-emscripten';

const MEMORY_LIMIT = 256 * 1024 * 1024, STACK_LIMIT = 64 * 1024;
// Randomness policy: QuickJS seeds Math.random from host time at runtime creation (verified on the
// pinned build: two instances created 1.2 s apart give different sequences; upstream QuickJS seeds from
// gettimeofday, which we treat as the likely cause without having verified the WASM build's source), which is ambient
// information. Before any submitted code runs, Math.random is replaced by a fixed-seed xorshift128
// generator (32-bit lanes) and locked (non-writable, non-configurable). Submitted programs may still use
// Math.random; every instance sees the identical sequence.
const PRELUDE = `
(function(){
  let s0 = 0x9E3779B9 | 0, s1 = 0x7F4A7C15 | 0, s2 = 0xF39CC060 | 0, s3 = 0x5CEDC834 | 0;
  function next(){ // xorshift128 (32-bit lanes), fixed seed
    let t = s3; t ^= t << 11; t ^= t >>> 8; s3 = s2; s2 = s1; s1 = s0; t ^= s0; t ^= s0 >>> 19; s0 = t;
    return (t >>> 0) / 4294967296;
  }
  Object.defineProperty(Math, 'random', { value: next, writable: false, configurable: false, enumerable: false });
})();`; // 64 KB: below the WASM stack, so native recursion (JSON, parse) overflows INSIDE the sandbox; allows ~300 JS frames
const INTRINSICS = { ...DefaultIntrinsics, Date: false };

// Reuse the interpreter module, never a runtime, context, or submission state.
let pairModule,pairModuleColdMs;
export async function initializePairSandbox(){
  const started=performance.now(),cold=!pairModule;pairModule??=newQuickJSWASMModule();await pairModule;
  const actualMs=performance.now()-started;if(cold)pairModuleColdMs=actualMs;
  return {actualMs,coldStartEstimateMs:pairModuleColdMs};
}
export async function runPairStage(code,input,timeoutMs){
  const started=performance.now();let rt,vm;
  try{
    const expected=input.op==='fit'?['op','publicEvidence']:input.op==='predict'?['a','b','op','state']:[];
    if(!expected.length||Object.keys(input).sort().join('|')!==expected.join('|'))throw new Error('invalid stage input');
    if(typeof code!=='string'||code.length>2_000_000)throw new Error('invalid program size');
    const Q=await pairModule; if(!Q)throw new Error('pair sandbox not initialized');
    rt=Q.newRuntime();rt.setMemoryLimit(MEMORY_LIMIT);rt.setMaxStackSize(STACK_LIMIT);
    rt.setInterruptHandler(shouldInterruptAfterDeadline(Date.now()+timeoutMs));
    vm=rt.newContext({intrinsics:INTRINSICS});
    for(const [s,file]of [[PRELUDE,'prelude.js'],[code,'submission.js']]){
      const r=vm.evalCode(s,file);if(r.error){r.error.dispose();return {ok:false,error:'program failed to load'};}r.value.dispose();
    }
    const h=vm.newString(JSON.stringify(input));vm.setProp(vm.global,'__stageInput',h);h.dispose();
    const r=vm.evalCode(`(function(){try{const x=JSON.parse(__stageInput);delete globalThis.__stageInput;const value=x.op==='fit'?fit(x.publicEvidence):predict(x.state,x.a,x.b);if(typeof value!==(x.op==='fit'?'string':'boolean'))return JSON.stringify({ok:false,error:'fit must return a string; predict must return a boolean'});return JSON.stringify({ok:true,value,counters:typeof memberCounters==='object'?memberCounters:null});}catch(e){return JSON.stringify({ok:false,error:String(e).slice(0,300)});}})()`,'stage.js');
    if(r.error){r.error.dispose();return {ok:false,error:'stage failed within time/memory budget'};}
    let out;try{out=vm.getString(r.value);}finally{r.value.dispose();}
    const result=JSON.parse(out);
    if(performance.now()-started>timeoutMs)return {ok:false,error:'stage wall-clock budget exhausted'};
    return result;
  }catch(e){return {ok:false,error:String(e?.message??e).slice(0,300)};}
  finally{try{vm?.dispose();}catch{}try{rt?.dispose();}catch{}}
}

const WRAP = (mode) => `
(function(){
  function msg(e){ try { if (e && typeof e === 'object') { const d = Object.getOwnPropertyDescriptor(e, 'message'); if (d && 'value' in d && typeof d.value === 'string') return d.value.slice(0, 300); return Object.prototype.toString.call(e).slice(0, 100); } return String(e).slice(0, 300); } catch { return 'unprintable error'; } }
  try {
    if (typeof encode !== 'function' || typeof decode !== 'function') return JSON.stringify({ ok: false, stage: 'load', error: 'encode/decode not defined as functions' });
    ${mode === 'encode'
      ? `const r = encode(JSON.parse(__dataJson)); if (typeof r !== 'string') return JSON.stringify({ ok: false, stage: 'encode', error: 'encode must return a string' }); if (/[^01]/.test(r)) return JSON.stringify({ ok: false, stage: 'encode', error: 'encode must return a string containing only 0 and 1' }); return JSON.stringify({ ok: true, bits: r });`
      : `const r = decode(__bits, __n); const len = Number(r && r.length); if (!Number.isFinite(len) || len < 0 || len > 10000000) return JSON.stringify({ ok: false, stage: 'decode', error: 'decode returned a non-array' }); const a = new Array(len); for (let i = 0; i < len; i++) { const v = Number(r[i]); if (!Number.isInteger(v)) return JSON.stringify({ ok: false, stage: 'decode', error: 'decode returned a non-integer at ' + i }); a[i] = v; } return JSON.stringify({ ok: true, symbols: a });`}
  } catch (e) { return JSON.stringify({ ok: false, stage: '${mode}', error: msg(e) }); }
})()`;

export async function runSide(code, mode, { A, dataJson, bits, n }, timeoutMs) {
  let Q, rt, vm;
  try {
    Q = await newQuickJSWASMModule();
    rt = Q.newRuntime(); rt.setMemoryLimit(MEMORY_LIMIT); rt.setMaxStackSize(STACK_LIMIT);
    rt.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + timeoutMs));
    vm = rt.newContext({ intrinsics: INTRINSICS });
    const setStr = (k, s) => { const h = vm.newString(s); vm.setProp(vm.global, k, h); h.dispose(); };
    const setNum = (k, x) => { const h = vm.newNumber(x); vm.setProp(vm.global, k, h); h.dispose(); };
    const dumpStr = (handle) => { try { const v = vm.dump(handle); return v; } finally { handle.dispose(); } };
    setNum('A', A);
    let r = vm.evalCode(PRELUDE, 'prelude.js');
    if (r.error) { r.error.dispose(); return { ok: false, stage: 'load', error: 'prelude failed' }; } r.value.dispose();
    r = vm.evalCode(code, 'submission.js');
    if (r.error) { rt.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + 200)); return { ok: false, stage: 'load', error: errText(dumpStr(r.error)) }; }
    r.value.dispose();
    if (mode === 'encode') setStr('__dataJson', dataJson); else { setStr('__bits', bits); setNum('__n', n); }
    r = vm.evalCode(WRAP(mode), 'wrap.js');
    if (r.error) { rt.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + 200)); return { ok: false, stage: mode, error: errText(dumpStr(r.error)) }; }
    const out = dumpStr(r.value);
    if (typeof out !== 'string') return { ok: false, stage: mode, error: 'sandbox produced a non-string result' };
    let parsed; try { parsed = JSON.parse(out); } catch { return { ok: false, stage: mode, error: 'sandbox produced non-JSON' }; }
    if (!parsed || typeof parsed.ok !== 'boolean') return { ok: false, stage: mode, error: 'sandbox produced malformed result' };
    return parsed;
  } catch (e) {
    // Host-boundary failure (interpreter trap, FFI error, allocation failure in the WASM instance). Bounded, never thrown.
    return { ok: false, stage: mode, error: 'host boundary: ' + String(e && e.message || e).slice(0, 200) };
  } finally {
    try { vm && vm.dispose(); } catch {} try { rt && rt.dispose(); } catch {}
  }
}
function errText(e) { try { if (e && typeof e === 'object') return `${e.name || 'Error'}: ${String(e.message || '').slice(0, 300)}`; return String(e).slice(0, 300); } catch { return 'unprintable error'; } }

export async function evaluateCompression(code, inst, { timeoutMs = 10000 } = {}) {
  try {
    if (typeof code !== 'string' || code.length > 2_000_000) return { ok: false, stage: 'load', error: 'code missing or too large' };
    const A = inst.A, data = inst.test;
    const e = await runSide(code, 'encode', { A, dataJson: JSON.stringify(data) }, timeoutMs);
    if (!e.ok) return { ok: false, stage: e.stage || 'encode', error: String(e.error).slice(0, 500) };
    const bits = e.bits;
    if (typeof bits !== 'string' || /[^01]/.test(bits)) return { ok: false, stage: 'encode', error: 'encode must return a string containing only 0 and 1' };
    const d = await runSide(code, 'decode', { A, bits, n: data.length }, timeoutMs);
    if (!d.ok) return { ok: false, stage: d.stage || 'decode', error: String(d.error).slice(0, 500) };
    const back = d.symbols;
    if (!Array.isArray(back) || back.length !== data.length) return { ok: false, stage: 'verify', error: `decode returned ${Array.isArray(back) ? back.length : typeof back} items, expected ${data.length}` };
    for (let i = 0; i < back.length; i++) if (back[i] !== data[i]) return { ok: false, stage: 'verify', error: `round trip mismatch at index ${i}: got ${back[i]}, expected ${data[i]}` };
    const bps = bits.length / data.length;
    return { ok: true, bits: bits.length, bitsPerSym: bps, baseline: inst.baselineBitsPerSym, oracle: inst.oracleBitsPerSym, ratioToBaseline: bps / inst.baselineBitsPerSym, ratioToOracle: bps / inst.oracleBitsPerSym };
  } catch (e) { return { ok: false, stage: 'verify', error: 'host boundary: ' + String(e && e.message || e).slice(0, 200) }; }
}

export const SUCCESS_RATIO = 0.6;
export const compressionContract = Object.freeze({ name: 'compression', score: evaluateCompression });
export async function evaluate(code, inst, options = {}) {
  try {
    if (typeof code !== 'string' || code.length > 2_000_000) return { ok: false, stage: 'load', error: 'code missing or too large' };
    return await (inst.contract ?? compressionContract).score(code, inst, { ...options, runProgram });
  } catch (e) { return { ok: false, stage: 'verify', error: 'host boundary: ' + String(e?.message || e).slice(0,200) }; }
}
export { isSuccess } from './result-contract.js';

// Generic contract call: fresh canonical state for EACH pair or quantity state.
// Only the unlabelled arguments enter the sandbox. The caller owns the total budget.
export async function runProgram(code, input, timeoutMs) {
  let rt, vm;
  try {
    const Q = await newQuickJSWASMModule(); rt = Q.newRuntime();
    rt.setMemoryLimit(MEMORY_LIMIT); rt.setMaxStackSize(STACK_LIMIT);
    rt.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + timeoutMs));
    vm = rt.newContext({ intrinsics: INTRINSICS });
    for (const [source, file] of [[PRELUDE,'prelude.js'],[code,'submission.js']]) {
      const r = vm.evalCode(source,file); if (r.error) { r.error.dispose(); return {ok:false,stage:'load',error:'submission failed to load within budget'}; } r.value.dispose();
    }
    const h = vm.newString(JSON.stringify(input)); vm.setProp(vm.global,'__inputJson',h); h.dispose();
    const r = vm.evalCode(`(function(){const x=JSON.parse(__inputJson);let value;
      if(x.op==='inspect')value={hasReachable:typeof reachable==='function',hasQuantity:typeof quantity==='function',fold:typeof quantityFold==='undefined'?null:quantityFold};
      else if(x.op==='reachable')value=reachable(x.a,x.b);
      else if(x.op==='quantity')value=quantity(x.state);
      else throw new Error('unknown contract operation');
      return JSON.stringify({ok:true,value});})()`, 'contract.js');
    if(r.error){r.error.dispose();return {ok:false,stage:'verify',error:'contract evaluation failed within budget'};}
    const out=vm.dump(r.value);r.value.dispose();
    if(typeof out!=='string')return {ok:false,stage:'verify',error:'contract produced non-string output'};
    const parsed=JSON.parse(out);if(parsed?.ok!==true||!Object.hasOwn(parsed,'value'))return {ok:false,stage:'verify',error:'contract produced invalid output'};
    return parsed;
  } catch(e) { return {ok:false,stage:'verify',error:'host boundary: '+String(e?.message||e).slice(0,200)}; }
  finally {try{vm?.dispose();}catch{}try{rt?.dispose();}catch{}}
}
