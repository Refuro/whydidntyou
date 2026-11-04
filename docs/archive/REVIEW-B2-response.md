# Package A / B2 implementation review

Reviewed 2026-11-03: `7bcb668..953c16e6c0edd859f1edfdac79120a181590175c`, including the decisions follow-up to `08d6ca0`, against `BUILD-PROMPT-v1.md`, the updated `REVIEW-PROMPT-B2.md`, and `DECISIONS-B2.md`.

**Disposition: hold the B3 handoff for three demonstrated implementation repairs: contract-bound success validation, the master length limit, and certificate-free identifiability input. After those repairs, proceed with B3 engineering and retain the B4 review stop. No confirmatory statistical claim is approved.** The B1 algebra and B2 calibration wall reproduce. The follow-up correctly implements repeat-0 analysis, quantity conditions, and early non-identifiability rejection. Its statistical labels acknowledge the remaining coverage limitation; they do not remove it.

The working files changed during inspection, so I exported committed snapshots, reviewed the subsequent delta, and reran checks at `953c16e`. Findings and line references apply to that final snapshot, not subsequent uncommitted work. All source hashes in the author's `SELFTEST-B2-decisions.json` match it; the original `SELFTEST-B2.json` correctly remains historical.

Validation: **55/55 shipped tests passed**, including the ordinary invariant wall, decisions fixtures, and schema-5 adaptation. Additional checks produced 34 passes, three demonstrated implementation/integration failures, and four descriptive or numerical observations. The additional script made no network requests and instantiated no WebAssembly. The shipped tests did execute their ordinary reference, quantity, count, and BFS solvers. I did **not** run `src/selftest.js` or the aggregate `npm run selftest`, because those execute historical adversarial regressions covered by the user's earlier restriction. That compression-isolation acceptance item remains supported by the author's evidence, not independently rerun here.

Evidence: `REVIEW-EVIDENCE-B2.json`, `REVIEW-CHECKS-B2.mjs`, and the pinned-snapshot test output `REVIEW-TESTS-B2.txt`. No project implementation, preregistration, or historical artifact was edited.

## 1. Findings and required disposition

### [P1] Bind success evaluation to the assigned domain contract

**Package A acceptance 3; `src/sandbox.js:103`, `src/validate.js:102`, and the result path through `validateBatch`.** `isSuccess` selects the threshold using the result's own `contract` field. The compression result validator does not reject an incompatible tag or additional reachability fields.

The ordinary synthetic-record fixture `records/compression-result-contract-confusion` demonstrates:

1. A compression result has correctly calculated `bits`, length, reference values, and ratios, with `ratioToBaseline: 1`. It is a compression failure.
2. Adding `contract: "reachability"` and `accuracy: 1` makes `isSuccess` return true without improving compression.
3. With end and terminal summaries derived from that result, **`validateBatch` accepts the compression slot as a success**.

This is a record-consistency defect, not a claim that an executable submission fooled the compression verifier. The fixture constructs a result record without running submitted code. It exposes a new way for an inconsistent score record to select its own success rule.

**Required fix:** take the contract from the regenerated domain instance, require the result variant to match it, validate its fields, and evaluate success using that trusted contract. Reject a reachability result in a compression run even when all compression arithmetic is valid. Also reject impossible parse/result combinations, such as a response without code paired with a successful execution result. Add a failing compression control, a passing compression control, the incompatible-tag fixture, and a genuine reachability control before wiring the invariant domain into the model loop.

### [P2] Decision 2 is implemented as a diagnostic, not a finished confidence procedure

**Package A acceptance 4; Decision 2; PLAN §§4.5 and 8; `src/bounds.js`.** The follow-up faithfully separates the justified fully resolved zero-success bound from the hypergeometric numerical reference. It labels proposal-count estimates as plug-in diagnostics and explicitly declines fixed-K and positive-count coverage claims. Those changes are correct. The remaining objection concerns what may be reported as confirmatory inference: declaring fresh provider randomness to be an independent Bernoulli draw per seed does not create a fixed population containing `K` successes.

