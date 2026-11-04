# Build report v1 — Package A and B1–B2

Date: 2026-11-03. Baseline commit: `7bcb668`. This delivery stops at the B2 review boundary required by `BUILD-PROMPT-v1.md`.

**Result:** Package A is implemented; the B1 generator/verifier and B2 wall controls are implemented. The final run passed **50 tests**, the unchanged original compression selftest, and the invariant wall on **16 development worlds**. The schema-5 review adaptation reports all **11 formerly absent protections present**. No real model API calls, new dependencies, new adversarial sandbox probes, or Phase 4 work occurred.

## What was built

| Component | Result | Evidence |
|---|---|---|
| A1 seed draw | SHA-256 expansion of literal master text, low 32 bits, duplicate suppression; two 40-seed configs | `test/seeds.test.js` |
| A2 restart procedure | Execution indices 0–2, random 128-bit run IDs, append-only execution/terminal chain; only interruptions permit a fresh restart | `src/ledger.js`, `test/harness.test.js` |
| A2 request durability | Dispatched request persisted before transport; atomic replacement on receipt; an unreceived response stays archived | transport callback and missing-end fixtures |
| A3 request binding | Reconstructed requests, full system/scaffold binding, feedback and parsed-response binding, prompt-builder hashes | four refusing payload cases and four passing treatment controls |
| A3 postmortems | Same request reconstruction; slotted runs additionally validate their registered batch | `src/postmortem-binding.js`, shared provenance validator |
| A4 resources | Named input/output/cache fields plus seconds recomputed across the entire chain; unavailable consumption remains unknown | forged tokens/seconds, missing-usage and cache-accounting fixtures |
| A5 analysis | Validated binomial API; log-space hypergeometric inversion; completeness gate; qualified resolved-only diagnostic; sample identification bounds for unknown paired arms | `test/bounds.test.js`, analysis fixtures |
| A6 wording | Active schema-5 documentation; retained-draw terminology; obsolete digest refusal removed | README and listed plan edits in `BUILD-NOTES.md` |
| B1 finite algebras | Count/abelian controls, S3/Q8/D4/A4, and transformation monoids on three/four points | eight-variant generator tests |
| B1 proof/audit | Exhaustive table laws and rule equations, consequence-rule paths, exact bounded image-assignment enumeration, kernel-equivalence classes, occupancy and coverage | generator proofs and explicit ambiguous-evidence test |
| B1 verifier | Fresh state per prediction/quantity evaluation; partition comparison; small/large generalization gap; functional and declarative-fold routes | reference, renamed-output, constant-partition and unavailable-sealed-set tests |
| B2 wall controls | Public-rule count nullspace, bounded BFS, oracle fold; budgets and primitive languages registered | `src/invariant-selftest.js`, `docs/SELFTEST-B2.json` |
| B2 preregistration | Key moves, ≥95% sealed criterion, predictions, budgets, confounds, and review prerequisites | `prereg/invariantGame.md` |

## What the tests establish

The retry fixtures cover interruption followed by completion, two interruptions followed by completion, three interruptions ending unresolved, completed failure without retry, setup failure, reference success after interruption, a dispatched request without a response/end record, missing executions, missing indices, excess executions, duplicate terminals, and records after termination. Discarded attempts and unreceived requests remain in the chain's resource accounting.

Request fixtures demonstrate refusal of absent hints/scaffolds, wrong memory payloads, and wrong feedback while the four correct treatment controls pass. The shared validator also refuses wrong model, options, reference values, versions, slots, scaffold hashes and paths. The schema-5 adaptation retains the original IDs for the 11 failed v9 protections; its **32 checks** are a focused adaptation, not a claim to have rerun all 61 original observations unchanged. Archived review files are untouched.

Coverage is checked independently with exact `BigInt` combinatorial probabilities for every `1 ≤ M ≤ 40`, `0 ≤ n ≤ min(10,M)`, and `0 ≤ K ≤ M`. Every case has at least 95% coverage. Tests include the reviewer's `M=79, K=77, n=2` counterexample and exact inversion boundaries at `M=2^32`. Invalid counts/significance refuse; endpoint CDFs are finite; no resolved evidence yields an unavailable diagnostic.

For B1, all table associativity triples are checked, every equation is verified, every positive path is replayed, and negative invariant inequalities are checked. Kernel-equivalence enumeration is exhaustive within the stated ambient-monoid class. Tests ensure a commuting subgroup is reported as abelian and ambiguous evidence is flagged. The public-evidence view strips certificates, secret invariant values, decoy annotations, calibration pairs and administrative IDs.

