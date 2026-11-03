// Verifier. Encoder and decoder run in SEPARATE vm contexts, each with its own intrinsics
// (nothing from the host is injected except the alphabet size and a no-op console), and every
// value crossing the boundary is serialized INSIDE the timed context and parsed as plain data on
// the host. The only channel from encoder to decoder is the counted bitstring.
// node:vm is an isolation convenience, not a security boundary (Node docs say so). This harness is
// for non-adversarial model outputs; regression tests cover the known side channels. Do not run
// hostile code here without a process-level sandbox.
//   encode(symbols: number[]) -> string of '0'/'1'
//   decode(bits: string, n: number) -> number[]
import vm from 'node:vm';

const PRELUDE = (code) => `
"use strict";
${code}
;(function(){
  if (typeof encode !== 'function' || typeof decode !== 'function') throw new Error('encode/decode not defined as functions');
  globalThis.__encode = encode; globalThis.__decode = decode;
})();`;

function fresh(A) {
  // createContext with a plain object: the context gets its OWN Math/Array/Object/JSON, not the host's.
  return vm.createContext({ A, console: { log() {} } });
}
function runTimed(ctx, src, timeoutMs) { return vm.runInContext(src, ctx, { timeout: timeoutMs }); }

export function evaluate(code, inst, { timeoutMs = 10000 } = {}) {
  const A = inst.A, data = inst.test;

  // --- encoder context
  const enc = fresh(A);
  try { runTimed(enc, PRELUDE(code), timeoutMs); } catch (e) { return { ok: false, stage: 'load', error: msg(e) }; }
  let bits;
  try {
    enc.__dataJson = JSON.stringify(data);
    // Coerce to string inside the context; the host receives a primitive string.
    bits = runTimed(enc, 'String(__encode(JSON.parse(__dataJson)))', timeoutMs);
  } catch (e) { return { ok: false, stage: 'encode', error: msg(e) }; }
  if (typeof bits !== 'string' || /[^01]/.test(bits)) return { ok: false, stage: 'encode', error: 'encode must return a string containing only 0 and 1' };

  // --- decoder context: fresh intrinsics, has never seen the data or the encoder's globals
  const dec = fresh(A);
  try { runTimed(dec, PRELUDE(code), timeoutMs); } catch (e) { return { ok: false, stage: 'load', error: msg(e) }; }
  let backJson;
  try {
    dec.__bits = bits; dec.__n = data.length;
    // Serialize inside the context: proxies/getters are exercised under the timeout, not on the host.
    backJson = runTimed(dec, 'JSON.stringify(Array.from(__decode(__bits, __n), x => Number(x)))', timeoutMs);
  } catch (e) { return { ok: false, stage: 'decode', error: msg(e) }; }
  let back;
  try { back = JSON.parse(backJson); } catch { return { ok: false, stage: 'decode', error: 'decode result was not serializable' }; }
  if (!Array.isArray(back) || back.length !== data.length) return { ok: false, stage: 'verify', error: `decode returned ${Array.isArray(back) ? back.length : typeof back} items, expected ${data.length}` };
  for (let i = 0; i < back.length; i++) if (back[i] !== data[i]) return { ok: false, stage: 'verify', error: `round trip mismatch at index ${i}: got ${back[i]}, expected ${data[i]}` };

  const bps = bits.length / data.length;
  return { ok: true, bits: bits.length, bitsPerSym: bps, baseline: inst.baselineBitsPerSym, oracle: inst.oracleBitsPerSym, ratioToBaseline: bps / inst.baselineBitsPerSym, ratioToOracle: bps / inst.oracleBitsPerSym };
}
function msg(e) { return String(e && e.message || e).slice(0, 500); }

export const SUCCESS_RATIO = 0.6;
export function isSuccess(r) { return r.ok && r.ratioToBaseline <= SUCCESS_RATIO; }
