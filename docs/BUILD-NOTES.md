# Build notes — v1

Started 2026-11-03 against commit `7bcb668`, following `BUILD-PROMPT-v1.md`.
Baseline: dependency install with lifecycle scripts disabled; `LLM_MOCK=1 npm run selftest` passed.
No new dependencies, real model calls, or new adversarial sandbox probes are authorized by this build.
The first delivery stops after B2 for the requested review; B3–B6 remain pending that review.

## Decisions and plan edits

- A1: the prompt says both “decimal string” and “up to 64 hex characters”. Accept canonical decimal strings of 1–64 digits, hash their literal text, and reject numbers, signs, whitespace, and leading-zero aliases. This conservative intersection supports the prescribed masters without numeric conversion. The two example seed lists each contain 40 seeds.
- A1, PLAN §8: substitute the specified SHA-256 computational sampling assumption and prospective public-randomness requirement. Correct retained-draw terminology throughout the plan and reporter, and remove the obsolete digest-refusal sentence (A6).

## Validation checkpoints

- Baseline selftest: passed, including the existing compression controls and historical sandbox regressions.

- A2–A4: schema 5 replaces trial/trial-failed with execution/terminal records. Setup failures terminate unresolved without a retry; only interruptions authorize another execution. A hard process stop with a durable dispatched request can be validated as interrupted. A whole-batch process stop still needs explicit recovery; missing terminal records are refused, never silently fabricated.
- A2: per execution at most the registered attempt budget; per slot at most three such executions, with all requests/costs retained. One transport call has a 120-second deadline; no provider-level retries. Scheduling is condition/seed/repeat with immediate fresh restarts, explicitly recorded. Provider decoding randomness is fresh and not controlled by this build.
- A3: archive scaffold text and prompt-builder hash in run metadata; pin builder hash in the header. Postmortems of slotted runs additionally validate their batch (auto-discovered beside the log or supplied with --batch). Standalone runs have their own recorded treatment only.
- A4: sum input_tokens, output_tokens, cache_creation_input_tokens and cache_read_input_tokens. Optional absent cache fields within present usage mean zero reported cache use; missing primary fields or missing usage mean unknown. Nested cache breakdowns are not double-counted. Archived usage.seconds measures request plus scoring time; it is unknown when usage is absent. Zero requests have known zero token consumption; setup elapsed time is unknown.
- A5: hypergeometricUpperBound returns the largest integer K, with K/M in nullBounds; binomialApproximation remains available. Repeats are separate strata (each has one binary slot endpoint per seed), never extra independent worlds. Paired differences average repeat intervals and report sample identification bounds until all outcomes resolve.
- A2/A3/A4 plan edits: §4.5 states the slot-procedure endpoint and removes the minimum-resolved/replacement sentence; §5 updates active schema references; §8 documents execution chains, request reconstruction, random run IDs and bound resources. A5 plan edit: §4.5 registers hypergeometric inversion and labels the binomial approximation. Historical change-log sections remain historical.
- A5 open statistical premise: M=2^32 follows the explicit build request. Construction eligibility changes the finite population, and stochastic decoding needs a fixed potential-outcome or design-based justification. This implementation discloses those assumptions; it does not manufacture prospective randomness evidence or certify a freeze.
- Review adapter: test/REVIEW-CHECKS-v9.mjs preserves all 11 absent-protection case IDs, upgrades source records to schema 5, and retains the passing treatment/metadata controls. It leaves the archived source immutable.

- Package A checkpoint: npm test passed; adapted review reports all 11 formerly absent protections present; existing npm run selftest passed. Coverage is checked with independent exact BigInt combinatorial counts, including large-M inversion boundaries.

## B1 choices and checks

- The registered initial alphabet range is 2–4 symbols. Count/abelian tables are C2×C2 and C3×C3 (optional modulus 2 or 3). Nonabelian groups are S3/Q8/D4/A4. Transformation worlds use dihedral permutations plus constants on three or four points (9/12 elements), a small explicit subclass rather than the full transformation monoid. Unknown options are refused.
- Conservation checks every table triple and every equation; two or three decoys have paths using base rules only. The generated submonoid controls the reported family classification. Secret transformation arrays are retained for independent checking.
- Identifiability enumerates every image assignment into the same ambient monoid, up to the registered 1,000,000-assignment cap. Kernel equivalence uses canonical rooted transition graphs; ambiguous worlds are returned with flags, never rerolled.
- B1 needs training/calibration labels before B3. These use bounded rewrite walks, invariant-inequality negatives, and declared order witnesses. They are calibration diagnostics, not B3 sealed construction or a joint-feature certificate. A regression caught the need to vary negative-string length for a valid length-parity world; the final calibration registration states independent initial lengths.
- The quantity context cutoff is TOTAL surrounding-context length <=3. Arbitrary functions get bounded exhaustive evidence. The proof route uses a separate declarative quantityFold interpreted by the host; it does not claim to prove arbitrary JavaScript implements that fold. Supplying both forms is refused.
- Fresh sandbox state is used for each classifier pair and each functional quantity state; the same existing interpreter restrictions apply. Compression scoring and digests are preserved. The invariant domain is intentionally not yet wired into model prompts/experiment dispatch; that is B6 after the review stops.
- B1 tests: all eight algebra variants have exact table/rule proofs, positive paths, negative certificates, deterministic digests, explicit identifiability counts, and a passing reference solver. Invalid tables/rules refuse; an abelian subgroup is reclassified; ambiguity is exposed; the production verifier refuses absent sealed data. Partition checks accept renamed values and reject a constant partition. Existing compression selftest passed unchanged.
