# Second review: whydidntyou, Plan v2

Reviewed on 2026-11-03 against the local `LLMBreakthroughs` working tree. The reviewed [PLAN.md](C:/Users/Refur/LLMBreakthroughs/docs/PLAN.md) has SHA-256 `8F0B4AD1ECF0388CE43C25915626BB7E04ACBF3B19A43269B5579552EA7F688A`.

I read the full plan and the four requested implementations, checked their callers and supporting documentation, ran the shipped self-test, and ran targeted offline reproductions. Hint-loop tests used the mock backend in a separate working copy. No paid model calls or GPU training were run. Proposed generator and training guarantees are assessed as specifications, not as implemented results.

## 1. Does v2 answer the hostile referee paragraph?

**Partly. Claim A is now potentially defensible; Claim B reinstates the original identification error under a stronger-sounding premise. Several claimed implementation repairs are also incomplete. Do not start the nine-run Phase 4 grid under the present claim.**

The promise-distribution semantics in §3.1 answer the reachability objection. Restricting the generator to actual monoid homomorphisms in §3.2 provides the right mathematical route to contextual conservation. The expanded baseline library, removal of the novelty dial, separation of quantity-requested prompting, and demotion of Phase 3 address specific v1 objections. Those objections should not simply be repeated as if nothing changed.

The remaining hostile referee paragraph is:

> The revision replaces its unsupported invention claim for frontier models with a benchmark against a designer-selected solver library, but retains an unsupported invention claim for synthetic-trained models. Knowing all training documents does not identify the algorithms or representations learned by the model, and excluding a representation from a document grammar does not prove its absence from the model’s capabilities. The proposed out-of-toolkit certificate is not a language non-expressibility proof; its quotient-aware sampler is impossible for some admitted groups and fails to account for combinations of quotients. The model is trained on commutative solutions and tested on order-sensitive ones without sufficient controls for output-language competence, sequence processing, or general distribution shift. Literal reuse of a fitted invariant across systems with new hidden symbol assignments is undefined as a meaningful transfer test. Moreover, the repaired verifier still accepts a zero-bit side channel, post-mortems still receive summaries, and the statistical report retains invalid population intervals and conditional effort summaries. This could become a controlled study of algorithmic generalization, but the present design cannot establish construction outside a known internal toolkit or support the planned interpretation of a null result.

### The two-claim structure needs a different boundary — §§0, 4.1, 4.5

Keep two experiments if useful, but make their claims:

- **A:** performance and resource comparisons against a specified, independently challenged solver portfolio on a specified task distribution.
- **B:** generalization from a fully documented training distribution, with a causal comparison of exposure to specified solution families and a formal certificate that a submitted solution lies outside a specified restricted language.

Neither establishes that the model lacked a corresponding internal procedure before the test. A model can infer procedures during training that no training document explicitly demonstrates. That is precisely why corpus provenance is valuable, but it is not a complete inventory of learned capabilities.

Separate three propositions throughout the paper: **no explicit target demonstration in training**, **submitted behavior outside language L0**, and **target capability absent from the trained model before testing**. The first two can sometimes be established. The third is not implied by them.

### Further gaps that affect both claims

**Accuracy is not a test of method identity (§1.2).** Two solvers can have identical accuracy for different reasons; the same method can have different accuracy because of search bounds or implementation errors. Report portfolio performance separately from a semantic analysis of the submitted program. If the registered language permits arbitrary loops, tables, and branching, “outside the language” may be false for every computable target under consideration. Specify a genuinely restricted language and its resource bounds.

**The maximum library score is an oracle portfolio unless selection is implementable (§2).** Selecting the best solver separately for each world using sealed labels gives the portfolio information unavailable to the model. This is a useful strong comparator if explicitly labeled, but also report a selector that chooses using only the public rules and training pairs. Do not choose or modify algorithms using sealed scores. Specify whether the portfolio gets one total compute budget or one budget per member.

