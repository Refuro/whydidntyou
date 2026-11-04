# Pre-registration: invariantGame

Status: B2 engineering registration, 2026-11-03. No model runs have occurred. The generator and wall controls have been exercised on development seeds 1 and 2. This document does not freeze a confirmatory experiment: B3 sealed construction, B4 portfolio challenge, B5 leakage audits, and a prospective timestamp/randomness manifest remain required. Future changes to this file are dated addenda only.

## The wall

The public task supplies 6–14 reversible string rewrites over 2–4 arbitrary letters and exactly 200 labeled training pairs. Every rewrite side has length at most three; the empty word is written ε. Two or three rules have explicit consequence paths using only the other rules. Rule order and symbol names are randomized.

The promise distribution contains connected positives certified by rewrite paths and disconnected negatives certified by unequal invariant values. Equal-invariant disconnected pairs are outside the promise. Accuracy is not an unrestricted reachability decision procedure.

Families admitted at this checkpoint:

- F-count: two-coordinate counts modulo 2, with symbol images in C2 × C2.
- F-abelian: products in C3 × C3 (the registered optional modulus is 2 or 3).
- F-nonabelian: S3, Q8, D4, and A4, using their full multiplication tables.
- F-monoid: dihedral permutations plus constant transformations on three or four points, with 9 or 12 elements. This is a registered small subclass of transformation monoids, not all transformations on those points.

The generated submonoid determines commutativity. Worlds with commuting images are classified as abelian, regardless of the ambient name. Constant invariants that cannot supply negative labels are explicit construction defects. No seed is redrawn until it passes.

## Conservation and identifiability

Verify closure, identity, and every associativity triple in the finite table. Fold symbol images from the identity. Verify each exposed rule equation exactly; associativity proves conservation in arbitrary contexts.

The bounded representation class is every assignment of the world's alphabet into the same ambient monoid, with at most 1,000,000 assignments. Keep assignments satisfying all public equations and 200 labels. Representations are equivalent when they induce the same equality relation on all strings: the canonical rooted transition graph of their reachable product states supplies the exact equivalence signature. Report both assignment and equivalence-class counts, occupancy, rule coverage, and the reference solver's information requirement. Ambiguous worlds remain visible and flagged; ambiguity is not silently repaired or excluded by an outcome-dependent retry.

## Submitted program and quantity contract

Programs define `reachable(a, b) -> boolean`. Every prediction runs in a fresh QuickJS/WASM state with the existing memory, stack, intrinsic, and deterministic-RNG restrictions. Inputs contain only the two strings. Administrative IDs, labels, and other pairs are withheld.

An optional `quantity(state)` function is evaluated in a fresh state for each string. Conservation is checked for every rule application with total left-plus-right context length at most three. This is bounded empirical evidence, not a proof. Compare induced equality partitions with the oracle partition, never raw output labels.

The separate proof route accepts a declarative `quantityFold = {table, identity, images}`. Its meaning is the host's registered fold interpreter. Its table laws and rule equations are checked exhaustively; this certifies that declared fold, not arbitrary JavaScript as an implementation of it. Supplying both a function and a declarative fold is refused to avoid an ambiguous quantity. Quantity validity and induced prediction accuracy are reported separately from the submitted classifier's accuracy.

## Success criterion

At least 95% accuracy on the frozen sealed pair set. Small-state and large-state accuracy and their difference are reported separately. A quantity claim additionally requires a conserved quantity and agreement of its induced partition on the registered check set; general proof and bounded evidence remain separate.

At B2, sealed pairs are absent and the production verifier fails closed. The wall selftest explicitly uses calibration pairs and labels its output `calibration-wall`. Its results are engineering evidence only. B3 must register the final support, quotas, nuisance constraints, histogram ceiling, joint-feature ceiling (τ = 0.70), rounding, and defect disposition before any model run. F-count and F-abelian histogram challenges are inapplicable controls.

## Calibration and budgets fixed at B2

