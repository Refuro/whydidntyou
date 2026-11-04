// One typed contract for run logs and experiment trial rows, used by the WRITERS (run.js, experiment.js)
// before a record is appended and by the READERS (report.js, postmortem.js) before a record is trusted.
// Presence and type first, then consistency. No coercion anywhere: inputs are normalized once at the
// command line (normalizeRunInput) and stored fields are asserted as stored.
import { isSuccess, validateResult } from './result-contract.js';
export { validateResult } from './result-contract.js';
import { validateSeedSource } from './seed-manifest.js';
import { getDomain } from './domains/index.js';
import { parseResponse } from './prompt.js';
import { createHash } from 'node:crypto';
import { resourceValue, validateUsage, validateResources } from './resources.js';

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
  if (typeof master !== 'string' || !/^(0|[1-9][0-9]{0,77})$/.test(master) || !isInt(n) || n < 1 || n > 100000) fail('drawSeeds: master must be canonical decimal text (1–78 digits), n an integer in [1,100000]');
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
  if (cfg.seedDraw != null) { if (!isPlainObj(cfg.seedDraw) || typeof cfg.seedDraw.master !== 'string' || !isInt(cfg.seedDraw.n) || cfg.seedDraw.n !== cfg.seeds.length) fail('config seedDraw must be {master: string, n} with n equal to the seed count'); validateSeedSource(cfg.seedDraw); const drawn = drawSeeds(cfg.seedDraw.master, cfg.seedDraw.n); if (JSON.stringify(drawn) !== JSON.stringify(cfg.seeds)) fail('config seeds do not equal the registered draw from seedDraw.master'); }
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

