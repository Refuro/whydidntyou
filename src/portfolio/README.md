# B4 independent challenge interface

The current family is **within library**. The finite-monoid CSP solved 1,720/1,720 accepted audit worlds and the public selector solved 1,719. Those are performance/resource comparisons, not evidence that the class resists the library. The B4 review and independent challenge are pending; these tools do not freeze the portfolio or start B5/B6.

## Export public worlds

```powershell
node src/portfolio/export-public.js docs/B4-EVIDENCE/F-nonabelian.construction.jsonl --out challenge/public/
```

Pass construction-ledger paths to the tool without opening them. Multiple ledger paths can precede `--out` to export a combined corpus. Every accepted world is regenerated and checked against its recorded digest; defects are not replaced. An identical verified export is a no-op. A different assignment needs a new output directory.

Every public JSON file has exactly these fields:

- `alphabet`, `rules` (`u`, `v`) and the redundant `rulesText`;
- `trainingPairs`: exactly 200 `{a, b, label}` examples;
- `sealedPairs`: exactly 200 `{a, b}` examples, without labels or certificates;
- `worldDigest`.

There are no seed, family, secret, calibration, certificate, scale or defect fields in these files. File numbers enumerate accepted exports, not gaps in proposal indices. A host-only index outside the public directory binds the files to their construction ledgers. The scorer refuses missing, modified or additional public files and changed host evidence. Do not copy or inspect the host index or construction ledgers; the documented commands resolve them for you.

## Submit and score a solver

Write a self-contained JavaScript file defining `reachable(a, b) -> boolean`. The sandbox adds a lexical binding named **`publicWorld`**, with exactly the public JSON object above. It is available to your top-level fitting code and to `reachable`. No imports or host APIs are supplied. Do not declare another `publicWorld` variable.

```javascript
// Interface example only: this is not a proposed challenge method.
const symbols = publicWorld.alphabet;
function reachable(a, b) {
  return a === b;
}
```

```powershell
node src/portfolio/score-external.js challenge/solvers/my-solver.js challenge/public/
node src/portfolio/score-external.js challenge/solvers/my-solver.js challenge/public/ --timeout-ms 40000 --max-calls 201
```

The outside file is never imported or evaluated in the host JavaScript environment. It runs through the existing QuickJS reachability contract: one fresh context for inspection and another for every pair. Consequently, top-level fitting repeats in each context and is charged every time; there is no unreported persistent fitting cache. Only public evidence and unlabeled call arguments enter those contexts. Sealed-label comparison happens in the host. An optional single `quantity` or `quantityFold` declaration is recognized by the existing interface but is not certified or scored by this classifier-only challenge adapter.

Defaults are **20,000 ms total per world** and **201 sandbox calls per world** (inspection plus 200 predictions). `--timeout-ms` accepts 1..120,000; `--max-calls` accepts 1..100,000. These are adapter defaults to make budget proposals measurable, not frozen portfolio budgets. The existing cooperative sandbox time limit is retained. Measured time includes repeated preparation, VM initialization and contract execution; host regeneration time is reported separately. Charges include actual sandbox calls, completed calls, program/input bytes and elapsed time. The existing contract has no instruction counter, so primitive-operation counts are explicitly unavailable and are not equated with the builder portfolio's work units.

Each invocation writes a unique solver-source archive, an append-only per-world log, and a JSON report under `challenge/results/`. `--out <directory>` changes that results directory. Failures and every changed budget setting are retained. Reports contain accuracy per world and by both effective/requested family, charged work, and failure counts. Failed evaluations have unavailable accuracy; family summaries show bounds retaining all failed worlds rather than silently dropping them. No per-pair predictions or sealed labels are published. These are descriptive development results, not inferential population bounds.

The default host index is resolved automatically. `--host-root <directory>` on both commands is available for isolated test/install environments; it must stay outside the public directory. Results must also stay outside the public directory.

## Registered portfolio languages

The fourteen scored entries are count linear algebra; full and proper-quotient group homomorphism search; finite-monoid image CSP; joint coarse features; full-product finite-state inference; rewrite normal forms; counterexample-guided finite-fold grammar; nuisance stumps; positional templates; BFS at 128/512/2048 nodes with 4096/16384/65536 tested positions; and bounded bidirectional search. Historical templates scored 16/16; their amended success rates are retained per effective family in `docs/B4-EVIDENCE/coverage.md`. The 4x/16x BFS settings remain builder resource curves. All challenger methods and budget proposals, including successful wall crossings and failures, belong in the challenge report before any freeze.
