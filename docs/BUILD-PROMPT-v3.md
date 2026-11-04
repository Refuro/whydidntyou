# Build request v3: close the B4 review, then versioned export and stop

Read `docs/REVIEW-RESPONSE-B4.md` and `docs/DECISIONS-B4r.md`. Same rules as v1/v2. Every item below ships with the fixture the review demonstrated. Finish with `docs/BUILD-REPORT-v3.md`; stop before any B5/B6 work.

1. **Order leak (review P1; decision 3).** Permute the fully realized sealed list with a domain-separated PRF stream after construction; new sampler identity; historical evidence untouched. Regressions: the review's data-only order decoder scores at chance on fresh worlds; reversal/permutation controls; a test that the per-pair interface (item 2) cannot observe export order.

2. **One inference contract (decision 2).** Implement fit-once (public evidence → serialized state string, budgeted) + per-pair inference (fresh context; inputs: state, a, b) for builder members and for `score-external.js` alike. The sealed set is never supplied as a batch. Run every reference member through the external adapter as a matched control and record both sides' per-stage wall-clock.

3. **Admission verifier (review P2; decision 4).** Extend `check-invariant-world.js` as specified; refuse the review's three semantic fixtures (wrong effective family; all-small strata; non-identifying public training set); add the small independent reference implementation for feature/congruence checks.

4. **Resources (review P2; decision 5).** Rename counters as member-specific; report per-stage wall-clock as the comparable resource; charge preparation where metered; emit selector totals; separate challenge/natural budgets and caches; add the 12/4 and 16/4 fixtures.

5. **Support naming (decision 6).** Add the analytic uniform-weight sampler oracle; report distinct support size and paired dependence per world; relabel the small/large gap as padding robustness in code, evidence and PLAN §3.4.

6. **Versioned public export.** Regenerate the public export from the repaired sampler under its new version id; include the export version in every file; the challenge prompt will reference it.

7. **Re-run the fixed audit** (2,048 proposals) under the new sampler and contract, in a new evidence directory, and report the same coverage table with the new resource columns; keep the old `B4-EVIDENCE/` historical.

Then write `docs/REVIEW-PROMPT-B4r.md` and stop.
