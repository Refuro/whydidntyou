# Plan v2: measuring method and representation synthesis relative to a known toolkit

Status: DRAFT v2 for second review. Supersedes `docs/archive/PLAN-v1.md` in response to `docs/archive/REVIEW-v1-response.md`. Nothing in Phase 2 or 4 has been run. Section numbers are new; the v1 review's section references point at the archived file.

## 0. What changed from v1, in one paragraph

v1 claimed to measure "invention" with a four-level ladder and synthetic tasks. The review showed that no black-box synthetic task can certify that a method or representation was absent from a trained model's toolkit, and that every proposed novelty check could be passed by instantiating a known representation (e.g. searching for a homomorphism into a small group). v2 therefore makes two claims instead of one. **Claim A (Phases 1–2):** frontier models do or do not exceed a *frozen, pre-registered library of known solvers* under explicit budgets, on tasks whose specific parameters are new. **Claim B (Phase 4):** a model whose training corpus we generated in full, and which therefore has a *known* toolkit, does or does not solve tasks that require a representation absent from that corpus. Claim B is the only one that speaks to invention. The ladder (parameter search / method selection / method synthesis / representation synthesis) is kept as vocabulary and never as a measured quantity.

## 1. Axes of measurement (replaces the ladder as the primary result)

Every trial is scored on four independent axes.

1. **Validity.** Task performance on a sealed evaluation set; for invariant tasks, a validated conserved quantity with demonstrated predictive utility (scored separately from the classifier).
2. **Relationship to the frozen baseline library.** Does the submitted solution's behavior match a library solver's (parameter fitting), compose library primitives, or use a representation outside the library's registered solver language? Determined by (a) running the library on the same instance and comparing accuracy, and (b) blind code audit against the library's primitive list.
3. **Resources.** Model tokens, candidate evaluations executed, wall-clock, number of labeled examples used.
4. **Reuse.** Whether the constructed representation, frozen after the trial, helps on independently generated systems.

A result is stated as: "under budget B, model M achieved validity V on family F, with relationship R to library L; the representation did / did not reuse on fresh systems." Nothing is labeled "invention" in Phases 1–2.

## 2. The frozen baseline library (new; required before any Phase 2 model run)

A registered set of solvers, each with a stated primitive language and compute budget, run on every evaluation instance *before* models see it. For the invariant family:

- modular linear algebra over symbol counts (solves D0–D1 by nullspace);
- finite-group homomorphism search into a registered list of small groups (Z_m, S3, Q8, D4, A4), with and without quotient coarsening;
- rewrite normalization / finite-state (transducer) synthesis up to a registered state bound;
- a small composition grammar over registered transformations (run-length, local normalization, symbol merge) × the solvers above;
- brute-force reachability (BFS) with the sandbox's time budget, as the trivial baseline.

Each solver reports accuracy on the sealed pairs and runtime. **If a library solver reaches the success criterion on a family, that family is classified "within library" and is reported as such; it is not promoted to a novelty claim.** Models are compared to the library's best, not to chance.

## 3. Phase 2 — hidden-invariant pair classification (synthetic; Claim A)

### 3.1 Task semantics (fixes v1 F3)
The task is **pair classification on a stated promise distribution**, not reachability. Positives: pairs connected by a random rule walk (reachable by construction). Negatives: pairs with different invariant value (unreachable by construction). The distribution is documented; claims are restricted to it. Unreachable same-invariant pairs are *not* in the distribution and the paper says so.

### 3.2 Generator soundness (fixes v1 F2)
Only invariant families with **compositional conservation** are admitted in v2: those expressible as a monoid homomorphism from strings to a finite monoid (count vectors mod m; group-valued products; products in small non-commutative monoids). For these, `I(u)=I(v)` for each rule implies `I(xuy)=I(xvy)` for all contexts, and this is verified by exhaustive check over all rule applications in all contexts up to the rule-length bound. Position-weighted and pattern-count invariants (v1 D2) and transformed-state invariants (v1 D4) are **excluded** until a sound construction with exhaustive verification exists.

### 3.3 Families (replaces the "dial"; ordered only by library coverage, not by claimed difficulty)
- **F-count**: count vector mod m with hidden weights. Within library (linear algebra). Serves as the sanity floor.
- **F-abelian**: product in Z_m^r with hidden symbol images. Within library.
- **F-nonabelian**: product in a registered small non-abelian group with hidden symbol images. Expected within library (homomorphism search); the experiment measures whether models match or exceed it, and at what resource cost.
- **F-monoid**: product in a small non-group monoid (e.g. a transformation monoid on 3–4 points) with hidden images. Partially outside the registered group list; the library's transducer synthesis is the relevant comparator.
- **F-sealed**: one further compositional family, chosen now and documented in a sealed file (`prereg/sealed/`), never opened during development. This is the transfer family for Claim A.

