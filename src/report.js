// Aggregates one experiment file (one batch). Every trial is validated against the config before it
// counts. Unit of analysis = world. Repeats averaged within world. No conditional medians.
//   node src/report.js runs/experiment-<name>.jsonl
// Contrasts in the config: ["a","b"] (requires identical generator options) or
// {"a":"...","b":"...","sharedWorld":true} to declare that differing options share the world's other draws.
import { readFileSync, writeFileSync } from 'node:fs';
import { validateTrial, assertSeed } from './validate.js';

const file = process.argv[2];
if (!file) { console.error('usage: node src/report.js runs/experiment-<name>.jsonl'); process.exit(1); }
const refuse = (m) => { console.error('refusing: ' + m); process.exit(2); };
const lines = readFileSync(file, 'utf8').trim().split('\n').map(l => JSON.parse(l));
const metas = lines.filter(l => l.type === 'experiment-meta');
if (metas.length !== 1) refuse(`expected exactly one experiment-meta record, found ${metas.length}`);
const meta = metas[0], cfg = meta.config; if (meta.schema !== 3) refuse(`file schema ${meta.schema}; the reporter requires schema 3`);
const trials = lines.filter(l => l.type === 'trial');
if (lines.length !== trials.length + 1) refuse('file contains records that are neither experiment-meta nor trial');
const J = (o) => JSON.stringify(o || {});

// ---- configuration validation (the config is part of the manifest)
if (!Array.isArray(cfg.conditions) || !cfg.conditions.length) refuse('config has no conditions');
if (!Array.isArray(cfg.seeds) || !cfg.seeds.length || !cfg.seeds.every(Number.isInteger)) refuse('config seeds must be a non-empty integer array');
if (new Set(cfg.seeds).size !== cfg.seeds.length) refuse('config seeds contain duplicates (the same world would count twice)');
try { cfg.seeds.forEach(assertSeed); } catch (e) { refuse(e.message); }
if (typeof meta.batchId !== 'string' || !meta.batchId || typeof meta.model !== 'string' || !meta.model) refuse('batch header lacks batchId/model');
if (new Set(cfg.conditions.map(c => c.id)).size !== cfg.conditions.length) refuse('config condition ids are not unique');
if (!(Number.isInteger(cfg.attempts) && cfg.attempts >= 1 && Number.isInteger(cfg.repeats) && cfg.repeats >= 1)) refuse('config attempts/repeats must be positive integers');
const MISSING = cfg.missingPolicy ?? 'refuse'; if (!['refuse', 'exploratory'].includes(MISSING)) refuse(`config missingPolicy must be "refuse" or "exploratory" (got ${JSON.stringify(MISSING)})`);
if (cfg.generatorVersions != null && (typeof cfg.generatorVersions !== 'object' || Array.isArray(cfg.generatorVersions))) refuse('config generatorVersions must be an object {domain: version}');
const condById = Object.fromEntries(cfg.conditions.map(c => [c.id, c]));
for (const ct of cfg.contrasts || []) { if (!Array.isArray(ct) && ct.sharedWorld !== undefined && typeof ct.sharedWorld !== 'boolean') refuse(`contrast ${ct.a}/${ct.b}: sharedWorld must be a strict boolean`); }

// ---- manifest validation: every trial must match the config exactly (shared contract in validate.js)
const seen = new Set(); const genVersions = {}; const digests = {};
for (const t of trials) {
  try { validateTrial(t, cfg, meta, condById); } catch (e) { refuse(e.message); }
  const k = `${t.condition}|${t.seed}|${t.repeat}`; if (seen.has(k)) refuse(`duplicate trial ${k}`); seen.add(k);
  (genVersions[t.domain] ||= new Set()).add(t.generatorVersion);
  // distinct seeds must generate distinct instances within a condition (seed aliasing / generator collisions)
  const dk = `${t.condition}|${t.instanceDigest}`; if (digests[dk] != null && digests[dk] !== t.seed) refuse(`condition ${t.condition}: seeds ${digests[dk]} and ${t.seed} generated the identical instance (${t.instanceDigest.slice(0, 12)}…); they are one world, not two`); digests[dk] = t.seed;
}
for (const [d, v] of Object.entries(genVersions)) {
  if (v.size !== 1) refuse(`domain ${d} has mixed generator versions ${[...v].join(',')}`);
  const pinned = cfg.generatorVersions && cfg.generatorVersions[d];
  if (!pinned) { if (MISSING === 'refuse') refuse(`config does not pin generatorVersions.${d}; required unless missingPolicy is "exploratory"`); }
  else if (pinned !== [...v][0]) refuse(`domain ${d}: trial generator version ${[...v][0]} != pinned ${pinned}`);
}