**Frozen quantity reuse is underspecified (§§1.4, 3.7, 4.4).** A correct quantity fitted to one world contains that world’s symbol images. Fresh worlds redraw those images, so the literal function usually should fail conservation. Distinguish additional test pairs in the same world, transport under a supplied symbol/algebra isomorphism, and reuse of a frozen constructor that fits a new quantity from new rules. Register which parameters may be refitted, what evidence is available, and the adaptation budget; compare against fitting from scratch. A failure of an old parameterization on a new world is not a failure of abstraction.

**The confirmatory claims are ahead of the artifacts (§§3.3, 6, 9–10).** I found no `prereg/sealed/` directory in the reviewed tree and could not establish the stated `confirm-phase1` tag from the inspected local references. If commitments exist elsewhere, identify their hashes and timestamps. A developer who chooses the sealed family already knows it; keeping a file unopened does not erase that knowledge. Use an independent custodian or disclose designer knowledge and freeze the family, sampler, library, and scaffold before access to confirmatory outcomes.

## 2. Answers to the seven questions in PLAN.md §11

### 11.1 — Is beyond a frozen library publishable, and what is missing from §2?

**It is an acceptable empirical claim, not by itself a sufficient contribution.** A weak library makes the result trivial; a benchmark made harder until the library fails makes the result conditional on that selection procedure. Publish the coverage table, all evaluated worlds, solver failure modes, and resource curves. Keep a general-distribution result separate from a deliberately library-resistant challenge set. A nonsignificant comparison also does not establish that the model does not exceed the library; register an effect-size margin and a non-superiority/equivalence procedure if that is the intended negative conclusion.

At minimum add or explicitly cover these baselines:

1. **Finite-monoid constraint synthesis.** Infer symbol transformations or a bounded multiplication table with SAT/SMT/CSP constraints for closure, associativity, identity, rule equations, and labeled examples. Group-only search is not the natural strongest baseline for F-monoid.
2. **Joint features and quotient products.** Combine all registered coarse invariants, rather than comparing against each separately. Their tuple can recover information that no single quotient preserves.
3. **A genuinely general finite-state inference baseline.** State whether it learns the full string-product state or only a single point’s image. A transformation on q points is determined by all q images. There are at most q^q transformations: 27 at q=3 and 256 at q=4. The full product can therefore be tracked by a finite automaton with at most that many reachable states. A transducer bound below the represented algebra’s size needs justification.
4. **Constraint-guided search in a registered program grammar.** Include a solver that generates candidates from relations and counterexamples. Pure enumeration is an unnecessarily weak version of synthesis.
5. **Non-invariant classifiers and stronger search controls.** Include the nuisance-feature models as scored baselines, along with bounded bidirectional search and normalization/canonical-form methods where applicable. They can solve the promise distribution without reconstructing the planted invariant.

