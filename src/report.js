// Aggregates one experiment file. Unit of analysis = world (seed × domain × opts). Repeats within a
// world are averaged. Reports: per-condition world-level discovery rate; success-by-budget curves
// (no conditional medians); per-world table; pre-registered contrasts paired by world with a
// bootstrap CI over worlds (first contrast is primary; the rest are secondary and Bonferroni-widened).
//   node src/report.js runs/experiment-<name>.jsonl
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) { console.error('usage: node src/report.js runs/experiment-<name>.jsonl'); process.exit(1); }
const lines = readFileSync(file, 'utf8').trim().split('\n').map(l => JSON.parse(l));
const metas = lines.filter(l => l.type === 'experiment-meta');
if (metas.length !== 1) { console.error(`refusing: expected exactly one experiment-meta record, found ${metas.length}. This file holds ${metas.length > 1 ? 'resumed or mixed batches' : 'no header'}; split it or add an explicit batch id.`); process.exit(2); }
const meta = metas[0], cfg = meta.config; const trials = lines.filter(l => l.type === 'trial');
const seen = new Set(); for (const t of trials) { const k = `${t.condition}|${t.seed}|${t.repeat}`; if (seen.has(k)) { console.error(`refusing: duplicate trial key ${k}`); process.exit(2); } seen.add(k); }

const worldKey = (t) => `${t.domain}|${t.seed}|${JSON.stringify(t.opts || {})}`;
const pct = (x) => (100 * x).toFixed(0) + '%';
const md = [`# Report: ${cfg.name}`, '', `File: ${file}. Conditions: ${cfg.conditions.length}. Configured: ${cfg.seeds.length} worlds × ${cfg.repeats} repeats × ${cfg.attempts} attempts. Trials present: ${trials.length} of ${cfg.conditions.length * cfg.seeds.length * cfg.repeats} expected.`];

// ---- per condition, world-level
const byCond = {}; for (const t of trials) (byCond[t.condition] ||= []).push(t);
md.push('', '## Per condition (world-level)', '', '| condition | domain | worlds | complete worlds | mean world success rate | success-by-budget (attempts 1,3,6,9,max) | tokens/trial (median) |', '|---|---|---|---|---|---|---|');
const rows = [];
for (const cond of cfg.conditions.map(c => c.id)) {
  const ts = byCond[cond] || []; if (!ts.length) { md.push(`| ${cond} | — | 0 | 0 | — | — | — |`); continue; }
  const worlds = {}; for (const t of ts) (worlds[worldKey(t)] ||= []).push(t);
  const wk = Object.keys(worlds), complete = wk.filter(k => worlds[k].length === cfg.repeats).length;
  const wrates = wk.map(k => worlds[k].filter(t => t.success).length / worlds[k].length);
  const meanRate = wrates.reduce((a, b) => a + b, 0) / wrates.length;
  const budgets = [1, 3, 6, 9, cfg.attempts].filter((b, i, arr) => b <= cfg.attempts && arr.indexOf(b) === i);
  const sbb = budgets.map(b => pct(ts.filter(t => t.success && t.success <= b).length / ts.length)).join(' / ');
  const tok = ts.map(t => t.tokens).sort((a, b) => a - b)[Math.floor(ts.length / 2)];
  rows.push({ condition: cond, domain: ts[0].domain, worlds: wk.length, complete, meanWorldSuccess: pct(meanRate), successByBudget: sbb, tokens: tok });
  md.push(`| ${cond} | ${ts[0].domain} | ${wk.length} | ${complete} | ${pct(meanRate)} | ${sbb} | ${tok} |`);
}
console.table(rows);

// ---- per world table
md.push('', '## Per world', '', '| world (domain/seed/opts) | ' + cfg.conditions.map(c => c.id).join(' | ') + ' |', '|---|' + cfg.conditions.map(() => '---').join('|') + '|');
const allWorlds = {}; for (const t of trials) (allWorlds[worldKey(t)] ||= {})[t.condition] = (allWorlds[worldKey(t)][t.condition] || []).concat([t]);
for (const [w, conds] of Object.entries(allWorlds)) md.push(`| ${w} | ` + cfg.conditions.map(c => { const ts = conds[c.id]; return ts ? `${ts.filter(t => t.success).length}/${ts.length}` : '—'; }).join(' | ') + ' |');

