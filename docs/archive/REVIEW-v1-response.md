Reviewed the local [PLAN.md](C:/Users/Refur/LLMBreakthroughs/docs/PLAN.md) and supporting files in `LLMBreakthroughs`. The public repository does not yet contain this draft.

## 1. Fatal flaws

**F1 — §§0–1, 2.3–2.4: Phase 2 still confuses a newly sampled object with invention of a concept.**

A random assignment of symbols to elements of \(S_3\) creates a new assignment inside a familiar representation. Recovering that assignment by solving constraints is structurally the same objection as recovering a hidden lag. Increasing the sophistication of the known representation does not change this.

There is a concrete solver that could pass every proposed check: recognize a group-presentation problem, search for a homomorphism into a small group, emit the resulting product as `quantity`, and explain the constraints it satisfies. That solver conserves the quantity, generalizes to long strings, constructs an instance-specific object, and can truthfully describe a derivation. None of that establishes invention.

The premise that frontier models know every named method is also unsupported. Conversely, lacking a standard name does not make a construction conceptually new.

**Fix:** Replace the four-level ladder as the primary measurement with separate axes:

- **Validity:** task performance, conservation, certificates.
- **Relationship to a frozen reference toolkit:** parameter fitting, composition of existing primitives, or a representation outside the registered solver language.
- **Resources:** model tokens, candidate evaluations, execution time, and sample complexity.
- **Reuse:** whether the constructed representation helps on independently generated tasks.

The strongest defensible claim would be “representation synthesis beyond this preregistered baseline library under these budgets.” The proposed design cannot certify “outside the model’s toolkit.”

**F2 — §§2.2, 2.4: The stated generator condition does not guarantee an invariant under local rewriting.**

The necessary condition is

\[
I(xuy)=I(xvy)\quad\text{for every allowed context }x,y,
\]

not merely \(I(u)=I(v)\).

For example, let \(I(s)\) count occurrences of `ab` modulo 2. The rule `a ↔ b` satisfies \(I(a)=I(b)=0\). Nevertheless, applying it to the second character of `aa` produces `ab`, changing the invariant.

Group products have the required compositional property. Arbitrary pattern counts, position-weighted quantities with length-changing rules, and transformations such as run-length encoding do not automatically have it. D2 and D4 therefore need substantially more than the proposed construction.

There is a second incompatibility: if “balanced on symbol counts” means each pair has identical histograms, D0–D1 cannot produce negatives. Their invariants are functions of those histograms. If it means matching marginal distributions across classes, joint histogram relationships can still reveal the label.

**Fix:** Specify and prove contextual conservation separately for every generator family. Where a finite-state representation permits exhaustive verification, use it. Explicitly define which histogram features are balanced, and recognize count-based information as intended signal at D0–D1.

**F3 — §2.2: The verifier measures a promise problem, not general reachability.**

The sampled distribution excludes unreachable pairs sharing the hidden invariant. Consequently,

\[
\widehat{\operatorname{reachable}}(a,b)=[I(a)=I(b)]
\]

can score perfectly while being wrong on an arbitrarily large portion of the actual reachability relation.

This is not incorrect labeling of the selected examples. It is a mismatch between the task’s name and the property measured. It becomes particularly damaging when §2.5 treats equivalences versus one-way rewrites as a stylistic transfer: reachability can become asymmetric while invariant equality remains symmetric.

**Fix:** Choose explicitly between:

1. Classification on the stated promise distribution, with claims restricted to that distribution; or
2. Reachability, requiring a complete invariant or an independent exact oracle.

For the second option, include same-invariant unreachable pairs and reversed directed pairs. Obtain these from provable constructions or finite, length-preserving systems whose entire state graph can be enumerated—not merely a bounded search that might miss longer paths.

**F4 — §§2.3, 2.5, 5: The proposed observations do not identify the claimed cognitive process.**

“Derived” and “enumerated” are not opposite mechanisms. A textbook algebraic solver derives constraints and searches their solutions. An inventive solver can enumerate conjectures. The distinction does not isolate invention.

Likewise, absence from a submitted explanation does not establish absence from the model’s consideration. The prompt requests one sentence about an attempt’s core idea; the proposed post-mortem analysis treats that selective record as an exhaustive account.

