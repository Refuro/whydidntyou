# B4 review request — builder audit, not a freeze

Read `BUILD-PROMPT-v1.md`, `DECISIONS-B2.md`, `REVIEW-RESPONSE-B2.md`, `BUILD-PROMPT-v2.md`, `BUILD-REPORT-v2.md`, the dated preregistration addenda, and `B4-EVIDENCE/coverage.md`.

## Requested review

1. **B2 repairs.** Check the actual batch/report/postmortem contract-confusion fixture, exact 78-digit seed manifest, certificate-free public identifiability, and explicit positive-count inference unavailability. The original reviewer script is preserved; its exploit now throws at the repaired validation boundary. Regressions live in `test/review-b2-repairs.test.js` and `test/harness.test.js`.
2. **Recovery.** Inspect `received-unscored`, archived raw/usage, planned execution IDs, source/config hashes, `resumedFrom`, orphan recovery, and separate abandonment disposition. Verify no duplicate dispatch or changed index/budget on repeated resume, and no trimming of partial records. See `test/resume.test.js`.
3. **Distribution and sampler.** Check the image and alphabet streams, historical-world preservation, requested/effective classifications, complete proposal ledgers, and the conditioning caused by construction exclusions. The LP support is explicitly restricted to matched joint-feature/nuisance classes from bounded walks and unequal-fold pairs. Infeasibility refers to this registered support, not every possible string distribution. Judge whether this restriction and identity-prefix large stratum are suitable before a freeze.
4. **Independent checker.** Recompute finite laws, symbol-image draws, all path/inequality labels, both realized ceilings and nuisance balance from the exported example. Verify that the historical positional construction convention refuses, while chance alignment of a valid uniform draw is not excluded.
5. **Complete portfolio.** Inspect all fourteen members, public-only fitting/selection, the finite-state q^q bound, the restricted counterexample-guided fold grammar, fitting/scoring costs, total work limits, and all BFS resource curves. The builder's own additional budget settings are not an independent challenge.
6. **Independent solver author challenge (still required).** A solver author who did not design this generator should attack these development worlds and propose stronger methods/budgets. Retain every challenged setting and outcome, including settings that cross the wall. No portfolio freeze is claimed until that external challenge and this review are complete.
7. **Positional-template requirement.** The historical baseline scores 100% on all sixteen old worlds and fails on the amended exported example. It can still solve some amended worlds by chance or equivalent representations. A universal failure requirement conflicts with uniform proposal sampling and retention; please confirm that the measured success rate, without filtering passing worlds, is the intended regression criterion.
8. **Claims.** Keep natural and challenge distributions separate. Neither portfolio matching nor these development results establish invention, capability absence, leakage absence, or confirmatory performance. Positive-count stochastic inference remains unavailable. The public selector and sealed-label oracle are distinct.

## Main findings to assess

The monoid CSP solves 1,720/1,720 accepted worlds, and the public selector solves 1,719/1,720. The largest BFS budget solves 34 nonabelian and 27 monoid worlds. All results, including stronger-search successes, are retained. The current generator is not claimed to resist the complete portfolio. Decide after the independent challenge whether the existing class remains useful for Claim A comparisons or warrants a separately registered pre-freeze expansion; no expansion is made in this delivery.

## Evidence and reproduction

The fixed audit proposes 512 seeds per requested family (2,048 total), retains every defect, and scores every accepted world. Accepted effective counts are 428 count, 652 abelian, 377 nonabelian, and 263 monoid. Every family exceeds 200 accepted worlds. The source hash is recorded in `B4-EVIDENCE/registration.json`; all construction and scoring rows are adjacent JSONL files. The historical control is `historical-positional.json`.

```powershell
$env:LLM_MOCK='1'
npm test
node src/check-invariant-world.js examples/invariantGame-world-1.json
node src/portfolio/run.js examples/invariantGame-world-1.json
node src/portfolio/audit.js docs/B4-EVIDENCE-independent-reproduction
```

Use a new output directory; the audit refuses overwriting existing ledgers. Ordinary tests and the portfolio make no model API calls. The aggregate legacy selftest also contains the author's historical adversarial sandbox checks; the builder did not rerun those in v2.

## Mandatory stop

This is the B4 review handoff. The independent challenge and acceptance remain pending. B5 leakage audits, B6 prompt/model-loop integration, a real-model pilot, and Phase 4 have not been started. Do not interpret this file or the builder audit as approval to proceed.
