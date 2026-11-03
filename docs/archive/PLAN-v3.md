# Plan v3: controlled measurement of solver behavior relative to a reference library and a documented training distribution

Status: DRAFT v3 for a third, verification-focused review. Supersedes v2 (`docs/archive/PLAN-v2.md`) in response to `docs/archive/REVIEW-v2-response.md`. Nothing in Phase 2 or 4 has been run.

## 0. What v3 claims, and what it explicitly does not

Three propositions are kept separate everywhere in this project:

- **(P-exposure)** no document in the audited training corpus explicitly demonstrates the target solution family;
- **(P-language)** the submitted solution's behavior lies outside a formally specified restricted language L0;
- **(P-capability)** the target capability was absent from the trained model before testing.

P-exposure and P-language can be established. **P-capability is not implied by them and is not claimed anywhere in this project.** A model can learn, during training, a procedure that no training document spells out.

**Claim A (Phases 1–2):** on a specified task distribution and under specified budgets, frontier models do or do not match an independently challenged, frozen solver portfolio; results are reported as performance and resource comparisons plus a semantic analysis of the submitted programs.

**Claim B (Phase 4):** a model trained from random initialization on a fully documented, hash-pinned synthetic corpus satisfying P-exposure for a withheld solution family does or does not produce solutions satisfying P-language on withheld-family tasks, compared causally with a matched model whose corpus includes that family. Reported as controlled exposure and generalization, never as invention.

The four-level ladder (parameter search / method selection / method synthesis / representation synthesis) is retained only as informal vocabulary in the discussion section.

## 1. Axes of measurement

1. **Validity.** Task performance on sealed evaluation pairs; for invariant tasks, a validated conserved quantity, scored by a fixed prediction rule, separately from the model's own classifier.
2. **Relationship to the reference portfolio** — two separate reports: (a) *performance* vs the portfolio (§2) on the same worlds; (b) *semantic analysis* of the submitted program: L0 membership (§4.2 defines L0 semantically; membership is decided by witness pairs, not by inspection), primitives used, and whether a registered portfolio member's behavior matches it on challenge pairs. Accuracy equality is never taken as method identity.
3. **Resources.** Model tokens, sandbox executions, wall-clock, labeled examples used.
4. **Reuse** — one of three registered kinds, never conflated: (R1) additional sealed pairs in the same world; (R2) transport under a supplied symbol/algebra isomorphism to a fresh world; (R3) a frozen *constructor* (procedure) re-fitting a quantity from a fresh world's rules under a registered adaptation budget, compared against fitting from scratch. The literal fitted quantity is expected to fail on fresh worlds and that failure is not reported as a failure of abstraction.

## 2. The reference portfolio

Membership (each with a registered primitive language and compute budget; one total budget per member, stated):
1. modular linear algebra over symbol counts;
2. finite-group homomorphism search into Z_m, S3, Q8, D4, A4, with and without quotient coarsening;
3. **finite-monoid constraint synthesis** (SAT/SMT/CSP over symbol images or a bounded multiplication table, with closure, associativity, identity, rule equations and labeled examples as constraints);
4. **joint coarse-feature classifier** over the tuple of all registered quotients and count features (not each separately);
5. finite-state inference that tracks the full string-product state (bound justified against the algebra size: ≤ q^q states for a transformation monoid on q points), plus rewrite normalization / canonical forms;
6. **constraint-guided search in a registered program grammar** driven by relations and counterexamples (not pure enumeration);
7. nuisance-feature classifiers (length, histogram difference, edit distance, LCS, positional agreement, short-pattern counts) and bounded bidirectional search, as scored baselines;
8. brute-force BFS under the sandbox budget.

