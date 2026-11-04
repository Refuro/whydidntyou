// Registered seed draw for confirmatory batches: n distinct seeds, uniform without replacement from [0, 2^32-1],
// from a published master seed. The config records {seedDraw: {master, n}} and the exact list; validateConfig
// recomputes the draw and refuses a config whose seed list differs.
//   node src/draw-seeds.js --master 20261103 --n 40
import { drawSeeds } from './validate.js';
const a = {}; for (let i = 2; i < process.argv.length; i += 2) a[process.argv[i].slice(2)] = Number(process.argv[i + 1]);
if (!Number.isInteger(a.master) || !Number.isInteger(a.n)) { console.error('usage: node src/draw-seeds.js --master <int> --n <int>'); process.exit(1); }
console.log(JSON.stringify({ seedDraw: { master: a.master, n: a.n }, seeds: drawSeeds(a.master, a.n) }));
