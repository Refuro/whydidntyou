// Hint-effect experiment. For one instance, runs EVERY rung of a hint ladder with the same number of
// repeats, alongside two controls with the same attempt budget: no hint, and a neutral instruction.
// Reports success rate per rung and the difference from the no-hint control. No early stopping, no
// "first rung to go 3/3": that selection rule fires by chance ~60% of the time with 7 ineffective rungs.
// Select promising rungs on development worlds; confirm on fresh worlds before reporting an effect.
//   node src/hints.js --domain laggedRule --seed 1 --attempts 6 --repeats 5 [--k 36] [--ladder hints/content-free.json]
import { readFileSync, appendFileSync } from 'node:fs';
import { runAttempts, parseArgs } from './run.js';

const a = parseArgs(process.argv.slice(2));
if (!a.domain) { console.error('usage: node src/hints.js --domain laggedRule --seed 1 --attempts 6 --repeats 5 [--k N] [--ladder file]'); process.exit(1); }
const ladder = JSON.parse(readFileSync(a.ladder || 'hints/content-free.json', 'utf8'));
const repeats = Number(a.repeats ?? 3);
const opts = a.k ? { k: Number(a.k) } : {};
const NEUTRAL = 'Take your time and think carefully before each attempt.';
const arms = [{ id: 'control-nohint', hint: null }, { id: 'control-neutral', hint: NEUTRAL }, ...ladder.map((h, i) => ({ id: `rung${i + 1}`, hint: h }))];

const out = { type: 'hint-effects', domain: a.domain, seed: a.seed ?? 1, opts, ladder: a.ladder || 'hints/content-free.json', attempts: Number(a.attempts ?? 6), repeats, arms: [] };
for (const arm of arms) {
  let wins = 0; const runs = [];
  for (let r = 0; r < repeats; r++) {
    const res = await runAttempts({ domain: a.domain, seed: a.seed ?? 1, attempts: a.attempts ?? 6, hint: arm.hint, opts, tag: `${arm.id}-r${r}`, quiet: true });
    runs.push(res.runId); if (res.success) wins++;
  }
  out.arms.push({ id: arm.id, hint: arm.hint, wins, repeats, rate: wins / repeats, runs });
  console.log(`${arm.id.padEnd(16)} ${wins}/${repeats}  ${arm.hint ? JSON.stringify(arm.hint) : '(no hint)'}`);
}
const ctrl = out.arms[0].rate;
console.log('\neffect vs no-hint control (percentage points; n is small, treat as development data):');
for (const arm of out.arms.slice(1)) console.log(`  ${arm.id.padEnd(16)} ${((arm.rate - ctrl) * 100).toFixed(0).padStart(4)}`);
appendFileSync('runs/hint-effects.jsonl', JSON.stringify({ ...out, ts: new Date().toISOString() }) + '\n');
console.log('\n-> runs/hint-effects.jsonl');
