// Minimal-nudge search. For a domain instance the model failed on, run short runs with
// hint level 1, 2, 3 ... (ordered least to most informative) and record the first level
// that flips failure to success. That level IS the measurement.
//   node src/hints.js --domain laggedRule --seed 1 --attempts 6 [--ladder hints/content-free.json] [--repeats 1]
import { readFileSync, appendFileSync } from 'node:fs';
import { runAttempts, parseArgs } from './run.js';

const a = parseArgs(process.argv.slice(2));
if (!a.domain) { console.error('usage: node src/hints.js --domain laggedRule --seed 1 --attempts 6 [--ladder file] [--repeats 1]'); process.exit(1); }
const ladder = JSON.parse(readFileSync(a.ladder || 'hints/content-free.json', 'utf8'));
const repeats = Number(a.repeats ?? 1);
const out = { type: 'hint-ladder', domain: a.domain, seed: a.seed ?? 1, ladder: a.ladder || 'hints/content-free.json', levels: [] };

for (let level = 0; level < ladder.length; level++) {
  let wins = 0; const runs = [];
  for (let r = 0; r < repeats; r++) {
    const res = await runAttempts({ domain: a.domain, seed: a.seed ?? 1, attempts: a.attempts ?? 6, hint: ladder[level], tag: `hintL${level + 1}r${r}`, quiet: true });
    runs.push(res.runId); if (res.success) wins++;
    console.log(`level ${level + 1} repeat ${r + 1}: ${res.success ? 'SUCCESS at attempt ' + res.success : 'no success'}  "${ladder[level]}"`);
  }
  out.levels.push({ level: level + 1, hint: ladder[level], wins, repeats, runs });
  if (wins === repeats) { out.minimalFlipLevel = level + 1; break; }
}
if (out.minimalFlipLevel == null) out.minimalFlipLevel = null;
appendFileSync('runs/hint-ladders.jsonl', JSON.stringify({ ...out, ts: new Date().toISOString() }) + '\n');
console.log(`\nminimal flip level: ${out.minimalFlipLevel ?? 'none (no hint in this ladder was enough)'}  -> runs/hint-ladders.jsonl`);
