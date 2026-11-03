// HELD-OUT domain family: "hidden period" source. Use this ONLY for the transfer test.
// A secret key K of length L. s[i] = K[i mod L] with probability p, else uniform random.
// Marginal is ~uniform. The key move is position-dependence (i mod L), not symbol-dependence.
// History: v1 used L in [11,30], p=0.85. Stock PPM order-6 scored 0.63 of baseline there (near the
// 0.60 success line) because short periods recur ~130 times in 4000 symbols and long contexts
// memorize them. v2 uses L in [200,400], p=0.8: PPM scores ~0.9, reference ~0.5 (see prereg addendum).
import { mulberry32, randInt } from '../rng.js';
import { assertSeed } from '../validate.js';
import { createHash } from 'node:crypto';

export const VERSION = 'hiddenPeriod-v2';
export const name = 'hiddenPeriod';

export function make(seed, opts = {}) {
  assertSeed(seed);
  const A = opts.A ?? 8;
  const p = opts.p ?? 0.8;
  const n = opts.n ?? 4000;
  const rng = mulberry32(seed * 6271 + 29);
  const L = opts.L ?? 200 + randInt(rng, 201);    // period in [200,400]: few repeats in 4000 symbols, so context models can't memorize it
  const K = Array.from({ length: L }, () => randInt(rng, A));

  const gen = (len, r) => Array.from({ length: len }, (_, i) => (r() < p ? K[i % L] : randInt(r, A)));
  const sample = gen(n, rng);
  const test = gen(n, mulberry32(seed * 15485863 + 5));

  const oracleBits = (s) => {
    const pm = p + (1 - p) / A, po = (1 - p) / A;
    let bits = 0;
    for (let i = 0; i < s.length; i++) bits -= Math.log2(s[i] === K[i % L] ? pm : po);
    return bits + L * Math.log2(A); // plus the cost of transmitting K
  };

  return {
    family: name, generatorVersion: VERSION, seed, A, n,
    secret: { L, K, p },
    sample, test,
    instanceDigest: createHash('sha256').update(JSON.stringify([name, VERSION, seed, opts, sample, test])).digest('hex'),
    baselineBitsPerSym: Math.ceil(Math.log2(A)),
    oracleBitsPerSym: oracleBits(test) / test.length,
    description:
`You are given a sequence of ${n} symbols, each an integer in [0, ${A - 1}]. The sequence was produced by an unknown process. Your goal is to write a lossless compressor for sequences from this process that uses as few bits as possible. A fresh sequence from the same process (not the one you can see) will be encoded with your code and the bit count measured. The trivial fixed-length encoding costs ${Math.ceil(Math.log2(A))} bits per symbol.`,
    reveal:
`The process: there is a hidden key K of length ${L}: ${JSON.stringify(K)}. Each symbol s[i] equals K[i mod ${L}] with probability ${p}; otherwise it is uniformly random. The dependency is on POSITION (i mod ${L}), not on earlier symbols. A compressor that transmits K once, then emits a flag bit per symbol (match / miss) and the symbol only on a miss, gets ~1.4 bits/symbol.`,
  };
}

export function referenceCode(inst) {
  const { L, K } = inst.secret; const A = inst.A; const w = Math.ceil(Math.log2(A));
  return `
const L=${L}, K=${JSON.stringify(K)}, W=${w};
function encode(s){let out='';for(let i=0;i<s.length;i++){if(s[i]===K[i%L])out+='1';else out+='0'+s[i].toString(2).padStart(W,'0');}return out;}
function decode(bits,n){const s=[];let pos=0;for(let i=0;i<n;i++){if(bits[pos++]==='1')s.push(K[i%L]);else{s.push(parseInt(bits.slice(pos,pos+W),2));pos+=W;}}return s;}`;
}
