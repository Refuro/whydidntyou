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

const MEMORY_LIMIT = 256 * 1024 * 1024, STACK_LIMIT = 64 * 1024; // 64 KB: below the WASM stack, so native recursion (JSON, parse) overflows INSIDE the sandbox; allows ~300 JS frames
const INTRINSICS = { ...DefaultIntrinsics, Date: false };

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
    let r = vm.evalCode(code, 'submission.js');
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

export async function evaluate(code, inst, { timeoutMs = 10000 } = {}) {
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
export function isSuccess(r) { return !!(r && r.ok && r.ratioToBaseline <= SUCCESS_RATIO); }
