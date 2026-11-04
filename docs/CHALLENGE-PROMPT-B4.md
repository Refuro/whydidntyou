# Independent solver challenge: whydidntyou, Phase 2 portfolio

You are the independent solver author required by `docs/PLAN.md` §2. You did not design this generator and you must not read its source. Your job is to solve the tasks as well as possible using only public evidence, to propose solvers and budgets the registered portfolio is missing, and to report everything you tried — including what failed. You are attacking the *baseline library*, not any language model: the stronger you make the library, the more honest the eventual comparison.

## What you may read
- `README.md`, `docs/PLAN.md` §§0–3 (what is being measured and why), `prereg/invariantGame.md` (the registered task, key moves and budgets).
- `docs/B4-EVIDENCE/coverage.md` and `summary.json` (what the current fourteen portfolio members score, with resource curves).
- The **public evidence** of development worlds only: run `node src/portfolio/export-public.js docs/B4-EVIDENCE/F-nonabelian.construction.jsonl --out challenge/public/` (if that script does not exist, ask the author for an export; do not open `src/domains/invariantGame.js`, `src/domains/invariantGame-b2.js`, `src/algebra.js`, or any `*.construction.jsonl` directly — they contain the secret).
- `src/portfolio/README.md` or the member list in `src/portfolio/` for the registered primitive languages and budgets, so you do not re-propose what exists.

## The task, as a solver sees it
A world gives you: an alphabet; 6–14 rewrite rules `u ↔ v` over it; 200 labeled string pairs (connected / not connected under the rules); and a sealed set of unlabeled pairs to classify. Score = accuracy on the sealed pairs; the registered threshold is ≥ 95%. Optionally you may also submit a `quantity(state)` function that you believe is conserved by every rule.

## What to deliver (`docs/CHALLENGE-REPORT-B4.md`)
1. **Your solvers**, each as a self-contained JavaScript file under `challenge/solvers/` conforming to `reachable(a, b)` (+ optional `quantity`), with its primitive language in one line and the compute budget it needs. Score each on the public development worlds with `node src/portfolio/score-external.js <solver.js> challenge/public/` (or describe how you scored it if the script is absent). Include at least: one method the registered portfolio does not contain; one attempt at a cheaper method that achieves the same; one attempt that uses only the 200 labels and no rule analysis.
2. **Budget proposals**: for every registered member, say whether its budget is too low to be a fair baseline, with the setting at which it starts to succeed if you found one.
3. **Sampler critique** (PLAN §3.4): the challenge sampler's bounded support is restricted to matched joint-feature/nuisance classes from bounded walks and unequal-fold pairs. Propose a pair distribution outside that support on which a feature-only classifier would score materially differently, if one exists; otherwise say why not.
4. **Everything that failed**, with scores. A method that crosses the wall is as important as one that doesn't.
5. **Three ranked recommendations** for the portfolio freeze.

## Rules
- No model API calls; no network; no reading of the generator or algebra source; no edits outside `challenge/` and your report. If you accidentally see secret material, say so in the report and stop.
- Zero new dependencies.
- Be adversarial toward the library's completeness, not toward the harness; sandbox probing is out of scope.
