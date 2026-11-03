// Verifier. Runs model-written JS in an isolated vm context, checks the round trip
// on data the model never saw, and measures bits per symbol.
// Contract the model must satisfy:
//   encode(symbols: number[]) -> string of '0'/'1' characters
//   decode(bits: string, n: number) -> number[]   (n = number of symbols)
import vm from 'node:vm';

export function evaluate(code, inst, { timeoutMs = 10000 } = {}) {
  const A = inst.A;
  const sandbox = { A, Math, Array, Number, String, Object, JSON, Map, Set, parseInt, parseFloat, isFinite, isNaN, console: { log() {} } };
  const ctx = vm.createContext(sandbox);
  try {
    vm.runInContext(code + '\n;this.__encode=encode;this.__decode=decode;', ctx, { timeout: timeoutMs });
  } catch (e) {
    return { ok: false, stage: 'load', error: String(e && e.message || e) };
  }
  const enc = sandbox.__encode, dec = sandbox.__decode;
  if (typeof enc !== 'function' || typeof dec !== 'function') return { ok: false, stage: 'load', error: 'encode/decode not defined as functions' };

  let bits;
  try {
    bits = vm.runInContext('__encode(__data)', Object.assign(ctx, { __data: inst.test.slice() }), { timeout: timeoutMs });
  } catch (e) { return { ok: false, stage: 'encode', error: String(e && e.message || e) }; }
  if (typeof bits !== 'string' || /[^01]/.test(bits)) return { ok: false, stage: 'encode', error: 'encode must return a string containing only 0 and 1' };

  let back;
  try {
    back = vm.runInContext('__decode(__bits, __n)', Object.assign(ctx, { __bits: bits, __n: inst.test.length }), { timeout: timeoutMs });
  } catch (e) { return { ok: false, stage: 'decode', error: String(e && e.message || e) }; }
  if (!Array.isArray(back) || back.length !== inst.test.length) return { ok: false, stage: 'verify', error: `decode returned ${Array.isArray(back) ? back.length : typeof back} items, expected ${inst.test.length}` };
  for (let i = 0; i < back.length; i++) {
    if (back[i] !== inst.test[i]) return { ok: false, stage: 'verify', error: `round trip mismatch at index ${i}: got ${back[i]}, expected ${inst.test[i]}` };
  }
  const bps = bits.length / inst.test.length;
  return {
    ok: true, bits: bits.length, bitsPerSym: bps,
    baseline: inst.baselineBitsPerSym, oracle: inst.oracleBitsPerSym,
    ratioToBaseline: bps / inst.baselineBitsPerSym, ratioToOracle: bps / inst.oracleBitsPerSym,
  };
}

// Pre-registered success criterion: beat fixed-length by at least 40%.
// With a uniform marginal this is impossible without finding the hidden structure.
export const SUCCESS_RATIO = 0.6;
export function isSuccess(r) { return r.ok && r.ratioToBaseline <= SUCCESS_RATIO; }