### 3.4 Negative sampler (fixes the quotient leak)
Negatives are drawn so that every proper quotient of the invariant mislabels at least 30% of them. For a group-valued invariant, this means sampling negative pairs concentrated on value pairs that agree under the abelianization (and under each registered proper quotient) but differ under the full invariant. The 95% success criterion is checked against the best quotient classifier for every instance; if any quotient exceeds 90%, the instance is regenerated.

### 3.5 Leakage audit (pre-model; required)
On an audit corpus of ≥2,000 worlds per family, independent of development worlds:
1. Predict family from metadata/format only (must be at chance); from canonicalized rule statistics; from labeled-pair statistics. Report confusion matrices. Metadata leakage is fixed; structural recognizability is reported as "library coverage", not hidden.
2. Predict pair labels from nuisance features (length, histogram difference, edit distance, LCS, positional agreement, short-pattern counts). Pre-registered equivalence margin: upper 95% bound below 55% on fresh worlds, uncertainty over worlds. Count features are intended signal for F-count/F-abelian and are reported as such.
3. Run the library with rules-only, examples-only, both.
4. Presentation interventions: symbol renaming, rule order, equivalence written as two directed rules (notation only), walk length, pair sampler.

### 3.6 Prompt conditions
Two task-prompt paraphrases. Two output conditions: **unrestricted** (classifier only) and **quantity-requested** (classifier plus `quantity(state)`, scored by a fixed prediction rule). The request is an intervention and is reported as one.

### 3.7 Measurements (same harness)
Validity on sealed pairs; library relationship (§1.2); resources; reuse of the frozen `quantity` on fresh systems of the same family and of F-sealed; hint effects vs no-hint and neutral controls (§5); post-mortem category with contradiction check (§5); observable computation category (candidate testing / constraint solving / mixed / unobserved), blind-annotated.

## 4. Phase 4 — controlled-toolkit model (new; Claim B)

### 4.1 Rationale
The only way to know a solver's toolkit is to have built its training data. Phase 4 trains a small model from scratch on a fully synthetic corpus in the invariant-game world, with a specified toolkit, and tests whether it solves tasks that need a representation absent from the corpus.

### 4.2 Corpus
Generated, not scraped. Contents: rule systems with worked solutions in a fixed formal notation; solutions use only the **in-toolkit** families (F-count, F-abelian); explanations, verifications, and failed attempts in the same notation; no group-valued, non-abelian, or monoid-valued object appears anywhere (enforced by a grammar filter over every document and by a held-out string-match audit). Size: 1–5B tokens, generated deterministically from a seed so the corpus itself is reproducible and auditable.

