// Reveal + "why didn't you try that" + classification. Run on a FAILED run log.
// Treat the model's answer as a hypothesis to check against the log, not as a measurement.
//   node src/postmortem.js --log runs/<file>.jsonl
import { readFileSync, appendFileSync } from 'node:fs';
import { getDomain } from './domains/index.js';
import { complete } from './llm.js';
import { SYSTEM_BASE, buildUserMessage } from './prompt.js';
import { parseArgs } from './run.js';

const a = parseArgs(process.argv.slice(2));
if (!a.log) { console.error('usage: node src/postmortem.js --log runs/<run>.jsonl'); process.exit(1); }
const lines = readFileSync(a.log, 'utf8').trim().split('\n').map(l => JSON.parse(l));
const meta = lines.find(l => l.type === 'meta'); const attempts = lines.filter(l => l.type === 'attempt');
const inst = getDomain(meta.domain).make(Number(meta.seed));

const transcript = buildUserMessage(inst, attempts, { hint: meta.hint });
const revealMsg = `${transcript}\n\n--- STOP. The experiment is over. Here is the actual answer. ---\n${inst.reveal}\n\nLook back over every attempt you made. Why didn't you try that? Be specific and concrete: did the idea never occur to you, did you consider it and dismiss it (when, and why), did you lack a concept needed to think of it, or did you spend your attempts elsewhere? Quote your own attempts where relevant. Then say what single sentence of advice, containing no information about this specific process, would have gotten you there.`;
const why = await complete({ system: SYSTEM_BASE, messages: [{ role: 'user', content: revealMsg }], maxTokens: 2000 });

const classifyMsg = `Classify the following self-explanation of a failed discovery attempt into exactly one category:
- never_considered: the key idea never came up at all
- considered_dismissed: the idea came up and was rejected or deprioritized
- missing_concept: the model lacked a concept/tool needed to form the idea
- budget_misallocated: the model knew where to look but spent its attempts elsewhere
- execution_failure: it had the idea but the code was wrong
Also extract the "generic advice" sentence it proposed, verbatim if present.
Respond as JSON: {"category": "...", "evidence": "short quote", "advice": "..."}.

Self-explanation:
${why}`;
const cls = await complete({ system: 'You are a careful annotator. Respond with JSON only.', messages: [{ role: 'user', content: classifyMsg }], maxTokens: 500 });
let parsed = null; try { parsed = JSON.parse(cls.match(/\{[\s\S]*\}/)[0]); } catch {}

// Behavioral cross-check: did the key idea actually appear anywhere in the log?
const ideas = attempts.map(x => (x.idea + ' ' + (x.assumption || '') + ' ' + (x.newObject || '')).toLowerCase());
const probes = meta.domain === 'laggedRule' ? ['lag', 'earlier', 'back', 'offset', 'delay', 'k-th', 'steps before'] : ['period', 'position', 'mod', 'cycle', 'index', 'repeat every'];
const mentioned = attempts.filter((_, i) => probes.some(p => ideas[i].includes(p))).map(x => x.attempt);

const rec = { type: 'postmortem', log: a.log, runId: meta.runId, domain: meta.domain, seed: meta.seed, model: meta.model, why, classification: parsed, raw_classification: cls, keyMoveMentionedInAttempts: mentioned, ts: new Date().toISOString() };
appendFileSync('runs/postmortems.jsonl', JSON.stringify(rec) + '\n');
console.log('--- model explanation ---\n' + why + '\n\n--- classification ---\n' + JSON.stringify(parsed, null, 2));
console.log(`\n--- behavioral cross-check ---\nattempts whose stated idea touched the key move: ${mentioned.length ? mentioned.join(', ') : 'none'}`);
if (parsed && parsed.category === 'considered_dismissed' && !mentioned.length) console.log('NOTE: model claims it considered the idea, but no attempt mentions it. Likely confabulation.');
if (parsed && parsed.category === 'never_considered' && mentioned.length) console.log('NOTE: model claims it never considered the idea, but attempts ' + mentioned.join(',') + ' mention it. Likely confabulation.');
console.log('\n-> runs/postmortems.jsonl');
