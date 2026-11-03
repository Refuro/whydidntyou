# Plan v3.1: controlled measurement of solver behavior relative to a reference library and a documented training distribution

Status: DRAFT v3.1 for a fourth, verification-focused review. v3 is archived at `docs/archive/PLAN-v3.md`; the third review and its probe scripts at `docs/archive/REVIEW-v3-response.md` and `docs/archive/review-v3-checks/`. Nothing in Phase 2 or 4 has been run. Changes from v3 are listed in §12.

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
2. **Relationship to the reference portfolio** — two separate reports: (a) *performance* vs the portfolio (§2) on the same worlds; (b) *semantic analysis* of the submitted program: L0 non-membership (§4.2 defines L0 semantically; a witness pair certifies that a quantity is OUTSIDE L0; absence of a witness means *unknown*, never membership), primitives used, and whether a registered portfolio member's behavior matches it on challenge pairs. Accuracy equality is never taken as method identity.
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

### 3.3 Families and the transfer family
F-count, F-abelian, F-nonabelian, F-monoid as in v2. For every generated world the **generated submonoid** is checked for non-commutativity and the reachable word support for exercising it; a world whose images happen to commute (e.g. all powers of one 3-cycle) is classified as abelian regardless of the ambient algebra's name.

**Transfer family — disclosed-knowledge fallback.** The reviewer declined custody (an author-visible workspace cannot provide author-blindness). Unless an external collaborator who did not design the generator takes custody under the salted-commitment procedure in the v3 review (§2, custody), the paper uses the fallback: the author's knowledge of F-sealed is disclosed; the family, sampler, portfolio, scaffold and protocol are frozen in one commit before any confirmatory outcome is observed; the commit hash is published to the public repository and to an independent timestamping service; the result is reported as *instance* and *family* transfer under disclosed designer knowledge, never as blind family selection.

### 3.4 Negative sampling (replaces v2's universal quotient requirement, which is infeasible for e.g. C2×C2×C2)
1. **Feasibility first.** For each admitted algebra, solve the finite feasibility problem: support points are unequal value pairs (nonidentity differences for groups), constraints are registered quotients (normal subgroups) or congruences (monoids). Report infeasible cases; do not regenerate indefinitely.
2. **Witness pairs.** For separation from count-based representations, include balanced pairs with identical symbol histograms and different labels (e.g. `…ab…` vs `…ba…` under non-commuting images). This is a certificate that histogram-only classifiers are bounded on the challenge distribution; the bound is computed, not assumed.
3. **Joint coarse-feature bound, correctly denominated.** The challenge distribution is validated against the *optimal* feature-only classifier over the joint coarse features (§2.4), computed on an enumerated bounded support of labeled string pairs by the weighted feasibility program in the v3 review (§11.3): nonnegative pair weights with positive and negative mass 1/2 each, per-class caps t_z ≥ max(positive mass, negative mass) in class z, Σ t_z ≤ τ. This bounds the best feature-only classifier's balanced accuracy, not one fitted classifier. Negative-only accuracy is not used (an always-negative classifier attains 100% on it). **Applicability by family:** for F-count and F-abelian the invariant is a function of counts, so a histogram challenge is inapplicable by construction; these families are controls and are reported as "feature-separable". The challenge is required only for families whose generated submonoid is non-commutative.
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
L0 is defined **semantically**: quantities that depend on the input only through its symbol histogram, q(s)=f(count(s)), with f ranging over the in-toolkit expression grammar. A proof by induction over the grammar establishes that every L0 expression is invariant under symbol permutation within a string. **Certificate that a submitted quantity is outside L0:** two strings with identical histograms and different outputs (`ab` vs `ba` suffices when images do not commute). **Certificate that a task requires information beyond L0 at the threshold:** the relevant feature for pair classification is the ordered pair of full histograms h(a,b) = (count(a), count(b)). Within a world, group sealed pairs by z = h(a,b); with n_z+ and n_z− the label counts, the maximum accuracy of any classifier that sees only z is U_hist = 1 − Σ_z min(n_z+, n_z−)/N. If a fraction α of the weighted set lies in balanced conflicting classes, U_hist = 1 − α/2; a registered gap below the task threshold is required (α ≥ 20% for a ceiling ≤ 90% under a 95% threshold). Matching histograms *within* each pair is insufficient (positive (ab,ab) vs negative (aabb,abab) are separable); conflicts must be within pair-feature classes (positive (ab,ab) vs negative (ab,ba)). The ceiling is exact for the finite sealed set and is computed per world. Both certificates are one-sided and assume a pure, deterministic, resource-bounded quantity evaluated against a frozen world; the submitted quantity's conservation is verified separately (bounded empirical check unless a proof artifact is supplied) and the certificate is searched within the task domain, tied to the quantity that achieved sealed success above U_hist. Neither certificate speaks to P-capability.

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

