// Registered null-bound calculations (PLAN §4.5). Pure functions, no I/O.
//   node src/bounds.js --n 100 --successes 0 --unresolved 10
// Exact iid fixed-sample design: n assigned construction-valid worlds; s observed certified successes among the resolved;
// u unresolved. Two bounds are reported, never one:
//   resolvedOnly: 1 - 0.05^(1/(n-u)) when s = 0 — valid ONLY under the registered missingness assumption (resolution independent of outcome);
//   conservative: the one-sided 95% upper bound treating every unresolved world as a possible success: solve P(Bin(n,p) <= s+u) = 0.05.
export function binomCdf(n, k, p) { let sum = 0; for (let i = 0; i <= k; i++) sum += Math.exp(logC(n, i) + i * Math.log(p) + (n - i) * Math.log(1 - p)); return sum; }
function logC(n, k) { let r = 0; for (let i = 1; i <= k; i++) r += Math.log(n - k + i) - Math.log(i); return r; }
export function upperBound(n, s, alpha = 0.05) { // smallest p with P(Bin(n,p) <= s) <= alpha
  if (s >= n) return 1; let lo = 0, hi = 1; for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2; if (binomCdf(n, s, mid) > alpha) lo = mid; else hi = mid; } return hi;
}
export function nullBounds({ n, successes, unresolved, alpha = 0.05 }) {
  const resolved = n - unresolved;
  return {
    n, resolved, unresolved, successes,
    resolvedOnly: successes === 0 && resolved > 0 ? 1 - Math.pow(alpha, 1 / resolved) : upperBound(resolved, successes, alpha),
    resolvedOnlyAssumption: 'resolution independent of potential outcome (registered missingness assumption; NOT established by disclosure)',
    conservative: upperBound(n, successes + unresolved, alpha),
    conservativeMeaning: 'one-sided 95% upper bound on the certified-success rate over all assigned construction-valid worlds, allowing every unresolved world to be a success',
  };
}
if (process.argv[1] && process.argv[1].endsWith('bounds.js')) {
  const a = {}; for (let i = 2; i < process.argv.length; i += 2) a[process.argv[i].slice(2)] = Number(process.argv[i + 1]);
  console.log(JSON.stringify(nullBounds({ n: a.n ?? 100, successes: a.successes ?? 0, unresolved: a.unresolved ?? 0 }), null, 2));
}
