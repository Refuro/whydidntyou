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

export function buildUserMessage(inst, history, { hint = null, sampleLen = 1200 } = {}) {
  const parts = [];
  parts.push(inst.description);
  parts.push(`\nHere are the first ${sampleLen} symbols of the sample sequence:\n${inst.sample.slice(0, sampleLen).join(' ')}`);
  if (history.length) {
    parts.push(`\nYour previous attempts (most recent last). Do not repeat an idea that already failed; the verifier result is exact.`);
    for (const h of history) {
      const res = h.result.ok ? `${h.result.bitsPerSym.toFixed(3)} bits/symbol (${(h.result.ratioToBaseline * 100).toFixed(0)}% of fixed-length)` : `FAILED at ${h.result.stage}: ${h.result.error}`;
      parts.push(`- attempt ${h.attempt}: "${h.idea}" -> ${res}`);
    }
  }
  if (hint) parts.push(`\nHint: ${hint}`);
  parts.push(`\nGoal: at most ${(inst.baselineBitsPerSym * 0.6).toFixed(2)} bits/symbol. Produce your next attempt now.`);
  return parts.join('\n');
}

export function parseResponse(text) {
  const grab = (tag) => { const m = text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)); return m ? m[1].trim() : null; };
  let code = grab('code');
  if (code) code = code.replace(/^```(?:js|javascript)?\s*/i, '').replace(/```\s*$/, '');
  return { idea: grab('idea') || '(no idea stated)', assumption: grab('assumption_questioned'), newObject: grab('new_object'), code };
}
