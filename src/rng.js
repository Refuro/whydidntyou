// Deterministic RNG so every domain instance is reproducible from a seed.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function randInt(rng, n) { return Math.floor(rng() * n); }
export function shuffle(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = randInt(rng, i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function derangement(rng, n) {
  // permutation with no fixed points, so "copy the earlier symbol" is never the rule
  for (;;) { const p = shuffle(rng, [...Array(n).keys()]); if (p.every((v, i) => v !== i)) return p; }
}
