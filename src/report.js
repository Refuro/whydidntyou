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

// paired contrasts: any condition pair on the same domain, e.g. scaffold vs baseline
md.push('', '## Contrasts (difference in discovery rate, same domain)', '');
const conds = Object.keys(byCond);
for (let i = 0; i < conds.length; i++) for (let j = i + 1; j < conds.length; j++) {
  const a = byCond[conds[i]], b = byCond[conds[j]]; if (a[0].domain !== b[0].domain) continue;
  const pa = a.filter(t => t.success).length / a.length, pb = b.filter(t => t.success).length / b.length;
  const se = Math.sqrt(pa * (1 - pa) / a.length + pb * (1 - pb) / b.length); const diff = pb - pa;
  const line = `${conds[j]} − ${conds[i]} (${a[0].domain}): ${(100 * diff).toFixed(0)} percentage points, 95% CI [${(100 * (diff - 1.96 * se)).toFixed(0)}, ${(100 * (diff + 1.96 * se)).toFixed(0)}]`;
  console.log(line); md.push(`- ${line}`);
}
md.push('', '_Discovery rate_ = share of trials that reached the success criterion within the attempt budget. CI = Wilson score interval. _Distinct ideas_ uses a lexical proxy; for publication, re-score with the LLM judge and a human spot-check (see README)._');
const outPath = file.replace(/\.jsonl$/, '').replace('experiment-', 'report-') + '.md';
writeFileSync(outPath, md.join('\n') + '\n');
console.log(`\nreport -> ${outPath}`);
