// Aggregates an experiment file into the headline measurements, with 95% Wilson CIs.
//   node src/report.js runs/experiment-pilot.jsonl   -> prints a table and writes runs/report-<name>.md
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) { console.error('usage: node src/report.js runs/experiment-<name>.jsonl'); process.exit(1); }
const lines = readFileSync(file, 'utf8').trim().split('\n').map(l => JSON.parse(l));
const meta = lines.find(l => l.type === 'experiment-meta'); const trials = lines.filter(l => l.type === 'trial');

function wilson(k, n, z = 1.96) { if (!n) return [0, 0]; const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [(c - h) / d, (c + h) / d]; }
const pct = (x) => (100 * x).toFixed(0) + '%';
const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

const byCond = {}; for (const t of trials) (byCond[t.condition] ||= []).push(t);
const rows = []; const md = [`# Report: ${meta.config.name}`, '', `Trials: ${trials.length} (${meta.config.seeds.length} seeds x ${meta.config.repeats} repeats per condition, ${meta.config.attempts} attempts per trial)`, '', '| condition | domain | trials | discovery rate (95% CI) | median attempts to discovery | distinct ideas per 10 attempts | best bits/sym (median) | tokens per trial (median) |', '|---|---|---|---|---|---|---|---|'];
for (const [cond, ts] of Object.entries(byCond)) {
  const n = ts.length, k = ts.filter(t => t.success).length, [lo, hi] = wilson(k, n);
  const attempts = median(ts.filter(t => t.success).map(t => t.success));
  const distinctPer10 = (10 * ts.reduce((s, t) => s + t.distinctIdeas, 0) / ts.reduce((s, t) => s + t.attemptsUsed, 0)).toFixed(1);
  const best = median(ts.map(t => t.bestBps).filter(Number.isFinite));
  const tok = median(ts.map(t => t.tokens));
  const row = { condition: cond, domain: ts[0].domain, trials: n, discovery: `${k}/${n} = ${pct(k / n)} [${pct(lo)}–${pct(hi)}]`, medianAttempts: attempts ?? '—', distinctPer10, bestBps: best == null ? '—' : best.toFixed(2), tokens: tok ?? '—' };
  rows.push(row);
  md.push(`| ${row.condition} | ${row.domain} | ${n} | ${row.discovery} | ${row.medianAttempts} | ${distinctPer10} | ${row.bestBps} | ${row.tokens} |`);
}
console.table(rows);

// structure-parameter curve: discovery rate as a function of the hidden lag k (laggedRule) or period L (hiddenPeriod)
const param = trials.some(t => t.secret && t.secret.k != null) ? 'k' : trials.some(t => t.secret && t.secret.L != null) ? 'L' : null;
if (param) {
  const byVal = {}; for (const t of trials) { const v = t.secret[param]; if (v == null) continue; (byVal[v] ||= []).push(t); }
  md.push('', `## Discovery rate by hidden ${param}`, '', `| ${param} | trials | discovery rate (95% CI) | median attempts |`, '|---|---|---|---|');
  console.log(`\ndiscovery rate by ${param}:`);
  for (const v of Object.keys(byVal).map(Number).sort((a, b) => a - b)) {
    const ts = byVal[v], n = ts.length, k = ts.filter(t => t.success).length, [lo, hi] = wilson(k, n);
    const line = `${param}=${v}: ${k}/${n} = ${pct(k / n)} [${pct(lo)}–${pct(hi)}]  median attempts ${median(ts.filter(t => t.success).map(t => t.success)) ?? '—'}`;
    console.log('  ' + line); md.push(`| ${v} | ${n} | ${k}/${n} = ${pct(k / n)} [${pct(lo)}–${pct(hi)}] | ${median(ts.filter(t => t.success).map(t => t.success)) ?? '—'} |`);
  }
}

// Contrasts: only those pre-registered in the experiment config ("contrasts": [["baseline","scaffold"], ...]).
// Paired by world (seed): per-seed success rate difference (mean over repeats), CI by bootstrap over seeds.
// The world is the unit of analysis; repeats estimate within-world noise and are averaged, not counted.
md.push('', '## Pre-registered contrasts (paired by world, bootstrap CI over worlds)', '');
const contrasts = meta.config.contrasts || [];
if (!contrasts.length) { md.push('_No contrasts pre-registered in the config; none computed._'); console.log('\n(no pre-registered contrasts)'); }
for (const [ca, cb] of contrasts) {
  const A = byCond[ca], B = byCond[cb]; if (!A || !B) { md.push(`- ${cb} − ${ca}: condition missing`); continue; }
  const rate = (ts) => { const m = {}; for (const t of ts) (m[t.seed] ||= []).push(t.success ? 1 : 0); return Object.fromEntries(Object.entries(m).map(([s, v]) => [s, v.reduce((x, y) => x + y, 0) / v.length])); };
  const ra = rate(A), rb = rate(B); const seeds = Object.keys(ra).filter(s => s in rb);
  if (!seeds.length) { md.push(`- ${cb} − ${ca}: no shared worlds`); continue; }
  const diffs = seeds.map(s => rb[s] - ra[s]); const mean = diffs.reduce((x, y) => x + y, 0) / diffs.length;
  let rng = 12345; const rnd = () => { rng = (rng * 1664525 + 1013904223) >>> 0; return rng / 4294967296; };
  const boots = []; for (let b = 0; b < 4000; b++) { let sum = 0; for (let k = 0; k < diffs.length; k++) sum += diffs[Math.floor(rnd() * diffs.length)]; boots.push(sum / diffs.length); }
  boots.sort((x, y) => x - y); const lo = boots[Math.floor(0.025 * boots.length)], hi = boots[Math.floor(0.975 * boots.length)];
  const line = `${cb} − ${ca} (${A[0].domain}): ${(100 * mean).toFixed(0)} percentage points, 95% bootstrap CI [${(100 * lo).toFixed(0)}, ${(100 * hi).toFixed(0)}], n=${seeds.length} worlds`;
  console.log(line); md.push(`- ${line}`);
}
md.push('', '_Discovery rate_ = share of trials that reached the success criterion within the attempt budget. CI = Wilson score interval over trials, which treats repeats as independent; for generalization to new worlds, use the world-paired contrasts and the per-world table. _Distinct ideas_ uses a lexical proxy; for publication, re-score with the LLM judge and a human spot-check (see README)._');
const outPath = file.replace(/\.jsonl$/, '').replace('experiment-', 'report-') + '.md';
writeFileSync(outPath, md.join('\n') + '\n');
console.log(`\nreport -> ${outPath}`);
