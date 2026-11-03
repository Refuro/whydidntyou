// One typed contract for run logs and experiment trial rows, shared by run.js (writer), report.js and
// postmortem.js (readers). Every check is a presence+type check first, then a consistency check.
export const SEED_MIN = 0, SEED_MAX = 4294967295; // generators normalize seeds to 32 bits; aliases outside this range are refused
const isStr = (x) => typeof x === 'string' && x.length > 0;
const isInt = Number.isInteger;

export function assertSeed(seed) {
  if (!isInt(seed) || seed < SEED_MIN || seed > SEED_MAX) throw new Error(`seed must be an integer in [${SEED_MIN}, ${SEED_MAX}] (got ${JSON.stringify(seed)}); larger values alias smaller ones`);
}

// Validates a parsed run log (array of records). Returns {meta, attempts, end} or throws with a reason.
export function validateRunLog(lines) {
  if (!Array.isArray(lines) || lines.length < 2) throw new Error('log has fewer than two records');
  const meta = lines[0], end = lines[lines.length - 1], attempts = lines.slice(1, -1);
  if (meta.type !== 'meta') throw new Error('first record is not meta');
  if (end.type !== 'end') throw new Error('last record is not end');
  if (meta.schema !== 3) throw new Error(`schema ${meta.schema}; schema 3 required`);
  for (const f of ['runId', 'domain', 'generatorVersion', 'model', 'memory', 'system']) if (!isStr(meta[f])) throw new Error(`meta.${f} missing or not a string`);
  assertSeed(Number(meta.seed));
  if (!isInt(meta.maxAttempts) || meta.maxAttempts < 1 || meta.attempts !== meta.maxAttempts) throw new Error('meta.maxAttempts/attempts invalid');
  if (typeof meta.opts !== 'object' || meta.opts === null) throw new Error('meta.opts missing');
  if (typeof meta.secret !== 'object' || meta.secret === null) throw new Error('meta.secret missing');
  if (attempts.some(x => x.type !== 'attempt')) throw new Error('records between meta and end are not all attempts');
  attempts.forEach((x, i) => {
    if (x.attempt !== i + 1) throw new Error(`attempt records not consecutive at index ${i}`);
    if (typeof x.raw !== 'string') throw new Error(`attempt ${i + 1}: raw missing`);
    if (typeof x.feedbackText !== 'string') throw new Error(`attempt ${i + 1}: feedbackText missing`);
    if (!Array.isArray(x.messagesSent) || !x.messagesSent.length) throw new Error(`attempt ${i + 1}: messagesSent missing`);
    if (!x.result || typeof x.result.ok !== 'boolean') throw new Error(`attempt ${i + 1}: result missing`);
  });
  if (!('success' in end)) throw new Error('end.success missing (must be null or an integer)');
  if (!(end.success === null || (isInt(end.success) && end.success >= 1 && end.success <= meta.maxAttempts))) throw new Error(`end.success invalid: ${JSON.stringify(end.success)}`);
  if (!isInt(end.attemptsUsed) || end.attemptsUsed !== attempts.length) throw new Error(`end.attemptsUsed ${end.attemptsUsed} != ${attempts.length} attempt records`);
  if (end.maxAttempts !== meta.maxAttempts) throw new Error(`end.maxAttempts ${end.maxAttempts} != meta.maxAttempts ${meta.maxAttempts}`);
  if (typeof end.budgetExhausted !== 'boolean') throw new Error('end.budgetExhausted must be a strict boolean');
  const derivedExhausted = end.success === null && attempts.length === meta.maxAttempts;
  if (end.budgetExhausted !== derivedExhausted) throw new Error(`end.budgetExhausted ${end.budgetExhausted} contradicts derived ${derivedExhausted}`);
  if (end.success !== null && end.attemptsUsed !== end.success) throw new Error('success index disagrees with attemptsUsed');
  return { meta, attempts, end };
}

// Validates one experiment trial row against the config and batch header. Throws with a reason.
export function validateTrial(t, cfg, header, condById) {
  const c = condById[t.condition]; if (!c) throw new Error(`trial condition "${t.condition}" not in config`);
  for (const f of ['batchId', 'model', 'generatorVersion', 'runId', 'instanceDigest']) if (!isStr(t[f])) throw new Error(`trial ${t.condition}/${t.seed}/${t.repeat}: ${f} missing or not a string`);
  if (!isStr(header.batchId) || !isStr(header.model)) throw new Error('batch header lacks batchId/model');
  if (t.batchId !== header.batchId) throw new Error(`trial batch ${t.batchId} != file batch ${header.batchId}`);
  if (t.model !== header.model) throw new Error(`trial model ${t.model} != batch model ${header.model}`);
  assertSeed(t.seed);
  if (!cfg.seeds.includes(t.seed)) throw new Error(`trial seed ${t.seed} not in config seeds`);
  if (!(isInt(t.repeat) && t.repeat >= 0 && t.repeat < cfg.repeats)) throw new Error(`trial repeat ${t.repeat} outside [0,${cfg.repeats})`);
  if (t.domain !== c.domain) throw new Error(`trial ${t.condition}/${t.seed}/${t.repeat}: domain ${t.domain} contradicts config ${c.domain}`);
  if (JSON.stringify(t.opts || {}) !== JSON.stringify(c.opts || {})) throw new Error(`trial ${t.condition}/${t.seed}/${t.repeat}: options contradict config`);
  if (t.memory !== (c.memory || cfg.memory || 'full')) throw new Error(`trial ${t.condition}/${t.seed}/${t.repeat}: memory contradicts config`);
  if (t.maxAttempts !== cfg.attempts) throw new Error(`trial ${t.condition}/${t.seed}/${t.repeat}: maxAttempts != config`);
  if (!(t.success === null || (isInt(t.success) && t.success >= 1 && t.success <= cfg.attempts))) throw new Error(`trial ${t.condition}/${t.seed}/${t.repeat}: success must be null or an integer in [1,${cfg.attempts}]`);
  if (!isInt(t.attemptsUsed) || t.attemptsUsed < 1 || t.attemptsUsed > cfg.attempts) throw new Error(`trial ${t.condition}/${t.seed}/${t.repeat}: attemptsUsed invalid`);
  if (t.success !== null && t.attemptsUsed !== t.success) throw new Error(`trial ${t.condition}/${t.seed}/${t.repeat}: success at ${t.success} but attemptsUsed ${t.attemptsUsed}`);
  if (t.success === null && t.attemptsUsed !== cfg.attempts) throw new Error(`trial ${t.condition}/${t.seed}/${t.repeat}: failed trial did not exhaust its budget`);
  if (typeof t.budgetExhausted !== 'boolean' || t.budgetExhausted !== (t.success === null && t.attemptsUsed === cfg.attempts)) throw new Error(`trial ${t.condition}/${t.seed}/${t.repeat}: budgetExhausted invalid or contradicts outcome`);
}