Two portfolio scores are reported: **oracle portfolio** (best member per world chosen with sealed labels — labeled as an oracle) and **implementable selector** (member chosen from public rules and training pairs only). Members are never modified using sealed scores. Before freezing, a solver author who did not design the generator attacks development worlds under the registered budgets; the portfolio is frozen only after that challenge. Coverage table, all evaluated worlds, failure modes and resource curves are published. A general-distribution result and any library-resistant challenge set are reported separately. A null comparison is not evidence of non-superiority unless a registered equivalence margin is met.

## 3. Phase 2 — hidden-invariant pair classification (Claim A)

### 3.1 Task semantics
Pair classification on a stated promise distribution: positives from random rule walks (connected by construction); negatives with different invariant value (disconnected by construction). Same-invariant disconnected pairs are outside the distribution and the paper says so. Two distributions are reported: **natural sampling** and a **quotient-challenge** distribution (§3.4), each with its own sealed pairs.

### 3.2 Generator soundness and verification
Admitted families are monoid homomorphisms from strings to a finite monoid M: count vectors mod m; products in finite abelian groups; products in registered non-abelian groups; products in small transformation monoids. **Conservation is proved, not sampled:** verify M's closure, identity and associativity exhaustively on its table; define I as the fold of symbol images; check every rule equation I(u)=I(v) in M. The homomorphism property then gives I(xuy)=I(xvy) for all contexts. No short-context cutoff is used as a proof. Two sound extensions are admitted only with their augmented summaries: alternating weighted sums carrying (length parity, alternating sum), and fixed-pattern counts carrying (count, prefix, suffix, capped length); rules must preserve the full summary, and these families are audited for rule coverage and shortcut creation before use.

Per world, an **identifiability audit** reports: number of inequivalent representations consistent with the exposed rules and training pairs; reachable-state occupancy; rule coverage; the reference solver's information requirement. Worlds where a valid invariant is not recoverable from the evidence are flagged, not silently included.

### 3.3 Families and the sealed transfer family
F-count, F-abelian, F-nonabelian, F-monoid as in v2. **F-sealed is chosen and committed by an independent custodian** (not the author; the reviewer is asked to act as custodian or to nominate one), as a hash of a specification file the author does not see until the confirmatory run. If no custodian is available, designer knowledge is disclosed and the family, sampler, portfolio and scaffold are frozen before any confirmatory outcome is observed, with commit hashes and timestamps listed in the paper.

### 3.4 Negative sampling (replaces v2's universal quotient requirement, which is infeasible for e.g. C2×C2×C2)
1. **Feasibility first.** For each admitted algebra, solve the finite feasibility problem: support points are unequal value pairs (nonidentity differences for groups), constraints are registered quotients (normal subgroups) or congruences (monoids). Report infeasible cases; do not regenerate indefinitely.
2. **Witness pairs.** For separation from count-based representations, include balanced pairs with identical symbol histograms and different labels (e.g. `…ab…` vs `…ba…` under non-commuting images). This is a certificate that histogram-only classifiers are bounded on the challenge distribution; the bound is computed, not assumed.
3. **Joint coarse-feature check.** The quotient-challenge distribution is validated against the joint classifier over all registered coarse features (§2.4), with a registered maximum accuracy (e.g. ≤ 70% on challenge negatives); thresholds are stated at a single denominator.
4. **Nuisance matching.** Positive/negative challenge pairs are matched on length, histogram distance, edit distance and LCS; the nuisance audit (§3.5) is re-run after conditioning.
5. **Calibration vs sealed.** Instance acceptance uses calibration pairs; sealed evaluation pairs are generated afterwards and never used for acceptance.

### 3.5 Leakage audit (as v2, unchanged in substance)
Metadata-only, canonicalized-rule and labeled-pair predictors of family; nuisance-feature predictors of label with a registered equivalence margin (upper 95% bound < 55% on fresh worlds); portfolio with rules-only / examples-only / both; presentation interventions. Structural recognizability is reported as portfolio coverage, not hidden.

### 3.6 Prompt and output conditions
Two paraphrases. Unrestricted vs quantity-requested output; the request is an intervention and is reported as one.

