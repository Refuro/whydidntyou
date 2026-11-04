# Ninth review request: whydidntyou, Plan v3.6 — source inspection and fixtures

Your v8 review and fixture script are archived under `docs/archive/` (REVIEW-v8-response.md, review-v8-checks/). `docs/PLAN.md` is v3.6; §12 lists the changes, §11 the questions. No adversarial sandbox execution is requested.

Code since v8: the reporter binds every run log to the regenerated instance (reference values checked, attempt arithmetic re-validated against regenerated references), to the configured treatment (hint, scaffold content hash recorded at preflight, memory, options, budget, model), and to the execution slot recorded in the run's metadata; one run id per slot; `trial-failed` records have typed stages and interrupted ones bind their logs (a completed run cannot be relabeled); preflight reads and hashes all scaffold files and exercises every (condition, seed) generator before the batch header; relative option constraints use effective values. `src/draw-seeds.js` produces registered seed draws and `validateConfig` recomputes them for confirmatory configs. `src/bounds.js` implements the two-layer missingness analysis and reproduces your 3.27% / 16.37% example. The RNG expected vector's SHA-256 is pinned. Your eight v8 fixtures were re-run by the author and refused.

Please answer §11.1–11.5. Same constraints.
