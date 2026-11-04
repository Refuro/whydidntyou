// Aggregates one experiment file (one batch). Every trial is validated against the config before it
// counts. Unit of analysis = world. Repeats averaged within world. No conditional medians.
//   node src/report.js runs/experiment-<name>.jsonl
// Contrasts in the config: ["a","b"] (requires identical generator options) or
// {"a":"...","b":"...","sharedWorld":true} to declare that differing options share the world's other draws.
import { readFileSync, writeFileSync } from 'node:fs';
import { validateTrial, validateTrialFailed, validateConfig, validateRunLog, validateAttempt } from './validate.js';
import { getDomain, domains } from './domains/index.js';
import { existsSync } from 'node:fs';

const file = process.argv[2];
if (!file) { console.error('usage: node src/report.js runs/experiment-<name>.jsonl'); process.exit(1); }
const refuse = (m) => { console.error('refusing: ' + m); process.exit(2); };
const lines = readFileSync(file, 'utf8').trim().split('\n').map(l => JSON.parse(l));
const metas = lines.filter(l => l.type === 'experiment-meta');
if (metas.length !== 1) refuse(`expected exactly one experiment-meta record, found ${metas.length}`);
const meta = metas[0], cfg = meta.config; if (meta.schema !== 4) refuse(`file schema ${meta.schema}; the reporter requires schema 4`);
const trials = lines.filter(l => l.type === 'trial'); const failedTrials = lines.filter(l => l.type === 'trial-failed');
if (lines.length !== trials.length + failedTrials.length + 1) refuse('file contains records of unknown type');
const J = (o) => JSON.stringify(o || {});

// ---- configuration validation: the SAME validator the writer ran before its first request
const DOMAIN_VERSIONS = Object.fromEntries(Object.entries(domains).map(([k, d]) => [k, d.VERSION]));
let MISSING; try { ({ missingPolicy: MISSING } = validateConfig(cfg, DOMAIN_VERSIONS)); } catch (e) { refuse('config: ' + e.message); }
if (typeof meta.batchId !== 'string' || !meta.batchId || typeof meta.model !== 'string' || !meta.model) refuse('batch header lacks batchId/model');
const condById = Object.fromEntries(cfg.conditions.map(c => [c.id, c]));


