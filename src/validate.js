// One typed contract for run logs and experiment trial rows, used by the WRITERS (run.js, experiment.js)
// before a record is appended and by the READERS (report.js, postmortem.js) before a record is trusted.
// Presence and type first, then consistency. No coercion anywhere: inputs are normalized once at the
// command line (normalizeRunInput) and stored fields are asserted as stored.
import { isSuccess } from './sandbox.js';
import { createHash } from 'node:crypto';

export const SEED_MIN = 0, SEED_MAX = 4294967295; // generators normalize seeds to 32 bits; larger values alias smaller ones
export const MEMORY_MODES = ['full', 'last-code', 'summary'];
export const RESULT_STAGES = ['load', 'encode', 'decode', 'verify', 'parse', 'truncated'];
export const RUN_STATUS = ['completed', 'interrupted'];
export const MISSING_POLICIES = ['refuse', 'exploratory'];
export const ATTEMPTS_MAX = 1000;
// Registered generator option domains (per key). Generators assert these too.
export const OPTION_DOMAINS = {
  A: (v) => isInt(v) && v >= 2 && v <= 64,
  p: (v) => typeof v === 'number' && v > 0 && v <= 1,
  n: (v) => isInt(v) && v >= 100 && v <= 100000,
  k: (v) => isInt(v) && v >= 1 && v <= 50000,
  L: (v) => isInt(v) && v >= 1 && v <= 100000,
};
const isStr = (x) => typeof x === 'string' && x.length > 0;
const isInt = Number.isInteger;
const isHex64 = (x) => typeof x === 'string' && /^[0-9a-f]{64}$/.test(x);
const isPlainObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const fail = (m) => { throw new Error(m); };

export function assertSeed(seed) {
  if (!isInt(seed) || seed < SEED_MIN || seed > SEED_MAX) fail(`seed must be an integer in [${SEED_MIN}, ${SEED_MAX}] (got ${JSON.stringify(seed)}); larger values alias smaller ones`);
}

// Normalizes and validates command-line / config inputs ONCE. Returns typed values or throws.
export function normalizeRunInput({ seed, attempts, memory, opts }) {
  const s = typeof seed === 'string' && /^\d+$/.test(seed) ? Number(seed) : seed; assertSeed(s);
  const a = typeof attempts === 'string' && /^\d+$/.test(attempts) ? Number(attempts) : attempts;
  if (!isInt(a) || a < 1 || a > ATTEMPTS_MAX) fail(`attempts must be an integer in [1,${ATTEMPTS_MAX}] (got ${JSON.stringify(attempts)})`);
  const m = memory ?? 'full'; if (!MEMORY_MODES.includes(m)) fail(`memory must be one of ${MEMORY_MODES.join('|')} (got ${JSON.stringify(memory)})`);
  const o = opts ?? {}; if (!isPlainObj(o)) fail('opts must be a plain object');
  validateOpts(o);
  return { seed: s, attempts: a, memory: m, opts: o };
}
export const OPTION_DEFAULTS = { A: 8, p: 0.85, n: 4000 }; // generator defaults; relative constraints are checked on EFFECTIVE values
export function validateOpts(o) {
  if (!isPlainObj(o)) fail('opts must be a plain object');
  for (const [k, v] of Object.entries(o)) { const dom = OPTION_DOMAINS[k]; if (!dom) fail(`opts.${k} is not a registered generator option`); if (!dom(v)) fail(`opts.${k}=${JSON.stringify(v)} outside its registered domain`); }
  const eff = { ...OPTION_DEFAULTS, ...o };
  if (o.k != null && o.k > eff.n / 2) fail(`opts.k=${o.k} must be at most n/2 (effective n=${eff.n})`);
  if (o.L != null && o.L > eff.n) fail(`opts.L=${o.L} must be at most n (effective n=${eff.n})`);
}

// PRF-style expansion: computational approximation to sampling distinct 32-bit seeds.
export function drawSeeds(master, n) {
  if (typeof master !== 'string' || !/^(0|[1-9][0-9]{0,63})$/.test(master) || !isInt(n) || n < 1 || n > 100000) fail('drawSeeds: master must be canonical decimal text (1–64 digits), n an integer in [1,100000]');
  const out = [], seen = new Set();
  for (let counter = 0; out.length < n; counter++) {
    const digest = createHash('sha256').update(`whydidntyou-seed-draw-v2|${master}|${counter}`).digest();
    const v = digest.readUInt32BE(28); // low 32 bits of the big-endian SHA-256 integer
    if (!seen.has(v)) { seen.add(v); out.push(v); }
  }
  return out;
}

