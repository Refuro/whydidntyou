# Decisions for the B4 review and the independent challenge

Author, 2026-11-03. Binding unless the B4 review overturns a decision in writing.

1. **Interpretation of the coverage result.** The current `invariantGame-v2-b3` class is **within library**: the finite-monoid CSP reaches the success criterion on 1,720/1,720 accepted worlds and the implementable public selector on 1,719. This is reported exactly so (PLAN §2) and is not a defect. For Claim A on this class the comparison is model vs. portfolio performance and resource cost. No pre-freeze expansion of the class is made now; after the independent challenge, a **separately registered library-resistant challenge family** may be added under PLAN §2 ("general-distribution result and library-resistant challenge set reported separately"), by dated addendum, never by altering this family.

2. **Positional-template regression criterion (builder Q7).** No universal-failure requirement and no filtering of passing worlds. The regression asserts: (a) the independent checker refuses the historical positional convention; (b) the template is a registered portfolio member included in the oracle portfolio; (c) its measured success rate on the amended distribution is reported per effective family alongside its 16/16 historical score. Chance successes are data, not defects.

3. **LP support restriction and identity-prefix large stratum (builder Q3).** Accepted for the freeze *as stated*: defects certify failure on the registered bounded support, not impossibility over all strings; the plan text (§3.4) is to say so verbatim. The challenger (below) is asked specifically whether a sampler outside this support could produce a materially different ceiling; if it can, that becomes a registered limitation, not a silent repair.

4. **Independent challenger (builder Q6, PLAN §2).** A third session that has not seen the generator source acts as the solver author: `docs/CHALLENGE-PROMPT-B4.md`. Every proposed method and budget is retained with its outcome. The portfolio freezes only after the challenge report and the B4 review are both in and the builder has registered any accepted additions.

5. **Budgets.** Builder resource curves (4×/16× BFS) are retained as curves, not as the frozen budgets; the challenger proposes budgets; the freeze records all settings including those that cross the wall.

6. **Order after this round.** B4 review and challenge run in parallel. Then: builder registers accepted challenge methods/budgets and freezes the portfolio (dated addendum), then B5 leakage audit, then B6 model-loop integration (classifier success and certified-quantity success as separate fields). The first real-model pilot happens after B6 and after I confirm the freeze manifest; it uses `missingPolicy: exploratory` and development worlds only.

7. **Statistics.** R4 stands: zero-count binomial bound is the only inferential result; positive counts are `unavailable` until a registered procedure exists. This is accepted as the state for the whole of Phase 2 development; no confirmatory claim is made until Phase 2's freeze.

## Immediate builder task (before the challenge starts; no other B5/B6 work yet)
Add `src/portfolio/export-public.js` (writes, for each accepted world in a construction ledger, a file containing ONLY `publicEvidence(inst)` — alphabet, rules, 200 labeled pairs, the sealed pairs unlabeled — plus the world digest; refuses to emit any secret, certificate, calibration or defect field) and `src/portfolio/score-external.js` (loads an outside solver file through the existing sandbox contract, scores it on a directory of public worlds against the sealed labels held by the host, reports accuracy per world and family plus charged work; never exposes labels to the solver). Both with tests; then commit and stop. Report in one paragraph appended to `BUILD-REPORT-v2.md`.