// ---- pre-registered contrasts, paired by world
md.push('', '## Pre-registered contrasts (paired by world; bootstrap percentile CI over worlds)', '');
const contrasts = cfg.contrasts || [];
if (!contrasts.length) md.push('_No contrasts pre-registered; none computed._');
contrasts.forEach(([ca, cb], idx) => {
  const A = byCond[ca] || [], B = byCond[cb] || [];
  const cA = cfg.conditions.find(c => c.id === ca), cB = cfg.conditions.find(c => c.id === cb);
  if (!cA || !cB) { md.push(`- ${cb} − ${ca}: condition missing from config`); return; }
  if (cA.domain !== cB.domain) { md.push(`- ${cb} − ${ca}: REFUSED, different domains (${cA.domain} vs ${cB.domain}) cannot be paired by seed`); return; }
  const pairedBy = JSON.stringify(cA.opts || {}) === JSON.stringify(cB.opts || {}) ? 'identical generator options' : `shared seed with DIFFERENT options (${JSON.stringify(cA.opts || {})} vs ${JSON.stringify(cB.opts || {})}); pairing assumes the generator shares the world's other draws across these options`;
  const rate = (ts) => { const m = {}; for (const t of ts) (m[t.seed] ||= []).push(t); return Object.fromEntries(Object.entries(m).map(([s, v]) => [s, { rate: v.filter(t => t.success).length / v.length, n: v.length }])); };
  const ra = rate(A), rb = rate(B); const seeds = Object.keys(ra).filter(s => s in rb);
  const dropped = new Set([...Object.keys(ra), ...Object.keys(rb)]).size - seeds.length;
  const incomplete = seeds.filter(s => ra[s].n !== cfg.repeats || rb[s].n !== cfg.repeats).length;
  if (!seeds.length) { md.push(`- ${cb} − ${ca}: no shared worlds`); return; }
  const diffs = seeds.map(s => rb[s].rate - ra[s].rate); const mean = diffs.reduce((x, y) => x + y, 0) / diffs.length;
  const level = idx === 0 ? 0.05 : 0.05 / Math.max(1, contrasts.length - 1); // primary at .05; secondaries Bonferroni among themselves
  let rng = 12345; const rnd = () => { rng = (rng * 1664525 + 1013904223) >>> 0; return rng / 4294967296; };
  const boots = []; for (let b = 0; b < 4000; b++) { let sum = 0; for (let k = 0; k < diffs.length; k++) sum += diffs[Math.floor(rnd() * diffs.length)]; boots.push(sum / diffs.length); }
  boots.sort((x, y) => x - y); const lo = boots[Math.floor((level / 2) * boots.length)], hi = boots[Math.min(boots.length - 1, Math.floor((1 - level / 2) * boots.length))];
  const degenerate = diffs.every(d => d === diffs[0]);
  const line = `${idx === 0 ? 'PRIMARY' : 'secondary'}: ${cb} − ${ca} (${cA.domain}): ${(100 * mean).toFixed(0)} pp, ${((1 - level) * 100).toFixed(1)}% CI [${(100 * lo).toFixed(0)}, ${(100 * hi).toFixed(0)}], n=${seeds.length} worlds` +
    (dropped ? `, ${dropped} world(s) dropped (missing in one arm)` : '') + (incomplete ? `, ${incomplete} world(s) with incomplete repeats` : '') +
    (degenerate ? `. DEGENERATE: every world difference is ${diffs[0]}; the percentile interval is not informative at n=${seeds.length} — report as "no discordant worlds observed", not as zero uncertainty` : '') + `. Paired by: ${pairedBy}.`;
  console.log(line); md.push(`- ${line}`);
});

// ---- parameter curve (laggedRule k / hiddenPeriod L), world-level
const param = trials.some(t => t.secret && t.secret.k != null) ? 'k' : trials.some(t => t.secret && t.secret.L != null) ? 'L' : null;
if (param) {
  const byVal = {}; for (const t of trials) (byVal[t.secret[param]] ||= []).push(t);
  md.push('', `## Discovery by hidden ${param} (world-level; pools conditions that share ${param})`, '', `| ${param} | worlds | conditions | mean world success rate | success-by-budget (1,3,6,9,max) |`, '|---|---|---|---|---|');
  for (const v of Object.keys(byVal).map(Number).sort((a, b) => a - b)) {
    const ts = byVal[v]; const worlds = {}; for (const t of ts) (worlds[worldKey(t) + '|' + t.condition] ||= []).push(t);
    const wr = Object.values(worlds).map(v => v.filter(t => t.success).length / v.length); const mean = wr.reduce((a, b) => a + b, 0) / wr.length;
    const conds = [...new Set(ts.map(t => t.condition))].join(',');
    const budgets = [1, 3, 6, 9, cfg.attempts].filter((b, i, arr) => b <= cfg.attempts && arr.indexOf(b) === i);
    md.push(`| ${v} | ${wr.length} | ${conds} | ${pct(mean)} | ${budgets.map(b => pct(ts.filter(t => t.success && t.success <= b).length / ts.length)).join(' / ')} |`);
  }
}
md.push('', '_World = independently generated instance (domain, seed, generator options). Rates are means over worlds of within-world success fractions. Success-by-budget = share of trials solved within b attempts (no conditioning on success). Contrast CIs are percentile bootstraps over paired world differences; the first configured contrast is primary at 95%, the rest are Bonferroni-widened among themselves. Population intervals per condition are deliberately not shown._');
const outPath = file.replace(/\.jsonl$/, '').replace('experiment-', 'report-') + '.md';
writeFileSync(outPath, md.join('\n') + '\n');
console.log(`\nreport -> ${outPath}`);