// ---- expected grid and missingness
const expected = []; for (const c of cfg.conditions) for (const s of cfg.seeds) for (let r = 0; r < cfg.repeats; r++) expected.push({ condition: c.id, seed: s, repeat: r });
const present = new Set(trials.map(t => `${t.condition}|${t.seed}|${t.repeat}`));
const missing = expected.filter(e => !present.has(`${e.condition}|${e.seed}|${e.repeat}`));
if (missing.length && MISSING === 'refuse') refuse(`${missing.length} of ${expected.length} expected trials are missing and missingPolicy is "refuse" (set "exploratory" for a development read-out)`);
writeFileSync(file.replace(/\.jsonl$/, '') + '.missing.json', JSON.stringify({ batchId: meta.batchId, expected: expected.length, present: trials.length, missing }, null, 2));
const esc = (s) => String(s).replace(/\|/g, '\\|');
const pct = (x) => (100 * x).toFixed(0) + '%';
const md = [`# Report: ${cfg.name}`, '', `File: ${file}. Batch: ${meta.batchId}. Model: ${meta.model}. Generator versions: ${Object.entries(genVersions).map(([d, v]) => d + '=' + [...v][0]).join(', ')}.`, `Configured: ${cfg.conditions.length} conditions × ${cfg.seeds.length} worlds × ${cfg.repeats} repeats × ${cfg.attempts} attempts = ${expected.length} trials. Present: ${trials.length}. Missing: ${missing.length}${missing.length ? ' — ' + missing.slice(0, 20).map(m => `${m.condition}/s${m.seed}/r${m.repeat}`).join(', ') + (missing.length > 20 ? ', …' : '') : ''}.`, missing.length ? `missingPolicy=exploratory: this read-out is DEVELOPMENT ONLY; the complete missing list is in the .missing.json beside this file.` : ''];
if (MISSING === 'exploratory') md.push('', '**EXPLORATORY BATCH (missingPolicy=exploratory). Not a confirmatory result.**');

// ---- world-level helpers
const byCond = {}; for (const t of trials) (byCond[t.condition] ||= []).push(t);
const worldsOf = (ts) => { const w = {}; for (const t of ts) (w[t.seed] ||= []).push(t); return w; };
const budgets = [1, 3, 6, 9, cfg.attempts].filter((b, i, arr) => b <= cfg.attempts && arr.indexOf(b) === i);
const worldSuccessByBudget = (ts, b) => { const w = worldsOf(ts); const v = Object.values(w).map(x => x.filter(t => t.success && t.success <= b).length / x.length); return v.reduce((p, q) => p + q, 0) / v.length; };

md.push('', '## Per condition (world-level; each number is a mean over worlds of within-world fractions)', '', '| condition | domain | worlds present / configured | worlds with all repeats | success-by-budget @ ' + budgets.join('/') + ' | tokens/trial (median) |', '|---|---|---|---|---|---|');
const rows = [];
for (const c of cfg.conditions) {
  const ts = byCond[c.id] || []; if (!ts.length) { md.push(`| ${c.id} | ${c.domain} | 0 / ${cfg.seeds.length} | 0 | — | — |`); continue; }
  const w = worldsOf(ts), complete = Object.values(w).filter(x => x.length === cfg.repeats).length;
  const sbb = budgets.map(b => pct(worldSuccessByBudget(ts, b))).join(' / ');
  const tok = ts.map(t => t.tokens).sort((p, q) => p - q)[Math.floor(ts.length / 2)];
  rows.push({ condition: c.id, worlds: `${Object.keys(w).length}/${cfg.seeds.length}`, complete, successByBudget: sbb, tokens: tok });
  md.push(`| ${c.id} | ${c.domain} | ${Object.keys(w).length} / ${cfg.seeds.length} | ${complete} | ${sbb} | ${tok} |`);
}
console.table(rows);

md.push('', '## Per world (successes/repeats)', '', '| world | ' + cfg.conditions.map(c => esc(c.id)).join(' | ') + ' |', '|---|' + cfg.conditions.map(() => '---').join('|') + '|');
for (const s of cfg.seeds) md.push(`| seed ${s} | ` + cfg.conditions.map(c => { const ts = (byCond[c.id] || []).filter(t => t.seed === s); return ts.length ? `${ts.filter(t => t.success).length}/${ts.length}` : '—'; }).join(' | ') + ' |');