// Whole-experiment configuration contract, used by the writer BEFORE any request and by the reader.
export function validateConfig(cfg, domainVersions /* {domain: currentVersion} or null */) {
  if (!isPlainObj(cfg)) fail('config is not an object');
  if (!isStr(cfg.name) || !/^[A-Za-z0-9_-]+$/.test(cfg.name)) fail('config name must be a safe identifier');
  if (!Array.isArray(cfg.conditions) || !cfg.conditions.length) fail('config has no conditions');
  if (!Array.isArray(cfg.seeds) || !cfg.seeds.length) fail('config seeds must be a non-empty array');
  cfg.seeds.forEach(assertSeed); if (new Set(cfg.seeds).size !== cfg.seeds.length) fail('config seeds contain duplicates');
  if (new Set(cfg.conditions.map(c => c.id)).size !== cfg.conditions.length) fail('config condition ids are not unique');
  if (!isInt(cfg.attempts) || cfg.attempts < 1 || cfg.attempts > ATTEMPTS_MAX) fail(`config attempts must be an integer in [1,${ATTEMPTS_MAX}]`);
  if (!isInt(cfg.repeats) || cfg.repeats < 1 || cfg.repeats > 100) fail('config repeats must be an integer in [1,100]');
  const mp = cfg.missingPolicy ?? 'refuse'; if (!MISSING_POLICIES.includes(mp)) fail(`config missingPolicy must be ${MISSING_POLICIES.join('|')} (got ${JSON.stringify(cfg.missingPolicy)})`);
  // Seed draw: confirmatory batches (missingPolicy refuse) must have their seed list produced by the registered draw
  // procedure (SHA-256 expansion of a string master; computational sampling assumption).
  if (cfg.seedDraw != null) { if (!isPlainObj(cfg.seedDraw) || typeof cfg.seedDraw.master !== 'string' || !isInt(cfg.seedDraw.n) || cfg.seedDraw.n !== cfg.seeds.length) fail('config seedDraw must be {master: string, n} with n equal to the seed count'); const drawn = drawSeeds(cfg.seedDraw.master, cfg.seedDraw.n); if (JSON.stringify(drawn) !== JSON.stringify(cfg.seeds)) fail('config seeds do not equal the registered draw from seedDraw.master'); }
  else if (mp === 'refuse') fail('confirmatory config (missingPolicy refuse) must declare seedDraw {master, n}; hand-picked seeds are exploratory only');
  if (cfg.memory != null && !MEMORY_MODES.includes(cfg.memory)) fail('config memory invalid');
  if (cfg.generatorVersions != null && !isPlainObj(cfg.generatorVersions)) fail('config generatorVersions must be an object');
  for (const c of cfg.conditions) {
    if (!isStr(c.id) || !/^[A-Za-z0-9_-]+$/.test(c.id)) fail('condition id must be a safe identifier');
    if (!isStr(c.domain)) fail(`condition ${c.id}: domain missing`);
    if (domainVersions && !(c.domain in domainVersions)) fail(`condition ${c.id}: unknown domain ${c.domain}`);
    if (c.memory != null && !MEMORY_MODES.includes(c.memory)) fail(`condition ${c.id}: memory invalid`);
    validateOpts(c.opts ?? {});
    if (c.hint != null && !isStr(c.hint)) fail(`condition ${c.id}: hint must be a non-empty string`);
    if (c.scaffold != null && !isStr(c.scaffold)) fail(`condition ${c.id}: scaffold must be a path string`);
    const pinned = cfg.generatorVersions && cfg.generatorVersions[c.domain];
    if (mp === 'refuse' && !isStr(pinned)) fail(`config does not pin generatorVersions.${c.domain}; required unless missingPolicy is "exploratory"`);
    if (isStr(pinned) && domainVersions && pinned !== domainVersions[c.domain]) fail(`generatorVersions.${c.domain}=${pinned} but the current generator is ${domainVersions[c.domain]}`);
  }
  const ids = new Set(cfg.conditions.map(c => c.id));
  for (const ct of cfg.contrasts ?? []) {
    const o = Array.isArray(ct) ? { a: ct[0], b: ct[1], sharedWorld: false } : ct;
    if (!isPlainObj(o) || !ids.has(o.a) || !ids.has(o.b) || o.a === o.b) fail(`contrast ${JSON.stringify(ct)} does not name two distinct configured conditions`);
    if (o.sharedWorld !== undefined && typeof o.sharedWorld !== 'boolean') fail(`contrast ${o.a}/${o.b}: sharedWorld must be a strict boolean`);
  }
  return { missingPolicy: mp };
}

