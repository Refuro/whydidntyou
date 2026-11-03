// Shared lexical proxy for "distinct ideas". Crude by design (no API): light stemming +
// Jaccard clustering. Good enough for dashboards; for publication, use `analyze.js --judge`
// and have a human spot-check a sample of the clusters.
const STOP = new Set('a an the of to and or in on for with by from as is are be this that it its into using use via based then than style approach method'.split(' '));
const stem = (w) => w.replace(/ies$/, 'y').replace(/(ing|ed|es|s)$/, '');
export const tokens = (s) => new Set(String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).map(stem).filter(w => w && !STOP.has(w) && w.length > 2));
export const jaccard = (x, y) => { let i = 0; for (const t of x) if (y.has(t)) i++; return i / (x.size + y.size - i || 1); };
export function clusterIdeas(ideas, threshold = 0.34) {
  const clusters = [];
  ideas.forEach((idea, idx) => { const t = tokens(idea); const c = clusters.find(c => jaccard(c.tok, t) >= threshold); if (c) { c.members.push(idx + 1); for (const w of t) c.tok.add(w); } else clusters.push({ tok: t, label: idea, members: [idx + 1] }); });
  return clusters;
}
