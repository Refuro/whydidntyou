// The attempt loop. One run = one model, one domain instance, N attempts, every attempt logged.
//   node src/run.js --domain laggedRule --seed 1 --attempts 20
//   node src/run.js --domain laggedRule --seed 1 --attempts 8 --hint "..." --tag hintL2
//   node src/run.js ... --scaffold scaffolds/reframe.md      (transfer test: generic scaffold appended to system prompt)
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { getDomain } from './domains/index.js';
import { evaluate, isSuccess } from './sandbox.js';
import { complete, MODEL, MOCK, getLastUsage } from './llm.js';
import { SYSTEM_BASE, buildMessages, parseResponse, describeResult } from './prompt.js';
import { normalizeRunInput, validateMeta, validateAttempt, validateEnd } from './validate.js';

export function parseArgs(argv) {
  const a = {}; for (let i = 0; i < argv.length; i++) { if (argv[i].startsWith('--')) { const k = argv[i].slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; a[k] = v; } } return a;
}

export async function runAttempts({ domain, seed, attempts, hint = null, scaffold = null, memory = 'full', opts = {}, slot = null, tag = '', quiet = false }) {
  ({ seed, attempts, memory, opts } = normalizeRunInput({ seed, attempts, memory, opts }));
  if (hint !== null && (typeof hint !== 'string' || !hint)) throw new Error('hint must be null or a non-empty string');
  const d = getDomain(domain);
  const inst = d.make(seed, opts);
  const scaffoldText = scaffold ? readFileSync(scaffold, 'utf8') : null;
  const scaffoldHash = scaffoldText === null ? null : createHash('sha256').update(scaffoldText).digest('hex');
  const system = SYSTEM_BASE + (scaffoldText !== null ? `\n\n${scaffoldText}` : '');
  mkdirSync('runs', { recursive: true });
  const runId = `${domain}-s${seed}-${MOCK ? 'mock' : MODEL}${tag ? '-' + tag : ''}-${Date.now()}`;
  const logPath = `runs/${runId}.jsonl`;
  const meta = { type: 'meta', schema: 4, runId, domain, generatorVersion: inst.generatorVersion, seed, model: MOCK ? 'mock' : MODEL, attempts, maxAttempts: attempts, hint, scaffold, scaffoldHash, slot, memory, opts, system, secret: inst.secret, instanceDigest: inst.instanceDigest, worldDigest: inst.worldDigest, n: inst.n, baseline: inst.baselineBitsPerSym, oracle: inst.oracleBitsPerSym, startedAt: new Date().toISOString() };
  validateMeta(meta);
  appendFileSync(logPath, JSON.stringify(meta) + '\n');
  if (!quiet) console.log(`run ${runId}\n  secret=${JSON.stringify(inst.secret)} baseline=${inst.baselineBitsPerSym} oracle=${inst.oracleBitsPerSym.toFixed(3)} target<=${(inst.baselineBitsPerSym * 0.6).toFixed(2)}`);

  const history = [];
  let success = null;
  const writeEnd = (status, reason) => { const end = { type: 'end', status, success, attemptsUsed: history.length, maxAttempts: attempts, budgetExhausted: status === 'completed' && !success && history.length === attempts, reason: reason || null, endedAt: new Date().toISOString() }; validateEnd(end, meta, history); appendFileSync(logPath, JSON.stringify(end) + '\n'); return end; };
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const messages = buildMessages(inst, history, { hint, memory });
    let raw;
    try { raw = await complete({ system, messages }); }
    catch (e) { // request failure is NOT an attempt: record the run as interrupted and stop
      const end = writeEnd('interrupted', 'api: ' + String(e && e.message || e).slice(0, 300));
      if (!quiet) console.log(`  run interrupted at attempt ${attempt}: ${end.reason}`);
      return { runId, logPath, success: null, interrupted: true, reason: end.reason, history, inst };
    }
    const usage = getLastUsage();
    const parsed = parseResponse(raw);
    const truncated = usage && usage.stop_reason === 'max_tokens' && !/<\/code>/.test(raw);
    const result = truncated ? { ok: false, stage: 'truncated', error: `output hit the ${usage.output_tokens}-token limit before </code>` }
      : parsed.code ? await evaluate(parsed.code, inst).catch(e => ({ ok: false, stage: 'verify', error: 'host boundary: ' + String(e && e.message || e).slice(0, 200) })) : { ok: false, stage: 'parse', error: 'no <code> block in response' };
    const rec = { type: 'attempt', attempt, messagesSent: messages, idea: parsed.idea, assumption: parsed.assumption, newObject: parsed.newObject, code: parsed.code, raw, result, feedbackText: describeResult(result), usage, ts: new Date().toISOString() };
    validateAttempt(rec, attempt - 1, meta);
    appendFileSync(logPath, JSON.stringify(rec) + '\n');
    history.push(rec);
    if (!quiet) console.log(`  #${attempt} ${result.ok ? result.bitsPerSym.toFixed(3) + ' bps' : 'FAIL(' + result.stage + ')'}  ${parsed.idea}`);
    if (isSuccess(result)) { success = attempt; break; }
  }
  writeEnd('completed', null);
  if (!quiet) console.log(success ? `  SUCCESS at attempt ${success}` : `  no success in ${history.length} attempts`);
  return { runId, logPath, success, interrupted: false, history, inst };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('run.js')) {
  const a = parseArgs(process.argv.slice(2));
  if (!a.domain) { console.error('usage: node src/run.js --domain laggedRule --seed 1 --attempts 20 [--memory full|last-code|summary] [--k 20] [--hint "..."] [--scaffold file] [--tag name]'); process.exit(1); }
  runAttempts({ domain: a.domain, seed: a.seed ?? 1, attempts: a.attempts ?? 20, hint: a.hint || null, scaffold: a.scaffold || null, memory: a.memory || 'full', opts: a.k ? { k: Number(a.k) } : {}, tag: a.tag || '' })
    .then(r => console.log(`log: ${r.logPath}`)).catch(e => { console.error(e); process.exit(1); });
}
