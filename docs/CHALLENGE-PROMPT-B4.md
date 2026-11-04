# Independent solver challenge: whydidntyou, Phase 2 portfolio

You are the independent solver author required by `docs/PLAN.md` §2. You did not design this generator and you must not read its source. Your job is to solve the tasks as well as possible using only public evidence, to propose solvers and budgets the registered portfolio is missing, and to report everything you tried — including what failed. You are attacking the *baseline library*, not any language model: the stronger you make the library, the more honest the eventual comparison.

The independent challenge remains a separate author/reviewer session. Builder matched controls are in `docs/B4r-EVIDENCE/matched-controls/summary.json`; those controls are not an independent challenge. You may read their result/timing summaries, but not the archived reference source packages: those include catalogue implementations and are reviewer material, subject to the same source-reading restriction as the algebra implementation.

## What you may read
- `README.md`, `docs/PLAN.md` §§0–3 (what is being measured and why), `prereg/invariantGame.md` (the registered task, key moves and budgets).
- `docs/B4r-EVIDENCE/coverage.md` and `summary.json` (what the current fourteen portfolio members score, with resource curves).
- The versioned **public evidence** in `challenge/public-sealed-matched-padded-v2-public-v2/`. Every file must say `exportVersion: sealed-matched-padded-v2-public-v2`. The host has already generated this export; do not open the private construction ledgers or generator/algebra source. The separate `challenge/example-sealed-matched-padded-v2-public-v2/` is the control example. Old ordered exports are retired and their scores are excluded from freeze inputs.
- `src/portfolio/README.md` or the member list in `src/portfolio/` for the registered primitive languages and budgets, so you do not re-propose what exists.

## The task, as a solver sees it
A world gives you: an alphabet; 6–14 rewrite rules `u ↔ v` over it; 200 labeled string pairs (connected / not connected under the rules); and no sealed batch. Fit once using that public evidence and return a serialized state string. For each private test pair a fresh sandbox receives only that string and a,b. Score = accuracy on the sealed pairs; the registered threshold is ≥ 95%.

## What to deliver (`docs/CHALLENGE-REPORT-B4.md`)
1. **Your solvers**, each as a self-contained JavaScript file under `challenge/solvers/` conforming to `fit(publicEvidence) -> string` and `predict(state, a, b) -> boolean` (or the equivalent two-source JSON package documented in `src/portfolio/README.md`), with its primitive language in one line and the compute budget it needs. Score each on the public development worlds with `node src/portfolio/score-external.js <solver.js> challenge/public-sealed-matched-padded-v2-public-v2/` (or describe how you scored it if the script is absent). Include at least: one method the registered portfolio does not contain; one attempt at a cheaper method that achieves the same; one attempt that uses only the 200 labels and no rule analysis.
2. **Budget proposals**: for every registered member, say whether its budget is too low to be a fair baseline, with the setting at which it starts to succeed if you found one.
3. **Sampler critique** (PLAN §3.4): the challenge sampler's bounded support is restricted to matched joint-feature/nuisance classes from bounded walks and unequal-fold pairs. Propose a pair distribution outside that support on which a feature-only classifier would score materially differently, while holding every registered nuisance constraint fixed. Dropping nuisance constraints does not count as a ceiling counterexample. The current large rows are neutral-prefix copies of short cores, so report padding robustness, not size generalization; a long-core distribution would need a future registration.
4. **Everything that failed**, with scores. A method that crosses the wall is as important as one that doesn't.
5. **Three ranked recommendations** for the portfolio freeze.

## Rules
- No model API calls; no network; no reading of the generator or algebra source; no edits outside `challenge/` and your report. If you accidentally see secret material, say so in the report and stop.
- Zero new dependencies.
- Be adversarial toward the library's completeness, not toward the harness; sandbox probing is out of scope.