## 4. Phase 4 — controlled exposure and generalization (Claim B)

### 4.1 What is withheld
The withheld family is **non-commutative structure**: no training document contains a solution, trace, explanation or failed attempt whose quantity is order-sensitive. (v2's wording "no group-valued object" was wrong: abelian groups are in-toolkit.) In-toolkit families: F-count and F-abelian.

### 4.2 L0 and its certificate
L0 is defined **semantically**: quantities that depend on the input only through its symbol histogram, q(s)=f(count(s)), with f ranging over the in-toolkit expression grammar. A proof by induction over the grammar establishes that every L0 expression is invariant under symbol permutation within a string. **Certificate that a submitted quantity is outside L0:** two strings with identical histograms and different outputs (`ab` vs `ba` suffices when images do not commute). **Certificate that a task requires information beyond L0 at the threshold:** balanced label conflicts within histogram classes in the sealed pairs, giving a computed accuracy ceiling for every L0 classifier. Neither certificate speaks to P-capability.

### 4.3 Corpus and exposure audit
- Solutions, traces, explanations and failed attempts are **emitted from a typed AST** in a fixed formal notation and rendered to text; the AST grammar for in-toolkit documents cannot express order-sensitive quantities. No post-hoc text filtering is relied on.
- Generic transition-table evaluators (`state = T[state][sym]`) are **excluded from in-toolkit documents**, since they evaluate non-commutative products regardless of the tables shown. Sequence-processing competence is taught by registered documents that are disclosed as part of the exposure intervention.
- Input rule systems in in-toolkit documents are themselves in-toolkit (commutative) and are audited.
- The exact delivered token stream, tokenizer, generator code, configuration, curriculum and packing rules are hashed; random initialization; no fine-tuning, validation-driven selection, or test-time examples outside the audit. Unique underlying worlds and structural equivalence classes are reported, not only token counts.
- Audit levels: generation/syntax (every document parsed and certified), semantics (L0 proof + search for alternate encodings in inputs and labels), actual exposure (hashes), interpretation (P-exposure and P-language only).

### 4.4 Interface frozen before any training
Executable output language (restricted; its primitives disclosed as exposure), tokenizer, context length sufficient for the full task prompt plus attempt history, interaction protocol, verifier. If the output language cannot express order-sensitive programs, P-language success is impossible by construction and the experiment is void; the language therefore includes general bounded loops and tables, and their presence in training documents is part of the audited exposure.

### 4.5 Staged execution with registered gates
1. Audit the generator; produce the L0 proof and witness certificates.
2. Overfit a tiny diagnostic set to catch interface bugs.
3. **Benchmark throughput** (tokens/s, peak memory) at the intended context length, precision and optimizer on the actual GPU before choosing token budgets. The v2 "hours to two days" figure is withdrawn; the plan uses measured numbers.
4. Train one small **target-withheld** model and one **matched target-exposed** model (same tokens, steps, architecture, decoding, budgets; data replaced, not added).
5. **Gates**, set before inspecting withheld-family results, per retained seed, on ≥100 fresh development worlds per control family: ≥90% world-level success with 95% lower bound >80%; ≥99% syntactically valid submissions. Controls: (C1) in-family synthesis on unseen F-count/F-abelian worlds with new presentations and the same prompt burden; (C2) the target-exposed model must solve unseen withheld-family worlds; (C3) representation-supplied diagnostic — the withheld model is given the missing representation and tested on fresh cases (diagnoses execution vs representation; does not establish prior absence).
6. Only if gates pass: the size × seed grid, with every seed reported individually (three seeds are three models, not a population) and corpus generation either fixed or independently replicated, stated.

A failed diagnostic run is engineering evidence, not a negative result.

## 5. Interventions and process measures

- **Hints:** prompted-restart estimand by default (hint present from attempt 1 in a fresh run), named as such; a continuation estimand (fork the identical failed history into randomized arms) is a separate experiment. Arms interleaved in a seeded random order within world; equal budgets; both controls reported; selected on development worlds, confirmed on fresh worlds; rung categories (content-free / strategy / solution-family) registered.
- **Post-mortems:** descriptive only. The model receives its full original record. A judge with the full record extracts one verbatim behavioral claim and rates it supported / contradicted / unverifiable with quoted evidence. Categories are multi-label with "unknown". No causal endpoint. Solver, responder and judge model identities are recorded separately.
- **Observable computation:** counters in the execution interface (sandbox executions, candidate evaluations where the model uses a provided tester); coverage limits stated; blind descriptive annotation with mixed/unknown.
- **Scaffold transfer:** developed on F-count/F-abelian/F-nonabelian development worlds, frozen, tested on fresh worlds and on F-sealed; reported as instance transfer plus family transfer with the strategy-leak caveat.

## 6. Phase 1 — search-breadth control
Unchanged: the k-curve. All existing runs are exploratory. The confirmatory k-curve is frozen at tag `confirm-phase1` (to be created at the commit that freezes `experiments/kcurve.json`; the tag's hash is reported).

## 7. Phase 3 — appendix, gated (unchanged from v2)

## 8. Statistics and reporting
- Unit: world. Repeats averaged within world. Effort: success-by-budget curves and censored time-to-success; no conditional medians.
- **One primary contrast** per experiment; secondaries Bonferroni-adjusted (implemented in `report.js`: primary at 95%, secondaries widened). Intervals: paired world bootstrap; degenerate cases (no discordant worlds) are reported as such, never as zero uncertainty. Per-condition population intervals are not reported.
- World identity validated by (domain, seed, generator options, generator version); contrasts across different options declare the shared-draw assumption; missing and incomplete worlds are reported with the registered exclusion/retry policy; mixed or resumed batches are refused by the reporter.
- Sample: ≥32–40 worlds per primary condition; power simulated from pilot estimates for the hierarchical design.
- Annotation: two qualified reviewers on every claimed out-of-L0 solution; blind to model and outcome (family cannot be blinded when code reveals it — stated); control artifacts included.

## 9. Pre-registration checklist — as v2, plus: L0 proof and grammar; witness-pair construction; portfolio challenge report; custodian commitment hash; exposure hashes; gate thresholds; estimand names for every intervention; primary/secondary contrast designation.

## 10. Order of work
1. Phase 1 confirmatory k-curve.
2. Phase 2 generator (homomorphism families, proof-based verification, identifiability audit, feasible challenge sampler); selftest proves conservation and bounds.
3. Portfolio implemented; independent challenger; freeze. Leakage audit.
4. Phase 2 development pilot; hints and post-mortems; scaffold frozen; custodian seals F-sealed.
5. Phase 2 confirmatory grid, two frontier models.
6. Phase 4 stages 1–3 (audit, diagnostic overfit, throughput benchmark) — no large training until these pass.
7. Phase 4 matched pair at one small size; gates; then grid if warranted.
8. Phase 3 if gated in.
9. Write-up: Claim A and Claim B with the three propositions stated separately.

## 11. Questions for the third review (verification-focused)
1. Re-verify the four repaired files against your v2 reproductions: shared host objects, hostile proxies, hint memory forwarding and interleaving, post-mortem full history and judge-based assessment, reporter batch/world validation and multiplicity. Try to break the sandbox again.
2. Is the L0 definition in §4.2 and its two certificates correct and sufficient for the P-language claim as stated?
3. Does §3.4 now specify a feasible sampler? Give a family where it still fails.
4. Are the Phase 4 gates and the three controls sufficient to interpret a null as "this protocol, these checkpoints"? What is still missing?
5. Would you act as custodian for F-sealed (receive a specification, return its hash)? If not, propose a procedure.
6. Rewrite the hostile paragraph for v3.