export function validateMessages(msgs, where) {
  if (!Array.isArray(msgs) || !msgs.length) fail(`${where}: messagesSent missing`);
  msgs.forEach((m, i) => { if (!isPlainObj(m) || !['user', 'assistant'].includes(m.role)) fail(`${where}: message ${i} role invalid`); const c = m.content; const okText = typeof c === 'string' && c.length > 0; const okBlocks = Array.isArray(c) && c.length > 0 && c.every(b => isPlainObj(b) && b.type === 'text' && typeof b.text === 'string'); if (!okText && !okBlocks) fail(`${where}: message ${i} content invalid`); });
  if (msgs[0].role !== 'user') fail(`${where}: first message must be the user task`);
}
export function validateMeta(meta) {
  if (!isPlainObj(meta) || meta.type !== 'meta') fail('meta record missing');
  if (meta.schema !== 5) fail(`schema ${meta.schema}; schema 5 required`);
  for (const f of ['runId', 'domain', 'generatorVersion', 'model', 'system']) if (!isStr(meta[f])) fail(`meta.${f} missing or not a string`);
  if (!/^[0-9a-f]{32}$/.test(meta.runId)) fail('meta.runId must be 16 random bytes as hex');
  if (!isHex64(meta.promptBuilderHash)) fail('meta.promptBuilderHash invalid');
  if (meta.scaffoldText !== null && typeof meta.scaffoldText !== 'string') fail('meta.scaffoldText must be null or text');
  if (typeof meta.seed !== 'number') fail('meta.seed must be a number'); assertSeed(meta.seed);
  if (!MEMORY_MODES.includes(meta.memory)) fail('meta.memory invalid');
  if (!isInt(meta.maxAttempts) || meta.maxAttempts < 1 || meta.maxAttempts > ATTEMPTS_MAX || meta.attempts !== meta.maxAttempts) fail('meta.maxAttempts/attempts invalid');
  if (!isPlainObj(meta.opts)) fail('meta.opts missing'); validateOpts(meta.opts); if (!isPlainObj(meta.secret)) fail('meta.secret missing');
  if (!isInt(meta.n) || meta.n < 1 || typeof meta.baseline !== 'number' || typeof meta.oracle !== 'number') fail('meta.n/baseline/oracle missing');
  if (!isHex64(meta.instanceDigest)) fail('meta.instanceDigest invalid'); if (!isHex64(meta.worldDigest)) fail('meta.worldDigest invalid');
  if (meta.hint !== null && !isStr(meta.hint)) fail('meta.hint must be null or a string');
  if (meta.scaffold !== null && !isStr(meta.scaffold)) fail('meta.scaffold must be null or a path');
  if (meta.scaffold !== null && !isHex64(meta.scaffoldHash)) fail('meta.scaffoldHash missing for a scaffold run');
  if (meta.slot !== null) { const s = meta.slot; if (!isPlainObj(s) || !isStr(s.batchId) || !isStr(s.condition) || s.seed !== meta.seed || !isInt(s.repeat) || s.repeat < 0 || !isInt(s.executionIndex) || s.executionIndex < 0 || s.executionIndex > 2 || s.runId !== meta.runId) fail('meta.slot invalid'); }
}
export function validateAttempt(x, i, meta, where = `attempt ${i + 1}`, inst = meta?.domain ? getDomain(meta.domain).make(meta.seed, meta.opts) : meta) {
  if (!isPlainObj(x) || x.type !== 'attempt') fail(`${where}: not an attempt record`);
  if (x.attempt !== i + 1) fail(`${where}: attempt number ${x.attempt} is not ${i + 1}`);
  validateMessages(x.messagesSent, where); validateUsage(x.usage);
  if (x.status === 'dispatched') {
    for (const f of ['raw','result','feedbackText','idea','code','assumption','newObject','usage']) if (x[f] !== null) fail(`${where}: dispatched ${f} must be null`);
    return;
  }
  if(x.status==='received-unscored'){
    if(typeof x.raw!=='string')fail(`${where}: receipt raw missing`);
    for(const f of ['result','feedbackText','idea','code','assumption','newObject'])if(x[f]!==null)fail(`${where}: unscored ${f} must be null`);
    return;
  }
  if (x.status !== 'received') fail(`${where}: status must be dispatched|received`);
  if (typeof x.raw !== 'string') fail(`${where}: raw missing`); if (typeof x.feedbackText !== 'string' || !x.feedbackText) fail(`${where}: feedbackText missing`);
  if (typeof x.idea !== 'string') fail(`${where}: idea missing`); if (!(x.code === null || typeof x.code === 'string')) fail(`${where}: code must be null or string`);
  validateMessages(x.messagesSent, where); validateResult(x.result, where, inst ?? undefined);
  const parsed=parseResponse(x.raw);
  if(x.code!==parsed.code)fail(`${where}: code differs from parsed response`);
  const truncated=x.usage?.stop_reason==='max_tokens'&&!/<\/code>/.test(x.raw);
  if(!parsed.code && (x.result.ok||!['parse','truncated'].includes(x.result.stage)))fail(`${where}: execution result without parsed code`);
  if((x.result.stage==='truncated')!==truncated||x.result.stage==='parse'&&(!!parsed.code||truncated))fail(`${where}: impossible parse/result combination`);
}
export function validateEnd(end, meta, attempts, inst=getDomain(meta.domain).make(meta.seed,meta.opts)) {
  if (!isPlainObj(end) || end.type !== 'end') fail('end record missing');
  if (!RUN_STATUS.includes(end.status)) fail(`end.status must be ${RUN_STATUS.join('|')}`);
  if (!('success' in end)) fail('end.success missing (must be null or an integer)');
  const received = attempts.filter(a => a.status === 'received');
  const pending = attempts.filter(a => a.status !== 'received');
  if (pending.length > 1 || (pending.length && attempts.at(-1).status === 'received')) fail('only the last attempt may remain dispatched');
  if (!isInt(end.attemptsUsed) || end.attemptsUsed !== received.length) fail('end.attemptsUsed differs from received responses');
  if (end.requestsDispatched !== attempts.length) fail('end.requestsDispatched differs from archived requests');
  if (attempts.length > meta.maxAttempts) fail(`${attempts.length} attempts exceed the budget ${meta.maxAttempts}`);
  if (end.maxAttempts !== meta.maxAttempts) fail(`end.maxAttempts ${end.maxAttempts} != meta.maxAttempts ${meta.maxAttempts}`);
  if (typeof end.budgetExhausted !== 'boolean') fail('end.budgetExhausted must be a strict boolean');
  // the ONE success event, derived from validated attempt results
  const first = attempts.findIndex(x => isSuccess(x.result, inst)); const derivedSuccess = first < 0 ? null : first + 1;
  if (end.success !== derivedSuccess) fail(`end.success ${JSON.stringify(end.success)} contradicts attempt results (derived ${derivedSuccess})`);
  if (derivedSuccess !== null && attempts.length !== derivedSuccess) fail('attempts continue after the first success (early stopping violated)');
  if (end.status === 'completed') {
    if (pending.length) fail('completed run has an unreceived response');
    const derivedExhausted = derivedSuccess === null && attempts.length === meta.maxAttempts;
    if (end.budgetExhausted !== derivedExhausted) fail(`end.budgetExhausted contradicts derived ${derivedExhausted}`);
    if (derivedSuccess === null && !derivedExhausted) fail('completed failed run did not exhaust its budget');
  } else {
    if (end.budgetExhausted !== false) fail('interrupted run cannot be budgetExhausted'); if (!isStr(end.reason)) fail('interrupted run needs a reason');
    // an interruption can only happen while another attempt was still due: before any success and before exhaustion
    if (derivedSuccess !== null) fail('interrupted after a success is not a reachable state');
    if (received.length >= meta.maxAttempts) fail('interrupted after the budget was exhausted is not a reachable state');
  }
}
// Validates a parsed run log. Returns {meta, attempts, end} or throws.
export function validateRunLog(lines) {
  if(!Array.isArray(lines)||!lines.length)fail('log has no records');
  const meta=lines[0];validateMeta(meta);
  const inst=getDomain(meta.domain).make(meta.seed,meta.opts),hasEnd=lines.at(-1).type==='end';
  const attempts=lines.slice(1,hasEnd?-1:undefined);
  attempts.forEach((x,i)=>validateAttempt(x,i,meta,undefined,inst));
  const first=attempts.findIndex(x=>isSuccess(x.result,inst)),success=first<0?null:first+1;
  const received=attempts.filter(x=>x.status==='received').length,completed=success!==null||received===meta.maxAttempts;
  const end=hasEnd?lines.at(-1):{type:'end',status:completed?'completed':'interrupted',success,attemptsUsed:received,requestsDispatched:attempts.length,maxAttempts:meta.maxAttempts,budgetExhausted:completed&&success===null,reason:completed?null:attempts.at(-1)?.status==='dispatched'?'process ended with an unreceived dispatched request':'process ended before completion; archived receipts must be rescored',inferred:true};
  validateEnd(end,meta,attempts,inst);
  return {meta,attempts,end,hasEnd};
}