An exact simple counterexample uses the *same* success probability `p` at every seed. With independent provider randomness, responses are iid Bernoulli(`p`) even when seed labels are sampled without replacement. Their success count is binomial, not hypergeometric. At `n=100`, zero successes, and `M=2^32`, the implementation gives:

| Quantity | Value |
|---|---:|
| Registered hypergeometric upper limit | 0.029513049172237515 |
| Binomial upper limit | 0.029513049607039935 |
| Choose true `p` between them | 0.029513049389638724 |
| Probability of zero successes, `(1-p)^100` | **0.050000001120062525** |

The probability of excluding the true `p` exceeds 5%. At `M=10^6`, the same construction gives 0.05000528011782278. These are tiny discrepancies. They demonstrate why the follow-up's refusal to claim exact coverage is necessary, not a practical failure newly discovered in its numerical inversion.

Decision 2's mean-of-products argument **does** justify the stated binomial zero-success bound under uniform subset sampling and independent per-seed decoding. It does not justify the tighter hypergeometric limit. Nor does a zero-count proof settle positive counts such as `s+u` when evaluations remain unresolved.

The eligible-population approximation also remains conditional on an unestablished premise. Deterministic eligibility makes the subset fixed; it does not prove `M_C ≥ 10^6`. The follow-up correctly says that proposal/acceptance estimates do not establish this lower bound. Current `constructionCounts` are derived from the all-assigned validated grid rather than editable summaries; that is appropriate for today's preflight-or-refuse runner. Once B3 introduces exclusions, those counts must instead come from the full proposal/defect ledger, with construction-valid eligibility distinguished from earlier calibration eligibility.

I checked the numerical scale of the proposed approximation: comparing `M=10^6` with `2^32`, at alpha .05, for every `1 ≤ n ≤ 100` and `0 ≤ count ≤ n`, the largest difference was **0.00000507747 in rate**, or **0.000507747 percentage points**. This is below a 0.01-percentage-point display increment. Nevertheless, 147 comparisons rounded to different displayed values because they crossed rounding boundaries. This endpoint comparison is not a proof for every intermediate population or an estimate of your actual eligibility rate.

**Before confirmatory use:** promote `providerRandomness.zeroSuccessUpperBound` to the inferential result when `s=u=0`; it does not require estimating `M_C`, provided the sampling and independence premises hold on the eligible population. For positive `s+u`, either register a valid procedure or explicitly return inference unavailable (a trivial upper bound of 1 is also valid), while keeping the numerical references as diagnostics. Rename the remaining machine-readable `conservative` field or add an explicit inferential-validity status: its value is still the hypergeometric reference, and `gate.passed` only checks completeness. Completeness must not be interpreted as validating positive-count coverage or the eligible-population premise. This unfinished inference decision need not block B3 sampler engineering, but it does block the corresponding population claim.

### [P2] Make the decimal master limit compatible with Decision 3

**Package A acceptance 1; Decision 3; `src/validate.js:54`.** Decimal text is a reasonable canonical representation. The current limit of 64 decimal digits does not implement the proposed conversion of arbitrary 64-character hexadecimal randomness.

The fixture converts 64 hexadecimal `f` characters to canonical decimal text. The result has **78 digits**, and `drawSeeds` rejects it. This is a representation mismatch, not a demand to accept hex directly or a statistical attack on SHA-256.

**Required fix:** keep decimal-only input, but size the documented bound to the selected randomness source's full output, or register an explicit extraction rule before the randomness arrives. Preserve the original source bytes and canonical decimal text in the manifest. Test zero, leading-zero aliases, the largest supported source value, and exact conversion beyond JavaScript number precision. Do not improvise truncation after obtaining a pulse.

### [P2] Separate public identifiability constraints from private certificate coverage

**B1/B2 acceptance 3–4; `src/domains/invariantGame.js:69–82`.** The enumeration's constraints correctly use only rule equations and labeled examples. However, the same function subsequently reads `p.certificate.path` to calculate coverage. Calling it with `publicEvidence(inst).trainingPairs` throws `Cannot read properties of undefined (reading 'path')`.

