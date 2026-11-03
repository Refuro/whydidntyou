// Prompt construction. Kept in one place so every run uses the same wording.
export const SYSTEM_BASE =
`You are trying to solve a problem no one has solved before. You have a verifier that tells you exactly how many bits your compressor uses on hidden data from the same process. Think like a scientist: form hypotheses about the generating process, test them against the sample, and write code that exploits what you find.

Output format (strict):
<idea>one sentence: the single core idea of THIS attempt, in plain language</idea>
<assumption_questioned>an assumption you deliberately dropped in this attempt, or "none"</assumption_questioned>
<new_object>a new quantity/structure you defined and named in this attempt, or "none"</new_object>
<code>
// plain JavaScript, no imports. Must define:
//   function encode(symbols) -> string of '0'/'1'
//   function decode(bits, n) -> array of n integers
// The alphabet size is available as the global A.
</code>`;

export function describeResult(r) {
  if (r.ok) return `${r.bitsPerSym.toFixed(3)} bits/symbol (${(r.ratioToBaseline * 100).toFixed(0)}% of fixed-length)`;
  if (r.stage === 'truncated') return `FAILED: your response was cut off at the output token limit before the code was complete. Write more compact code.`;
  return `FAILED at ${r.stage}: ${r.error}`;
}

function problemText(inst, { hint, sampleLen }) {
  const parts = [inst.description, `\nHere are the first ${sampleLen} symbols of the sample sequence:\n${inst.sample.slice(0, sampleLen).join(' ')}`];
  if (hint) parts.push(`\nHint: ${hint}`);
  parts.push(`\nGoal: at most ${(inst.baselineBitsPerSym * 0.6).toFixed(2)} bits/symbol.`);
  return parts.join('\n');
}

// Memory modes — an experimental variable, state it in the prereg:
//   full      multi-turn: the model sees all of its previous responses in full, each followed by the verifier result
//   last-code single turn: idea+result list for all attempts, plus the full code of the most recent attempt
//   summary   single turn: idea+result list only (no code)
export function buildMessages(inst, history, { hint = null, sampleLen = 1200, memory = 'full' } = {}) {
  const problem = problemText(inst, { hint, sampleLen });
  const first = { role: 'user', content: [{ type: 'text', text: problem + '\n\nProduce your first attempt now.', cache_control: { type: 'ephemeral' } }] };
  if (memory === 'full') {
    const msgs = [first];
    for (const h of history) {
      msgs.push({ role: 'assistant', content: h.raw });
      msgs.push({ role: 'user', content: `Verifier result for attempt ${h.attempt}: ${describeResult(h.result)}\n\nProduce your next attempt now.` });
    }
    return msgs;
  }
  const lines = history.map(h => `- attempt ${h.attempt}: "${h.idea}" -> ${describeResult(h.result)}`);
  let text = problem;
  if (history.length) text += `\n\nYour previous attempts (most recent last). The verifier result is exact.\n${lines.join('\n')}`;
  if (memory === 'last-code' && history.length) { const h = history[history.length - 1]; text += `\n\nFull code of your most recent attempt (${h.attempt}):\n<code>\n${h.code || '(none)'}\n</code>`; }
  text += `\n\nProduce your next attempt now.`;
  return [{ role: 'user', content: text }];
}

// kept for postmortem.js (single-turn transcript)
export function buildUserMessage(inst, history, opts = {}) { return buildMessages(inst, history, { ...opts, memory: 'summary' })[0].content; }

export function parseResponse(text) {
  const grab = (tag) => { const m = text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)); return m ? m[1].trim() : null; };
  let code = grab('code');
  if (code) code = code.replace(/^```(?:js|javascript)?\s*/i, '').replace(/```\s*$/, '');
  return { idea: grab('idea') || '(no idea stated)', assumption: grab('assumption_questioned'), newObject: grab('new_object'), code };
}