// Slot and execution records use the same assignment contract on write and read.
export function validateSlot(t, cfg, header, condById) {
  if (!isPlainObj(t) || t.batchId !== header.batchId || !condById[t.condition] || !cfg.seeds.includes(t.seed) || !isInt(t.repeat) || t.repeat < 0 || t.repeat >= cfg.repeats) fail('slot does not match the batch assignment');
}
export function validateExecution(t, cfg, header, condById) {
  validateSlot(t,cfg,header,condById);
  if (t.type !== 'slot-execution' || !isInt(t.executionIndex) || t.executionIndex < 0 || t.executionIndex > 2) fail('invalid slot execution index/type');
  if (!['completed','interrupted','setup-failed'].includes(t.status)) fail('invalid execution status');
  if (!/^[0-9a-f]{32}$/.test(t.runId)) fail('execution runId must be 16 random bytes hex');
  if (t.status === 'setup-failed') { if (t.log !== null) fail('setup failure cannot link a run log'); }
  else if (!isStr(t.log)) fail('execution must link its log');
  if (t.status === 'completed' ? t.reason !== null : !isStr(t.reason)) fail('execution reason contradicts status');
  validateResources(t.resources);
}
export function validateTrial(t, cfg, header, condById) {
  validateSlot(t,cfg,header,condById);
  if (t.type !== 'slot-terminal' || !['success','failure','unresolved'].includes(t.outcome)) fail('invalid slot terminal outcome/type');
  const c=condById[t.condition];
  if (t.model !== header.model || t.domain !== c.domain || JSON.stringify(t.opts) !== JSON.stringify(c.opts || {}) || t.memory !== (c.memory || cfg.memory || 'full') || t.maxAttempts !== cfg.attempts) fail('terminal treatment/budget/model contradicts config');
  if (!isHex64(t.instanceDigest) || !isHex64(t.worldDigest) || !isStr(t.generatorVersion) || !isPlainObj(t.secret)) fail('terminal instance identity missing');
  if (!(t.success === null || (isInt(t.success) && t.success >= 1 && t.success <= cfg.attempts)) || (t.outcome === 'success') !== (t.success !== null)) fail('terminal success contradicts outcome');
  if (!Array.isArray(t.chain) || t.chain.length < 1 || t.chain.length > 3) fail('terminal must reference one to three executions');
  if (!isInt(t.attemptsUsed) || t.attemptsUsed < 0 || t.attemptsUsed > cfg.attempts || !isInt(t.distinctIdeas) || t.distinctIdeas < 0) fail('terminal attempts/ideas invalid');
  if (t.outcome === 'failure' && t.attemptsUsed !== cfg.attempts) fail('failed completed slot did not exhaust its budget');
  if (t.outcome === 'success' && t.attemptsUsed !== t.success) fail('successful slot continued after success');
  if (t.budgetExhausted !== (t.outcome === 'failure')) fail('terminal budgetExhausted contradicts outcome');
  for (const f of ['tokens','seconds']) if (!resourceValue(t[f])) fail('terminal resources must be nonnegative finite or unknown');
  validateResources(t.resources);
}
