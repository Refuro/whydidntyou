// Hint-effect experiment (prompted-restart estimand: each arm is a FRESH run with the hint present
// from attempt 1; this is not the causal effect of inserting a hint into a failed trajectory).
// Every arm gets the same attempt budget and repeat count; arms are interleaved in a seeded random
// order so time-of-day / provider drift is not confounded with treatment. No early stopping.
//   node src/hints.js --domain laggedRule --seed 1 --attempts 6 --repeats 5 [--k 36] [--memory full] [--ladder file] [--order-seed 7]
import { readFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { runAttempts, parseArgs } from './run.js';
import { MODEL, MOCK } from './llm.js';

const a = parseArgs(process.argv.slice(2));
if (!a.domain) { console.error('usage: node src/hints.js --domain laggedRule --seed 1 --attempts 6 --repeats 5 [--k N] [--memory M] [--ladder file] [--order-seed S]'); process.exit(1); }
const attempts = Number(a.attempts ?? 6), repeats = Number(a.repeats ?? 3);
if (!(Number.isInteger(attempts) && attempts >= 1 && Number.isInteger(repeats) && repeats >= 1)) { console.error('attempts and repeats must be finite positive integers'); process.exit(1); }
const ladderPath = a.ladder || 'hints/content-free.json';
const ladder = JSON.parse(readFileSync(ladderPath, 'utf8'));
const memory = a.memory || 'full';
const opts = a.k ? { k: Number(a.k) } : {};
const NEUTRAL = 'Take your time and think carefully before each attempt.';
const arms = [{ id: 'control-nohint', hint: null, category: 'control' }, { id: 'control-neutral', hint: NEUTRAL, category: 'control' },
  ...ladder.map((h, i) => ({ id: `rung${i + 1}`, hint: typeof h === 'string' ? h : h.text, category: typeof h === 'string' ? 'unlabeled' : h.category }))];
const CATEGORIES = new Set(['control', 'content-free', 'strategy', 'solution-family', 'unlabeled']);
for (const arm of arms) if (!CATEGORIES.has(arm.category)) { console.error(`ladder entry ${arm.id} has category "${arm.category}"; allowed: ${[...CATEGORIES].join(', ')}`); process.exit(1); }

// interleaved execution order, seeded
// order seed is world-specific by default so different worlds get different schedules; override with --order-seed
const orderSeed = Number(a['order-seed'] ?? (1000003 * Number(a.seed ?? 1) + (opts.k || 0))); let x = orderSeed >>> 0; const rnd = () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
const jobs = []; for (let r = 0; r < repeats; r++) for (const arm of arms) jobs.push({ arm, r });
for (let i = jobs.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [jobs[i], jobs[j]] = [jobs[j], jobs[i]]; }

const batchId = `hints-${a.domain}-s${a.seed ?? 1}-${Date.now()}`;
import { createHash } from 'node:crypto';
const out = { type: 'hint-effects', batchId, estimand: 'prompted-restart', domain: a.domain, seed: a.seed ?? 1, opts, memory, model: MOCK ? 'mock' : MODEL, ladder: ladderPath, attempts, repeats, orderSeed, executionOrder: jobs.map(j => `${j.arm.id}#${j.r}`), results: [] };
mkdirSync('runs', { recursive: true });
// Immutable batch header BEFORE the first job; every partial record references its digest.
const header = { type: 'hint-batch-header', batchId, estimand: 'prompted-restart', domain: a.domain, seed: a.seed ?? 1, opts, memory, model: MOCK ? 'mock' : MODEL, ladder: ladderPath, ladderContent: ladder, arms: arms.map(x => ({ id: x.id, category: x.category, hint: x.hint })), attempts, repeats, orderSeed, schedule: jobs.map(j => `${j.arm.id}#${j.r}`), ts: new Date().toISOString() };
const headerDigest = createHash('sha256').update(JSON.stringify(header)).digest('hex');
appendFileSync('runs/hint-effects.partial.jsonl', JSON.stringify({ ...header, headerDigest }) + '\n');
for (const [i, { arm, r }] of jobs.entries()) {
  try {
    const res = await runAttempts({ domain: a.domain, seed: a.seed ?? 1, attempts, hint: arm.hint, memory, opts, tag: `${arm.id}-r${r}`, quiet: true });
    out.results.push({ arm: arm.id, repeat: r, success: res.success, runId: res.runId });
    console.log(`[${i + 1}/${jobs.length}] ${arm.id.padEnd(16)} rep ${r}: ${res.success ? 'SUCCESS@' + res.success : 'fail'}`);
  } catch (e) { out.results.push({ arm: arm.id, repeat: r, error: String(e.message || e) }); console.log(`[${i + 1}/${jobs.length}] ${arm.id} rep ${r}: ERROR ${e.message}`); }
  appendFileSync('runs/hint-effects.partial.jsonl', JSON.stringify({ type: 'hint-job', batchId, headerDigest, jobIndex: i, arm: arm.id, category: arm.category, repeat: r, result: out.results[out.results.length - 1], ts: new Date().toISOString() }) + '\n');
}
const summary = arms.map(arm => { const all = out.results.filter(x => x.arm === arm.id); const rs = all.filter(x => !x.error); return { id: arm.id, category: arm.category, hint: arm.hint, assigned: repeats, completed: rs.length, failed: all.length - rs.length, wins: rs.filter(x => x.success).length, n: rs.length }; });
const ctrl = summary[0];
console.log('\narm              cat        wins/completed (assigned, API-failed)   diff vs no-hint (pp)   (one world; development data; failed jobs excluded from the denominator — register a retry/exclusion rule before confirmatory use)');
for (const s of summary) console.log(`${s.id.padEnd(16)} ${s.category.padEnd(10)} ${s.wins}/${s.completed} (${s.assigned}, ${s.failed})      ${s.n && ctrl.n ? ((s.wins / s.n - ctrl.wins / ctrl.n) * 100).toFixed(0).padStart(5) : '   —'}   ${s.hint ? JSON.stringify(s.hint).slice(0, 60) : '(no hint)'}`);
out.summary = summary;
appendFileSync('runs/hint-effects.jsonl', JSON.stringify({ ...out, ts: new Date().toISOString() }) + '\n');
console.log('\n-> runs/hint-effects.jsonl');