// ---- manifest validation: every record must match the config exactly (shared contract in validate.js); one terminal outcome per slot
const seen = new Set(); const genVersions = {}; const digests = {}; const seedWorld = {}; const coincident = []; const usedRuns = new Map();
// Binds a run log to (a) the regenerated instance — the log's reference values are CHECKED against it, and result arithmetic
// is validated against the regenerated references, never the log's own fields; (b) the configured condition (treatment:
// hint, scaffold content hash, memory, options); (c) the execution slot (batch, condition, seed, repeat).
function bindLog(text, inst, row, cond, k) {
  const lines = text.trim().split('\n').map(l => JSON.parse(l)); const log = validateRunLog(lines); const m = log.meta;
  if (m.n !== inst.n || m.baseline !== inst.baselineBitsPerSym || Math.abs(m.oracle - inst.oracleBitsPerSym) > 1e-9) throw new Error(`${k}: log reference values (n/baseline/oracle) differ from the regenerated instance`);
  log.attempts.forEach((x, i) => validateAttempt(x, i, { n: inst.n, baseline: inst.baselineBitsPerSym, oracle: inst.oracleBitsPerSym }));
  if (m.runId !== row.runId || m.seed !== row.seed || m.domain !== row.domain || m.generatorVersion !== inst.generatorVersion || m.worldDigest !== inst.worldDigest || m.instanceDigest !== inst.instanceDigest || JSON.stringify(m.secret) !== JSON.stringify(inst.secret) || JSON.stringify(m.opts) !== JSON.stringify(cond.opts || {})) throw new Error(`${k}: linked log does not describe this slot's instance`);
  if (m.maxAttempts !== cfg.attempts || m.model !== meta.model || m.memory !== (cond.memory || cfg.memory || 'full')) throw new Error(`${k}: linked log budget/model/memory contradict the config`);
  if (m.hint !== (cond.hint ?? null)) throw new Error(`${k}: linked log hint does not match the configured treatment`);
  const expectedScaffold = (meta.scaffoldHashes || {})[cond.id] ?? null; if (m.scaffoldHash !== expectedScaffold || (m.scaffold ?? null) !== (cond.scaffold ?? null)) throw new Error(`${k}: linked log scaffold does not match the configured treatment`);
  if (!m.slot || m.slot.batchId !== meta.batchId || m.slot.condition !== row.condition || m.slot.seed !== row.seed || m.slot.repeat !== row.repeat) throw new Error(`${k}: linked log was not executed for this slot`);
  return log;
}
for (const f of failedTrials) {
  try { validateTrialFailed(f, cfg, meta, condById); } catch (e) { refuse(e.message); }
  const k = `${f.condition}|${f.seed}|${f.repeat}`; if (seen.has(k)) refuse(`slot ${k} has more than one terminal record`); seen.add(k);
  if (f.stage === 'interrupted') { // the linked log must really be an interrupted run for this slot
    if (!existsSync(f.log)) refuse(`${k}: trial-failed links a missing log`);
    const cond = condById[f.condition]; const inst = getDomain(cond.domain).make(f.seed, cond.opts || {});
    let log; try { log = bindLog(readFileSync(f.log, 'utf8'), inst, { runId: f.runId, seed: f.seed, domain: cond.domain, condition: f.condition, repeat: f.repeat }, cond, k); } catch (e) { refuse(e.message); }
    if (log.end.status !== 'interrupted') refuse(`${k}: trial-failed links a ${log.end.status} run; a completed run cannot be relabeled unresolved`);
    if (usedRuns.has(f.runId)) refuse(`run ${f.runId} reported for more than one slot`); usedRuns.set(f.runId, k);
  }
}
for (const t of trials) {
  try { validateTrial(t, cfg, meta, condById); } catch (e) { refuse(e.message); }
  const c = condById[t.condition];
  const k = `${t.condition}|${t.seed}|${t.repeat}`; if (seen.has(k)) refuse(`slot ${k} has more than one terminal record (trial and/or trial-failed)`); seen.add(k);
  // bind the summary row to its run log: the log is the evidence, the row is a cache of it
  if (!existsSync(t.log)) refuse(`trial ${k}: linked log ${t.log} not found`);
  const inst = getDomain(t.domain).make(t.seed, t.opts);
  let log; try { log = bindLog(readFileSync(t.log, 'utf8'), inst, t, c, k); } catch (e) { refuse(e.message); }
  if (log.end.status !== 'completed' || log.end.success !== t.success || log.end.attemptsUsed !== t.attemptsUsed) refuse(`trial ${k}: summary row contradicts its linked log`);
  if (usedRuns.has(t.runId)) refuse(`run ${t.runId} is reported for more than one slot (${usedRuns.get(t.runId)} and ${k}); independent slots need independent executions`); usedRuns.set(t.runId, k);
  (genVersions[t.domain] ||= new Set()).add(t.generatorVersion);
  // Recompute both digests from the generator: the row's digests must be what the generator produces for (seed, options).
  if (inst.generatorVersion !== t.generatorVersion) refuse(`trial ${k}: generator version ${t.generatorVersion} is not the current ${inst.generatorVersion}`);
  if (inst.instanceDigest !== t.instanceDigest) refuse(`trial ${k}: instanceDigest does not match the regenerated instance`);
  if (inst.worldDigest !== t.worldDigest) refuse(`trial ${k}: worldDigest does not match the regenerated instance`);
  if (JSON.stringify(inst.secret) !== JSON.stringify(t.secret)) refuse(`trial ${k}: recorded secret differs from the regenerated instance`);
  t.secret = inst.secret; // strata use the regenerated secret, never the copied field
  // Sampling policy (PLAN §8): seeds are independent draws WITH replacement; two seeds that generate the same world are
  // coincident independent draws, retained as separate trials and REPORTED, so the independent-draw null bound stays valid.
  const dk = `${t.condition}|${t.worldDigest}`; if (digests[dk] != null && digests[dk] !== t.seed) coincident.push({ condition: t.condition, seeds: [digests[dk], t.seed], worldDigest: t.worldDigest }); else digests[dk] = t.seed;
  const sk = `${t.condition}|${t.seed}`; if (seedWorld[sk] != null && seedWorld[sk] !== t.worldDigest) refuse(`condition ${t.condition} seed ${t.seed}: repeats carry different worldDigests`); seedWorld[sk] = t.worldDigest;
}
// paired conditions with identical generator options must have the same world per seed
for (const ct of (cfg.contrasts || []).map(x => Array.isArray(x) ? { a: x[0], b: x[1] } : x)) {
  const cA = condById[ct.a], cB = condById[ct.b]; if (!cA || !cB || JSON.stringify(cA.opts || {}) !== JSON.stringify(cB.opts || {})) continue;
  for (const s of cfg.seeds) { const wa = seedWorld[`${ct.a}|${s}`], wb = seedWorld[`${ct.b}|${s}`]; if (wa && wb && wa !== wb) refuse(`contrast ${ct.a}/${ct.b} seed ${s}: identical options but different worlds`); }
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
const missing = expected.filter(e => !present.has(`${e.condition}|${e.seed}|${e.repeat}`)).map(e => ({ ...e, reason: (failedTrials.find(f => f.condition === e.condition && f.seed === e.seed && f.repeat === e.repeat) || {}).reason || 'not started' }));
// the diagnostic ledger is written BEFORE the inferential (missingness) refusal of an otherwise valid batch; malformed records still refuse earlier
writeFileSync(file.replace(/\.jsonl$/, '') + '.missing.json', JSON.stringify({ batchId: meta.batchId, expected: expected.length, present: trials.length, missing, coincidentWorlds: coincident }, null, 2));
if (missing.length && MISSING === 'refuse') refuse(`${missing.length} of ${expected.length} expected trials are missing and missingPolicy is "refuse"; reasons are in ${file.replace(/\.jsonl$/, '')}.missing.json`);
const esc = (s) => String(s).replace(/\|/g, '\\|');
const pct = (x) => (100 * x).toFixed(0) + '%';
const md = [`# Report: ${cfg.name}`, '', `File: ${file}. Batch: ${meta.batchId}. Model: ${meta.model}. Generator versions: ${Object.entries(genVersions).map(([d, v]) => d + '=' + [...v][0]).join(', ')}.`, `Configured: ${cfg.conditions.length} conditions × ${cfg.seeds.length} worlds × ${cfg.repeats} repeats × ${cfg.attempts} attempts = ${expected.length} trials. Present: ${trials.length}. Missing: ${missing.length}${missing.length ? ' — ' + missing.slice(0, 20).map(m => `${m.condition}/s${m.seed}/r${m.repeat}`).join(', ') + (missing.length > 20 ? ', …' : '') : ''}.`, missing.length ? `missingPolicy=exploratory: this read-out is DEVELOPMENT ONLY; the complete missing list is in the .missing.json beside this file.` : ''];
if (MISSING === 'exploratory') md.push('', '**EXPLORATORY BATCH (missingPolicy=exploratory). Not a confirmatory result.**');
if (coincident.length) md.push('', `**Coincident worlds:** ${coincident.length} pair(s) of seeds generated identical worlds and are retained as independent draws: ${coincident.map(c => `${c.condition}: seeds ${c.seeds.join(' & ')}`).join('; ')}.`);

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