The final B2 calibration results are:

| Control | Count/abelian | Noncommutative | Scope |
|---|---:|---:|---|
| Oracle reference | 100% | 100% | all 16 worlds; conservation proved and partitions matched |
| Count nullspace | 100% | 50–75% | public rules, mod-2/mod-3 features |
| Bounded BFS | 50% | 50% | large calibration pairs, explicit node/transition limits |

All 16 final wall worlds were uniquely recoverable in the registered representation class. This is development evidence for those worlds, not a ≥200-world portfolio coverage audit. `SELFTEST-B2.json` records per-world results, budgets and source hashes. The two original compression families retain their previous outcomes and digests; `src/selftest.js` was not edited.

## Decisions, deviations and limitations

1. **Required review stop:** B3–B6 remain unstarted. There is deliberately no sealed example/checker, full portfolio, leakage audit, B4 review prompt, or invariant-model-loop dispatch yet. Those deliverables belong after the requested review boundary.
2. **Master ambiguity:** the prompt says both decimal text and up to 64 hex characters. The implementation takes the conservative intersection: canonical decimal text of 1–64 digits, with no numeric coercion or leading-zero aliases. The example masters are supported exactly.
3. **Repeated solves:** binary bounds are reported separately by repeat stratum, each with one slot procedure per seed. Repeats are not pooled as independent worlds. Paired differences average repeat intervals; reported intervals with unknown arms are sample identification bounds only. These per-stratum confidence limits are not a simultaneous family-wise claim.
4. **Statistical premises:** `M=2^32` follows the explicit build request. Conditioning on future construction eligibility changes the relevant finite population, and stochastic decoding needs an appropriate potential-outcome/design justification. Reports disclose these premises. The build does not certify prospective public randomness, an external timestamp, or an active confirmatory freeze.
5. **Bounded generator registration:** initial alphabets contain 2–4 letters. The transformation family is dihedral permutations plus constant maps, not every transformation monoid. The identifiability class fixes the ambient monoid and enumerates at most 1,000,000 assignments. These choices are recorded rather than generalized beyond their scope.
6. **B1/B2 calibration before B3:** training and calibration sets necessarily exist for the requested selftests. They use bounded walks, inequality negatives and declared order witnesses. They do not establish B3's joint-feature ceiling, nuisance matching, integer quotas, or sealed construction. Production scoring fails closed while sealed pairs are absent.
7. **Quantity proof route:** arbitrary `quantity(state)` code receives a bounded check over total surrounding-context length ≤3. A separately declared `quantityFold` is interpreted by the host and receives a full algebraic proof. This proves that declarative object; it does not certify arbitrary JavaScript as equivalent to it. Both forms at once are refused.
8. **Retry accounting:** setup failure terminates unresolved. A durable dispatched request without an end record is valid interrupted evidence. A hard stop of the entire batch driver can leave a missing terminal, which is refused; automatic whole-batch resumption is not implemented. No missing terminal is fabricated.
9. **Resources:** optional cache counters omitted from present provider usage mean no reported cache use; absent primary usage/response fields remain unknown. Seconds measure the archived request-plus-scoring interval when usage is present; setup time is unknown. A zero-request setup failure has known zero token consumption. No cost is estimated for an unreceived response.
10. **Build workflow:** dependency installation disabled lifecycle scripts. Tests were run at logical implementation checkpoints; the existing historical sandbox regressions ran as part of the explicitly required selftest. No new sandbox adversarial investigation was added.

Every plan edit is listed by section in `BUILD-NOTES.md`. The append-only preregistration rule, archived reviews, and exploratory runs were preserved.

## Open questions for the reviewer

- Accept the repeat-stratified endpoint and identify the primary stratum before any confirmatory use, or require a separately registered world-level aggregation?
- How should `M` and the bound change after B3 eligibility/construction exclusions, and what justification is required for stochastic decoding?
- Should masters accept literal hexadecimal strings as well as the prescribed decimal examples?
- Is the initial transformation-monoid subclass and 2–4-letter representation class sufficient for B3/B4, or should an amendment expand it before a freeze?
- Is total context length ≤3 the intended bounded quantity check? Is the explicit declarative-fold route acceptable?
- Are the B2 BFS/node/transition and sandbox budgets suitable starting points for the independent B4 challenge?
- What preregistered disposition should apply to non-identifiable worlds once B3 construction is available?
- Is an explicit recover/resume command required for whole-batch process termination before confirmatory operation?

Review instructions are in `REVIEW-PROMPT-B2.md`. Work stops here pending that review.