The corpus-controlled study must also be positioned against algorithmic-generalization research, not only frontier-model discovery benchmarks. Transformers have already been trained to simulate finite automata through learned parallel computations. Merely training a small model to evaluate a noncommutative finite-state process would not be a new invention result; synthesizing a reusable solver under a clearly withheld training regime is the potentially distinct question. [Liu et al., Transformers Learn Shortcuts to Automata](https://arxiv.org/abs/2210.10749)

**Test before model collection:** have a solver author who did not design the generator attack representative development worlds under the registered budgets. Freeze the portfolio only after that challenge, and keep the confirmatory worlds untouched.

### 11.2 — Are monoid homomorphisms too narrow, and can order-sensitive families return?

**They are not too narrow for a controlled algorithm-learning experiment. They are too narrow to support broad claims about scientific concept invention. Order sensitivity is already present in noncommutative monoids.**

There are sound ways to recover some excluded examples without leaving finite-monoid semantics:

- **Alternating weighted sums.** Store both length parity and alternating sum: I(s)=(epsilon(s),a(s)), with epsilon(s)=(-1)^|s| and a(s) the alternating symbol-weight sum modulo m. Concatenation obeys `(epsilon,a) * (delta,b) = (epsilon*delta, a + epsilon*b mod m)`. This finite associative summary handles the context’s parity shift. Equality of the entire summary on each rule, not just the sum, gives conservation.
- **Counts of a fixed pattern modulo m.** Store the count, the prefix and suffix up to pattern-length minus one, and capped length information. Concatenation computes crossing-boundary occurrences from the boundary summaries. This yields a finite summary monoid. Rules must preserve the augmented summary for this construction to establish conservation.

These constructions deliberately preserve more than the original scalar feature. They may leave few useful rewrite rules or create extra shortcuts; audit that rather than calling them automatically valid benchmark families. More generally, a finite-state summary can support exhaustive equivalence checks over reachable summary states.

**The verification sentence in §3.2 remains wrong if read as a proof method.** Testing contexts only up to the rewrite-rule length is not generally exhaustive. A long word can reach an algebra state that no context that short reaches. For a generated finite monoid, verify closure, identity and associativity, define the map as a fold of the symbol images, and check every rule equation. The homomorphism argument then proves conservation in all contexts. Alternatively, enumerate all reachable monoid states and all left/right summary contexts; do not substitute a short-string cutoff for that proof.

Also distinguish conservation from identifiability. Six to fourteen short relations may admit many inequivalent representations, and a valid invariant need not be recoverable from the exposed evidence. Audit ambiguity, useful rule coverage, reachable-state occupancy, and the reference solver’s information requirements per world.

### 11.3 — Does the quotient-aware sampler close the leak?

**No. It is sometimes infeasible, has inconsistent thresholds, and ignores combinations of quotients.**

Here is a direct counterexample to the universal guarantee. Let the invariant group be `C2 × C2 × C2`, which is allowed by F-abelian. It has seven order-two subgroups, each consisting of zero and one distinct nonzero vector. Quotienting by any of these subgroups is a proper quotient. For a negative pair with distinct group values a,b, that quotient merges the values exactly when their nonzero difference a-b lies in its kernel. Each nonzero difference belongs to exactly one of the seven kernels. If every quotient must mislabel at least 30% of negatives, the required probability mass sums to at least `7 × .30 = 2.10`, although the available mass is 1. No negative distribution can satisfy the specification.

The stronger reading—each negative pair agrees under every proper quotient—is also impossible whenever the intersection of the relevant kernels is the identity. Even if individual quotients are weak, their tuple can be injective and recover the full invariant. This is a concrete reason to test the combined coarse-feature representation.

The numerical conditions disagree too. With balanced classes, a conserved quotient accepts every positive. Mislabeling 30% of negatives caps overall accuracy at 85%. Regenerating only when overall quotient accuracy exceeds 90% allows negative error as low as 20%. Pick one definition and enforce it at the correct denominator.

For non-group monoids, quotients are determined by monoid congruences. Group normal-subgroup tests do not establish the same guarantee there. “Every proper quotient” and “every registered proper quotient” are different claims and cannot be interchanged.

**Fix:** first solve a finite feasibility problem for the proposed sampling constraints. For groups, use nonidentity differences as support points and quotient kernels as constraints; for monoids, use unequal value pairs and registered congruences. Report infeasibility rather than silently regenerating indefinitely or excluding algebra types. Test a classifier on the joint output of the coarse solvers.

There is also a distribution fingerprint risk: positives come from local walks, while negatives are now selected through special algebraic relationships. The classes can differ in pair similarity, word statistics, or orbit occupancy even when their quotients match. Construct paired positive/negative challenge examples with matched nuisance statistics, and re-run the nuisance audit after this conditioning. Report both natural-sampling and quotient-challenge performance. Do not reject instances using the same finite final test pairs on which the headline result is measured; use separate calibration pairs and then generate fresh sealed evaluation pairs.

For proving separation from count-based representations, balanced counterexamples with the same symbol histogram are cleaner than an impossible universal quotient requirement.

### 11.4 — Is Phase 4 feasible, what should the capability gate be, and what threatens corpus absence?

**A small feasibility study is justified. The proposed full grid is not justified yet. Parameter count and token count cannot establish that a null will be informative.**

Small models can learn nontrivial behaviors on carefully designed synthetic distributions: TinyStories demonstrated coherent generation below ten million parameters, while algorithmic datasets exhibit generalization that can occur long after training-set memorization. Neither result predicts success at synthesizing a program from rules and labeled examples. Low training loss is especially poor evidence of readiness here. [Eldan and Li, TinyStories](https://arxiv.org/abs/2305.07759); [Power et al., Grokking](https://arxiv.org/abs/2201.02177)

**The immediate problem is a compound distribution shift (§§4.2–4.4).** Training only commutative worked solutions and testing noncommutative ones can change all of the following at once: sequence-order dependence, required code syntax, state representation, output length, number of latent states, and search difficulty. A null cannot identify which change broke the model. The ablation removing “look for a conserved quantity” is also uninterpretable if that natural-language strategy was never established as usable by a model trained on fixed formal notation.

Before choosing billions of tokens, freeze an executable output language, tokenizer, context length, and interaction protocol. If the earlier 200-pair format is retained with character-level strings, the prompt can already require thousands to tens of thousands of tokens, before attempt history. A short-context nanoGPT configuration would introduce an unrelated bottleneck. If the output language literally permits only commutative expressions, out-of-language success is impossible by the interface; if it permits general programs, explain the exposure to their primitives and stop calling that interface a known internal toolkit.

**A concrete gate I would preregister:** for each retained training seed, on at least 100 independent development worlds per relevant control family, require at least 90% world-level success, with the 95% lower confidence bound above 80%, under the final interaction and execution budgets. Also require at least 99% syntactically valid submissions. These are proposed operational thresholds, not facts about a universal capability boundary. Set them before inspecting the withheld-family results.

Apply that gate to three distinct controls:

1. **In-family synthesis:** unseen F-count/F-abelian worlds with new parameters, new presentations, and the same context and output burdens as the target. Random new examples from familiar templates are insufficient.
2. **Target-exposed positive control:** an otherwise matched model trained with the target family included must solve genuinely unseen target worlds. Match total tokens, optimizer steps, architecture, decoding, and verification budgets; replace data rather than simply adding more. If this control fails, the target/interface/training setup is below floor.
3. **Representation-supplied diagnostic:** give the target-withheld model the missing representation and the information required to instantiate it, then test fresh cases. Failure means execution or interpretation is still a bottleneck. Success narrows the diagnosis but does not prove that the representation was previously absent internally.

Include syntax and sequence-processing controls that do not demonstrate the target task. Explicitly document what they teach; they are part of the exposure intervention. Examine learning curves and held-out executable validity, not only token prediction loss. Use new worlds for the eventual confirmatory test after selecting the protocol.

**Stage the spending:** first audit the corpus generator and prove the language-separation witness; then overfit a tiny diagnostic set to catch interface bugs; then train one small target-exposed model and one matched target-withheld model. Advance to the size-by-seed grid only if the controls pass. A small failed diagnostic run is useful engineering evidence; it is not a negative result about invention.

**The runtime claim in §4.3 needs measurement.** Using the common first-order training estimate `C ≈ 6NT` FLOPs, with N model parameters and T processed tokens, gives the following illustrative compute-only times. The 10 and 30 TFLOP/s columns are assumed sustained useful throughput, not measured RTX 4080 SUPER performance or advertised peak rates. Attention at long context, checkpointing, evaluation, and data handling can add substantial cost. [Kaplan et al., Scaling Laws for Neural Language Models, §2.1](https://arxiv.org/pdf/2001.08361)

| Parameters | Tokens processed | Approximate FLOPs | At 10 TFLOP/s | At 30 TFLOP/s |
|---:|---:|---:|---:|---:|
| 20M | 1B | 1.2 × 10^17 | 3.3 hours | 1.1 hours |
| 150M | 1B | 9.0 × 10^17 | 25.0 hours | 8.3 hours |
| 150M | 5B | 4.5 × 10^18 | 125.0 hours | 41.7 hours |

For an illustrative 20M/70M/150M grid with three seeds each, 1B tokens per run totals about 5.0 GPU-days at 10 TFLOP/s or 1.7 at 30. At 5B tokens, those totals become 25.0 or 8.3 GPU-days. Repeating the entire grid for two additional ablations triples these totals, before tuning and failures. “Hours to about two days per run” is possible in some configurations but is not established for the planned experiment. Benchmark actual tokens/second and peak memory on the intended context length, tokenizer, optimizer, and precision first.

The largest threats to the absence claim are generic transition-table evaluators in worked code; positional or sequential information in explanations and failed attempts; input rule systems with richer structure than the annotated solution; data packing across document boundaries; and development examples, tools, or post-training data that reintroduce the withheld family. Large token counts generated from a small family of templates can also be mostly repetition. Report unique underlying worlds and structural equivalence classes, not just tokens.

Finally, three training seeds are only three independent trained models at a given size, however many test worlds each sees. Report every seed’s result, specify whether corpus generation is fixed or independently replicated, and do not treat three sizes as interchangeable replicates. A floor-qualified null can bound performance for these checkpoints and this protocol; it cannot establish an inability to invent.

### 11.5 — Does a grammar filter plus string audit establish absence?

**No, except for a narrowly specified syntactic absence claim.** There is even a literal contradiction in §4.2: F-abelian uses group-valued objects, and every group is a monoid, while the corpus is said to contain no group-valued or monoid-valued object. Presumably the intended exclusion is noncommutative structure; write and test that property explicitly.

A generic program of the form `state = transition[state][symbol]` can evaluate both commutative and noncommutative products. Every demonstrated transition table could commute while the program supplies the full general evaluator. Renaming its variables removes no mathematical content. Similarly, an unrolled computation, a matrix representation, or a failed solution can encode the relevant operation without any banned family name.

The quotient/linear-algebra tests in §4.4 are not a proof of non-expressibility. Failure of selected candidate solvers establishes their failure under their bounds. It does not quantify over every expression in the claimed language. If L0 includes unrestricted arithmetic, arrays, indexing, and loops, it can implement the target by interpreting a multiplication table. In that case “not expressible in L0” is simply false.

**A guarantee that can actually be proved:** define L0 semantically as quantities that depend only on the input histogram, for example `q(s)=f(count(s))`, with a precisely bounded or otherwise characterized f. Prove by induction over the grammar that every permitted expression is invariant to symbol permutation. For a candidate target quantity, produce strings with the same histogram and different outputs; `ab` and `ba` suffice when the symbol images do not commute. That is a certificate that the submitted quantity is outside this L0. It is not evidence that the trained network previously lacked an order-sensitive algorithm.

To prove that a task *requires* information beyond L0 for the performance threshold, also construct balanced label conflicts within histogram-feature equivalence classes. Two possible invariant outputs alone do not establish a classification lower bound on the actual sampled dataset. Show that every L0-based classifier has a bounded maximum accuracy on the specified challenge distribution.

Audit the corpus at four levels:

1. **Generation and syntax:** parse every emitted solution, intermediate trace, explanation, and failed attempt; certify its allowed syntax. Prefer emitting a typed AST and rendering it over generating text and filtering it afterward. A held-out audit sample cannot certify every document.
2. **Semantics:** prove the relevant property for the restricted language and validate generator obligations. Search for alternate encodings and audit the input rule systems and labels, not only solutions. Unlimited semantic absence over general-purpose programs is not established by string matching.
3. **Actual exposure:** hash the exact token stream delivered to training, tokenizer, generator, configuration, curriculum and packing rules. Use random initialization; account for all fine-tuning, validation-driven selection, auxiliary tools, and test-time examples. A deterministic seed alone is not a corpus specification without versioned code and configuration.
4. **Interpretation:** report “no explicit target solution in this audited corpus” and “solution behavior outside L0.” Do not promote those statements into a known inventory of the model’s latent algorithms.

A strict audit of explicit exposure is achievable and valuable. An audit excluding every implication or potential generalization of the corpus is neither the same claim nor the objective the experiment needs.

### 11.6 — Which process measures should be dropped or retained?

| Measure in §5 | Verdict | Required change |
|---|---|---|
| Hint effects | Keep | Randomize or interleave arm order within world, use equal allowed budgets and a specified restart/continuation intervention, select on development worlds, confirm separately, and adjust primary comparisons. |
| Post-mortem categories as explanations of failure | Drop as a causal endpoint | Keep only as a descriptive study of what models say after revelation. A reveal and a leading question can alter the story. |
| Explicit claim/log contradictions | Keep after repair | Use the full original record, an explicit quoted claim, and localized contradictory evidence. Nonmention and generic substring matches are not contradictions. |
| Candidate evaluations and solver calls | Keep as measured external work | Instrument the execution interface; state coverage. A call count does not include candidates considered inside a solver or computation outside the interface. The current sandbox does not implement these counters. |
| Observable-computation labels | Keep as descriptive annotations | Permit mixed and unknown; classify code operations, not latent thought. |
| Reuse | Keep only after defining the transferred object | Specify whether an instantiated quantity, an abstract representation, or a fitting procedure is frozen; register permissible adaptation and compare against scratch. |

I would not spend a main-paper annotation budget on `missing_concept` or `budget_misallocated` inferred from post-hoc explanations. Spend it on output-language membership, executable correctness, and concrete contradictions. Human reviewers can be blinded to model identity and reported outcome, but code can reveal its mathematical family; do not promise family blinding that the artifact itself defeats. Include control artifacts if reviewers must not know that every assigned program was selected as an apparent success.

### 11.7 — Rewrite the hostile paragraph: what still stands?

The replacement paragraph is in section 1. The v1 reachability-name objection and the rejection of a scalar novelty dial are substantially answered at the specification level. The unresolved core is identification of a known internal toolkit, compounded by an unproved language-separation test, an infeasible sampler guarantee, undefined reuse, incomplete capability controls, and concrete failures in the claimed repairs.

## 3. Check the fixes

### `src/sandbox.js` — original exploit fixed; isolation claim still false

**Verified repair:** the original `var stash` zero-bit encoder is rejected. The shipped self-test passes, and the real lag-bank program scores about 0.995 bits/symbol on seed-1 laggedRule and 2.558 on seed-1 hiddenPeriod. Its execution is now included in the table.

**Verified residual blocker:** [freshContext](C:/Users/Refur/LLMBreakthroughs/src/sandbox.js:11) injects the same host `Math`, `Array`, `Object`, and other objects into both contexts. They are mutable shared references. This program still passes with zero bits:

```javascript
function encode(s) { Math.__reviewStash = s.slice(); return ''; }
function decode(bits, n) { return Math.__reviewStash; }
```

Observed result: `ok: true`, `bits: 0`, `bitsPerSym: 0`, `success: true`. The test ran in a short-lived process and removed its temporary property. This is a remaining instance of the same communication-channel flaw, not a hypothetical hostile escape.

**A second verified problem:** a decoder can return an array proxy whose `length` getter throws. The host accesses that property in [the verification loop](C:/Users/Refur/LLMBreakthroughs/src/sandbox.js:35), outside the timeout and exception handling, and `evaluate` throws instead of returning a failure result. A nonterminating getter would similarly escape the timed evaluation region. Do not rely on a model intentionally behaving well to make a verifier correct.

**Fix:** use context-owned intrinsics rather than injecting host constructors/objects, and make all boundary values plain serialized data. Validate and serialize results inside the timed isolated worker, then inspect only trusted host-side data. For actual generated-code execution, use fresh constrained processes with no shared writable state, external time/memory limits, and no access to secrets or experiment files. `node:vm` is explicitly not a security boundary. [Node documentation](https://nodejs.org/download/release/latest-v20.x/docs/api/vm.html)

Keep the original regression and add shared-object and exceptional-result cases. The real winner is executed but its expected behavior is not asserted; its load or decoding failure currently would not increment the self-test failure count. Pin its source hash and assert the intended regression cases. The retained program is the later lag-bank winner, not the initial arithmetic-coded PPM program; preserve that first winner too if claims about the original PPM wall remain.

### `src/report.js` — paired estimator repaired; population reporting and validation remain defective

**Verified repair:** only configured contrasts are computed. For each condition, repeated outcomes are averaged by seed, paired differences are formed, and the bootstrap resamples those differences. For a complete, correctly matched design, this is the intended world-level point estimator and a conventional paired cluster bootstrap. An offline fixture with world differences 1 and 0 returned a 50-percentage-point estimate as expected.

**Remaining problems:**

- [The grouping key](C:/Users/Refur/LLMBreakthroughs/src/report.js:49) is only `seed`. Domain, generator version, instance options, run batch, model, and a declared paired-generation identity are not validated. A fixture pairing laggedRule against hiddenPeriod with matching seed numbers was accepted and labeled as a laggedRule contrast. Some contrasts can intentionally use a shared generation block across changed parameters, but that coupling must be declared, not inferred from an integer.
- Missing worlds are silently dropped by intersection, and incomplete repetitions are averaged without a completion check. If failures or API interruptions cause missingness, the reported comparison can change its target population. Report missingness and enforce the preregistered exclusion/retry policy.
- Re-running `experiment.js` appends another metadata record and more trials to the same filename. The report uses the first metadata record and all trial rows. Duplicate runs or changed configurations can silently be mixed. Reject multiple experiment identities and duplicate trial keys, or explicitly handle resumed batches with immutable configuration hashes.
- The main table still pools repeats into Wilson intervals and still reports median attempts conditional on success. The parameter curve does likewise and pools conditions sharing the parameter. A footnote calling these intervals “for orientation” does not implement §8. The promised per-world table is not actually emitted. Replace these with world-level summaries and the registered effort metrics.
- Percentile bootstrapping can be degenerate. When every observed world difference is zero, it returns `[0,0]` for any sample size; I reproduced this. That is not proof of zero population uncertainty. Predefine a boundary-aware interval or conservative bounded-mean fallback, and distinguish lack of observed discordance from equivalence.
- Naming at most three primary contrasts does not handle multiplicity. Three independent tests at .05 have family-wise false-positive probability `1 - .95^3 = 14.3%`. Use one primary contrast, Holm/Bonferroni, a preregistered hierarchy, or a simultaneous procedure. State what the 95% intervals cover.

### `src/hints.js` — early-stopping bias removed; option handling regressed

**Verified repairs:** all arms run; no-hint and neutral controls exist; each receives the same allowed attempt budget and repeat count; `--k` reaches the instance generator. A mock run with two rungs produced four arms, all with lag 36.

**Verified regression:** [the new call](C:/Users/Refur/LLMBreakthroughs/src/hints.js:22) dropped the previous forwarding of `memory`. Running with `--memory summary` produced four logs recording `memory: full`. Restore forwarding and log the resolved setting. “Honors instance options” is also too broad: only `k` is parsed, not a generic saved instance/configuration. As new domains arrive, accept a versioned instance specification or run-log reference rather than reconstructing selected options ad hoc.

Every no-hint repetition runs first, then every neutral repetition, then each rung in order. Provider drift, transient service conditions, and other time effects are confounded with treatment. Randomize or interleave `(world, repeat, arm)` execution with a recorded randomization seed.

The implementation starts fresh runs with a hint present from the beginning. It estimates prompted-restart performance, not the causal effect of introducing a hint into the original failed trajectory. That is a legitimate intervention if named correctly. For continuation effects, fork the identical failure history into randomized continuation arms, preserve budgets, and keep revelation out of those histories.

The output is an exploratory one-world rate difference, not yet a confirmatory world-level estimate. Validate positive integer repeats/attempts, preserve partial results after API failures, and record rung category, exact prompt/configuration hashes, and model revision. The neutral instruction itself can help; report both control contrasts rather than assuming it is inert.

### `src/postmortem.js` — instance options repaired; full-history and contradiction repairs are not implemented correctly

**Verified repair:** reconstruction now calls `make(seed, meta.opts || {})`. This fixes the explicit-lag omission for logs compatible with the current generator. It does not make old logs reproducible after generator changes; store an immutable instance or generator revision/hash and verify it before revealing an answer.

**Verified failure of the full-history claim:** [postmortem.js:16](C:/Users/Refur/LLMBreakthroughs/src/postmortem.js:16) still calls `buildUserMessage`, and [prompt.js:53](C:/Users/Refur/LLMBreakthroughs/src/prompt.js:53) forces `memory: 'summary'`. In a sentinel test, code, full raw response, and assumption text were all absent from the resulting transcript. The self-reporting model still does not receive the record against which its account is judged.

**Verified false-positive mechanism:** [the probes](C:/Users/Refur/LLMBreakthroughs/src/postmortem.js:38) match `lag` inside `flag`, and `s[i-` inside the ordinary adjacent predictor `s[i-1]`. Either can cause a `never_considered` classification to be labeled a contradiction without evidence of the decisive long-lag idea. Including code in a substring search has introduced more opportunities for spurious matches; it has not created an explicit contradiction test.

The log does correctly stop calling a considered-but-unmentioned idea a contradiction. However, `contradiction: false` still conflates agreement, unverifiability, parser failure, and no detected evidence. Store a three-way assessment—supported, contradicted, unverifiable—with the quoted claim and exact evidence; use a separate error state for failed classification. Permit multiple self-report categories or unknown instead of forcing a single causal explanation.

**Fix:** supply the full original messages and code, with an explicit truncation policy if necessary. Replace substring contradiction decisions with a blinded evidence assessment or tightly scoped semantic checks. Do not infer internal consideration from code automatically: a copied generic solver can contain a useful operation without the model having articulated the corresponding hypothesis. Require explicit behavioral claims, such as a claim that no submitted program tested a lag greater than one, before treating the code as a contradiction.

Post-mortem calls also use the currently configured model, while the saved record labels them with `meta.model` from the old run. Record original solver, responding model, and judge separately, and enforce the intended checkpoint identity if the task is self-report. Check that the input log is a completed failed trial rather than accepting a successful or interrupted run without notice.

### Documentation consistency

The exploratory heading is repaired. Other claims remain stale: README still recommends 10 seeds × 3 repeats, lists conditional medians, and says compression is impossible without discovering the rule; WHY-THIS-WORKS still says success requires an idea outside the model’s existing tools and presents self-training as establishing complete toolkit knowledge. The active Phase 1 predictions still include older nonmention/confabulation wording without an equally explicit replacement. Align the active protocol, README, prose explanation, prompts, and report before freezing a confirmatory version. Treat archived exploration as history, not as the current definition.

## 4. Top five remaining changes, ranked by improvement per unit of work

1. **Remove the known-internal-toolkit inference before any GPU spending — §§0, 4.1–4.5.** State Claim B as controlled exposure and generalization outside a formal reference language, and separate corpus absence, language non-expressibility, and latent capability.

2. **Close the demonstrated verifier bypass and correct the false measurement repairs — §§5–6, 8.** Eliminate shared host objects, handle returned values inside isolation, actually provide full post-mortem history, restore hint memory options, and validate world/batch identity in reporting before collecting further confirmatory data.

3. **Replace the universal quotient requirement with a feasible semantic certificate — §§3.2, 3.4, 4.4.** Prove the chosen language property, use explicit witness pairs and classification lower bounds, and check joint coarse features and sampler feasibility instead of claiming that selected solver failures prove non-expressibility.

4. **Make Phase 4 a gated pilot before a scaling grid — §§4.2–4.4, 8, 10.** Run matched target-exposed/target-withheld controls at one small size, require executable-control gates, and measure actual throughput at the intended context length before committing to billions of tokens across sizes and ablations.

5. **Define reuse and freeze the complete confirmatory intervention — §§1.4, 3.3, 3.7, 5, 8–9.** Specify what is transferred and refitted, seal the transfer-family commitment, randomize hint order, and register boundary-aware world-level inference plus an actual multiplicity procedure.
