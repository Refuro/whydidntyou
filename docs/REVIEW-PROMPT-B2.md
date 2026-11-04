# Review request: Package A and B2 boundary

Please review `7bcb668..HEAD` against `BUILD-PROMPT-v1.md`. The builder has stopped at B2 as required. This is an implementation review; B3–B6, real-model pilots and Phase 4 have not started.

Read `BUILD-REPORT-v1.md`, `BUILD-NOTES.md`, and `prereg/invariantGame.md` first. `SELFTEST-B2.json` contains final per-world wall results, registered budgets and source hashes. `REVIEW-EVIDENCE-schema5.json` records the adapted v9 checks.

## Package A acceptance

1. Check the exact SHA-256 input string, low-32-bit convention, duplicate handling, canonical master representation, regenerated 40-seed lists and the <5-overlap regression.
2. Trace an assigned slot through execution indices 0–2 to one terminal. Confirm only interruptions authorize a new execution and every outgoing request is saved before transport. Check discarded work, unknown consumption, setup failure and missing-end evidence.
3. Try ordinary record inconsistencies against `validateBatch`: chain gaps, extra executions, wrong slots/treatments, absent payload hint/scaffold, wrong memory, wrong feedback, changed prompt-builder hash and forged resources. Correct treatment controls must remain valid.
4. Check the finite-population inversion, input validation, no-resolved-data behavior, completeness gate, repeat strata and paired sample identification bounds. Review the explicitly unresolved population/decoding premises before permitting any confirmatory claim.
5. Verify the plan edits stayed within the requested repairs and the historical archive/preregistration restrictions were respected.

Reproduction, with no model API calls:

```text
npm install --ignore-scripts --no-audit --no-fund
npm test
npm run selftest
node test/REVIEW-CHECKS-v9.mjs . docs/REVIEW-EVIDENCE-schema5.json
```

Set `LLM_MOCK=1` in the shell for any harness command. The adapted review script uses offline responses without executable submissions. The required selftest executes the existing historical sandbox regressions and the ordinary wall solvers; new sandbox adversarial probing remains the author's work.

## B1/B2 acceptance

1. Independently check the finite tables, especially Q8 multiplication and the three/four-point transformation representations. Confirm exhaustive closure/identity/associativity checks and the all-context conservation argument.
2. Replay every consequence-rule certificate and verify rules stay within the registered count/length range. Confirm symbol relabeling and rule shuffling do not change their meaning.
3. Inspect the identifiability class and canonical transition-graph equivalence. It should enumerate all assignments into the fixed ambient table, apply only public rules/200 labels, and flag ambiguity without rerolling worlds. Check the generated-submonoid classification.
4. Check the public-evidence view for secret/certificate leakage. The calibration sets are internal; no invariant model prompt exists yet.
5. Check fresh-state classifier/quantity evaluation, equality-partition scoring, the bounded context check, and the distinction between a declarative-fold proof and arbitrary code. Without sealed pairs, default scoring must refuse.
6. Reproduce the 16-world calibration wall: reference 100%, count nullspace 100% on count/abelian controls and 50–75% on noncommutative cases, BFS 50% on large pairs. Treat these as evidence under explicit budgets, not generic impossibility or a full portfolio audit.

## Decisions needed before B3

Address the open questions in `BUILD-REPORT-v1.md`, particularly the finite-population/decoding premises, repeat strata, monoid subclass, quantity proof route and BFS budgets. State whether B3 can proceed, or list concrete repairs first.

B3 must supply the sampler feasibility program, certified sealed support, nuisance matching, rounding, independent realized-ceiling checks, defect ledger, exported example and checker. B4 must supply the complete challenged portfolio and ≥200-world-per-family coverage audit. The builder must stop again with `REVIEW-PROMPT-B4.md` after B4.

## Author decisions and pre-review follow-up

Read DECISIONS-B2.md before resolving the questions above. The author confirmed the review is still pending and B3 must remain gated. Independent code/document updates implement repeat-0 primary analysis, population sensitivity labels, quantity output conditions and early rejection of non-identifiable worlds. See the dated preregistration addendum and BUILD-NOTES.md. The original B2 evidence is historical; SELFTEST-B2-decisions.json records the follow-up checks.

Review specifically whether the proposal-count sensitivity diagnostic and positive-count approximation labels faithfully implement decision 2, and whether the B3 exclusion ledger and resumedFrom/disposition requirements are carried forward without being prematurely treated as completed. No review finding has yet been supplied or closed.