This does not invalidate the returned class counts for the 16 internal worlds, and it does not mean private certificates were used to filter assignments. It means the purported public-evidence audit cannot run on the public-evidence representation. That is an avoidable trap for the independent B3 checker and B4 solver challenge.

**Required fix:** make the constraint/enumeration operation accept certificate-free public examples. Compute private path-coverage diagnostics separately, or explicitly return unavailable coverage when certificates were not supplied. The assignment and equivalence-class counts must be identical with certificates present, absent, or altered. Add that fixture and retain the ambiguous-evidence control.

## 2. Package A acceptance results

| Item | Review result |
|---|---|
| A1 exact input and bit convention | Correct literal UTF-8 string `whydidntyou-seed-draw-v2\|<master>\|<counter>`, counter starts at zero; `readUInt32BE(28)` matches the low 32 bits of the SHA-256 integer. |
| A1 lists and duplicates | Both stored 40-seed lists independently regenerated; first seeds are 471087916 and 1284684434; overlap is zero. A 100,000-seed check using master `"0"` encountered and skipped one duplicate, consuming 100,001 counters. |
| A2 restart chains | Shipped interruption/completion/setup/missing-end fixtures pass. Indices are contiguous, completed/setup-failed executions terminate the chain, only interruptions authorize successors, and index 2 exhaustion is unresolved. Run IDs and terminal-chain references are checked. |
| A2 outgoing requests and resources | Outgoing requests are written before the transport callback. Discarded attempts remain in the chain; unreceived usage remains unknown. Known token/cache fields and seconds are recomputed, and forged summaries refuse. |
| A3 request binding | Hint, scaffold, memory, feedback, prompt-builder hash, metadata, and slot fixtures pass. Correct treatment controls pass. Slotted postmortems use the same batch binding. |
| A5 numerical implementation | Small-population exact combinatorial coverage checks, the `79/77/2` example, large-population inversion boundaries, invalid-input checks, and no-resolved-data behavior pass. This validates the fixed-outcome calculation, not Decision 2's stochastic interpretation. |
| A5 missingness and contrasts | Unknown arms produce sample identification bounds; unavailable outcomes are not silently discarded. Repeat 0 is primary in both condition tables and contrasts; later repeats are exploratory. Opposing later-repeat effects cannot change the primary contrast. |
| Historical constraints | No changes to files in `docs/archive/`, `runs/exploratory/`, or pre-existing preregistrations in the reviewed range. `prereg/invariantGame.md` is the explicitly requested new file; the follow-up appends a dated addendum. `src/selftest.js` and the dependency lockfile are unchanged. |

Two further implementation points belong in B3's recovery work:

**Persist receipt before scoring.** In `run.js:47–58`, the received raw response and usage are not written until after parsing, scoring, and record validation. A process death in that interval leaves a durable record saying only “dispatched,” and `readLog` interprets it as an unreceived-response interruption. Thus outgoing-request durability is established, but receipt durability is not. Register separate received-but-unscored evidence, save the response before evaluation, and specify whether recovery rescores it or marks it unresolved; do not silently represent a known received response as unreceived. A fixture can simulate this interruption at the writer boundary without any adversarial program.

**Recovery must distinguish partial validity from readiness to analyze.** `validateBatch` can return missing terminals so that conservative diagnostics can be generated; the confirmatory reporter refuses an unfinished assignment. Decision 8 must not turn a partial batch into permission to rerun completed slots or discard existing logs. In particular, account for an interrupted driver after a log was written but before its `slot-execution` record was appended.

The original plan edits concern §4.5, §5, §8, and one terminology replacement in the historical §13 bullet. The decisions follow-up additionally changes §§2, 3.2, 3.3, and 3.6, plus the endpoint/sampling wording in §§4.5 and 8; these implement the binding decisions rather than expand the research claims. The §13 terminology edit is consistent with the instruction to remove “independent draws,” but is not separately enumerated in `BUILD-NOTES.md`; add it to the edit list. Reconcile the older statement that mixed/resumed batches are refused when Decision 8 is implemented.

