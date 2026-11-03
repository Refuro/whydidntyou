// Experiment runner: a grid of conditions x seeds x repeats, so every number in the
// report is a rate over many trials, not a single anecdote.
//   node src/experiment.js experiments/pilot.json
// Config:
// { "name": "pilot", "attempts": 15, "seeds": [1,2,3,4,5], "repeats": 2,
//   "conditions": [ {"id":"baseline","domain":"laggedRule"},
//                   {"id":"scaffold","domain":"laggedRule","scaffold":"scaffolds/reframe.md"},
//                   {"id":"heldout-baseline","domain":"hiddenPeriod"},
//                   {"id":"heldout-scaffold","domain":"hiddenPeriod","scaffold":"scaffolds/reframe.md"} ] }
import { readFileSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { MODEL, MOCK } from './llm.js';
import { runAttempts } from './run.js';
import { clusterIdeas } from './ideas.js';

const cfgPath = process.argv[2];
if (!cfgPath) { console.error('usage: node src/experiment.js experiments/<config>.json'); process.exit(1); }
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
mkdirSync('runs', { recursive: true });
const out = `runs/experiment-${cfg.name}.jsonl`;
if (existsSync(out)) { console.error(`refusing: ${out} already exists. Each batch gets its own file; rename the old one or change "name".`); process.exit(2); }
const batchId = `${cfg.name}-${Date.now()}`;
appendFileSync(out, JSON.stringify({ type: 'experiment-meta', schema: 3, batchId, config: cfg, model: MOCK ? 'mock' : MODEL, startedAt: new Date().toISOString() }) + '\n');

let done = 0; const total = cfg.conditions.length * cfg.seeds.length * cfg.repeats;
for (const cond of cfg.conditions) for (const seed of cfg.seeds) for (let rep = 0; rep < cfg.repeats; rep++) {
  const t0 = Date.now();
  const r = await runAttempts({ domain: cond.domain, seed, attempts: cfg.attempts, hint: cond.hint || null, scaffold: cond.scaffold || null, memory: cond.memory || cfg.memory || 'full', opts: cond.opts || {}, tag: `${cfg.name}-${cond.id}-r${rep}`, quiet: true });
  const tokens = r.history.reduce((s, h) => s + ((h.usage?.input_tokens || 0) + (h.usage?.output_tokens || 0)), 0);
  const distinct = countDistinct(r.history.map(h => h.idea));
  const trial = { type: 'trial', experiment: cfg.name, batchId, condition: cond.id, domain: cond.domain, generatorVersion: r.inst.generatorVersion, seed, repeat: rep, secret: r.inst.secret, opts: cond.opts || {}, memory: cond.memory || cfg.memory || 'full', model: MOCK ? 'mock' : MODEL, runId: r.runId, instanceDigest: r.inst.instanceDigest, log: r.logPath, success: r.success, attemptsUsed: r.history.length, maxAttempts: cfg.attempts, budgetExhausted: !r.success && r.history.length === cfg.attempts, distinctIdeas: distinct, bestBps: Math.min(...r.history.filter(h => h.result.ok).map(h => h.result.bitsPerSym), Infinity), tokens, seconds: (Date.now() - t0) / 1000 };
  appendFileSync(out, JSON.stringify(trial) + '\n');
  done++; console.log(`[${done}/${total}] ${cond.id} seed=${seed} rep=${rep}: ${r.success ? 'SUCCESS@' + r.success : 'fail'} distinct=${distinct}/${r.history.length} tokens=${tokens}`);
}
console.log(`\nall trials -> ${out}\nnext: node src/report.js ${out}`);

function countDistinct(ideas) { return clusterIdeas(ideas).length; }