// ---- contrasts
md.push('', '## Pre-registered contrasts (paired by world; percentile bootstrap over world differences)', '', 'The FIRST contrast is the primary endpoint (95% interval). Any others are EXPLORATORY: shown at nominal 95% with no family-wise error control across them (this is the registered policy; see PLAN.md §8). sharedWorld is a declared assumption, not a verified coupling; see the generator coupling test registered for the domain.', '');
const contrasts = (cfg.contrasts || []).map(x => Array.isArray(x) ? { a: x[0], b: x[1], sharedWorld: false } : x);
if (!contrasts.length) md.push('_No contrasts pre-registered; none computed._');
contrasts.forEach((ct, idx) => {
  const cA = condById[ct.a], cB = condById[ct.b]; const label = idx === 0 ? 'PRIMARY' : 'exploratory';
  const line = (txt) => { console.log(`${label}: ${txt}`); md.push(`- ${label}: ${txt}`); };
  if (!cA || !cB) return line(`${ct.b} − ${ct.a}: condition missing from config`);
  if (cA.domain !== cB.domain) return line(`${ct.b} − ${ct.a}: REFUSED (different domains)`);
  if (J(cA.opts) !== J(cB.opts) && ct.sharedWorld !== true) return line(`${ct.b} − ${ct.a}: REFUSED — generator options differ (${J(cA.opts)} vs ${J(cB.opts)}) and the config does not declare {"sharedWorld": true}`);
  const A = byCond[ct.a] || [], B = byCond[ct.b] || []; const wa = worldsOf(A), wb = worldsOf(B);
  const seeds = cfg.seeds.filter(s => wa[s] && wb[s]); const droppedSeeds = cfg.seeds.filter(s => !(wa[s] && wb[s]));
  const incomplete = seeds.filter(s => wa[s].length !== cfg.repeats || wb[s].length !== cfg.repeats);
  if (seeds.length < 2) return line(`${ct.b} − ${ct.a}: only ${seeds.length} paired world(s); no interval computed`);
  const diffs = seeds.map(s => wb[s].filter(t => t.success).length / wb[s].length - wa[s].filter(t => t.success).length / wa[s].length);
  const mean = diffs.reduce((p, q) => p + q, 0) / diffs.length;
  const allEqual = diffs.every(d => d === diffs[0]);
  let ci = 'bootstrap interval withheld (uninformative: every world difference is identical, ' + diffs[0] + ', n=' + seeds.length + '). ' + (diffs[0] === 0 ? 'No discordant worlds observed.' : `All ${seeds.length} worlds differ in the same direction by ${diffs[0]}.`) + ' Inference for this contrast is UNRESOLVED pending the registered bounded-outcome fallback.';
  if (!allEqual) {
    let rng = 12345; const rnd = () => { rng = (rng * 1664525 + 1013904223) >>> 0; return rng / 4294967296; };
    const boots = []; for (let b = 0; b < 4000; b++) { let sum = 0; for (let k = 0; k < diffs.length; k++) sum += diffs[Math.floor(rnd() * diffs.length)]; boots.push(sum / diffs.length); }
    boots.sort((p, q) => p - q); ci = `95% CI [${(100 * boots[Math.floor(0.025 * boots.length)]).toFixed(0)}, ${(100 * boots[Math.floor(0.975 * boots.length) - 1]).toFixed(0)}]`;
  }
  line(`${ct.b} − ${ct.a} (${cA.domain}): ${(100 * mean).toFixed(0)} pp, ${ci}; n=${seeds.length} paired worlds` + (droppedSeeds.length ? `; worlds missing in an arm: ${droppedSeeds.join(',')}` : '') + (incomplete.length ? `; worlds with incomplete repeats: ${incomplete.join(',')}` : '') + (ct.sharedWorld ? '; pairing relies on the declared shared-world coupling across options' : ''));
});

// ---- parameter curve (laggedRule k / hiddenPeriod L): stratified by condition, world-level
const param = trials.some(t => t.secret && t.secret.k != null) ? 'k' : trials.some(t => t.secret && t.secret.L != null) ? 'L' : null;
if (param) {
  md.push('', `## Success by hidden ${param}, per condition (world-level)`, '', `| condition | ${param} | worlds | success-by-budget @ ${budgets.join('/')} |`, '|---|---|---|---|');
  for (const c of cfg.conditions) { const ts = byCond[c.id] || []; const vals = [...new Set(ts.map(t => t.secret[param]))].sort((p, q) => p - q); for (const v of vals) { const sub = ts.filter(t => t.secret[param] === v); md.push(`| ${c.id} | ${v} | ${Object.keys(worldsOf(sub)).length} | ${budgets.map(b => pct(worldSuccessByBudget(sub, b))).join(' / ')} |`); } }
}
md.push('', '_World = independently generated instance (seed) within a condition. All rates are means over worlds of within-world success fractions; success-by-budget @b = share solved within b attempts, world-averaged, with no conditioning on success. Per-condition population intervals are deliberately not shown._');
const outPath = file.replace(/\.jsonl$/, '').replace('experiment-', 'report-') + '.md';
writeFileSync(outPath, md.join('\n') + '\n');
console.log(`\nreport -> ${outPath}`);
