# Third review request: whydidntyou, Plan v3 — verification focus

Your v2 review is at `docs/archive/REVIEW-v2-response.md`; the plan it reviewed at `docs/archive/PLAN-v2.md`. `docs/PLAN.md` is now v3. This round is narrower than the first two: verify that the repairs are real, and check the new formal commitments.

What changed in code since your v2 review: `src/sandbox.js` no longer injects any host object (contexts get their own intrinsics); all boundary values are serialized inside the timed context; your `Math.__reviewStash` and throwing/looping-proxy cases are regression tests in `src/selftest.js`, which also asserts the real winning program's expected behavior on both families and pins its hash. `src/hints.js` forwards `memory`, interleaves `(arm, repeat)` in a seeded random order, labels rung categories, records the estimand as prompted-restart, and preserves partial results. `src/postmortem.js` sends the full multi-turn record (raw responses and code), refuses incomplete or successful runs, verifies the regenerated secret against the log, and replaces substring matching with a judge that must quote a verbatim claim and rate it supported/contradicted/unverifiable; solver, responder and judge models are recorded separately. `src/report.js` validates world identity (domain, seed, options), refuses mixed batches and duplicate trials, reports missing/incomplete worlds, replaces conditional medians with success-by-budget curves, emits the per-world table, designates the first contrast primary with Bonferroni-widened secondaries, and flags degenerate bootstraps.

Please:
1. Re-run your v2 reproductions against the current tree and try new ones. Report pass/fail per case with what you ran.
2. Answer §11 of `docs/PLAN.md`, with particular attention to §4.2 (L0 and certificates) and §3.4 (sampler feasibility).
3. Say whether you will act as custodian for the sealed transfer family (§3.3). If yes, the author will send a specification file for you to hash and hold.
4. Rewrite the hostile paragraph for v3 and rank the top three remaining changes.

Same constraints: adversarial, concrete, no rewriting.
