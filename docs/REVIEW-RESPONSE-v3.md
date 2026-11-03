# Third review: whydidntyou, Plan v3

Reviewed on 2026-11-03 against the local working tree. The reviewed [PLAN.md](C:/Users/Refur/LLMBreakthroughs/docs/PLAN.md) has SHA-256 `776c38177f470d55c57109bf81b30d6b88392d7189cfad9a2ee95181ea1ed0e9`. Source hashes, individual probe results and reproduction scripts accompany this response.

**Verdict: v3 resolves the central overclaim from v2, but is not ready for confirmatory collection.** The separation of P-exposure, P-language and P-capability is substantive. I would no longer reject Claim B for equating a documented corpus with a known internal toolkit. The remaining blockers are executable: the verifier still accepts two zero-bit side channels; record validation and judge identity remain incorrect; and the formal certificates and sampler need precise, testable definitions before their promises can be treated as guarantees.

This review distinguishes observed failures, source-inspection findings and proposed tests. I ran no paid model calls or training. Offline probes used a source-only copy, mock responses or an intercepted local `fetch`; no `.env` was copied. Potentially nonterminating submissions ran in disposable child processes with an external timeout. These targeted tests do not establish general isolation or statistical coverage.

## 1. Verification of the repairs — §11.1

The shipped `node src/selftest.js` passes on Node v22.23.4, Windows. Its four old side-channel/proxy regressions are rejected. The real lag-bank program is now hash-pinned and its expected outcomes are asserted: approximately **0.995 bits/symbol on laggedRule, success**, and **2.558 on hiddenPeriod, failure**, both at seed 1. This repairs the specific v2 omission.

The additional probes are in [REVIEW-CHECKS-v3.mjs](C:/Users/Refur/LLMBreakthroughs/docs/REVIEW-CHECKS-v3.mjs) and [REVIEW-CHECKS-v3-extra.mjs](C:/Users/Refur/LLMBreakthroughs/docs/REVIEW-CHECKS-v3-extra.mjs). [REVIEW-EVIDENCE-v3.json](C:/Users/Refur/LLMBreakthroughs/docs/REVIEW-EVIDENCE-v3.json) records inputs through case identifiers, observed results, runtime and reviewed source hashes. To reproduce from the repository root in PowerShell:

```powershell
node src/selftest.js
node docs/REVIEW-CHECKS-v3.mjs . "$env:TEMP\whydidntyou-v3-evidence.json"
node docs/REVIEW-CHECKS-v3-extra.mjs "$env:TEMP\whydidntyou-v3-evidence.json"
```

The scripts create a separate source copy beside the evidence file. A `pass` means that particular expected behavior was observed, not that the enclosing component is certified.

### Verifier: old cases pass; the isolation claim still fails

Each additional sandbox probe called `evaluate(code, make(1), {timeoutMs: 200})`, with a 2.5-second external process limit.

| Case | Result | Observation |
|---|---|---|
| Original global `stash` | PASS | Rejected: decoder returned zero items. |
| v2 `Math.__reviewStash` | PASS | Context-local `Math` no longer carries data between encoder and decoder. |
| Decoder proxy with throwing `length` getter | PASS | Returns a decode failure instead of throwing on the host. |
| Decoder proxy with looping `length` getter | PASS | The VM's 200 ms timeout catches it. |
| Host access through `console.log.constructor` | **FAIL** | Accepted with `ok: true`, zero bits, `success: true`. |
| Host access through the context object's constructor | **FAIL** | Also accepted with zero bits. |
| Thrown object's looping `message` getter | **FAIL** | VM timeout did not stop it; external supervisor killed the process. |
| Replacement `JSON.stringify` returning a coercion trap | **FAIL** | Host coercion escaped the timed region; external supervisor killed it. |
| Promise callback containing an infinite loop | **FAIL** | `evaluate` first returned a rejection, then the process hung; external supervisor killed it. |

The request says that no host object is injected. [sandbox.js:22](C:/Users/Refur/LLMBreakthroughs/src/sandbox.js:22) still injects a host-created console object with a host function. This complete submission succeeds:

```javascript
const host = console.log.constructor('return globalThis')();
function encode(s) {
  host.__v3Review = s.slice();
  return '';
}
function decode() {
  const s = host.__v3Review;
  delete host.__v3Review;
  return s;
}
```

Replacing its first line with `const host = globalThis.constructor.constructor('return globalThis')();` also succeeds. Removing the console alone therefore does not fix the demonstrated channel. The probes only used a temporary host-global property; they did not read files, credentials or network resources.

Two boundary assumptions also remain false. [sandbox.js:57](C:/Users/Refur/LLMBreakthroughs/src/sandbox.js:57) reads and coerces a submitted exception outside the timeout. Separately, the submitted program can replace `JSON.stringify`, so [sandbox.js:47](C:/Users/Refur/LLMBreakthroughs/src/sandbox.js:47) need not return a primitive string; the host's subsequent `JSON.parse` can invoke the returned object's coercion code. The scripts contain minimal reproductions of both, plus the Promise case.

**Required fix — §§1.1, 6, 10:** use separate constrained execution processes for encoder and decoder, with the parent retaining the secret, strictly validated primitive messages, no shared writable channel, and externally enforced lifetime and resource limits. Cover initialization, result/error handling and queued work, not just function evaluation. A child process without restrictions on shared files or parent data is not sufficient. For Phase 2/4, a deterministic bounded-language interpreter offers a much smaller verification surface. Node itself says that `node:vm` is not a security mechanism; the observed failures here are on the stated local runtime. [Node documentation](https://nodejs.org/api/vm.html#vm-executing-javascript)

The code's new “non-adversarial model outputs” comment does not rescue the measurement. A verifier is supposed to distinguish valid submissions from invalid ones, including accidental exploitation. Add these cases to the regression suite, but do not confuse passing a growing list of examples with establishing the execution boundary.

### Hints: the main repair is real; interruption handling is incomplete

| Case | Result | What ran / what happened |
|---|---|---|
| Memory and instance option forwarding | PASS | Two rungs, two repeats, `--memory summary --k 36`: all eight run logs recorded summary memory and lag 36. |
| Arm coverage, estimand and categories | PASS | Both controls and both rungs ran twice; prompted-restart and supplied categories were recorded. |
| Interleaving and order seed | PASS | Seeds 7 and 8 produced different shuffled `(arm, repeat)` schedules, with complete arm coverage. |
| API failure preserves partial work | PASS, narrowly | A local stub failed the first call. All four jobs were attempted, one error was recorded, and four partial records were appended. |
| Positive-integer validation | **FAIL** | `--repeats 1.5` was accepted, logged as 1.5, and executed two repetitions per arm. |

**Remaining fixes — §5:** [hints.js:13](C:/Users/Refur/LLMBreakthroughs/src/hints.js:13) needs finite positive-integer validation; its current condition also admits infinity. Partial records need a batch/configuration identity, domain, model, memory, exact hint and randomized schedule identity: the common append-only partial file cannot reliably reconstruct multiple interrupted experiments from seed/arm/repeat alone. The final summary excludes API-error jobs from its denominator; register retry/exclusion rules and report assigned, completed and failed counts separately.

The default order seed is 1 for every invocation. This is a shuffled schedule, but repeated worlds inherit the same schedule unless the caller varies it. Derive and record a world-specific assignment seed if independent schedules are intended. The shipped ladder also contains category `borderline`, outside §5's registered three-category vocabulary. Validate categories instead of merely copying strings. These latter points are source-inspection findings, not claims that the mock run measured real hint effects.

### Post-mortems: raw history restored; judge plumbing and evidentiary checks fail

These probes captured outgoing request bodies using a local `fetch` stub. They test information flow and validation, not the quality of a real judge.

| Case | Result | Observation |
|---|---|---|
| Missing end record | PASS | Refused before either request. |
| Successful run | PASS | Refused before either request. |
| Regenerated secret differs from log | PASS | Refused before either request. |
| Raw-response and code sentinels | PASS | Both reached the responder and judge; the old summary-only failure is fixed. |
| Complete original record | **FAIL** | Original scaffold sentinel reached neither; detailed verifier-error sentinel reached the responder but not the judge. |
| `--judge-model review-judge` | **FAIL** | Both requests used `review-responder`; the saved record claimed judge `review-judge`. |
| Verbatim-claim/evidence and category validation | **FAIL** | A fabricated claim, nonexistent attempt 999, fabricated evidence and invalid category were accepted with `judgeError: null`. |
| End-record consistency | **FAIL** | A log claiming two completed attempts but containing one attempt record was accepted and made both requests. |

The old `flag`/`lag` substring contradiction mechanism is gone by source inspection. That is a repair; it does not establish that the replacement enforces its contract.

**Required fixes — §5:** [postmortem.js:34](C:/Users/Refur/LLMBreakthroughs/src/postmortem.js:34) does not forward the requested judge model, and `complete` currently accepts no per-call model override. Route the actual model and save the resolved request identity. Validate JSON shape, assessment/category enums, a verbatim claim span in the self-report, and localized evidence spans in the relevant attempt. Missing or invalid evidence must produce an annotation error or an explicitly unresolved assessment, not a usable contradiction label. Human adjudication remains necessary for semantic entailment even after span validation.

Archive the actual messages, original system/scaffold text and verifier responses at run time. Reconstructing them with today's `SYSTEM_BASE` and prompt builder is not the original record. Give both responder and judge that archive, with a declared context-overflow policy. Validate the complete log structure, including exactly one matching metadata/end pair and consecutive attempt records consistent with the end count. Matching the secret alone does not prove that the rules, visible data, prompts or generator behavior are unchanged.

### Reporter: point estimator repaired; data identity and boundary reporting remain unreliable

| Case | Result | Observation |
|---|---|---|
| Complete paired fixture with differences 1 and 0 | PASS | Reports 50 percentage points, as in the v2 reproduction. |
| Two experiment metadata records | PASS | Refused with exit code 2. |
| Duplicate condition/seed/repeat | PASS | Refused with exit code 2. |
| Different domains declared in condition configuration | PASS | Contrast explicitly refused. |
| Trial domain contradicts configuration | **FAIL** | Accepted a laggedRule/hiddenPeriod pairing and reported a 100-point laggedRule contrast. |
| Trial options contradict configuration | **FAIL** | Accepted `{k:40}` rows under `{}` configuration and said “identical generator options.” |
| Different trial generator versions | **FAIL** | Ignored `v1` versus `v2`; paired by seed and reported an effect. |
| Different configured options, no declared coupling | **FAIL** | Automatically assumed a shared draw and computed a contrast. |
| Zero differences | PARTIAL | Degeneracy is flagged, but `[0,0]` still appears as a 95% CI. |
| Every difference equals 1 | **FAIL** | Reports “no discordant worlds observed” although every world favors B over A. |
| Unequal repeats across worlds | **FAIL** | Mean world success is 50%, but the final success-by-budget entry is 67%. |
| A configured world absent in both arms | **FAIL** | Header says 2/4 trials present; the missing world has no table row or explicit disposition. |
| Repeat indices 10 and 11 when two repeats are configured | **FAIL** | Counts the observed world as complete. |
| One primary plus two secondaries | PASS, narrowly | Produces 95%, 97.5%, 97.5% intervals: correct alpha allocation for the stated separate secondary family. |

Per-condition Wilson intervals and conditional attempt medians are removed, and a per-world table is now emitted. Those v2 repairs are real. Its world-key cells currently contain unescaped `|` characters, breaking the Markdown table; that is a small presentation fix.

**Required fixes — §8:** validate each trial against an immutable expected-run manifest before aggregation: condition, allowed seed/repeat, domain, normalized options, generator/instance identity, model/configuration identity and batch. Pair using the registered world or shared-generation-block identity. Require an explicit coupling declaration for changed options; printing an assumption after silently making it is not validation. `experiment.js` must emit the missing provenance, not leave the reporter to invent it.

Construct missingness from the expected grid, including worlds absent in both arms, and enforce the registered retry/exclusion rule. Compute success-by-budget by first averaging repeats within each world, as the declared unit requires; its final-budget point should agree with the corresponding world-level success rate. The parameter curve also counts world-by-condition combinations as “worlds” and pools conditions; stratify it or name the pooled estimand and count correctly.

Suppress a degenerate percentile interval as an inferential interval and use a preregistered boundary-aware procedure, or report uncertainty as unresolved. Constant nonzero differences are distinct from zero differences. A warning appended to `[100,100]` does not turn it into an informative population interval.

The multiplicity formula does what §8 literally says for **secondaries among themselves**. It does not control a single 5% family-wise error rate over primary plus secondaries. With one primary and one secondary, both use .05; independent tests would yield `1 - .95^2 = 9.75%` family-wise error. State separate inferential families, make secondaries exploratory, or register gatekeeping/global adjustment. The allocation test above verifies arithmetic, not finite-sample bootstrap coverage.

## 2. Answers to the formal and operational questions in §11

### §11.2 — Are L0 and its certificates correct and sufficient?

**They are sound one-sided certificates under explicit execution assumptions. They are not a membership decision procedure, and the task certificate needs a precise pair-feature definition.**

For a fixed world and a deterministic, pure quantity `q`, if every expression in the actual registered grammar satisfies `q(s) = f(count(s))`, then finding `s,t` with `count(s) = count(t)` and `q(s) != q(t)` proves `q` is outside L0. This is sufficient for P-language in that direction. An induction over an actual grammar can prove the premise; a promise to write such a grammar cannot yet be audited.

Four commitments remain necessary:

1. **Correct §1.2's “membership is decided by witness pairs.”** A witness establishes nonmembership. Failure to find one means **unknown**, unless exhaustive coverage or another proof is available. Because `f` is restricted to an expression grammar, permutation invariance alone may not establish membership either: an invariant function of counts might still be outside that grammar.
2. **Freeze the semantics.** Specify alphabet, input domain, termination/resource bounds, canonical output equality and purity. Run both strings against the same frozen artifact/world with no call index, mutable state, randomness or external input. Test shuffled query order and repeated identical inputs. Otherwise a counter returning 1 then 2 “certifies” nothing about a function of a string.
3. **Tie the certificate to the useful submitted quantity.** An identity function `q(s)=s` supplies an immediate order-sensitivity witness but generally fails conservation. Require a separately validated conserved quantity, its fixed prediction rule and sealed task success above the computed L0 ceiling. Search for witnesses inside the declared task domain; an order-sensitive branch on irrelevant inputs is not evidence that order sensitivity solved the task.
4. **Specify verification of submitted quantities, not only the planted invariant.** §3.2's monoid-table proof certifies the generator's fold. Arbitrary submitted code does not inherit that proof. Require a checkable representation with corresponding algebra/rule obligations, a sound proof artifact, or explicitly report only bounded empirical conservation. Keep certificate-search failure separate from a demonstrated in-L0 solution.

For pair classification, the relevant feature is ordinarily the **ordered pair of full histograms**:

```text
h(a,b) = (count(a), count(b))
```

Hold the world's rules, training examples and fitted program fixed. For sealed examples grouped by `z=h(a,b)`, let `n_z+` and `n_z-` be their label counts. The maximum empirical accuracy of any deterministic classifier that sees only this feature is

```text
U_hist = sum_z max(n_z+, n_z-) / N
       = 1 - sum_z min(n_z+, n_z-) / N.
```

This is an upper bound for any L0-based classifier under that interface, even when not every histogram classifier is expressible in L0. Randomization cannot improve its expected accuracy. It is not valid if the classifier also receives raw strings, example indices or other distinguishing information. Compute it within worlds and aggregate using the registered world weights; pooling features across worlds can create false conflicts because a solver also knows which world it is solving.

**Matching histograms within each pair is insufficient.** Consider a positive `(ab,ab)` and a negative `(aabb,abab)`. Each pair has matching histograms internally, but their pair-feature classes differ, so a histogram classifier can attain 100%. For noncommuting transposition images in S3, these labels are consistent with invariant equality/inequality. By contrast, positive `(ab,ab)` and negative `(ab,ba)` occupy the same pair-feature class and force a 50% ceiling on those two examples. The accompanying calculation reproduces both ceilings; it is a demonstration of the feature-bound issue, not a fully nuisance-matched sampler.

The **mass** of these conflicts matters. If a fraction `alpha` of the weighted evaluation set is balanced within conflicting classes and the rest is perfectly separable, the ceiling is `1 - alpha/2`. Ten percent conflicting mass leaves a 95% ceiling, insufficient to rule out a histogram-only solver at a 95% pass threshold. Twenty percent leaves 90%. Register a strict gap below the task threshold and calculate it on the actual weighted evaluation set.

Finally, the empirical ceiling is exact for that finite set. A population ceiling needs a distribution construction that guarantees the conflict weights, or an additional statistical argument. Do not promote a finite certificate into a universal accuracy bound on other pairs.

### §11.3 — Does §3.4 specify a feasible sampler?

**No, not yet. Feasibility-first is the right repair, but the current constraints neither specify a complete string sampler nor apply to all admitted families.** Reporting an infeasible challenge family is an acceptable outcome; silently changing the target population until a desired result appears is not.

**First failure: the negative-only accuracy requirement.** §3.4.3 proposes at most 70% accuracy “on challenge negatives” for a joint classifier. An unrestricted classifier that always predicts negative attains 100% on that denominator. If the intended predictor is fixed invariant equality, say so and restrict its decision rule. If the intended comparator is the joint-feature classifier in §2.4, use balanced overall accuracy or a false-positive rate at a fixed true-positive rate, with a registered fitting protocol. Fixing a denominator does not fix an ill-defined classifier constraint.

**Concrete infeasible families:**

- **F-count and F-abelian, including `C2 × C2 × C2`.** The invariant is a function of symbol counts. Under the promise, positives have equal invariant values and negatives unequal ones. Full count features therefore determine the labels. No sampler can create opposite labels within the same full pair-histogram class. A joint feature set that recovers the invariant cannot be forced below 70% either. Mark the histogram challenge inapplicable/infeasible for these control families, rather than demanding it across all families.
- **An admitted nongroup monoid can have the same problem.** On three points, take the transformation monoid `{identity, constant-0}` and symbol images in that monoid. Product value depends only on whether a constant-0 symbol occurs. It is a nongroup F-monoid example with a completely histogram-based invariant; the non-group label does not imply the desired separation.
- **Even an ambient nonabelian group does not guarantee it.** If every symbol image in S3 is a power of one 3-cycle, the generated image is cyclic. The actual invariant is order-insensitive. Check the generated submonoid and reachable word support, not just the ambient algebra's name. A noncommuting image can also fail to be exercised under restrictive word-length/support choices.

**The feasibility problem must reach the string level.** Weights over unequal algebra values or group differences establish only an algebraic prerequisite. They do not establish that those values can be realized with the required word lengths, histogram classes, rewrite-connected positives and matched edit/LCS statistics. Nuisance conditioning can remove all usable witnesses or change their weights. Feasibility must be rechecked after word construction and matching.

A concrete small-instance test is to enumerate a bounded support of **actual labeled string pairs**, certify each positive by a rule path and each negative by unequal invariant values, then solve a weighted feasibility problem. Let pair weights be nonnegative, with total positive and negative mass each 1/2. For every joint coarse-feature class `z`, introduce `t_z` at least as large as its positive mass and its negative mass, and require `sum_z t_z <= tau`. Add the required histogram-conflict mass and registered nuisance-matching constraints. This bounds the optimal feature-only classifier on that support, rather than just the particular classifier that happened to be fitted. Publish feasible weights or an infeasibility result. Larger samplers can approximate this construction, but must then state which guarantees became empirical.

Two nearby specifications also need closure before that test is meaningful. In §3.5, define nuisance views separately from intended signal: count features on F-count and pattern features on a pattern-count family may be the legitimate solution, so a universal below-55% requirement would reject valid controls. In §3.2, the “number of inequivalent representations” needs an explicit bounded representation class and equivalence relation; otherwise there is no finite number to audit. Also state moduli/bounds for augmented counts and alternating sums, or provide a different conservation proof: unrestricted integer summaries do not have a finite table whose associativity can be exhaustively checked.

### §11.4 — Do the Phase 4 gates support a checkpoint-specific null?

**Yes as a diagnostic design, conditional on execution; not yet as a registered statistical conclusion.** C1 tests in-family synthesis, C2 establishes that target-exposed training can support the task, and C3 tests whether the withheld checkpoint can use a supplied representation. Passing all three makes a narrowly phrased failure substantially more informative. It still does not identify the missing internal concept, isolate the mechanism of failure or justify a general claim about the architecture.

The remaining commitments are:

- **Resolve the exposure rule — §§4.1–4.4.** “No quantity is order-sensitive” and “no target invariant solution is demonstrated” are different exclusions. Register what counts as a quantity and how helper documents are classified. Copying, indexing, reversing and bounded loops can teach sequence operations without demonstrating the target invariant, but broad wording can also forbid those documents. Publish representative allowed/rejected ASTs, including generic table evaluators and ordinary sequence helpers, and require the auditor to classify them consistently. Treat the resulting primitive exposure as part of the intervention.
- **Freeze the null and the event.** Specify world-level success, attempts/tokens/compute, conservation and witness requirements, a meaningful rate/effect margin, the interval/test, and treatment of unknown certificates, invalid code, timeouts and API failures. A zero count and a nonsignificant exposure contrast answer different questions. Report task success and certified out-of-L0 success separately, so a weak witness finder cannot manufacture a capability null.
- **Keep all selection on development data.** Register checkpoint/decoding selection, pilot stopping rules and whether the grid may proceed after a failed gate. Report every trained seed and failed gate, including seeds not retained for a confirmatory subset. The phrase “per retained seed” must not license silent filtering. Fresh confirmatory worlds must follow protocol selection.
- **Keep controls from becoming exposure.** C3 must use separate fresh contexts and frozen weights; supplied representations, control solutions and feedback cannot carry into the unprompted target condition. The same applies to C2's examples and development traces.
- **Define the matched intervention.** Fix the replacement rule, corpus-world sampling, token order, teacher/rendering style, initialization pairing and data seeds. Matching total tokens/steps does not isolate a mathematical concept if replacement also changes template diversity, output lengths or curriculum. The causal claim is the effect of the specified replacement bundle; replicate corpus generation if generalizing beyond one corpus is intended.
- **Specify inference across worlds and training runs.** Repeated attempts are not new worlds. Reusing worlds across checkpoints does not create independent model-world observations. Report the three training seeds individually as already promised, pair world comparisons appropriately, and distinguish uncertainty conditional on a checkpoint from variability over training runs.

For scale, under **one fixed checkpoint and protocol, one binary success event per independent sampled world, and no selection on those outcomes**, zero successes in `n` worlds gives the exact one-sided 95% upper bound

```text
p_upper = 1 - 0.05^(1/n).
```

It is **2.95% at n=100**, **8.94% at n=32**, and **7.22% at n=40**. Thus §8's 32–40 worlds cannot exclude a 5% success rate even with zero successes under these assumptions; 59 zero-success worlds are needed for that particular bound. This is not a power calculation for the paired exposure effect, which needs the planned hierarchical simulation and an effect-size target. The 100-world gate is a control-sample requirement, not automatically the confirmatory sample size.

For the gate itself, 90 successes out of 100 gives a two-sided 95% Wilson lower bound of approximately **82.56%**, satisfying the stated >80% condition if that is the chosen interval and those worlds are independent. Register the interval and the syntax-validity denominator explicitly. Passing a floor control does not supply the missing effect-size target or null-test power.

### §11.5 — Custody of F-sealed

**I can compute and verify a file commitment, but I cannot serve as the independent, author-blind custodian described in §3.3 through this author-visible chat and shared workspace.** An author-supplied specification already known to the author fails that definition before hashing. Calling its hash “sealed” would certify byte identity, not absence of designer knowledge. No F-sealed specification has been received or committed in this review.

Use an external collaborator who did not design the generator and does not share the development workspace:

1. Freeze public eligibility criteria, budgets, exclusions and a disclosure/evaluation schedule. The custodian privately chooses the family and sampling specification, without author-provided candidate content that defeats the intended blindness and without tuning to confirmatory outcomes.
2. The custodian retains the exact bytes plus a random salt and publishes a dated commitment over an unambiguous encoding of both. The salt prevents guessing a small menu of candidate specifications from the public hash. Use an external timestamped record; an editable local Git timestamp alone is insufficient provenance.
3. Commit the relevant generator/sampler specification, hidden-seed procedure and evaluation configuration. Freeze portfolio, scaffold and protocol before disclosure; document who can access the hidden material. If knowledge is meant to remain hidden through execution, the custodian must operate that portion of the evaluation.
4. At the registered release point, publish the bytes and salt, verify the commitment, and release the access/exception log.

If that arrangement is unavailable, use §3.3's disclosed-designer-knowledge fallback. I can help verify its hashes, but it must not be described as independent family selection or author blinding. Align §10's ordering with the selected commitment procedure before development begins.

## 3. The hostile referee paragraph for v3 — §11.6

> The revised claims appropriately distinguish training exposure, formal output behavior and latent capability, but the experiment still lacks an auditable bridge from those definitions to its reported outcomes. Its advertised verifier accepts zero-bit communication through the host and can hang outside the stated timeout; the reporter accepts trial records contradicting their condition configuration; and the post-mortem tool records a judge model it did not call while accepting fabricated quotations. The proposed L0 test is a one-sided nonmembership witness presented elsewhere as a membership decision procedure, and the task-level certificate is unspecified unless histogram classes, classifier access and conflict weights are fixed. The challenge sampler includes an impossible negative-only accuracy bound and does not establish joint feasibility of algebraic, string-level and nuisance constraints. Finally, the training exclusion and permitted sequence-processing exposure need an executable audit, while checkpoint-specific nulls still lack registered effect margins and handling of certificate failures and missing runs. The narrower scientific question is legitimate, but the current artifacts cannot yet support confirmatory performance or controlled-generalization claims.

**Does v3 answer this paragraph? Partly in intent, not in execution.** It answers the old internal-toolkit objection, defines reuse sensibly, separates oracle and implementable portfolios, and introduces useful gates. It does not answer the observed failures above. A credible response would be the repaired execution/record contract passing the old and new probes, a checked grammar and candidate-certificate implementation, and a sampler artifact that publishes feasible challenge weights or explicit infeasibility by family. Those artifacts, followed by a frozen protocol and untouched confirmatory worlds, would materially change the review.

## 4. Top three remaining changes

1. **Repair the evidence path before more confirmatory runs — §§1.1, 5–6, 8.** Replace the demonstrated execution boundary, validate trial/log identity, and fix actual judge-model routing plus quote checks; these are reproduced failures that can invalidate otherwise sound experiments. Require the accompanying probes to pass before collecting more data.

2. **Turn the two central formal promises into small executable artifacts — §§3.2–3.5, 4.1–4.4.** Publish the actual L0 grammar/proof, pure candidate interface and one-sided certificate verifier, then demonstrate a string-level feasible challenge sampler with a computed histogram/joint-feature ceiling; report inadmissible families explicitly. This resolves the biggest remaining design ambiguities before model or GPU spending.

3. **Freeze the complete estimand and commitment package — §§3.3, 4.5, 8–10.** Register exposure-helper boundaries, matched replacement, selection/gates, missingness, certificate failures, boundary intervals and null/effect margins, and use either genuine external custody or the disclosed fallback. Most of this is inexpensive specification work; it prevents a successful engineering pilot from being mistaken for a pre-specified confirmatory result.