export function validateResult(r, where, ref /* {n, baseline, oracle} */) {
  if (!isPlainObj(r) || typeof r.ok !== 'boolean') fail(`${where}: result missing or ok not boolean`);
  if (r.ok) {
    for (const f of ['bits', 'bitsPerSym', 'baseline', 'oracle', 'ratioToBaseline', 'ratioToOracle']) if (typeof r[f] !== 'number' || !Number.isFinite(r[f])) fail(`${where}: successful result lacks finite ${f}`);
    if (!isInt(r.bits) || r.bits < 0) fail(`${where}: bits must be a non-negative integer`);
    if (ref) { // arithmetic is derived from authoritative counts, never trusted from the record
      const close = (x, y) => Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(y));
      if (r.baseline !== ref.baseline || !close(r.oracle, ref.oracle)) fail(`${where}: baseline/oracle differ from the instance`);
      if (!close(r.bitsPerSym, r.bits / ref.n)) fail(`${where}: bitsPerSym != bits/n`);
      if (!close(r.ratioToBaseline, r.bitsPerSym / ref.baseline) || !close(r.ratioToOracle, r.bitsPerSym / ref.oracle)) fail(`${where}: ratios do not follow from bitsPerSym`);
    }
  }
  else { if (!RESULT_STAGES.includes(r.stage)) fail(`${where}: failed result stage ${JSON.stringify(r.stage)} not in ${RESULT_STAGES.join('|')}`); if (typeof r.error !== 'string') fail(`${where}: failed result lacks error string`); }
}
export function validateMessages(msgs, where) {
  if (!Array.isArray(msgs) || !msgs.length) fail(`${where}: messagesSent missing`);
  msgs.forEach((m, i) => { if (!isPlainObj(m) || !['user', 'assistant'].includes(m.role)) fail(`${where}: message ${i} role invalid`); const c = m.content; const okText = typeof c === 'string' && c.length > 0; const okBlocks = Array.isArray(c) && c.length > 0 && c.every(b => isPlainObj(b) && b.type === 'text' && typeof b.text === 'string'); if (!okText && !okBlocks) fail(`${where}: message ${i} content invalid`); });
  if (msgs[0].role !== 'user') fail(`${where}: first message must be the user task`);
}
export function validateMeta(meta) {
  if (!isPlainObj(meta) || meta.type !== 'meta') fail('meta record missing');
  if (meta.schema !== 4) fail(`schema ${meta.schema}; schema 4 required`);
  for (const f of ['runId', 'domain', 'generatorVersion', 'model', 'system']) if (!isStr(meta[f])) fail(`meta.${f} missing or not a string`);
  if (typeof meta.seed !== 'number') fail('meta.seed must be a number'); assertSeed(meta.seed);
  if (!MEMORY_MODES.includes(meta.memory)) fail('meta.memory invalid');
  if (!isInt(meta.maxAttempts) || meta.maxAttempts < 1 || meta.maxAttempts > ATTEMPTS_MAX || meta.attempts !== meta.maxAttempts) fail('meta.maxAttempts/attempts invalid');
  if (!isPlainObj(meta.opts)) fail('meta.opts missing'); validateOpts(meta.opts); if (!isPlainObj(meta.secret)) fail('meta.secret missing');
  if (!isInt(meta.n) || meta.n < 1 || typeof meta.baseline !== 'number' || typeof meta.oracle !== 'number') fail('meta.n/baseline/oracle missing');
  if (!isHex64(meta.instanceDigest)) fail('meta.instanceDigest invalid'); if (!isHex64(meta.worldDigest)) fail('meta.worldDigest invalid');
  if (meta.hint !== null && !isStr(meta.hint)) fail('meta.hint must be null or a string');
  if (meta.scaffold !== null && !isStr(meta.scaffold)) fail('meta.scaffold must be null or a path');
  if (meta.scaffold !== null && !isHex64(meta.scaffoldHash)) fail('meta.scaffoldHash missing for a scaffold run');
  if (meta.slot !== null) { if (!isPlainObj(meta.slot) || !isStr(meta.slot.batchId) || !isStr(meta.slot.condition) || typeof meta.slot.seed !== 'number' || !isInt(meta.slot.repeat)) fail('meta.slot invalid'); }
}
export function validateAttempt(x, i, meta, where = `attempt ${i + 1}`) {
  if (!isPlainObj(x) || x.type !== 'attempt') fail(`${where}: not an attempt record`);
  if (x.attempt !== i + 1) fail(`${where}: attempt number ${x.attempt} is not ${i + 1}`);
  if (typeof x.raw !== 'string') fail(`${where}: raw missing`); if (typeof x.feedbackText !== 'string' || !x.feedbackText) fail(`${where}: feedbackText missing`);
  if (typeof x.idea !== 'string') fail(`${where}: idea missing`); if (!(x.code === null || typeof x.code === 'string')) fail(`${where}: code must be null or string`);
  validateMessages(x.messagesSent, where); validateResult(x.result, where, meta ? { n: meta.n, baseline: meta.baseline, oracle: meta.oracle } : null);
}
export function validateEnd(end, meta, attempts) {
  if (!isPlainObj(end) || end.type !== 'end') fail('end record missing');
  if (!RUN_STATUS.includes(end.status)) fail(`end.status must be ${RUN_STATUS.join('|')}`);
  if (!('success' in end)) fail('end.success missing (must be null or an integer)');
  if (!isInt(end.attemptsUsed) || end.attemptsUsed !== attempts.length) fail(`end.attemptsUsed ${end.attemptsUsed} != ${attempts.length} attempt records`);
  if (attempts.length > meta.maxAttempts) fail(`${attempts.length} attempts exceed the budget ${meta.maxAttempts}`);
  if (end.maxAttempts !== meta.maxAttempts) fail(`end.maxAttempts ${end.maxAttempts} != meta.maxAttempts ${meta.maxAttempts}`);
  if (typeof end.budgetExhausted !== 'boolean') fail('end.budgetExhausted must be a strict boolean');
  // the ONE success event, derived from validated attempt results
  const first = attempts.findIndex(x => isSuccess(x.result)); const derivedSuccess = first < 0 ? null : first + 1;
  if (end.success !== derivedSuccess) fail(`end.success ${JSON.stringify(end.success)} contradicts attempt results (derived ${derivedSuccess})`);
  if (derivedSuccess !== null && attempts.length !== derivedSuccess) fail('attempts continue after the first success (early stopping violated)');
  if (end.status === 'completed') {
    const derivedExhausted = derivedSuccess === null && attempts.length === meta.maxAttempts;
    if (end.budgetExhausted !== derivedExhausted) fail(`end.budgetExhausted contradicts derived ${derivedExhausted}`);
    if (derivedSuccess === null && !derivedExhausted) fail('completed failed run did not exhaust its budget');
  } else {
    if (end.budgetExhausted !== false) fail('interrupted run cannot be budgetExhausted'); if (!isStr(end.reason)) fail('interrupted run needs a reason');
    // an interruption can only happen while another attempt was still due: before any success and before exhaustion
    if (derivedSuccess !== null) fail('interrupted after a success is not a reachable state');
    if (attempts.length >= meta.maxAttempts) fail('interrupted after the budget was exhausted is not a reachable state');
  }
}
// Validates a parsed run log. Returns {meta, attempts, end} or throws.
export function validateRunLog(lines) {
  if (!Array.isArray(lines) || lines.length < 2) fail('log has fewer than two records');
  const meta = lines[0], end = lines[lines.length - 1], attempts = lines.slice(1, -1);
  validateMeta(meta); attempts.forEach((x, i) => validateAttempt(x, i, meta)); validateEnd(end, meta, attempts);
  return { meta, attempts, end };
}

