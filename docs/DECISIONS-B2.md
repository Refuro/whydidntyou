# Decisions on the builder's open questions (BUILD-REPORT-v1 §Open questions)

Made by the author 2026-11-03. Binding for the B2 review and for packages B3–B6. Each is a decision, not a discussion; a reviewer who disagrees should say so in its review, and the builder should implement as written unless the review overturns it.

1. **Repeat-stratified endpoint.** Accepted. For confirmatory use the **primary stratum is repeat 0**: one binary slot-procedure outcome per seed. Repeats 1..r are exploratory (within-world variability) and are never pooled as worlds. The report labels the primary stratum.

2. **M after eligibility/construction exclusions; stochastic decoding.** Keep `M = 2^32` as the sampling population and treat conditioning on construction eligibility as follows: eligibility is a deterministic function of the seed, so the eligible population M_C is a fixed subset; for n ≤ 100 and any M_C ≥ 10^6 the hypergeometric bound differs from the M = 2^32 figure by less than the printed precision. Register that approximation explicitly and report both figures when M_C can be estimated from the proposal/eligible counts. For stochastic decoding, the registered potential outcome is **the slot-procedure outcome under the registered protocol with provider randomness**, treated as an independent Bernoulli draw per seed; the zero-success bound then follows the mean-of-products argument (P(zero) ≤ (1 − mean p)^n). State both assumptions in §4.5; do not claim a fixed-K identity.

3. **Masters.** Decimal text only, as implemented. When the prospective source yields hex (a drand round or NIST pulse), convert it to its canonical decimal big-integer text deterministically and record both the original hex and the decimal in the freeze manifest.

4. **Algebra subclass and 2–4-letter representation class.** Sufficient for B3 and the B4 portfolio challenge. Expansion (full transformation monoids, larger alphabets) only by a dated amendment to `prereg/invariantGame.md` **before** the freeze, and only if the B4 portfolio solves every registered family — never after confirmatory outcomes are seen.

5. **Quantity verification.** Total surrounding-context length ≤ 3 is the registered bounded check for arbitrary JavaScript quantities, reported as *bounded empirical conservation*. The declarative `quantityFold` route is accepted as the only *proved* route. Refusing both forms at once is correct. The unrestricted vs quantity-requested output conditions (PLAN §3.6) map to: unrestricted = classifier only; quantity-requested = classifier plus either form.

6. **Budgets.** The B2 BFS node/transition limits and sandbox budgets are the starting registration. The independent B4 challenger may propose increases; any change is made before the portfolio freeze and recorded; none after.

7. **Non-identifiable worlds.** Treated as construction defects: excluded from the assigned set at construction time with reason `non-identifiable`, logged in the defect ledger with the seed, never rerolled. Consistent with the fail-closed rule in PLAN §4.2.

8. **Recover/resume.** Required before any confirmatory operation. Add to package B3: `node src/experiment.js --resume runs/experiment-<name>.jsonl` validates the existing chain, refuses on any inconsistency, and continues only slots without a terminal record; every resumed execution records `resumedFrom` with the prior batch state digest. A batch that cannot be resumed consistently is abandoned and listed in the freeze's batch disposition log.

## Carried-forward instructions for package B3–B6 (in addition to BUILD-PROMPT-v1.md)
- Implement the eight decisions above where they touch code (1, 2, 5, 7, 8) and plan text (2, 4, 6); list each edit in `BUILD-NOTES.md`.
- Address the B2 review's findings before starting B3; add each finding's fixture to `test/`.
- The B4 stop remains in force; write `docs/REVIEW-PROMPT-B4.md` there.
