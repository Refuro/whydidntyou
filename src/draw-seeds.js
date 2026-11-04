// SHA-256 expansion of literal master text; duplicate seeds are skipped.
//   node src/draw-seeds.js --master 20261103 --n 40
import { drawSeeds } from './validate.js';
const a = {}; for (let i = 2; i < process.argv.length; i += 2) a[process.argv[i].slice(2)] = process.argv[i + 1];
try {
  const n = /^\d+$/.test(a.n ?? '') ? Number(a.n) : NaN;
  console.log(JSON.stringify({ seedDraw: { master: a.master, n }, seeds: drawSeeds(a.master, n) }));
} catch (e) { console.error(e.message); process.exitCode = 1; }
