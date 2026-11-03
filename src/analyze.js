// Analysis of one or more run logs: distinct ideas, key-move hits, error stages, trajectory.
//   node src/analyze.js runs/<file>.jsonl [more files...]      (no API needed)
//   node src/analyze.js --judge runs/<file>.jsonl              (LLM assigns each idea to pre-registered key moves)
import { readFileSync, existsSync } from 'node:fs';
import { complete } from './llm.js';

const args = process.argv.slice(2); const judge = args.includes('--judge'); const files = args.filter(f => !f.startsWith('--'));
if (!files.length) { console.error('usage: node src/analyze.js [--judge] runs/<run>.jsonl ...'); process.exit(1); }

import { clusterIdeas } from './ideas.js';

for (const file of files) {
  const lines = readFileSync(file, 'utf8').trim().split('\n').map(l => JSON.parse(l));
  const meta = lines.find(l => l.type === 'meta'); const end = lines.find(l => l.type === 'end'); const at = lines.filter(l => l.type === 'attempt');
  console.log(`\n=== ${file}\n${meta.domain} seed=${meta.seed} model=${meta.model} hint=${meta.hint ? JSON.stringify(meta.hint) : 'none'} scaffold=${meta.scaffold || 'none'}`);
  console.log(`attempts=${at.length} success=${end ? end.success ?? 'no' : '(run incomplete)'}`);

  // distinct ideas via greedy Jaccard clustering over idea text
  const clusters = clusterIdeas(at.map(x => x.idea));
  console.log(`distinct ideas (lexical proxy): ${clusters.length} / ${at.length} attempts`);
  for (const c of clusters) console.log(`  [${c.members.join(',')}] ${c.label}`);

  const stages = {}; for (const x of at) { const s = x.result.ok ? 'ok' : x.result.stage; stages[s] = (stages[s] || 0) + 1; }
  console.log(`result stages: ${JSON.stringify(stages)}`);
  const best = at.filter(x => x.result.ok).sort((p, q) => p.result.bitsPerSym - q.result.bitsPerSym)[0];
  console.log(`best: ${best ? best.result.bitsPerSym.toFixed(3) + ' bps at attempt ' + best.attempt : 'none ran'}  (baseline ${meta.baseline}, oracle ${meta.oracle.toFixed(3)})`);
  console.log(`assumptions questioned: ${at.filter(x => x.assumption && !/^none$/i.test(x.assumption)).length}; new objects defined: ${at.filter(x => x.newObject && !/^none$/i.test(x.newObject)).length}`);

  if (judge) {
    const prereg = `prereg/${meta.domain}.md`;
    if (!existsSync(prereg)) { console.log(`(no ${prereg}; skipping key-move judging)`); continue; }
    const km = readFileSync(prereg, 'utf8');
    const msg = `Below are pre-registered key moves for a discovery problem, then a numbered list of ideas a model tried. Assign each idea to the key moves it exhibits (0 or more). Respond with JSON: {"assignments":[{"attempt":1,"keyMoves":["KM1"]}, ...]}.\n\n${km}\n\nIDEAS:\n${at.map(x => `${x.attempt}. ${x.idea} | assumption dropped: ${x.assumption} | new object: ${x.newObject}`).join('\n')}`;
    const r = await complete({ system: 'You are a careful annotator. Respond with JSON only.', messages: [{ role: 'user', content: msg }], maxTokens: 1500 });
    try { const j = JSON.parse(r.match(/\{[\s\S]*\}/)[0]); const hits = {}; for (const x of j.assignments) for (const k of x.keyMoves) (hits[k] ||= []).push(x.attempt); console.log(`key-move hits: ${JSON.stringify(hits)}`); } catch { console.log('judge returned unparseable output:\n' + r); }
  }
}
