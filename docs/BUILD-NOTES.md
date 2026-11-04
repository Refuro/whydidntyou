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

## B2 delivery

- Added publicEvidence to explicitly strip secret certificates, decoy annotations and administrative data before any future solver constructor/prompt receives a world.
- Registered B2 controls and budgets in src/baselines/invariant-wall.js and prereg/invariantGame.md. The selftest uses seeds 1 and 2 across eight algebra variants; its calibration results do not claim B3 sealed or B4 portfolio coverage. npm run selftest now runs the original unchanged compression test followed by the invariant wall.
- Final validation: 50 tests passed; original compression selftest passed; all 16 invariant reference runs scored 100%, count controls scored 100% on count/abelian and 50–75% on noncommutative worlds, and bounded BFS scored 50% on large pairs. All 16 final wall worlds were uniquely recoverable in the registered class. Final evidence and source hashes are in SELFTEST-B2.json.
- New prereg file created as explicitly requested by B2; no existing prereg file was edited. No archived review, historical exploratory run, or baseline program was changed.
- Delivery stops at B2. BUILD-REPORT-v1.md and REVIEW-PROMPT-B2.md describe the completed scope and outstanding decisions. B3–B6 and REVIEW-PROMPT-B4.md are pending the required review.

## B2 decisions follow-up (2026-11-03)

Base: 08d6ca0. The author explicitly confirmed that the B2 review is still pending and B3 must stay gated. Only independent decision updates are implemented here.

- D1: report and analysis label repeat 0 as primary. Later repeats have separate exploratory bounds, curves, parameter tables and contrasts; their outcomes cannot change the primary contrast.
- D2: the M=2^32 numerical reference stays available, with a plug-in estimated-M_C reference from validated proposal/eligible counts. The current harness assigns all preflighted proposals or refuses, so its counts are equal and are derived from the validated grid, never accepted from an editable row. B3 must replace this count source with its validated proposal/defect ledger. Estimates do not establish the true lower bound on M_C.
- D2: reports state deterministic eligibility and independent provider Bernoulli draws. The mean-of-products zero-success bound is emitted separately only when n>0 and s=u=0. Hypergeometric values are labeled registered numerical references, without an exact fixed-K claim for stochastic outcomes. The zero-success argument is not extended into an unproved positive-count coverage assertion. The numerical fixture checks every n=1..100 and count=0..n at M_C=10^6 against the 0.01 percentage-point printing unit.
- D5: unrestricted scoring is classifier-only; quantity-requested requires one quantity form. Both forms remain refused. Functional checks are explicitly labeled bounded empirical conservation; declarative folds are the only proved route. B2 reference selftests explicitly request the quantity endpoint. B6 prompt/loop integration is still pending.
- D7: non-identifiability now throws ConstructionDefect(seed, 'non-identifiable') with the audit retained; make cannot return that world for assignment. Generator version advances to invariantGame-v1-b2.1. Durable exclusion-ledger persistence is B3 work and was not started.
- D3/D4/D6: decimal masters, the accepted initial subclass/representation range, and existing budgets are retained. Preregistration changes are a dated addendum only. Family expansion and budget changes obey the author's pre-freeze restrictions. Source-hex conversion and freeze-manifest emission remain future freeze work.
- D8: --resume is explicitly queued for B3, including prior-state digest binding and abandoned-batch disposition. It is not implemented before the pending B2 review. No B2 review findings were invented or treated as resolved.
- Plan edits: §2 records the D6 budget policy; §3.2 records D7 defect disposition; §3.3 records D4 scope/expansion restrictions; §3.6 records D5 output/quantity semantics; §4.5 records D1/D2 endpoint and sampling assumptions; §8 removes the contradictory repeat pooling and fixed-K stochastic wording. The latter consistency edits implement the binding decisions without changing the broader research claims.
- Baseline dependency install and full selftest passed. The updated npm test suite passed all 55 tests. Final full selftest results are recorded below. No real model requests, dependency additions, new adversarial sandbox probes, or B3/B4 implementation occurred.

- Final follow-up selftest passed: both original compression walls and all 16 invariant wall worlds. Evidence is in SELFTEST-B2-decisions.json; the original SELFTEST-B2.json remains unchanged.

