# Eighth review request: whydidntyou, Plan v3.5 — source inspection and fixtures

Your v7 review and fixture script are archived under `docs/archive/` (REVIEW-v7-response.md, review-v7-checks/). `docs/PLAN.md` is v3.5; §12 lists the changes, §11 the questions. No adversarial sandbox execution is requested.

Code since v7: `hints.js` honors `interrupted` and scores only completed runs; `validateConfig` in `src/validate.js` is shared by `experiment.js` (before the batch header and first request, plus a generator preflight per condition) and `report.js`; `trial-failed` records are typed and validated with one terminal record per slot; the reporter writes the missingness ledger before any refusal, binds every summary row to its re-validated run log, uses the regenerated secret for strata, and reports (rather than refuses) coincident worlds; result arithmetic and legal end-state transitions are enforced in `validate.js`; option domains are enforced per key; the RNG regression compares a 512-bit vector against an independent implementation and checks the lock descriptor; judge labels are recorded as provisional. Your six v7 writer fixtures were re-run by the author: zero requests, zero batch files.

Please answer §11.1–11.5. Same constraints.