## 3. B1/B2 acceptance results and limits

**Finite algebras and conservation pass.** I independently checked all 64 Q8 products using Hamilton quaternion multiplication, rather than the builder's basis/sign tables. The permutation and transformation tables match explicit composition on their represented points. All eight variants satisfy exhaustive closure, identity, and associativity checks. The three/four-point transformation subclasses have the declared 9/12 elements.

For all 16 development worlds I independently replayed positive certificates and consequence-rule certificates, checked every negative invariant inequality, verified rule count/length constraints, checked invariance under symbol renaming, and replayed certificates after reversing rule order. The all-context argument is sound: the submitted finite-table fold is a homomorphism, and equality of each rule's two products is preserved by multiplication on the left and right.

**Identifiability counts pass within the registered class.** Independent enumeration retained exactly the same assignments after applying the public rules and 200 labels. I grouped them using a product-graph equivalence check, separate from the builder's canonical signature, and obtained the same single kernel class in every final wall world. Canonical rooted transition graphs are appropriate here: with fixed edge labels and root, their isomorphism preserves precisely which words reach the same product state. This is an exact statement about assignments into the specified ambient table, not about all possible representations. The existing ambiguous-evidence and commuting-subgroup tests pass.

**The public projection removes the listed private fields, but presentation still reveals structure.** `publicEvidence` strips secrets, certificates, decoy annotations, calibration pairs, and administrative IDs. Nevertheless, `make` assigns the registered generator images to the first alphabet positions (`invariantGame.js:89–90`), and the public view preserves that ordered alphabet. With two letters, the image tuple is fixed for each ambient variant across successfully constructed seeds. With the default three-letter monoid worlds, all three image slots are already filled by the fixed generators.

This is not an accidental secret-object export. It is a low-cost family of template solvers implied by the generator's public ordering convention. **Add a B4 baseline that enumerates the registered ambient templates and positional image assignments, uses only the public rules/labels to select one, and reports its fitting cost.** Also test an independent permutation of the public alphabet listing while preserving the underlying task. The 16-world wall does not demonstrate substantial latent invariant diversity, and shuffling letter names alone does not remove this convention. Any change to the latent-image sampler should be a documented pre-freeze generator amendment, not a silent repair to historical worlds.

**Verifier structure is consistent with the declared proof distinction.** Every classifier pair and functional-quantity state goes through a fresh `runProgram` call; source inspection shows each call creates a fresh runtime/context. Equality partitions are compared through both forward and reverse maps, rather than by raw labels. The bounded context set contains every split with total surrounding length at most three. The declarative route validates the finite table and rule equations and evaluates the fold on the host; this proves that declarative quantity, not an arbitrary JavaScript function. The tests exercise renamed quantity values and constant partitions. Missing sealed pairs refuse before any submitted code is called. I did not conduct new state-channel or adversarial runtime probes.

**The calibration numbers reproduce.** The shipped wall test passed under its registered sandbox budgets. An additional host-side calculation of the same trusted control algorithms matched every stored world digest and accuracy:

| Variant | Count solver, seed 1 | Count solver, seed 2 | Reference | BFS, large pairs |
|---|---:|---:|---:|---:|
| F-count | 100% | 100% | 100% | 50% |
| F-abelian | 100% | 100% | 100% | 50% |
| S3 | 65% | 62.5% | 100% | 50% |
| Q8 | 75% | 73.75% | 100% | 50% |
| D4 | 71.25% | 67.5% | 100% | 50% |
| A4 | 68.75% | 73.75% | 100% | 50% |
| Transformations on 3 points | 50% | 50% | 100% | 50% |
| Transformations on 4 points | 68.75% | 50% | 100% | 50% |

These reproduce B2's engineering claim. The host-side calculation does not independently reproduce WebAssembly timing. The BFS wall is specifically a 128-node / 4,096-candidate-position / length-slack-six wall; candidate positions include unsuccessful match checks. It provides no evidence against search at a larger budget. Keep visited nodes, tested positions, maximum depth, budget-exhaustion frequency, and resource curves in the B4 challenge. Similarly, the count control's failure is not a ceiling against all histogram or joint-feature classifiers; B3 must calculate those ceilings independently.

