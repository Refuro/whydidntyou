# B4r private-pair challenge interface

Use export `sealed-matched-padded-v2-public-v2`. The historical B4 ordered export and 201-refit adapter are retired; their scores cannot enter a freeze. This build stops for B4r review and the separately authorized independent challenge.

The full repaired development export is `challenge/public-sealed-matched-padded-v2-public-v2/`; the single control example is `challenge/example-sealed-matched-padded-v2-public-v2/`. Each JSON contains alphabet, rules (`u`, `v`), rulesText, exactly 200 labeled trainingPairs, worldDigest and exportVersion. There are no sealed pairs in the export. A private host index binds each file to its construction ledger. Do not inspect that index or the generator, algebra or construction files as a challenger.

Define `fit(publicEvidence) -> string` and `predict(serializedState, a, b) -> boolean`:

```javascript
function fit(publicEvidence) {
  return JSON.stringify({alphabet: publicEvidence.alphabet});
}
function predict(serializedState, a, b) {
  const model = JSON.parse(serializedState);
  return a === b; // Interface example, not a proposed method.
}
```

Fit receives only alphabet, rules, rulesText and trainingPairs; the version/digest envelope is withheld. Fit runs once. Each prediction starts in a fresh runtime/context with exactly state,a,b. There is no persistent fitting variable, sealed batch, row number or cross-pair history. Source runs only in QuickJS. Alternatively submit JSON `{ "format": "fit-predict-source-v2", "fitSource": "...", "inferenceSource": "..." }`, with each source defining its entry function. Both sides can omit unused fit code from inference this way. No imports or host APIs are supplied. The state limit is 2,000,000 bytes. The private-pair challenge scores classification only; quantity verification belongs to the separate legacy contract.

```powershell
node src/portfolio/score-external.js challenge/solvers/my-solver.js challenge/public-sealed-matched-padded-v2-public-v2/
node src/portfolio/score-external.js challenge/solvers/my-solver.json challenge/public-sealed-matched-padded-v2-public-v2/ --fit-ms 40000 --inference-ms 40000
```

Defaults: fit 20,000 ms; independent public, challenge and natural inference budgets of 20,000 ms each; 2,000 ms per pair; 200 inference calls per set. `--fit-ms`, `--inference-ms`, `--pair-ms` and `--max-calls` retain every changed setting in a new report. All accept integers 1..120,000. The cooperative interpreter deadline is not a hard external supervisor. Prediction caches are disabled, so neither set inherits work from another. The interpreter module alone is reused. Fit and inference timing includes context creation, source loading, state handling and cleanup. Actual one-time module startup is separate; standalone preparation adds an explicitly labeled cold-start estimate. Host world regeneration is reported separately. Reference search counters are member-specific; external self-reported counters are not trusted or compared.

Each invocation archives its exact source, append-only rows and final JSON under `challenge/results/` (override with `--out`). Reports retain failed evaluations with unavailable accuracy and family accuracy bounds. Every result includes construction acceptance/defects, requested and effective family denominators, and within-world dependence. No sealed labels or row predictions are emitted. `--host-root` may select an isolated host index; neither host data nor results may be inside the public export.

The fourteen entries are count linear algebra; full/quotient group homomorphism search; finite-monoid image CSP; joint coarse features; full-product finite-state inference; rewrite normal forms; counterexample-guided finite-fold grammar; nuisance stumps; positional templates; BFS at 128/512/2048 nodes and 4096/16384/65536 candidate positions; and bidirectional search. Exact languages and budgets are in `members.js` and `registration.js`. The new evidence is `docs/B4r-EVIDENCE/`; `docs/B4-EVIDENCE/` is historical. Small/large gaps on noncommutative matched supports measure padding robustness. Distinct support and dependent neutral-prefix copies are reported per world.