## 2026-11-03 — B2 review repairs (v2 step 1)

- R1: results cannot select the success contract. Readers regenerate the instance; the shared validator rejects foreign fields, incorrect variants, inconsistent arithmetic, and execution without parsed code. Compression's legacy untagged result stays a fixed compression variant.
- R2: canonical decimal masters allow 78 digits; `--source-hex` records original hex, bytes and exact BigInt decimal in the draw manifest. Decimal strings are bounded by length (not restricted to a 256-bit numeric maximum).
- R3: public identifiability no longer reads certificates. Private path coverage is separate and explicitly unavailable without certificates.
- R4: only resolved zero-success evidence receives the registered stochastic inference bound. Positive/unresolved counts return unavailable and bound 1; hypergeometric, resolved-only and population plug-in values are explicitly non-inferential diagnostics. The midpoint counterexample reproduces noncoverage above 5%.
- Plan edit inventory correction: the earlier §13 sampling-history terminology edit changed coincident worlds to “retained draws and reported”; it was omitted from the earlier inventory. No new PLAN edits in this repair commit.
- Fixtures: `test/review-b2-repairs.test.js`, plus updated diagnostics and master-shape assertions in existing tests. Historical B2 evidence and reviewer-owned input files are unchanged.

## 2026-11-03 — B3 receipt and resume protocol

- Raw response and usage are fsynced in `received-unscored` before parsing/scoring. Resume deterministically scores that receipt; it never redispatches its request. A dispatched request without a receipt consumes that execution and follows the existing two-retry policy.
- Schema 5 gains a versioned resume manifest: source/config hashes and preassigned run IDs. Resume validates existing chains and orphan logs before dispatch, appends `resumedFrom`, retains indices/budgets, and is a no-op after all terminals exist. A partial final record or mismatched source/config produces a separate durable abandoned disposition; evidence is not trimmed or repaired.
- Usage seconds now mean archived transport latency; unknown usage remains unknown. Scoring runtime is not included in provider usage seconds.
- PLAN edit: §8 replaces the blanket resumed-batch refusal with the validated resume path and explicit abandonment rule.
- Offline suite: 68/68 pass, including receipt-before-score, orphan log, terminal-boundary interruption, repeated resume, partial batch/run records, and changed source/config. No model calls or new sandbox probes.

## 2026-11-03 — B3 generator, sealed construction and evidence

- Historical B2 implementation is retained as `invariantGame-b2.js`; its tests and wall runner explicitly use that version. Existing evidence files and archive contents remain unchanged. The current generator uses a uniform image draw and separate public-order stream, with a version bump and dated preregistration addendum.
- Bounded string-support feasibility, a dependency-free two-phase simplex, exact joint nuisance matching, integer rounding, independent realized ceilings, and certificate checking are implemented. The support restriction and all numeric limits are registered in the addendum and `SAMPLER`; infeasibility concerns this support, not arbitrary strings. A minimum-weight objective retains support diversity instead of collapsing the feasibility solution to four repeated pairs.
- Construction ledgers retain every fixed proposal, counts/classification/audit/reason, and exclude defects without replacement. Compression batch counts now come from their durable header construction entries; invariant corpus acceptance reports derive from their proposal/disposition ledger. Model-loop integration remains B6 and gated.
- The export checker independently verifies the alphabet/image streams, finite laws, paths/inequalities, rounded ceilings and nuisance balance. It refuses the historical positional convention; chance agreement with a positional pattern is not excluded because that would bias the registered assignment distribution.
- No additional PLAN edits here. Fixtures cover LP feasible/infeasible/unbounded cases, public permutation invariance, congruence closure, defect retention, rounded checks and tampered exports.

## 2026-11-03 — B4 portfolio and audit protocol

