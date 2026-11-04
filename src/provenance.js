import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { SYSTEM_BASE, buildMessages, describeResult, parseResponse } from './prompt.js';

export const sha256 = text => createHash('sha256').update(text).digest('hex');
export const promptBuilderHash = () => sha256(readFileSync(new URL('./prompt.js', import.meta.url)));
export function validateRequestArchive(log, inst, treatment = log.meta, expectedPromptHash = promptBuilderHash()) {
  const m = log.meta;
  if (m.promptBuilderHash !== expectedPromptHash || expectedPromptHash !== promptBuilderHash()) throw new Error('prompt-builder hash differs from the frozen source');
  const scaffold = m.scaffoldText;
  if (scaffold !== null && typeof scaffold !== 'string') throw new Error('archived scaffold text missing');
  if (m.scaffoldHash !== (scaffold === null ? null : sha256(scaffold))) throw new Error('archived scaffold text hash mismatch');
  if ((m.scaffold === null) !== (scaffold === null)) throw new Error('scaffold path/text mismatch');
  if (m.system !== SYSTEM_BASE + (scaffold === null ? '' : `\n\n${scaffold}`)) throw new Error('system differs from base plus archived scaffold');
  const history = [];
  for (const x of log.attempts) {
    const expected = buildMessages(inst, history, { hint: treatment.hint ?? null, memory: treatment.memory ?? 'full' });
    if (JSON.stringify(x.messagesSent) !== JSON.stringify(expected)) throw new Error(`attempt ${x.attempt}: messagesSent differs from reconstructed request`);
    if (x.status === 'received') {
      if (x.feedbackText !== describeResult(x.result)) throw new Error(`attempt ${x.attempt}: feedbackText differs from result`);
      const parsed = parseResponse(x.raw);
      for (const field of ['idea','code','assumption','newObject']) if (x[field] !== parsed[field]) throw new Error(`attempt ${x.attempt}: ${field} differs from archived response`);
      history.push(x);
    }
  }
}
