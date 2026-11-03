# Second review request: whydidntyou, Plan v2

You reviewed Plan v1 (your review is at `docs/archive/REVIEW-v1-response.md`; the plan it reviewed is at `docs/archive/PLAN-v1.md`). The author accepted nearly all of it. `docs/PLAN.md` is now v2, rewritten around your recommended axes, with the invention claim split into Claim A (frontier models vs a frozen baseline library) and Claim B (a model trained from scratch on a fully generated corpus with a known toolkit — Phase 4, new).

Code changes made in response to your review, all in the repo: encoder and decoder now run in separate contexts with your zero-bit exploit as a regression test (`src/sandbox.js`, `src/selftest.js`); the real winning program is kept at `baselines/` and scored on every wall; `postmortem.js` and `hints.js` honor instance options; contrasts are pre-registered in the config, paired by world, bootstrap CI over worlds (`src/report.js`); `hints.js` runs every rung with equal repeats against no-hint and neutral controls, no early stopping; the prereg heading now says "exploratory" where it previously said "before any data collection"; `docs/WHY-THIS-WORKS.md` and `README.md` overclaims corrected.

Read `docs/PLAN.md` (v2) in full. Then:

1. **Does v2 answer the hostile referee paragraph you wrote for v1?** Rewrite that paragraph for v2. Be specific about what still stands.
2. **Answer the seven questions in PLAN.md §11.** Question 4 and 5 (Phase 4 feasibility and corpus absence guarantee) matter most; the author will spend GPU-days on them.
3. **Check the fixes.** Read `src/sandbox.js`, `src/report.js`, `src/hints.js`, `src/postmortem.js` and say whether each repair is correct, and whether any new problem was introduced.
4. **Rank the top five remaining changes** by improvement per unit of work, tied to v2 section numbers.

Same constraints as before: adversarial, concrete, no rewriting, no softening. If v2's split into two claims is itself the wrong structure, say so in item 1 and propose the alternative.
