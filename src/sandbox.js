// Verifier. Encoder and decoder run in SEPARATE vm contexts: the decoder receives only the
// submitted program text, the counted bitstring, n and A. It cannot see the encoder's state
// or the original data, so the only channel between them is the bits we count.
// (node:vm is an isolation convenience, not a security boundary; this is a non-adversarial
// setting with a regression test for the obvious side channel. Do not run untrusted code here.)
// Contract the model must satisfy:
//   encode(symbols: number[]) -> string of '0'/'1' characters
//   decode(bits: string, n: number) -> number[]   (n = number of symbols)
import vm from 'node:vm';

function freshContext(A) {
  return vm.createContext({ A, Math, Array, Number, String, Object, JSON, Map, Set, parseInt, parseFloat, isFinite, isNaN, console: { log() {} } });
}
function load(code, ctx, timeoutMs) {
  vm.runInContext(code + '\n;this.__encode=typeof encode==="function"?encode:null;this.__decode=typeof decode==="function"?decode:null;', ctx, { timeout: timeoutMs });
}

export function evaluate(code, inst, { timeoutMs = 10000 } = {}) {
  const A = inst.A, data = inst.test;
  // --- encode side
  const encCtx = freshContext(A);
  try { load(code, encCtx, timeoutMs); } catch (e) { return { ok: false, stage: 'load', error: String(e && e.message || e) }; }
  if (!encCtx.__encode || !encCtx.__decode) return { ok: false, stage: 'load', error: 'encode/decode not defined as functions' };
  let bits;
  try { encCtx.__data = data.slice(); bits = vm.runInContext('__encode(__data)', encCtx, { timeout: timeoutMs }); }
  catch (e) { return { ok: false, stage: 'encode', error: String(e && e.message || e) }; }
  if (typeof bits !== 'string' || /[^01]/.test(bits)) return { ok: false, stage: 'encode', error: 'encode must return a string containing only 0 and 1' };

  // --- decode side: a fresh context that has never seen the data or the encoder's variables
  const decCtx = freshContext(A);
  try { load(code, decCtx, timeoutMs); } catch (e) { return { ok: false, stage: 'load', error: String(e && e.message || e) }; }
  let back;
  try { decCtx.__bits = bits; decCtx.__n = data.length; back = vm.runInContext('__decode(__bits, __n)', decCtx, { timeout: timeoutMs }); }
  catch (e) { return { ok: false, stage: 'decode', error: String(e && e.message || e) }; }
  if (!Array.isArray(back) || back.length !== data.length) return { ok: false, stage: 'verify', error: `decode returned ${Array.isArray(back) ? back.length : typeof back} items, expected ${data.length}` };
  for (let i = 0; i < back.length; i++) if (back[i] !== data[i]) return { ok: false, stage: 'verify', error: `round trip mismatch at index ${i}: got ${back[i]}, expected ${data[i]}` };

  const bps = bits.length / data.length;
  return { ok: true, bits: bits.length, bitsPerSym: bps, baseline: inst.baselineBitsPerSym, oracle: inst.oracleBitsPerSym, ratioToBaseline: bps / inst.baselineBitsPerSym, ratioToOracle: bps / inst.oracleBitsPerSym };
}

export const SUCCESS_RATIO = 0.6;
export function isSuccess(r) { return r.ok && r.ratioToBaseline <= SUCCESS_RATIO; }