// A failed-trial record: a slot that produced no completed run (interrupted request, setup failure).
export function validateTrialFailed(t, cfg, header, condById) {
  if (!isPlainObj(t) || t.type !== 'trial-failed') fail('not a trial-failed record');
  if (!isStr(t.batchId) || t.batchId !== header.batchId) fail(`trial-failed batch ${t.batchId} != file batch ${header.batchId}`);
  if (!condById[t.condition]) fail(`trial-failed condition "${t.condition}" not in config`);
  if (typeof t.seed !== 'number' || !cfg.seeds.includes(t.seed)) fail('trial-failed seed not in config');
  if (!(isInt(t.repeat) && t.repeat >= 0 && t.repeat < cfg.repeats)) fail('trial-failed repeat out of range');
  if (!isStr(t.reason)) fail('trial-failed lacks a reason');
  if (!['setup', 'interrupted'].includes(t.stage)) fail('trial-failed stage must be setup|interrupted');
  if (t.stage === 'setup') { if (t.runId != null || t.log != null) fail('setup failure cannot carry a run'); }
  else { if (!isStr(t.runId) || !isStr(t.log)) fail('interrupted trial-failed must link its run log'); }
}
// Builds and validates a trial row (writer side) / validates one (reader side).
export function validateTrial(t, cfg, header, condById) {
  const c = condById[t.condition]; if (!c) fail(`trial condition "${t.condition}" not in config`);
  const k = `${t.condition}/${t.seed}/${t.repeat}`;
  for (const f of ['batchId', 'model', 'generatorVersion', 'runId']) if (!isStr(t[f])) fail(`trial ${k}: ${f} missing or not a string`);
  if (!isHex64(t.instanceDigest) || !isHex64(t.worldDigest)) fail(`trial ${k}: digests invalid`);
  if (!isStr(header.batchId) || !isStr(header.model)) fail('batch header lacks batchId/model');
  if (t.batchId !== header.batchId) fail(`trial batch ${t.batchId} != file batch ${header.batchId}`);
  if (t.model !== header.model) fail(`trial model ${t.model} != batch model ${header.model}`);
  if (typeof t.seed !== 'number') fail(`trial ${k}: seed must be a number`); assertSeed(t.seed);
  if (!cfg.seeds.includes(t.seed)) fail(`trial seed ${t.seed} not in config seeds`);
  if (!(isInt(t.repeat) && t.repeat >= 0 && t.repeat < cfg.repeats)) fail(`trial repeat ${t.repeat} outside [0,${cfg.repeats})`);
  if (t.domain !== c.domain) fail(`trial ${k}: domain ${t.domain} contradicts config ${c.domain}`);
  if (!isPlainObj(t.opts) || JSON.stringify(t.opts) !== JSON.stringify(c.opts || {})) fail(`trial ${k}: options contradict config`);
  if (t.memory !== (c.memory || cfg.memory || 'full')) fail(`trial ${k}: memory contradicts config`);
  if (t.maxAttempts !== cfg.attempts) fail(`trial ${k}: maxAttempts != config`);
  if (!(t.success === null || (isInt(t.success) && t.success >= 1 && t.success <= cfg.attempts))) fail(`trial ${k}: success must be null or an integer in [1,${cfg.attempts}]`);
  if (!isInt(t.attemptsUsed) || t.attemptsUsed < 1 || t.attemptsUsed > cfg.attempts) fail(`trial ${k}: attemptsUsed invalid`);
  if (t.success !== null && t.attemptsUsed !== t.success) fail(`trial ${k}: success at ${t.success} but attemptsUsed ${t.attemptsUsed}`);
  if (t.success === null && t.attemptsUsed !== cfg.attempts) fail(`trial ${k}: failed trial did not exhaust its budget`);
  if (typeof t.budgetExhausted !== 'boolean' || t.budgetExhausted !== (t.success === null && t.attemptsUsed === cfg.attempts)) fail(`trial ${k}: budgetExhausted invalid or contradicts outcome`);
  if (!isInt(t.distinctIdeas) || !isInt(t.tokens) || typeof t.seconds !== 'number') fail(`trial ${k}: metrics missing`);
}
