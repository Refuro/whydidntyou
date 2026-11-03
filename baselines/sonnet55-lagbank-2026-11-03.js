// Winning program from runs/laggedRule-s1-claude-sonnet-5-5-1793729634271.jsonl attempt 3 (claude-sonnet-5-5, laggedRule v2, k=13): 0.995 bps.
// Kept as a regression baseline: any future laggedRule wall must report what THIS program scores on it.
function makePredictor() {
  const hist = [];
  const lagsets = [[]];
  for (let i = 1; i <= 24; i++) lagsets.push([i]);
  for (let i = 1; i <= 12; i++) for (let j = i + 1; j <= 12; j++) lagsets.push([i, j]);
  lagsets.push([1, 2, 3]);
  lagsets.push([1, 2, 3, 4]);
  const NM = lagsets.length + 1; // last = uniform
  const counts = lagsets.map(ls => new Float64Array(Math.pow(9, ls.length) * (A + 1)));
  const alphas = lagsets.map(ls => ls.length <= 1 ? 0.5 : (ls.length === 2 ? 0.3 : 0.15));
  const w = new Float64Array(NM).fill(1 / NM);
  const idx = new Array(lagsets.length).fill(0);
  function predict() {
    const n = hist.length;
    const p = new Array(A).fill(0);
    for (let m = 0; m < lagsets.length; m++) {
      const ls = lagsets[m];
      let key = 0;
      for (let t = 0; t < ls.length; t++) key = key * 9 + (n - ls[t] >= 0 ? hist[n - ls[t]] : 8);
      const base = key * (A + 1);
      idx[m] = base;
      const c = counts[m];
      const a = alphas[m];
      const den = c[base + A] + A * a;
      const wm = w[m] / den;
      for (let s = 0; s < A; s++) p[s] += wm * (c[base + s] + a);
    }
    const wu = w[NM - 1] / A;
    for (let s = 0; s < A; s++) p[s] += wu;
    return p;
  }
  function update(sym) {
    let sum = 0;
    for (let m = 0; m < lagsets.length; m++) {
      const c = counts[m];
      const base = idx[m];
      const a = alphas[m];
      const pr = (c[base + sym] + a) / (c[base + A] + A * a);
      w[m] *= pr;
      sum += w[m];
    }
    w[NM - 1] *= 1 / A;
    sum += w[NM - 1];
    const eps = 0.003;
    for (let m = 0; m < NM; m++) w[m] = (1 - eps) * (w[m] / sum) + eps / NM;
    for (let m = 0; m < lagsets.length; m++) {
      const c = counts[m];
      c[idx[m] + sym] += 1;
      c[idx[m] + A] += 1;
    }
    hist.push(sym);
  }
  return { predict, update };
}

function freqs(p) {
  const f = new Array(A);
  let tot = 0;
  let ps = 0;
  for (let s = 0; s < A; s++) ps += p[s];
  for (let s = 0; s < A; s++) { f[s] = 1 + Math.floor(p[s] / ps * 60000); tot += f[s]; }
  return [f, tot];
}

function encode(symbols) {
  const pr = makePredictor();
  const out = [];
  let low = 0, high = 0xFFFFFFFF, pending = 0;
  const HALF = 0x80000000, Q = 0x40000000;
  function emit(b) {
    out.push(b);
    const o = (b === '1') ? '0' : '1';
    while (pending > 0) { out.push(o); pending--; }
  }
  for (let i = 0; i < symbols.length; i++) {
    const s = symbols[i];
    const [f, tot] = freqs(pr.predict());
    let cl = 0;
    for (let k = 0; k < s; k++) cl += f[k];
    const ch = cl + f[s];
    const range = high - low + 1;
    high = low + Math.floor(range * ch / tot) - 1;
    low = low + Math.floor(range * cl / tot);
    for (;;) {
      if (high < HALF) emit('0');
      else if (low >= HALF) { emit('1'); low -= HALF; high -= HALF; }
      else if (low >= Q && high < HALF + Q) { pending++; low -= Q; high -= Q; }
      else break;
      low = low * 2; high = high * 2 + 1;
    }
    pr.update(s);
  }
  pending++;
  if (low < Q) emit('0'); else emit('1');
  return out.join('');
}

function decode(bits, n) {
  const pr = makePredictor();
  let pos = 0;
  function nb() { return pos < bits.length ? (bits.charCodeAt(pos++) - 48) : 0; }
  let low = 0, high = 0xFFFFFFFF, value = 0;
  const HALF = 0x80000000, Q = 0x40000000;
  for (let i = 0; i < 32; i++) value = value * 2 + nb();
  const res = [];
  for (let i = 0; i < n; i++) {
    const [f, tot] = freqs(pr.predict());
    const range = high - low + 1;
    const target = Math.floor(((value - low + 1) * tot - 1) / range);
    let s = 0, cl = 0;
    while (s < A - 1 && cl + f[s] <= target) { cl += f[s]; s++; }
    const ch = cl + f[s];
    high = low + Math.floor(range * ch / tot) - 1;
    low = low + Math.floor(range * cl / tot);
    for (;;) {
      if (high < HALF) { }
      else if (low >= HALF) { low -= HALF; high -= HALF; value -= HALF; }
      else if (low >= Q && high < HALF + Q) { low -= Q; high -= Q; value -= Q; }
      else break;
      low = low * 2; high = high * 2 + 1; value = value * 2 + nb();
    }
    res.push(s);
    pr.update(s);
  }
  return res;
}
