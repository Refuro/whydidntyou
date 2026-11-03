// The attempt loop. One run = one model, one domain instance, N attempts, every attempt logged.
//   node src/run.js --domain laggedRule --seed 1 --attempts 20
//   node src/run.js --domain laggedRule --seed 1 --attempts 8 --hint "..." --tag hintL2
//   node src/run.js ... --scaffold scaffolds/reframe.md      (transfer test: generic scaffold appended to system prompt)
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { getDomain } from './domains/index.js';
import { evaluate, isSuccess } from './sandbox.js';
import { complete, MODEL, MOCK, getLastUsage } from './llm.js';
import { SYSTEM_BASE, buildUserMessage, parseResponse } from './prompt.js';

export function parseArgs(argv) {
  const a = {}; for (let i = 0; i < argv.length; i++) { if (argv[i].startsWith('--')) { const k = argv[i].slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; a[k] = v; } } return a;
}

export async function runAttempts({ domain, seed, attempts, hint = null, scaffold = null, tag = '', quiet = false }) {
  const d = getDomain(domain);
  const inst = d.make(Number(seed));
  const system = SYSTEM_BASE + (scaffold ? `\n\n${readFileSync(scaffold, 'utf8')}` : '');
  mkdirSync('runs', { recursive: true });
  const runId = `${domain}-s${seed}-${MOCK ? 'mock' : MODEL}${tag ? '-' + tag : ''}-${Date.now()}`;
  const logPath = `runs/${runId}.jsonl`;
  const meta = { type: 'meta', runId, domain, seed, model: MOCK ? 'mock' : MODEL, attempts: Number(attempts), hint, scaffold, secret: inst.secret, baseline: inst.baselineBitsPerSym, oracle: inst.oracleBitsPerSym, startedAt: new Date().toISOString() };
  appendFileSync(logPath, JSON.stringify(meta) + '\n');
  if (!quiet) console.log(`run ${runId}\n  secret=${JSON.stringify(inst.secret)} baseline=${inst.baselineBitsPerSym} oracle=${inst.oracleBitsPerSym.toFixed(3)} target<=${(inst.baselineBitsPerSym * 0.6).toFixed(2)}`);

  const history = [];
  let success = null;
  for (let attempt = 1; attempt <= Number(attempts); attempt++) {
    const user = buildUserMessage(inst, history, { hint });
    const raw = await complete({ system, messages: [{ role: 'user', content: user }] });
    const parsed = parseResponse(raw);
    const result = parsed.code ? evaluate(parsed.code, inst) : { ok: false, stage: 'parse', error: 'no <code> block in response' };
    const rec = { type: 'attempt', attempt, idea: parsed.idea, assumption: parsed.assumption, newObject: parsed.newObject, code: parsed.code, raw, result, usage: getLastUsage(), ts: new Date().toISOString() };
    appendFileSync(logPath, JSON.stringify(rec) + '\n');
    history.push(rec);
    if (!quiet) console.log(`  #${attempt} ${result.ok ? result.bitsPerSym.toFixed(3) + ' bps' : 'FAIL(' + result.stage + ')'}  ${parsed.idea}`);
    if (isSuccess(result)) { success = attempt; break; }
  }
  appendFileSync(logPath, JSON.stringify({ type: 'end', success, attemptsUsed: history.length, endedAt: new Date().toISOString() }) + '\n');
  if (!quiet) console.log(success ? `  SUCCESS at attempt ${success}` : `  no success in ${history.length} attempts`);
  return { runId, logPath, success, history, inst };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('run.js')) {
  const a = parseArgs(process.argv.slice(2));
  if (!a.domain) { console.error('usage: node src/run.js --domain laggedRule --seed 1 --attempts 20 [--hint "..."] [--scaffold file] [--tag name]'); process.exit(1); }
  runAttempts({ domain: a.domain, seed: a.seed ?? 1, attempts: a.attempts ?? 20, hint: a.hint || null, scaffold: a.scaffold || null, tag: a.tag || '' })
    .then(r => console.log(`log: ${r.logPath}`)).catch(e => { console.error(e); process.exit(1); });
}