### 4.3 Model and training
Decoder-only transformer, 20–150M parameters, trained on a single consumer GPU (the author's RTX 4080 SUPER, 16 GB): hours to ~2 days per run at these sizes, which permits replicates. Three model sizes × three seeds minimum. Training code is standard (nanoGPT-class); the contribution is the corpus and the evaluation, not the architecture.

### 4.4 Evaluation
- **In-toolkit control:** held-out F-count/F-abelian systems. Must be solved at high rate or the model is below floor and Phase 4 is reported as floor-limited.
- **Out-of-toolkit test:** F-nonabelian / F-monoid systems. Success requires a validated conserved quantity (Axis 1) that is provably not expressible in the in-toolkit language (checked by the same quotient/linear-algebra tests used in §3.4).
- **Reuse:** a frozen out-of-toolkit quantity re-applied to fresh systems.
- **Ablations:** corpus with the out-of-toolkit family present (positive control); corpus with "look for a conserved quantity" strategy text removed (does the meta-strategy matter?).

### 4.5 What Claim B can and cannot say
It can say: a model with a known toolkit did / did not construct a representation outside it, at this scale, in this world. It cannot say anything about frontier models. The two claims are reported side by side; neither is extrapolated to the other.

## 5. Interventions and process measures (fixes v1 F4 and the hint selection bias)

- **Hints:** every rung vs equal-budget no-hint and neutral-instruction controls, equal repeats, no early stopping. Rungs are labeled *content-free*, *strategy* (e.g. "ask what stays the same"), or *solution-family*. Selected on development worlds, confirmed on fresh worlds; only confirmed effects are reported.
- **Post-mortems:** the model receives the reveal and its full attempt history (not a summary). Self-reports are coded; "contradiction" is recorded only when a claim is contradicted by prose or code in the log. Non-mention is "unverifiable".
- **Observable computation:** logged from the sandbox (candidate evaluations executed, constraint-solver calls if the model uses a provided one) and blind-annotated; never interpreted as cognition.
- **Scaffold transfer:** the scaffold is built from F-count/F-abelian/F-nonabelian development worlds only, frozen, and tested on fresh worlds of those families and on F-sealed. The result is "transfer to a family held out from development"; the caveat that strategy can transfer without answers is stated.

## 6. Phase 1 (laggedRule / hiddenPeriod) — reclassified

Phase 1 is retained as the **search-breadth control** (the k-curve) and as the harness test bed. All runs to date are exploratory; a confirmatory k-curve is frozen at the tag `confirm-phase1`. The real winning program is a registered library member for this family. Phase 1 is reported under Axes 1–3 only.

## 7. Phase 3 (vintage model) — demoted to an appendix

Retained only as a conditional case study of **method reconstruction** (optimal prefix coding with a fully specified contract), gated on: (a) contamination audit with named, unnamed-algorithm, and formula probes in independent sessions, base and instruction-tuned separately; (b) the architecture-matched modern twin as comparator; (c) interface, revealed-method, and near-target reasoning controls; (d) a restricted executable language or audited translation so JavaScript fluency is not a confound. Entropy recovery is dropped as a concept-invention endpoint (Gibbs 1902 precursor; underspecified target). A null result is "this checkpoint under this protocol".

## 8. Design and statistics

- **Unit of analysis:** the independently generated world. Repeats within a world estimate within-world variation and are averaged.
- **Sample:** ≥32–40 worlds per primary condition for Claim A; repeats second. Power simulated for the hierarchical design from pilot estimates before the confirmatory run.
- **Contrasts:** pre-registered in the experiment config, paired by world, bootstrap CI over worlds. No automatic all-pairs testing. Multiplicity handled by naming ≤3 primary contrasts.
- **Effort metrics:** success-by-budget curves; censored time-to-success; no conditional medians.
- **Annotation:** two qualified reviewers examine *every* claimed out-of-library solution; blind to model, family, outcome; rubric with "unknown"; agreement reported.
- **Models:** ≥2 frontier families for Claim A; ≥3 sizes × 3 seeds for Claim B.

## 9. Pre-registration checklist (frozen per phase, before the confirmatory run)

Generator versions and rejection rules; families and sealed transfer family; structural train/test splits; exact model revisions, prompts, sample exposure, memory mode, output cap, retries, timeout/truncation/parse policies; library membership, budgets, and the criterion for declaring a baseline inadequate; primary endpoints and ≤3 contrasts with effect sizes; clustering model and multiplicity; development vs sealed sets; annotation rubrics and blinding; hint eligibility, continuation vs restart, confirmation criteria; Phase 3 gates; Phase 4 corpus seed, grammar filter, and audit procedure.

## 10. Order of work

1. Confirmatory k-curve (Phase 1), already runnable.
2. Phase 2 generator for compositional families only, with exhaustive conservation verification and the quotient-aware negative sampler; selftest proves it. Seal F-sealed.
3. Baseline library implemented and run on an audit corpus; leakage audit; library coverage table.
4. Phase 2 pilot (3 worlds × 2 repeats × 4 families, one model), development only.
5. Hint and post-mortem development on pilot worlds; scaffold frozen.
6. Phase 2 confirmatory grid, two models, F-sealed transfer.
7. Phase 4 corpus generator and grammar filter; in-toolkit control run; then out-of-toolkit runs and ablations.
8. Phase 3 appendix if the gates pass.
9. Write-up: Claim A and Claim B side by side.

## 11. Questions for the second review

1. Is "beyond the frozen library under budget" a claim a serious venue will accept as the primary result, and what library members are missing from §2?
2. Is restricting Phase 2 to monoid-homomorphism invariants too narrow to be interesting, and is there a sound way to readmit order-sensitive families with exhaustive verification?
3. Does the quotient-aware negative sampler (§3.4) close the coarse-invariant leak, or does it introduce a new fingerprint (e.g. negatives now have a characteristic structure)?
4. Phase 4: is a 20–150M model trained on 1–5B synthetic tokens capable enough that an out-of-toolkit null is informative, and what in-toolkit control performance should be the gate? What corpus design choices most threaten the "absent from training" guarantee?
5. Is the grammar filter + string audit sufficient to establish absence of the out-of-toolkit representation from the corpus, or can the representation be implicitly present (e.g. via worked solutions whose structure encodes a non-abelian product without naming it)?
6. Which of the remaining process measures (§5) would you drop entirely as un-interpretable, and which would you keep?
7. Rewrite the hostile referee paragraph for v2. What still stands?