## 4. Disposition of the eight decisions

1. **Repeat 0 primary: accepted and implemented in the follow-up.** Both per-condition analysis and the primary contrast use repeat 0. My fixture with a +100-point contrast at repeat 0 and a −100-point contrast at repeat 1 now reports +100 points as primary and keeps the later stratum exploratory. The corresponding shipped test and report-label checks pass.

2. **Population/decoding decision: accept the follow-up's diagnostic interpretation, not a general confidence claim.** The zero-success field and the positive-count/plug-in caveats faithfully implement the requested distinction. Complete the inferential-status separation in finding 2 before confirmatory use. The conditional target and the distinction between construction defects and evaluation interruptions remain essential.

3. **Canonical decimal masters: accepted; current length limit must change.** Keep exact string hashing and record source hex plus decimal. Fix the demonstrated 78-digit conversion failure before committing to the public-randomness manifest format.

4. **Initial algebra/alphabet class: accepted for B3 and B4 engineering.** The finite-table proofs and bounded identifiability class are sound at this scope. Keep the explicit subclass description, the template baseline above, and the independent challenger. Expansion remains a dated pre-freeze amendment under the author's stated rule; the current class is not evidence about arbitrary transformation monoids.

5. **Quantity routes: accepted; condition enforcement is now implemented.** The follow-up requires one quantity form in the quantity-requested arm, refuses both forms together, evaluates only classifier accuracy in the unrestricted condition, and labels functional conservation as bounded empirical evidence. The new tests pass. Classifier accuracy still determines the generic `success` field, so future model-loop integration must keep raw classifier success and certified quantity success separate; the presence of a quantity alone is not a valid conserved-quantity certificate.

6. **Budgets: accepted as starting budgets, not calibrated difficulty claims.** B4 may challenge them before the freeze. Record preparation and scoring costs separately and include the primitive-operation accounting described above; retain all challenged budget settings rather than publishing only the one that preserves the wall.

7. **Non-identifiable worlds as construction defects: accepted; early rejection is implemented, ledger persistence is pending.** The follow-up throws `ConstructionDefect(seed, 'non-identifiable')` with its audit and bumps the generator version; the dated preregistration addendum correctly supersedes the earlier flag-only disposition. B3 must preserve every excluded seed, requested family, effective classification, assignment/class counts, and reason in its durable ledger. Report acceptance rates by family; do not replace defects until a convenient accepted sample appears. This selection changes the target distribution and feeds directly into Decision 2.

8. **Validated recovery before confirmatory operation: accepted and required.** The command should validate a partial prefix, retain the prior state digest in `resumedFrom`, preserve all dispatched/received work, and resume only unfinished slots under the same indices and budgets. Test repeated resume, interruption after terminal completion, orphan logs, partial final records, changed source/configuration, and receipt-before-score failure. An inconsistent batch is abandoned with a recorded disposition, not repaired by dropping evidence. Resume must be idempotent.

## 5. B3 entry and B4 exit conditions

Before starting B3, repair contract-bound success validation, reconcile the master representation with the chosen randomness source, and separate public identifiability from private path coverage. Add the demonstrated record/public-input/master fixtures and rerun the ordinary test suite. These changes do not require expanding the experimental scope. The statistical-reference work may remain explicitly nonconfirmatory while B3 is built.

During B3, preserve the now-implemented repeat-0 and quantity-condition rules, implement the durable defect ledger and recovery, and derive proposal/eligible counts from that ledger. Include receipt durability in recovery. The source-independent checker must recompute certified labels, conservation, nuisance constraints, and both realized feature ceilings after rounding. Do not use the B2 wall scores as substitutes for these certificates.

Before accepting B4, require the complete challenged portfolio, the ≥200-world-per-family coverage audit, all construction-defect counts, the positional-template control, and the declared budget/resource curves. Preserve the stop at `REVIEW-PROMPT-B4.md`. No real-model pilot or Phase 4 work is authorized by this review.