**Fix:** Measure observable behavior: submitted candidate constructions, executed searches, constraint-solving operations, and explicit contradictions between statements and code. Rename unsupported self-reports accordingly. Reserve “confabulation” for identifiable contradictions, rather than nonmention.

**F5 — §§2.8, 4: The existing verifier accepts a zero-bit “compressor.”**

I tested the current [sandbox.js](C:/Users/Refur/LLMBreakthroughs/src/sandbox.js:22). An encoder that saves its input in a shared variable and returns an empty string, followed by a decoder that returns that variable, receives:

```text
ok: true
bits: 0
bitsPerSym: 0
success: true
```

The encoder and decoder share a context; the decoder also retains access to `__data`. This does not show that the existing model runs exploited it. It shows that their verifier is not enforcing the claimed communication constraint.

**Fix:** Run decoding in a fresh execution environment receiving only the submitted program, counted bitstream, and explicitly permitted public information. Independently isolate evaluation labels and secrets in Phase 2. Add this exact exploit as a regression test before further collection. Also use an actual isolation boundary for generated code: Node’s documentation explicitly says `node:vm` is not a security mechanism. [Node documentation](https://nodejs.org/download/release/latest-v21.x/docs/api/vm.html)

## 2. Answers to the seven open questions in PLAN.md §7

**7.1 — Is random generation sufficient to exclude designer knowledge?**

No. It hides a sampled solution while retaining the designer’s choice of representation, algebra, rule generator, and negative sampler. Those choices determine which familiar solver applies.

Run the pre-model audit in section 3 below. Separate unintended sampling clues from legitimate mathematical evidence in the rules. Recognizing legitimate evidence can still amount to known-method selection.

**7.2 — Should success require conservation?**

Maintain two endpoints.

- **Task success:** performance on a sealed evaluation set, independent of whether the model expresses its solution in the author’s preferred form.
- **Validated invariant construction:** an explicit, nontrivial, conserved quantity with demonstrated predictive utility.

Requiring `quantity` is appropriate for a claim about constructing invariants. It also tells the solver what kind of representation to seek and excludes potentially valid alternative solutions. Therefore, it changes the intervention and must be disclosed.

Optional `quantity` has the opposite weakness: successful classifiers may provide no evidence for the central claim, and an unused quantity can be appended decoratively.

A useful compromise is separate unrestricted and invariant-requested conditions. In the latter, evaluate a fixed prediction rule based on the submitted quantity, in addition to the model’s unrestricted classifier. Do not label either endpoint “invention.”

**7.3 — Can derive versus enumerate become objective?**

Only as a description of externally observable computation.

Instrument a candidate-evaluation interface and record candidate representations, evaluations, constraints, and execution costs. Use categories such as **candidate testing**, **constraint solving**, **mixed**, and **unobserved**.

Candidate counts alone are insufficient: one SAT invocation may represent millions of implicit candidates; one vectorized operation may test thousands. Nor can instrumentation count alternatives considered internally during generation.

Blind annotators to model, dial, outcome, and the author’s intended classification. Allow “unclassifiable.” Do not use these labels as the central evidence for invention.

**7.4 — Is D3 non-enumerable, and what should follow it?**

No. For \(A\) symbols, direct assignments into \(S_3\) number \(6^A\): 46,656 at \(A=6\), and 60,466,176 at \(A=10\). Rule constraints can prune these sharply; group symmetries create additional redundancy.

Computing homomorphisms and finite quotients is established computational algebra. GAP explicitly provides these operations. That does not establish the runtime on your unfinished generator, but it establishes a mandatory baseline. [GAP documentation](https://gap-system.github.io/gap/doc/ref/chap40.html#X7B82DF4286046BDE)

The next experimental rung should require a representation outside a frozen template library and test its reuse across independent systems. Increasing group size merely makes the same search harder. Section 4 gives a concrete direction and its limitations.

**7.5 — Is optimal coding the right historical target?**

Keep optimal prefix coding as a **method-reconstruction case study**, conditional on capability and contamination checks. Drop numerical recovery of Shannon entropy as evidence of concept invention.

A candidate second task is constructing single-error-correcting codes and a reusable representation of error syndromes. Its finite cases admit exhaustive verification, although it also requires a historical precursor audit and does not automatically qualify as concept invention. [Hamming’s original paper](https://zoo.cs.yale.edu/classes/cs323/doc/Hamming.pdf)

**7.6 — Is 10 seeds × 3 repeats sufficient for a 40-point drop?**

**Under independence, approximately yes. Under the proposed clustered design, not necessarily.**

Assume one prespecified two-sided comparison, \(\alpha=.05\), equal sample sizes, fixed model/prompt, and success probabilities \(p_1=.70,\ p_3=.30\). The normal-approximation sample size per condition is

\[
n\approx
\frac{
\left[
z_{.975}\sqrt{2\bar p(1-\bar p)}
+
z_{\text{power}}\sqrt{p_1(1-p_1)+p_3(1-p_3)}
\right]^2
}{(p_1-p_3)^2},
\qquad \bar p=.50.
\]

This gives:

- **80% power:** \(n=23.31\), round up to **24 independent trials per condition**.
- **90% power:** \(n=30.70\), round up to **31**.
- **30 independent trials:** approximately **89.3% power**. Enumerating binomial outcomes for the pooled score-test rejection rule gives **89.6%**.

The absolute rates matter. For .80 versus .40, approximately 23 and 30 independent trials give 80% and 90% power, respectively.

For three repeats per sampled world, the usual planning approximation is

\[
DE=1+(3-1)\rho,\qquad n_{\rm eff}=30/DE,
\]

where \(\rho\) is within-world correlation when generalizing to new worlds.

| Within-world correlation | Effective \(n\) per condition | Approximate power, .70 versus .30 |
|---:|---:|---:|
| 0 | 30 | 89% |
| .25 | 20 | 73% |
| .50 | 15 | 60% |
| 1 | 10 | 43% |

These are illustrative cluster adjustments, not an exact power calculation for a paired design. Cross-condition covariance could improve precision; it must be estimated rather than assumed.

**Recommendation:** prioritize at least **32–40 distinct worlds per primary condition**, then add repeats. Simulate power for the actual hierarchical design using pilot estimates. Four Bonferroni-adjusted primary comparisons would require approximately **43 independent observations per condition** for 90% power at .70 versus .30.

**7.7 — What is the strongest objection, and does the plan answer it?**

The experiment can be solved by synthesizing instances of established representations, while every proposed novelty check accepts that behavior. Therefore, positive and negative results cannot distinguish invention from retrieval, search, representation fitting, or execution difficulty.

The plan acknowledges this objection but does not answer it. The required response is an operational claim relative to explicit baselines, not another harder invariant family.

## 3. Leakage and designer-knowledge

**§1’s guarantee is false as stated.** Randomizing an invariant’s parameters does not remove the designer’s knowledge of the family. Deriving the rules from that invariant actively transmits constraints on it.

Potential channels include:

- **Rule form:** length changes, repeated symbols, apparent inverses, cancellation patterns, commutation relations, symbol participation, and relation redundancy.
- **Generator fingerprints:** rejection-sampling artifacts, different rule counts or length distributions across dials, and unusually frequent identities.
- **Labeled pairs:** positives produced by short random walks can retain long common substrings, unusual alignment structure, or shared local neighborhoods. Independently generated negatives need not.
- **Prompt and feedback:** family-specific wording, alphabet size, examples, explicit requests for a conserved object, and diagnostic messages.
- **Decoys:** consequences of other rules add no independent mathematical information. Their recognizable redundancy may actually identify the generator.

Run this audit before exposing tasks to models:

1. **Generate a large audit corpus with independent development and audit worlds.** For example, 2,000 worlds per dial. Keep symbol-renamed copies, shared underlying structures, and related rule presentations in the same split.

2. **Predict the dial from three views.** Use metadata/formatting only; canonicalized rule statistics; and labeled-pair statistics without rules. Report a five-way confusion matrix. Metadata prediction above chance demands a fix; structural prediction reveals how readily the family can be selected.

3. **Predict pair labels without solving the advertised problem.** Train fixed classifiers using lengths, histogram differences, edit distance, longest common substrings, positional agreement, short-pattern counts, run statistics, and distances to training examples. Evaluate on unseen worlds and independently generated test-pair distributions. Count information is intended signal at D0–D1; do not pretend it can simultaneously be removed there.

4. **Run solver baselines with controlled information.** Compare rules only, examples only, and both. Include modular linear algebra, finite-group homomorphism search, finite-state/transducer synthesis, rewrite normalization, and a small composition grammar. Measure actual accuracy and runtime—not whether they recover the exact planted parameterization.

5. **Intervene on presentation and sampling.** Hold the underlying system fixed while changing symbol names, rule ordering, redundant presentations, positive-walk lengths, and pair-generation procedures. For a pure notation test, represent an equivalence as two directed rules; do not change it into one directed rule.

For nuisance-only label predictors, preregister a practical equivalence margin—for example, require an upper confidence bound below 55% accuracy, using uncertainty across worlds. A nonsignificant result against 50% is not evidence of negligible leakage.

Most importantly, **successful family recognition from mathematically relevant rules is not necessarily a data leak**. It is evidence that the task permits known-method selection. That directly matters to the central claim.

## 4. Is the dial real?

**Not as an ordering of invention.** At present it mixes representation family, parameter count, identifiability, implementation difficulty, and search-space size.

| Dial | Likely first move by a strong model | Classification under the plan’s own vocabulary |
|---|---|---|
| **D0** | Compute symbol-count changes for each rule; check parity constraints. | Level 1–2. |
| **D1** | Form a matrix of count differences and solve for a modular nullspace, testing candidate moduli if necessary. | Level 1–2, even though this is a derivation rather than brute enumeration. |
| **D2** | Lift features to position classes or short ordered patterns; solve constraints, or construct a finite-state transducer. | Usually level 1–2. Order sensitivity does not establish a new concept. |
| **D3** | Interpret relations algebraically; solve assignments into small groups or search finite quotients/permutation representations. | Level 1–2 unless independently demonstrated otherwise. |
| **D4** | Search compositions of familiar transformations—run-length encoding, local normalization, merging—with familiar invariant families. | Level 1–2 when the transformation vocabulary is familiar. A two-stage pipeline is not two concept inventions. |

Three specific problems with §2.4:

**First, D1 is not naturally an enumeration task.** Its standard linear-algebra solution already breaks the mapping from “derive” to “invent.”

**Second, complexity need not increase with dial.** An obvious \(S_3\) presentation may be easier than identifying a long rare pattern at D2. A D4 transformation can be nearly identity. Enumerability depends on the chosen language and computational budget.

**Third, failure to reproduce the full planted invariant does not imply failure to classify the sampled pairs.** A coarser invariant can suffice.

For a concrete example, assume a surjective \(Q_8\)-valued invariant and negatives uniformly distributed over distinct group-value pairs. Its abelianization has four classes of size two. A classifier using only that quotient accepts all positives and rejects \(6/7\) negatives, giving

\[
\frac12+\frac12\frac67=\frac{13}{14}\approx92.9\%.
\]

That is already close to the 95% threshold without recovering the full noncommutative information. A biased negative sampler could push it further. Testing whether count-based candidates equal \(I\) misses this issue; test their classification performance.

**What should sit above D3?** A useful next family would require synthesizing an auxiliary representation and its update law outside the frozen baseline grammar—for example, a variable-depth intermediate structure—and reusing it on independently generated rule systems. Evaluate increasing depth, counterexamples that collapse under simpler representations, and transfer after freezing the abstraction.

This would test synthesis beyond specified templates. It would still not prove that the representation was absent from the model’s knowledge. No replacement D-number removes that limitation.

## 5. The measurements

| §2.3 check | What it detects | What it misses / how to pass without invention | Specific repair |
|---|---|---|---|
| **Conservation** | Agreement on sampled transitions; with separation tests, usefulness on sampled negatives. | A constant passes conservation alone. A stock algebraic invariant passes the combined check. Rare violations can escape sampling. An unused `quantity` can be attached to another classifier. | Check all rule/context cases where tractable; otherwise use targeted counterexample search. Score a fixed classifier using the quantity, test deterministic isolated calls, and report conservation and predictive usefulness separately. |
| **Small/large generalization gap** | Sensitivity to the particular length shift. | A known group solver does expensive fitting once, then evaluates strings linearly. It passes both sizes. Zero gap also occurs when both accuracies are poor. Conversely, a valid idea can fail at large size because of an implementation bug. | Report both accuracies, runtime scaling, preprocessing cost, and performance across path length, branching, and length—not just one difference. |
| **Named-method judge** | Whether a judge recognizes a familiar description. | Renaming a standard construction, composing textbook operations, or using an obscure method can yield “non-standard.” Judge ignorance is not novelty. | Require evidence for identified precedents; allow “unknown”; audit code as well as prose. Have domain experts assess every claimed invention, not a small random sample. |
| **Derive/enumerate annotation** | The appearance of the explanation and visible program operations. | Gaussian elimination is a derivation using a known method. A search result can be narrated as a derivation. Actual invention may involve extensive enumeration. | Replace the invention interpretation with observable computation categories; log external candidate testing and blind annotation. |

Two additional errors matter.

**Ten thousand successful checks are not a proof.** Under independent representative sampling, zero violations in 10,000 checks gives an approximate one-sided 95% upper bound of \(3/10{,}000\) on the violation probability under that sampling distribution. It says nothing about an unsampled boundary case or adversarial context.

**“Equivalent to \(I\)” needs a precise definition.** Compare induced equality relations, not literal output values. An injective relabeling of invariant values is equivalent. A finer conserved representation may also be valid and useful even if it does not induce exactly the planted partition. The verifier should not punish a legitimate alternative simply because it differs from the author’s object.

## 6. Phase 3

**Optimal coding is a reasonable constrained method task. The proposed entropy endpoint is a poor concept-invention test.**

For Huffman-style coding, §3.1 must specify the coding alphabet, equal symbol costs, prefix condition, handling of zero probabilities, and supported alphabet sizes. Verify code validity before comparing expected length. Require a procedure that works on unseen distributions and larger alphabets; otherwise enumeration of small code trees can pass without reconstructing a scalable method. Accept any valid optimal method, rather than requiring the historical algorithm’s exact form. [Huffman’s original paper](https://compression.ru/download/articles/huff/huffman_1952_minimum-redundancy-codes.pdf)

The level-4 task is underspecified in a more fundamental way. Asking for a frequency-only lower bound does not uniquely identify Shannon entropy:

- Zero is a lower bound.
- The optimal single-symbol prefix-code cost \(L^*(p)\) is itself a frequency-only quantity and a tight lower bound on that optimization problem.
- For \(p=(.99,.01)\), binary single-symbol prefix coding requires expected length 1, while entropy is approximately .0808.

A solver returning \(L^*\) could satisfy the stated mathematical task and fail the entropy-identity verifier. That is answer matching, not verification of the requested property.

If the intended target is an asymptotically tight rate, state the block-coding problem and require the bound’s operational justification. Merely reproducing \(-\sum p\log p\) does not establish its meaning for communication. Also fix the units: arbitrary scaling of a valid lower bound need not remain valid for a fixed binary coding cost. [Shannon’s original paper](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf)

**The most serious pre-1931 precursor is statistical mechanics.** Gibbs’s 1902 treatment already relates entropy to an ensemble’s average logarithmic probability. Thus the formula’s conceptual ingredients can legitimately occur in an entirely historical corpus. Recognizing or adapting them is different from originating the mathematical object. The audit must search formulas and equivalent reasoning, not only “Shannon” and “information theory.” [Gibbs, 1902](https://history.aip.org/exhibits/gap/PDF/gibbs.pdf)

Additional precursor searches should cover Hartley, telegraph-code optimization, counting arguments, probability-weighted logarithms, and combinatorial tree problems. Distinguish legitimate historical precursors from accidental post-cutoff contamination.

**Talkie cannot be assumed temporally clean.** Its authors acknowledge post-cutoff factual knowledge and imperfect filtering. They also describe modern-model judging and synthetic conversations in post-training. Those facts do not prove coding-specific contamination, but they invalidate the assumption that the checkpoint’s date label establishes knowledge subtraction. The report also describes an architecture-matched modern twin, which is a better comparator than an unrelated frontier model. [Talkie technical report](https://talkie-lm.com/introducing-talkie)

The proposed keyword check has both false negatives and false positives. A model can know an algorithm without its inventor’s name; “entropy” can correctly refer to pre-1931 thermodynamics. Use independent sessions for named probes, unnamed algorithm-completion probes, formula probes, and the actual experiment. Audit base and instruction-tuned checkpoints separately.

**The capability floor is insufficient.** A modern model solving the prompt establishes that the modern model can use it. A vintage model solving a frequency-assignment exercise establishes much less than the ability to construct and execute a recursive optimizer.

Add three controls:

1. **Interface control:** reliable use of the output format, arithmetic, lists, recursion, and verifier feedback.
2. **Revealed-method control:** supply the complete algorithm and test execution on new instances.
3. **Near-target reasoning controls:** matched recursion, exchange arguments, and probability calculations using established methods.

Avoid making JavaScript fluency an unmeasured prerequisite. A restricted executable language or a fixed, audited translation procedure would help; a modern model freely “translating” prose can silently supply the missing algorithm.

Even after these controls, a null means failure of this checkpoint under this protocol. Thirty trials on one historical target do not validate the synthetic invention ladder.

## 7. Statistics and reporting

**The experimental unit is the independently generated world.** Test pairs are observations within a world; repeated model attempts are an adaptive trajectory; repeated runs on the same world estimate stochastic variation conditional on it. None should be counted interchangeably.

**Wilson intervals are appropriate only for the corresponding binomial estimand.** They do not repair clustering. For new-world generalization, use a hierarchical model or resample worlds while preserving within-world repetitions and matched conditions. Ten worlds provide weak support for estimating heterogeneous effects.

For reference, under the independent-binomial calculation:

- 21/30 successes: Wilson 95% interval approximately **52.1–83.3%**.
- 9/30 successes: approximately **16.7–47.9%**.
- 950/1,000 correct: approximately **93.5–96.2%**.

Thus 95% empirical accuracy can be an operational pass threshold, but it does not establish population accuracy of at least 95%. A two-sided Wilson lower bound of at least 95% requires 964/1,000, assuming the binomial model applies.

**The contrast implementation does not match its description.** [report.js](C:/Users/Refur/LLMBreakthroughs/src/report.js:41) calls comparisons paired but computes an independent-sample Wald standard error. It neither uses matched outcomes nor handles seed clustering. Its interval also collapses to zero width when both sample proportions are 0 or 1.

Specify contrasts in advance. Match by world, preserve matching in inference, report percentage-point differences directly, and do not infer differences from overlap of separate Wilson intervals. Avoid automatically testing every same-domain condition pair.

**The hint measurement currently selects lucky outcomes.** [hints.js](C:/Users/Refur/LLMBreakthroughs/src/hints.js:22) stops at the first rung with all repeats successful. Three successes out of three have a Wilson lower bound of only about **44%**. With seven equally ineffective hints and a 50% background success rate, the probability that at least one produces 3/3 successes is

\[
1-(1-.5^3)^7 \approx 60.7\%.
\]

The repair is a randomized comparison against an equal-budget no-hint continuation or restart, depending on the estimand. Include a neutral instruction control and an explicit solution-family hint. Select promising hints on development worlds and confirm effects on fresh worlds. Do not assume rung effects are monotonic or that the lowest successful rung measures conceptual distance.

Moreover, “ask what stays the same” names the solution strategy. It should be labeled a strategy hint, not content-free.

**The held-out transfer is already exposed in §6.** The proposed pilot runs D0–D4; scaffold development then uses D2–D3 failures; the full experiment later calls D3 held out. D3 is therefore not held out at the family level. Fresh D3 seeds would establish instance transfer only.

Choose the transfer family before pilots and keep it unopened, or describe the experiment honestly as transfer to new instances. The equivalence/one-way distinction also needs the semantic repair described above.

**Attempt and idea metrics are affected by stopping.** Successful runs stop early. Conditional median attempts can make a stronger model look slower because it additionally solves difficult cases. Distinct ideas per ten attempts is likewise conditioned on unequal opportunity.

Report success-by-budget curves and a censored time-to-success analysis or restricted mean effort. Treat lexical diversity as descriptive until its coding is validated.

**Several concrete harness issues need fixing before these measurements mean what their names say:**

- [postmortem.js](C:/Users/Refur/LLMBreakthroughs/src/postmortem.js:14) reconstructs the instance without `meta.opts`; an explicitly chosen lag can therefore receive the wrong reveal.
- [hints.js](C:/Users/Refur/LLMBreakthroughs/src/hints.js:17) likewise does not pass the instance options. It does not necessarily investigate the failed instance.
- Post-mortems receive a summary, while the cross-check uses keywords in selected fields rather than inspecting the full code. This can manufacture apparent disagreement.
- The PPM self-test is a flag-coded longest-context predictor, not the actual arithmetic-coded context mixer that crossed the first wall. Preserve actual winning programs as regression baselines.

**Preregister the choices that determine the result:**

- Generator versions, rejection rules, invariant families, and structural train/test splits.
- Exact model revisions, prompt variants, sample exposure, memory limits, and all resource budgets.
- Solver-library coverage, computational budgets, and criteria for declaring a baseline inadequate.
- Primary endpoints, contrasts, effect sizes, clustering model, multiplicity handling, and stopping rules.
- Development-feedback sets versus sealed final evaluation sets.
- Timeout, truncation, parsing, API-error, and retry policies.
- Annotation rubrics, blinding, disagreement resolution, and “unknown” categories.
- Hint eligibility, continuation versus restart, confirmation criteria, and transfer exclusions.
- Phase 3 contamination and capability gates.

Thirty human spot-checks are inadequate support for central novelty classifications. Even 30/30 agreements have a Wilson lower bound around 88.6%. With modest numbers of claimed inventions, have two qualified reviewers examine all of them. Five programmers can provide a useful diagnostic pilot, but not a stable “human” benchmark; record mathematical background and account for learning across tasks.

**The public-facing justification also overclaims.** [WHY-THIS-WORKS.md](C:/Users/Refur/LLMBreakthroughs/docs/WHY-THIS-WORKS.md:23) and the README should not assert that:

- Compression requires identifying the particular hidden rule.
- Fresh generation guarantees conceptual novelty.
- The oracle’s realized code length is a universal minimum for every individual sample.
- A successful hint reveals how close the model was.
- Cross-family improvement excludes strategy leakage.
- All choices preceded data collection.

The Phase 1 revisions are legitimate exploratory work. Label their timing precisely and freeze a new confirmatory protocol; the existing addendum’s “before any data collection” heading is incompatible with its description of a completed real run.

A serious ML referee could reject the current submission immediately for unsupported construct validity, insufficient baselines, invalid verifier isolation, adaptive reuse of evaluation data, or inaccurate independence assumptions. Confidence intervals and a preregistration document do not compensate for those problems.

## 8. The strongest hostile reading

> This paper presents known algebraic system identification as concept invention. Its synthetic tasks sample parameters from familiar invariant families, while its baselines exclude the computational-algebra and program-synthesis methods naturally suited to those families. Its novelty assessments measure conservation, length generalization, and whether annotators recognize an algorithm; none distinguishes invention from instantiating a known representation. The reachability benchmark excludes cases that would expose the incompleteness of the planted invariant. Claimed process measurements rely on selective model narratives, and the historical experiment confounds knowledge, general capability, interface competence, and acknowledged temporal contamination. The proposed transfer family is used during development, repeated seeds are treated as independent evidence, and the current verifier accepts solutions that communicate outside the scored channel. The results could support a narrower study of representation fitting and prompt interventions, but they do not support the paper’s central claim.

**The plan does not answer this paragraph.** It recognizes the parameter-versus-method problem but treats a new family and new annotations as its solution.

What would answer it is a narrower operational claim, sound task semantics, an independently challenged solver library, a repaired verifier, untouched transfer families, and randomized interventions. For a stronger invention claim, additional evidence about the solver’s prior toolkit would be required; the proposed black-box measurements do not supply it.

## 9. Ranked changes

1. **Replace the invention claim and remove the unified ladder figure — §§0–1, 5.** Define the primary result relative to a frozen solver library and explicit budgets. This is inexpensive and removes the largest unsupported inference.

2. **Repair evaluation and instance identity — §§2.8, 4.** Separate encoder and decoder execution, isolate secrets, preserve instance options in hints and post-mortems, and add the demonstrated zero-bit exploit as a regression test.

3. **Implement the strongest obvious D3 baseline before the model pilot — §§2.4, 2.6, 6.** Test finite-group constraint solving and measure its classification accuracy, including coarser quotients. If it passes, classify that family as known-method synthesis without raising the novelty label.

4. **Prove generator soundness and settle reachability semantics — §2.2.** Establish contextual conservation for every family, resolve the histogram-balancing incompatibility, and either state the promise distribution explicitly or obtain a complete reachability oracle.

5. **Make hints and transfer confirmatory experiments — §§2.5, 4–6.** Add equal-budget randomized controls, keep the transfer family out of all pilots and scaffold development, and allocate the primary sample budget to independent worlds rather than mostly repeated runs.