- Fourteen independently fitted portfolio members are implemented under `src/portfolio/`, including all three retained BFS settings. Each fitter receives only `publicEvidence`; selection completes on public training scores before sealed scoring. Oracle best-member selection is labeled separately. The finite-state member compares full transformations (at most q^q states), and the fold-grammar member refines public counterexamples under relation constraints.
- The positional-template control reproduces 100% on all 16 historical B2 worlds and fails on the amended exported example. Universal failure is incompatible with retaining uniformly proposed assignments: some new worlds can accidentally fit old templates. They are retained and their actual success frequency is reported. No family expansion or outcome-dependent exclusions were introduced.
- A fixed, prospective development audit uses 512 proposals per requested family, 2,048 total, with all construction complete before any portfolio fit. Source hashes, seed/options, every defect, every accepted-world digest, all fit/scoring results and all BFS settings are retained. Audit workers are ordinary Node worker threads, not independent reviewers.
- All 77 ordinary offline tests pass before this audit; the two unchanged compression reference controls also pass (laggedRule ratio 0.468; hiddenPeriod ratio 0.507333). No new adversarial probes were made. The aggregate legacy `npm run selftest` includes adversarial cases and was not rerun in v2 under the no-probing instruction; its benign reference/wall coverage is exercised separately and in the ordinary suite.
- No PLAN edits beyond the §8 resume amendment in v2. The earlier missed §13 terminology change is listed in the repair entry above. Pre-registration changes are dated append-only addenda.

### B4 completed evidence

- Final ordinary suite: 79/79 passed. Independent example checker passed. Source identity in the completed audit matches current source.
- 2,048 fixed proposals; 1,720 accepted and scored; every requested and effective family has >=200 accepted worlds. Effective counts: 428 count, 652 abelian, 377 nonabelian, 263 monoid. Monoid acceptance is 295/512 by requested family; all 217 defects are retained with reasons.
- Monoid CSP and oracle portfolio: 1,720/1,720 successes. Public selector: 1,719/1,720. Largest BFS setting: 34 nonabelian and 27 monoid successes. Positional-template successes: 250/428 count, 443/652 abelian, 113/377 nonabelian, 3/263 monoid; historical baseline 16/16 at 100% accuracy. These actual outcomes are not filtered.
- The current generator is not portfolio-resistant. No automatic family expansion is made; the external challenge and B4 review decide the next pre-freeze step. `REVIEW-PROMPT-B4.md` is the mandatory handoff; B5/B6 remain gated.

## 2026-11-03 — immediate B4 decision task: external challenge adapters

- `export-public.js` regenerates every accepted ledger entry, verifies its world digest and certificates, and emits only the strict public projection plus unlabeled sealed pairs and the digest. A separate host index binds exact public bytes and private ledger identities. No calibration, certificate, secret, defect, scale, seed or family field is exported. Identical verified exports are idempotent; assignment changes require another directory.
- `score-external.js` injects only that public projection as `publicWorld`, runs self-contained outside code through the existing fresh-QuickJS reachability contract, and keeps sealed labels in the host. No change to the sandbox, verifier, generator, original sampler or portfolio members is needed. Each invocation archives the source, budgets, per-world/family scores, failures and actual call/time/byte charges. Primitive instructions are unavailable because the existing sandbox has no counter; they are not fabricated or equated with portfolio work units. Top-level fitting repeats in every fresh call and is charged.
- The host source hash pins the adapter environment at export; old construction ledgers remain usable through exact regenerated-world/digest checks, despite the newly added source files. The earlier B4 audit remains historical and untouched, with its original source hash. No full coverage rerun or new challenger result is claimed.
- PLAN edits authorized by `DECISIONS-B4.md`: §2 records the within-library interpretation, retained positional-template successes, builder resource-curve status and both pre-freeze gates; §3.4 changes the infeasibility wording to the registered bounded problem and adds the required verbatim limitation plus the challenger question. No B5/B6 implementation or freeze is performed.
- Adapter defaults are operational limits, not frozen budgets. `src/portfolio/README.md` documents the public interface, exact charged work, archive paths and budget flags for the independent session.

Validation: all 87 ordinary offline tests pass, including eight adapter tests covering exact projection, refusal of private fields, legacy digest regeneration, sandbox scoring, family/work summaries, retained failed budgets, changed evidence and the documented CLI pair. The requested one-paragraph report is appended to `BUILD-REPORT-v2.md`; the immediate task stops after commit.
