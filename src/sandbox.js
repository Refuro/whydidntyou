// Verifier on a WebAssembly-hosted JavaScript interpreter (QuickJS via quickjs-emscripten).
// Why: a WASM module has no I/O unless the host imports one, and we import none. There is no
// filesystem, process, environment, network or clock inside the sandbox, so the ONLY channel from
// the encoder to the decoder is the counted bitstring the host carries across. Each side runs in
// its own WASM module instance (separate linear memory). Timeouts use the interpreter's interrupt
// handler; memory and stack are capped by the runtime. Every value crossing the boundary is a
// string built inside the sandbox and parsed on the host; the host never calls into sandbox objects.
// Residual risk: a memory-safety escape from the WASM sandbox itself (the same boundary browsers
// rely on). Nothing in the submitted program's power can widen the channel.
//   encode(symbols: number[]) -> string of '0'/'1'
//   decode(bits: string, n: number) -> number[]
import { newQuickJSWASMModule, shouldInterruptAfterDeadline } from 'quickjs-emscripten';

const MEMORY_LIMIT = 256 * 1024 * 1024, STACK_LIMIT = 4 * 1024 * 1024;

// Prelude evaluated before submitted code: freeze the clock (no timing channel), keep everything else ECMAScript.
const PRELUDE = `
(function(){
  const fixed = 0;
  const FD = function Date(...a){ return a.length ? new (Function.prototype.bind.apply(__OrigDate, [null, ...a])) : new __OrigDate(fixed); };
  FD.now = () => fixed; FD.parse = __OrigDate.parse; FD.UTC = __OrigDate.UTC; FD.prototype = __OrigDate.prototype;
  Object.defineProperty(globalThis, 'Date', { value: FD, writable: false, configurable: false });
  globalThis.A = __A;
})();`;

// Everything is checked INSIDE the sandbox and reported as a JSON string.
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
  const Q = await newQuickJSWASMModule();            // fresh WASM instance per side
  const rt = Q.newRuntime(); rt.setMemoryLimit(MEMORY_LIMIT); rt.setMaxStackSize(STACK_LIMIT);
  const deadline = Date.now() + timeoutMs; rt.setInterruptHandler(shouldInterruptAfterDeadline(deadline));
  const vm = rt.newContext();
  const setStr = (k, s) => { const h = vm.newString(s); vm.setProp(vm.global, k, h); h.dispose(); };
  const setNum = (k, x) => { const h = vm.newNumber(x); vm.setProp(vm.global, k, h); h.dispose(); };
  const dumpStr = (handle) => { const v = vm.dump(handle); handle.dispose(); return v; };
  try {
    setNum('__A', A);
    { const od = vm.getProp(vm.global, 'Date'); vm.setProp(vm.global, '__OrigDate', od); od.dispose(); }
    let r = vm.evalCode(PRELUDE); if (r.error) { r.error.dispose(); return { ok: false, stage: 'load', error: 'prelude failed' }; } r.value.dispose();
    r = vm.evalCode(code, 'submission.js');
    if (r.error) { rt.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + 200)); const e = dumpStr(r.error); return { ok: false, stage: 'load', error: errText(e) }; }
    r.value.dispose();
    if (mode === 'encode') setStr('__dataJson', dataJson); else { setStr('__bits', bits); setNum('__n', n); }
    r = vm.evalCode(WRAP(mode), 'wrap.js');
    if (r.error) { rt.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + 200)); const e = dumpStr(r.error); return { ok: false, stage: mode, error: errText(e) }; }
    const out = dumpStr(r.value);
    if (typeof out !== 'string') return { ok: false, stage: mode, error: 'sandbox produced a non-string result' };
    let parsed; try { parsed = JSON.parse(out); } catch { return { ok: false, stage: mode, error: 'sandbox produced non-JSON' }; }
    if (!parsed || typeof parsed.ok !== 'boolean') return { ok: false, stage: mode, error: 'sandbox produced malformed result' };
    return parsed;
  } finally { try { vm.dispose(); } catch {} try { rt.dispose(); } catch {} }
}
function errText(e) { if (e && typeof e === 'object') return `${e.name || 'Error'}: ${String(e.message || '').slice(0, 300)}`; return String(e).slice(0, 300); }

export async function evaluate(code, inst, { timeoutMs = 10000 } = {}) {
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
}

export const SUCCESS_RATIO = 0.6;
export function isSuccess(r) { return r.ok && r.ratioToBaseline <= SUCCESS_RATIO; }