The development wall uses seeds 1 and 2 for each of the eight algebra variants. Each world has 80 calibration pairs: 40 small and 40 large, balanced within each group. Initial random string lengths are 4–10 and 96–128; walks use 8 and 32 steps with maximum resulting lengths 24 and 160. Identity padding for order witnesses may slightly extend initial lengths. Half of the noncommutative negatives use a fixed noncommuting symbol-pair witness with identity padding. Other negatives draw independent strings until an invariant inequality is found, with at most 256 proposals. These calibration choices do not certify the B3 joint-feature ceiling or nuisance matching.

Three controls run before any model:

- Reference: oracle table and symbol images; product equality. Must pass all families, prove conservation, and match partitions.
- Count nullspace: Gaussian elimination of public rule count differences over F2 and F3, followed by equality of all nullspace coordinates. Must pass count/abelian controls and fail the noncommutative wall.
- BFS: public rewrites only; FIFO search, at most 128 visited strings, 4,096 candidate positions per pair, and length slack six. Must fail large calibration pairs. This result is specific to that explicit search budget.

Each control has a 20-second total sandbox evaluation budget per world. The count solver's host preparation uses only the public alphabet and rules; the reference alone receives secrets. The B4 portfolio will provide the broader challenged solver comparison and resource curves.

## Key moves

- KM1: seek a quantity preserved by every rewrite, rather than enumerate rewrite paths.
- KM2: use training labels to constrain which conserved quantities retain the distinctions needed for classification.
- KM3: for noncommutative worlds, preserve symbol order through product state; a histogram alone loses required distinctions.
- KM4: validate the proposed algebra and every rule equation, then distinguish a finite-state fold proof from a short-context check.
- KM5: transport the construction procedure to fresh worlds under the eventual registered adaptation budget, rather than copy a fitted table.

## Predictions

- P1: the reference exceeds the sealed threshold in every construction-valid world because labels are certified by the same invariant; the independent B3 checker must verify this without trusting the generator.
- P2: the count-nullspace control passes count/abelian worlds and falls below 95% on the noncommutative diagnostic wall.
- P3: bounded BFS falls below 95% on large states under its registered budget.
- P4: asking for a quantity changes behavior and must be analyzed as a prompt intervention, not as a neutral formatting request.
- P5: identifiability flags and rule coverage predict some fitting failures; reference success alone does not establish learnability from public evidence.

## Confounds to watch

- Familiar presentations, rule statistics, or pair nuisance features may identify the family or label. B5 audits remain mandatory.
- The calibrated order witnesses demonstrate failure of registered count controls; they are not a final finite-set certificate against all joint-feature classifiers.
- A table-fitting method may be retrieved from prior knowledge. All claims remain Claim A portfolio/resource comparisons, never invention or prior absence of capability.
- Pure quantity outputs follow from fresh evaluation; completion still depends on the cooperative wall-clock interrupt.
- The identifiability class fixes the ambient monoid. Uniqueness inside it is not uniqueness across all representations.
- The small transformation-monoid subclass and the explicit BFS cap limit generality. B4 challenge and budgets must be reviewed before a freeze.

## Addendum 2026-11-03 — author decisions before the B2 review

DECISIONS-B2.md is binding unless the pending B2 review overturns a decision. The author confirmed that B3 remains gated on that review. This addendum supersedes the earlier ambiguity disposition and clarifies the existing output conditions; it does not expand the family, alphabet, support, or budgets.

