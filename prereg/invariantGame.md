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
