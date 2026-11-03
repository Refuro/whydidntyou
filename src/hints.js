// Hint-effect experiment (prompted-restart estimand: each arm is a FRESH run with the hint present
// from attempt 1; this is not the causal effect of inserting a hint into a failed trajectory).
// Every arm gets the same attempt budget and repeat count; arms are interleaved in a seeded random
// order so time-of-day / provider drift is not confounded with treatment. No early stopping.
//   node src/hints.js --domain laggedRule --seed 1 --attempts 6 --repeats 5 [--k 36] [--memory full] [--ladder file] [--order-seed 7]
import { readFileSync, appendFileSync } from 'node:fs';
import { runAttempts, parseArgs } from './run.js';
import { MODEL, MOCK } from './llm.js';

const a = parseArgs(process.argv.slice(2));
if (!a.domain) { console.error('usage: node src/hints.js --domain laggedRule --seed 1 --attempts 6 --repeats 5 [--k N] [--memory M] [--ladder file] [--order-seed S]'); process.exit(1); }
const attempts = Number(a.attempts ?? 6), repeats = Number(a.repeats ?? 3);
if (!(attempts >= 1 && repeats >= 1)) { console.error('attempts and repeats must be positive integers'); process.exit(1); }
const ladderPath = a.ladder || 'hints/content-free.json';
const ladder = JSON.parse(readFileSync(ladderPath, 'utf8'));
const memory = a.memory || 'full';
const opts = a.k ? { k: Number(a.k) } : {};
const NEUTRAL = 'Take your time and think carefully before each attempt.';
const arms = [{ id: 'control-nohint', hint: null, category: 'control' }, { id: 'control-neutral', hint: NEUTRAL, category: 'control' },
  ...ladder.map((h, i) => ({ id: `rung${i + 1}`, hint: typeof h === 'string' ? h : h.text, category: typeof h === 'string' ? 'unlabeled' : (h.category || 'unlabeled') }))];

// interleaved execution order, seeded
const orderSeed = Number(a['order-seed'] ?? 1); let x = orderSeed >>> 0; const rnd = () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
const jobs = []; for (let r = 0; r < repeats; r++) for (const arm of arms) jobs.push({ arm, r });
for (let i = jobs.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [jobs[i], jobs[j]] = [jobs[j], jobs[i]]; }

const out = { type: 'hint-effects', estimand: 'prompted-restart', domain: a.domain, seed: a.seed ?? 1, opts, memory, model: MOCK ? 'mock' : MODEL, ladder: ladderPath, attempts, repeats, orderSeed, executionOrder: jobs.map(j => `${j.arm.id}#${j.r}`), results: [] };
for (const [i, { arm, r }] of jobs.entries()) {
  try {
    const res = await runAttempts({ domain: a.domain, seed: a.seed ?? 1, attempts, hint: arm.hint, memory, opts, tag: `${arm.id}-r${r}`, quiet: true });
    out.results.push({ arm: arm.id, repeat: r, success: res.success, runId: res.runId });
    console.log(`[${i + 1}/${jobs.length}] ${arm.id.padEnd(16)} rep ${r}: ${res.success ? 'SUCCESS@' + res.success : 'fail'}`);
  } catch (e) { out.results.push({ arm: arm.id, repeat: r, error: String(e.message || e) }); console.log(`[${i + 1}/${jobs.length}] ${arm.id} rep ${r}: ERROR ${e.message}`); }
  appendFileSync('runs/hint-effects.partial.jsonl', JSON.stringify({ seed: out.seed, opts, arm: arm.id, repeat: r, result: out.results[out.results.length - 1], ts: new Date().toISOString() }) + '\n');
}
const summary = arms.map(arm => { const rs = out.results.filter(x => x.arm === arm.id && !x.error); return { id: arm.id, category: arm.category, hint: arm.hint, wins: rs.filter(x => x.success).length, n: rs.length }; });
const ctrl = summary[0];
console.log('\narm              cat        wins/n   diff vs no-hint (pp)   (one world; development data only)');
for (const s of summary) console.log(`${s.id.padEnd(16)} ${s.category.padEnd(10)} ${s.wins}/${s.n}      ${s.n && ctrl.n ? ((s.wins / s.n - ctrl.wins / ctrl.n) * 100).toFixed(0).padStart(5) : '   —'}   ${s.hint ? JSON.stringify(s.hint).slice(0, 60) : '(no hint)'}`);
out.summary = summary;
appendFileSync('runs/hint-effects.jsonl', JSON.stringify({ ...out, ts: new Date().toISOString() }) + '\n');
console.log('\n-> runs/hint-effects.jsonl');
