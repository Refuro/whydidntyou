// MAIN domain family: "lagged rule" source.
// s[i] = g(s[i-k]) with probability p, otherwise a uniformly random symbol.
// g is a derangement of the alphabet, so the marginal distribution is ~uniform:
// order-0 (frequency) coding gains nothing, adjacent-context (order-1) coding gains
// nothing when k > 1. The ONLY way to compress is to discover the lag k and the map g.
import { mulberry32, randInt, derangement } from '../rng.js';

export const name = 'laggedRule';

export function make(seed, opts = {}) {
  const A = opts.A ?? 8;
  const p = opts.p ?? 0.85;
  const n = opts.n ?? 4000;
  const rng = mulberry32(seed * 7919 + 17);
  const k = opts.k ?? 2 + randInt(rng, 6);      // lag in [2,7]
  const g = derangement(rng, A);

  const gen = (len, r) => {
    const s = [];
    for (let i = 0; i < len; i++) {
      if (i >= k && r() < p) s.push(g[s[i - k]]); else s.push(randInt(r, A));
    }
    return s;
  };
  const sample = gen(n, rng);                       // shown to the model
  const test = gen(n, mulberry32(seed * 104729 + 3)); // scored, never shown

  const oracleBits = (s) => {
    const pm = p + (1 - p) / A, po = (1 - p) / A;
    let bits = 0;
    for (let i = 0; i < s.length; i++) {
      if (i < k) bits += Math.log2(A);
      else bits -= Math.log2(s[i] === g[s[i - k]] ? pm : po);
    }
    return bits;
  };

  return {
    family: name, seed, A, n,
    secret: { k, g, p },
    sample, test,
    baselineBitsPerSym: Math.ceil(Math.log2(A)),
    oracleBitsPerSym: oracleBits(test) / test.length,
    // What the model is told. Deliberately says nothing about lags, maps or noise.
    description:
`You are given a sequence of ${n} symbols, each an integer in [0, ${A - 1}]. The sequence was produced by an unknown process. Your goal is to write a lossless compressor for sequences from this process that uses as few bits as possible. A fresh sequence from the same process (not the one you can see) will be encoded with your code and the bit count measured. The trivial fixed-length encoding costs ${Math.ceil(Math.log2(A))} bits per symbol.`,
    // What is revealed after failure.
    reveal:
`The process: each symbol s[i] equals g(s[i-${k}]) with probability ${p}, where g is this fixed permutation of the alphabet: ${JSON.stringify(g)}. Otherwise s[i] is uniformly random. So the dependency is at lag ${k}, not on the previous symbol. A compressor that (1) checks whether s[i] matches the prediction g(s[i-${k}]) and emits one flag bit, then (2) emits the symbol only on a miss, gets ~1.4 bits/symbol; adaptive arithmetic coding on the same model approaches the oracle (~${(oracleBits(test) / test.length).toFixed(2)} bits/symbol).`,
  };
}

// Reference solver that knows the secret. Used by selftest to confirm the scorer works.
export function referenceCode(inst) {
  const { k, g } = inst.secret; const A = inst.A; const w = Math.ceil(Math.log2(A));
  return `
const K=${k}, G=${JSON.stringify(g)}, A=${A}, W=${w};
function encode(s){let out='';for(let i=0;i<s.length;i++){if(i<K){out+=s[i].toString(2).padStart(W,'0');continue;}
 const pred=G[s[i-K]]; if(s[i]===pred){out+='1';}else{out+='0'+s[i].toString(2).padStart(W,'0');}} return out;}
function decode(bits,n){const s=[];let pos=0;for(let i=0;i<n;i++){if(i<K){s.push(parseInt(bits.slice(pos,pos+W),2));pos+=W;continue;}
 if(bits[pos++]==='1'){s.push(G[s[i-K]]);}else{s.push(parseInt(bits.slice(pos,pos+W),2));pos+=W;}} return s;}`;
}