**Registered null event and margins.** The withheld-model endpoint is the world-level rate of *certified out-of-L0 success* (sealed success above U_hist plus a validated conserved quantity with a witness), reported separately from raw task success. Under one checkpoint and independent worlds, zero certified successes in n worlds bounds the rate at 1 − 0.05^(1/n) (one-sided 95%): 8.9% at n=32, 2.95% at n=100; excluding a 5% rate needs n ≥ 59. The confirmatory n per checkpoint, the effect margin for the exposed-vs-withheld contrast, and the handling of unknown certificates, invalid code, timeouts and API failures are fixed before the withheld-family results are inspected. Exposure-helper documents (copying, indexing, reversing, bounded loops) are classified by a published allowed/rejected AST list; generic table evaluators are rejected. "Per retained seed" never licenses silent filtering: every trained seed and every failed gate is reported. C2/C3 contexts and weights are isolated from the unprompted target condition.

A failed diagnostic run is engineering evidence, not a negative result.

## 5. Interventions and process measures

- **Hints:** prompted-restart estimand by default (hint present from attempt 1 in a fresh run), named as such; a continuation estimand (fork the identical failed history into randomized arms) is a separate experiment. Arms interleaved in a seeded random order within world; equal budgets; both controls reported; selected on development worlds, confirmed on fresh worlds; rung categories (content-free / strategy / solution-family) registered.
- **Post-mortems:** descriptive only. The model receives its full original record. A judge with the full record extracts one verbatim behavioral claim and rates it supported / contradicted / unverifiable with quoted evidence. Categories are multi-label with "unknown". No causal endpoint. Solver, responder and judge model identities are recorded separately.
- **Observable computation:** counters in the execution interface (sandbox executions, candidate evaluations where the model uses a provided tester); coverage limits stated; blind descriptive annotation with mixed/unknown.
- **Scaffold transfer:** developed on F-count/F-abelian/F-nonabelian development worlds, frozen, tested on fresh worlds and on F-sealed; reported as instance transfer plus family transfer with the strategy-leak caveat.

## 6. Phase 1 — search-breadth control
The verifier is now process-isolated (`src/runner.js` under Node's permission model, hard external timeout, network globals removed; eleven reproduced side channels in `selftest`). The k-curve is unchanged. All existing runs are exploratory. The confirmatory k-curve is frozen at tag `confirm-phase1` (to be created at the commit that freezes `experiments/kcurve.json`; the tag's hash is reported).

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

## 11. Questions for the fourth review (verification-focused)
1. Re-run the v3 probe scripts (`docs/archive/review-v3-checks/`) against the current tree, plus new ones. The verifier is now two child processes under `--experimental-permission` with network globals removed and a SIGKILL timeout; try to open a channel between the encoder and decoder processes, or to hang the parent.
2. Verify the reporter's manifest validation (forged domain/options/version/batch/repeat), the per-world success-by-budget, the degenerate-interval handling, and the `sharedWorld` coupling declaration.
3. Verify post-mortem judge routing (`--judge-model`), the archived-record path (`messagesSent`, `meta.system`), and the claim/evidence substring validation; try to get a fabricated quote accepted.
4. Are §4.2 (U_hist, conflict mass, one-sidedness) and §3.4 (weighted feasibility program, per-family applicability) now stated precisely enough to implement without further interpretation? Name any remaining ambiguity.
5. Is the disclosed-knowledge fallback in §3.3 acceptable as stated, and what is the minimum external timestamping that makes the freeze credible?
6. Rewrite the hostile paragraph for v3.1 and rank the top three remaining changes.

## 12. Changes from v3
- Verifier rebuilt on child processes with the permission model (v3 review §1: Function-constructor escapes, hangs outside timeout, JSON.stringify trap, promise loop) — all eleven cases are selftest regressions.
- Runs archive the exact system prompt and the exact messages sent for every attempt (schema 2); post-mortems use the archive, refuse malformed or successful logs, verify generator version and secret, route the judge model, and validate the judge's claim and evidence as verbatim substrings; failed validation yields `unresolved`, never a label.
- Reporter validates every trial against the config (condition, seed, repeat, domain, options, memory, model, batch, generator version), lists missing trials from the expected grid, averages within world before any curve, withholds degenerate intervals and distinguishes zero from constant nonzero differences, requires a `sharedWorld` declaration to pair across differing options, labels secondaries exploratory with no family-wise control, and stratifies the parameter curve by condition. Each batch gets its own file.
- Hints: finite-integer validation, category enum (`borderline` removed), batch identity and full provenance in partial records, world-specific default schedule seed, assigned/completed/failed counts.
- L0: witness certifies non-membership only; U_hist defined on pair-histogram classes; conflict-mass gap registered.
- Sampler: negative-only accuracy removed; optimal feature-only classifier bounded by a weighted feasibility program on enumerated labeled pairs; histogram challenge marked inapplicable for count/abelian families; generated submonoid checked for commutativity.
- Custody: reviewer declined; disclosed-knowledge fallback with public commit plus independent timestamp.
- Phase 4: registered null event (certified out-of-L0 success), zero-success bounds, exposure-helper AST list, no silent seed filtering.
