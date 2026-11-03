// Reveal + "why didn't you try that" + judged assessment. Descriptive only: what a model says after
// revelation, and whether a specific claim it makes is supported, contradicted or unverifiable
// against its OWN full record. Not a causal explanation of the failure.
//   node src/postmortem.js --log runs/<run>.jsonl [--judge-model claude-sonnet-5-5]
import { readFileSync, appendFileSync } from 'node:fs';
import { getDomain } from './domains/index.js';
import { complete, MODEL, MOCK } from './llm.js';
import { SYSTEM_BASE, buildMessages } from './prompt.js';
import { parseArgs } from './run.js';

const a = parseArgs(process.argv.slice(2));
if (!a.log) { console.error('usage: node src/postmortem.js --log runs/<run>.jsonl'); process.exit(1); }
const lines = readFileSync(a.log, 'utf8').trim().split('\n').map(l => JSON.parse(l));
const meta = lines.find(l => l.type === 'meta'), end = lines.find(l => l.type === 'end'), attempts = lines.filter(l => l.type === 'attempt');
if (!end) { console.error('refusing: run is incomplete (no end record)'); process.exit(2); }
if (end.success) { console.error(`refusing: run succeeded at attempt ${end.success}; post-mortems are for failed runs`); process.exit(2); }
const inst = getDomain(meta.domain).make(Number(meta.seed), meta.opts || {});
if (JSON.stringify(inst.secret) !== JSON.stringify(meta.secret)) { console.error('refusing: regenerated instance does not match the logged secret (generator changed since this run)'); process.exit(2); }

// FULL original record: the same multi-turn messages the model saw (its raw responses and code), then the reveal.
const history = buildMessages(inst, attempts, { hint: meta.hint, memory: 'full' });
history.push({ role: 'user', content: `--- STOP. The experiment is over. Here is the actual answer. ---\n${inst.reveal}\n\nLook back over every attempt above (your full responses and code are all there). Answer in this order:\n1. Did the decisive idea appear in any of your attempts, in prose or in code? Quote the attempt number and the exact text if so.\n2. If it never appeared: did it occur to you and get rejected, or did it never occur to you? Be concrete and do not guess.\n3. If it did appear: why did it not succeed?\n4. One sentence of advice, containing no information about this specific process, that would have gotten you there.` });
const why = await complete({ system: SYSTEM_BASE, messages: history, maxTokens: 2500 });

// Judged assessment against the record. The judge sees the full record and the self-report; it must quote.
const record = attempts.map(x => `=== attempt ${x.attempt} (${x.result.ok ? x.result.bitsPerSym.toFixed(3) + ' bps' : 'FAIL ' + x.result.stage}) ===\n${x.raw}`).join('\n\n');
const judgeMsg = `You are assessing a model's self-report about its own failed attempts. You have the FULL record of those attempts and the answer that was revealed.

REVEALED ANSWER:\n${inst.reveal}\n\nFULL RECORD:\n${record}\n\nSELF-REPORT:\n${why}\n\nTasks:
A. Extract the model's main behavioral claim about its attempts as a short verbatim quote (e.g. "I never tested lags beyond 8").
B. Assess that claim against the record: "supported" (record shows it), "contradicted" (record shows the opposite; quote the attempt number and the exact code or text that contradicts it), or "unverifiable" (the record cannot settle it, e.g. a claim about what the model considered but did not write).
C. Category of the self-report, choose all that apply: never_considered, considered_dismissed, missing_concept, budget_misallocated, execution_failure, unknown.
Respond as JSON only: {"claim":"...","assessment":"supported|contradicted|unverifiable","evidence":"attempt N: <quote>" or "", "categories":["..."]}`;
const judgeRaw = await complete({ system: 'You are a careful, literal annotator. Respond with JSON only. Quote exactly.', messages: [{ role: 'user', content: judgeMsg }], maxTokens: 800 });
let judged = null, judgeError = null; try { judged = JSON.parse(judgeRaw.match(/\{[\s\S]*\}/)[0]); } catch (e) { judgeError = 'unparseable judge output'; }

const rec = { type: 'postmortem', log: a.log, runId: meta.runId, domain: meta.domain, seed: meta.seed, opts: meta.opts || {}, solverModel: meta.model, respondingModel: MOCK ? 'mock' : MODEL, judgeModel: MOCK ? 'mock' : (a['judge-model'] || MODEL), why, judged, judgeError, judgeRaw, ts: new Date().toISOString() };
appendFileSync('runs/postmortems.jsonl', JSON.stringify(rec) + '\n');
console.log('--- self-report ---\n' + why + '\n\n--- judged assessment ---\n' + (judged ? JSON.stringify(judged, null, 2) : 'JUDGE ERROR: ' + judgeError + '\n' + judgeRaw));
if (rec.solverModel !== rec.respondingModel) console.log(`\nNOTE: solver was ${rec.solverModel}; the self-report came from ${rec.respondingModel}. Set ANTHROPIC_MODEL to match if this is meant as a self-report.`);
console.log('\n-> runs/postmortems.jsonl');