- Primary stratum: repeat 0, one binary slot-procedure outcome per seed. Repeats 1..r are exploratory within-world variability and are never pooled as worlds. Primary paired contrasts also use repeat 0 only.
- Sampling population reference: M=2^32. Eligibility is deterministic in the seed, defining a fixed eligible subset M_C. For n<=100, the registered finite-population approximation assumes M_C>=10^6 and uses two decimal places in percent. Proposal/eligible-count estimates produce a second, explicitly plug-in sensitivity figure; they do not establish the true M_C or its lower bound.
- Provider randomness: one independent Bernoulli slot-procedure draw per seed under the registered protocol. For fully resolved zero successes, the mean-of-products argument gives P(zero)<=(1-mean p)^n. Hypergeometric inversion remains a numerical reference; no exact fixed-K identity is claimed for stochastic decoding, and the zero-success argument alone is not a positive-count coverage proof.
- Non-identifiable worlds: construction defects, excluded before assignment with seed and reason non-identifiable, never rerolled. The generator now throws a typed defect carrying its audit (generator version invariantGame-v1-b2.1). B3 must persist that defect in its proposal ledger.
- Unrestricted output evaluates only the classifier. Quantity-requested requires the classifier plus either a functional quantity or a declarative quantityFold. Functional quantities receive bounded empirical conservation over total surrounding-context length <=3; only the declarative route is proved. Both forms together remain invalid. Extra single-form declarations in the unrestricted condition do not add a quantity endpoint.
- The current monoid subclass, 2–4-letter class, BFS limits and sandbox budgets are accepted starting registrations. Expansion requires a dated amendment before freeze and is allowed only if the B4 portfolio solves every registered family. The independent B4 challenger may propose budget increases before freeze; no post-freeze change is allowed.
- Decimal master text remains required. Future freeze manifests must record both original public-source hex and its deterministic canonical big-integer decimal conversion.
- B3 must add validated batch resume with resumedFrom bound to the prior batch-state digest. Inconsistent batches must be abandoned and recorded in the freeze's batch-disposition log. B3 and the B4 review stop remain gated as stated in DECISIONS-B2.md.

## Addendum 2026-11-03 — B2 review closure and B3 construction registration

This pre-freeze amendment retains historical B2 worlds under `invariantGame-v1-b2.1` and introduces `invariantGame-v2-b3`. No confirmatory outcomes have been collected.

- Images: independent uniform choices in the registered ambient table, using a domain-separated SHA-256 stream with rejection to remove modulo bias. Sampling is computational under the registered seed assumption. Each seed proposes one complete assignment; construction failures are not redrawn. Conditional on admissibility the assignment law is uniform under that assumption. Commuting generated images are classified as abelian. Public alphabet order uses a separate stream; canonical symbol sorting is used internally for order-invariant public statistics. Overrides are excluded from registered corpora.
- Construction: record each proposed seed and its final eligibility/construction disposition before any portfolio solver runs. Unavailable assignment counts are explicit nulls with a defect reason, never invented zeros. Eligibility requires the conservation/certificate construction and public identifiability checks; sealed construction follows that calibration stage.
- Bounded challenge support: all nonempty strings of length <=4; 12 seeded eight-step rule walks per start, remaining within length four; all ordered pairs with unequal invariant values supply negative candidates. Retain classes containing both labels under the joint coarse-feature AND exact nuisance tuple, in a seed-permuted order capped at 32 classes. This deterministic restriction is part of the registered support, not a claim of infeasibility on all strings. Include each retained pair with an identity prefix of length >=96 for the large stratum; inability to construct that padding is a defect.
- Joint features: every proper two-sided congruence of the ambient finite table, jointly with exact ordered symbol-count vectors (which include all modular count features). The trivial quotient is included; the full identity congruence is excluded. Nuisance tuple: ordered lengths, histogram L1 distance, Levenshtein distance, LCS.
- LP: nonnegative support weights; each label mass 1/2; each size stratum mass 1/2; exact positive/negative nuisance-class balance; per joint-feature class t_z >= each label mass; sum t_z <=0.70. A two-phase simplex maximizes the minimum support weight to retain diversity, with 10,000 pivots. Rounding uses largest remainders by label and scale to 200 pairs. Independent realized-count checks enforce U_hist<=0.70, joint ceiling<=0.70, exact nuisance matching and conflict witnesses; any failure is a defect, not repaired. Natural sealed sampling is also retained; count/abelian controls use natural sampling only and mark the histogram challenge inapplicable.
- Inference supersedes the earlier diagnostic wording: resolved zero-success evidence uses the mean-of-products/provider zero-success upper bound. Positive or unresolved counts have inference unavailable and the trivial upper bound 1. Hypergeometric and plug-in figures have inferentialValidity none; completeness is not an inference license.
- Recovery: receipt raw text/usage is durable before parsing/scoring; replay deterministically rescores it. Registered source/config identity and preassigned run IDs bind resume; repeated completion is a no-op, inconsistent evidence receives a separate durable abandonment record.

Rounding numeric tie convention (same pre-freeze addendum): fractional remainders within 1e-8 are tied and resolved by support index. This prevents floating-point noise from assigning different multiplicities to algebraically equal matched-label weights; the realized independent check still fails closed.
