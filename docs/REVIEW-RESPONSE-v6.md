# Sixth review: whydidntyou, Plan v3.3

Reviewed on 2026-11-03 against the local working tree. [PLAN.md](C:/Users/Refur/LLMBreakthroughs/docs/PLAN.md) SHA-256: `a7e560cb843cc8448483e6f9b81336eddf128760c3efe473caf709185820d5b1`. Runtime: Node v22.23.4, quickjs-emscripten/core 0.32.0. [REVIEW-EVIDENCE-v6.json](C:/Users/Refur/LLMBreakthroughs/docs/REVIEW-EVIDENCE-v6.json) records the source hashes, WASM hash and 95 completed regression checks.

**Verdict: the reproduced v5 failures are repaired. The new claim of one enforced typed contract is not true of the writer, and the instance digest is unsuitable for the duplicate-content check attributed to it. The ambient-information audit is incomplete. Section 4.2 is mathematically implementable, but still needs a concrete registered construction and an explicit conditional estimand for excluded worlds.**

Scope: the 95 recorded checks completed before the user instructed me to stop the activity triggering protections. All met their individual expectations; this is a regression result, not a security certification. An exploratory ambient-information check produced no usable result and is excluded from that evidence. I then stopped executing probes and completed the review by source inspection. New cases below are explicitly labeled **not executed**. No further adversarial execution or retry was attempted. No paid model calls were made, and project source was not changed.

No engine-level host-memory or operating-system escape was demonstrated. This response contains no reproduction of such an escape. The disclosure rule in §11 remains applicable if one is found later.

## 1. Verifier, ambient information and attempt retention — §11.1

### Verified repairs

The archived v5 payloads were replayed against a separate copy of the current source and installed dependencies. The asynchronous evaluator API was retained. Reporter/post-mortem fixtures were supplied with the newly required run identities and instance digests so they exercised their intended checks instead of failing on an unrelated missing field. Model responses were locally intercepted or mocked.

| Regression | Observed result |
|---|---|
| Shipped ten-capability probe | `0000000000`; the probe ran successfully. |
| Three v5 Date aliases | `000`; all three tested paths are unavailable. |
| Four v5 one-symbol timing-channel trials | All rejected because Date is undefined. |
| Ordinary recursion and deep nesting | Both return an in-interpreter `stack overflow`, without an uncaught host exception. |
| Recursion through `runAttempts` | Complete `meta`, `attempt`, `end` sequence; no caught outer exception. |
| Prior Node filesystem/process/environment/SQLite routes | Rejected through the tested routes. |
| Prior shared-object, proxy, getter, serializer and Promise cases | Returned bounded failures in these runs. |
| Backtracking expression and input-property setter cases | Returned failures; no external termination was needed. |
| Allocation loop | Returned `out of memory`; about 1.64 seconds for a requested 200 ms interrupt budget. |
| Shipped self-test | Passed, including all nineteen regressions. |
| Pinned real lag-bank submission | Approximately 0.995 bits/symbol on laggedRule and 2.558 on hiddenPeriod, preserving the expected success/failure distinction. |

The allocation result is consistent with the revised description of a cooperative deadline. Do not revive v5's hard-deadline objection as though §6 still promises one. Likewise, the Date and ordinary-recursion failures should be marked closed, not carried forward as active defects.

### The randomness audit is not established by the ten-bit probe

**Objection — §6 and §12:** the plan says built-in facilities have been audited for ambient information, including the randomness source. The capability probe contains no randomness test. [sandbox.js](C:/Users/Refur/LLMBreakthroughs/src/sandbox.js:15) disables Date while retaining the other default intrinsics; it does not define a deterministic randomness policy or explicitly remove `Math.random`.

There is a concrete reason to inspect this path: upstream QuickJS initializes its random state from `gettimeofday` in `js_random_init`, separately from the Date object. That upstream implementation motivates an audit; it is **not proof that the installed WASM build exposes a recoverable clock**. Establish the behavior of the exact pinned build before making that claim. [Upstream QuickJS source](https://github.com/bellard/quickjs/blob/master/quickjs.c)

**Fix/test:** specify whether randomness is forbidden or supplied by a fixed, documented generator, and verify that policy against the pinned interpreter build. Audit context initialization and the actual built-in implementation, not just the existence of Date. A future approved check should distinguish absence, deterministic sequences, and dependence on host state. I did not complete that check here and claim no new timing channel.

This matters independently for §4.2: its witness certificate assumes a pure deterministic quantity. Repeating an order-sensitive-looking output from a stochastic program is not a certificate that the quantity depends on order. Determinism needs an enforced execution contract, rather than a sentence in the proof assumptions.

### Narrow the remaining lifecycle claim

The reproduced interpreter failures now become logged attempts. However, [run.js](C:/Users/Refur/LLMBreakthroughs/src/run.js:29) awaits the model call before writing the attempt record, and that call can throw. No terminal failure record is written along that path. This is a **source-level observation, not a newly executed submission attack**.

The reporter's default refusal of incomplete batches limits the damage; it does not supply the missing disposition. Specify separate states for a completed failed submission, a failed request and an interrupted run. Register which budget a failed request consumes and preserve a terminal status or resumable event record. Do not count an API failure as evidence that the solver tried and failed. The current repair supports “these submitted-program failures are retained,” not “every started run has a complete audit trail.”

## 2. Shared validation, world identity and post-mortems — §11.2

### The v5 record fixtures pass

| Previously failing or required check | Result |
|---|---|
| Missing batch/model identity | Refused. |
| Contradictory trial `budgetExhausted` | Refused. |
| Wrong `end.maxAttempts` | Refused. |
| String `budgetExhausted: "false"` | Refused. |
| Missing `meta.system` or `end.success` | Refused before model requests. |
| Seed `2^32 + 1` | Refused by the generator and reporter configuration check. |
| Final verifier feedback under full, summary and last-code memory | Reaches both responder and judge. |
| Exact/newline-sensitive quotations and unverifiable-with-evidence | Correct acceptance or unresolved status retained. |
| Fresh hint-output directory | Run succeeds. |
| Hint header and job references | Recomputed digest matches, header precedes jobs, all three jobs reference it. |

The other replayed outcome, generator-version, duplicate-row, missingness and contrast fixtures also passed. Missing-world handling still distinguishes refusal from an explicitly exploratory read-out. No new statistical interval result was inferred from this small fixture set.

### Finding 1: the writer does not use the shared contract

**Objection — §8, §12 and the v6 request:** [run.js](C:/Users/Refur/LLMBreakthroughs/src/run.js) neither imports nor calls `validateRunLog` or another record validator. [experiment.js](C:/Users/Refur/LLMBreakthroughs/src/experiment.js) also constructs and appends trials without `validateTrial`. The generator's call to `assertSeed` is not validation of the run or trial record. The claim that one typed contract is shared by the writer and both readers is therefore false as implemented.

This is operationally relevant. `runAttempts` converts `attempts` with `Number(...)` but does not require a positive integer before creating its log. Its seed is converted for generation but the original value is written into metadata. Model requests can therefore start, or malformed runs can be written, before readers reject the configuration.

**Fix:** normalize command-line inputs once, validate the complete run/experiment configuration before creating a batch or making a request, and use shared constructors/validators when writing each record. Derive the outcome once and use it in the writer, reporter and post-mortem path. Preserve interruption as a distinct state rather than relaxing the schema for completed runs.

**New cases to add, not executed:** zero/fractional/invalid attempt budgets at the writer; a numeric command-line seed yielding a numeric logged seed; an unsupported memory mode; a writer-generated run accepted by the common reader without coercion.

### Finding 2: the digest cannot perform its claimed content-alias check

**Objection — §8:** both generators compute this structure:

```text
SHA256([family, version, seed, opts, sample, test])
```

See [laggedRule.js](C:/Users/Refur/LLMBreakthroughs/src/domains/laggedRule.js:51) and [hiddenPeriod.js](C:/Users/Refur/LLMBreakthroughs/src/domains/hiddenPeriod.js:38). Including the seed makes this a provenance digest, not a seed-independent content identity. Two seeds that produce identical content still hash different serialized inputs. Consequently, [report.js](C:/Users/Refur/LLMBreakthroughs/src/report.js:39) cannot detect those aliases by comparing the generator's digests. It can detect two rows carrying the same supplied digest, which is a different property.

The uint32 restriction **does** close the particular v5 out-of-range alias. I have not demonstrated another duplicate full world in the current default distribution, and this finding should not be reported as one.

There is also no reporter-side recomputation of an instance digest, no check that repeats of the same world retain one digest, and no equality check between paired conditions with identical generator options. A nonempty string satisfies the trial's digest type check. Post-mortems do regenerate and compare the digest; the reporter does not provide the same guarantee.

**Fix:** keep the provenance digest, and add a separately named semantic world digest over canonical task-defining content, excluding seed labels and irrelevant option spelling. Define whether “world” means a latent generator, a particular public/sealed dataset, or both; hash the relevant secret/rules, effective parameters and data accordingly. Canonicalize defaults. Verify digests against generated artifacts or a frozen manifest; require identity across repeats and same-world conditions. For different options, use the separately registered latent-draw coupling identity.

**New cases to add, not executed:** identical semantic payloads under two seed labels; an arbitrary nonempty digest; different digests across repeats; different digests in otherwise identically configured paired conditions. Also decide whether genuine independent draws that happen to coincide remain draws from the stated population or are conditioned away: silently deduplicating by content changes the sampling distribution too.

### Finding 3: the shared contract is still shallow and readers supply different extra rules

These are direct source observations in [validate.js](C:/Users/Refur/LLMBreakthroughs/src/validate.js:12), not claims of newly observed end-to-end acceptance:

| Gap | What follows from the code | Specific repair/test |
|---|---|---|
| `assertSeed(Number(meta.seed))` | Log validation coerces strings, booleans and null instead of enforcing a numeric field. Post-mortems repeat the conversion. | Normalize at input; assert the stored field without coercion. Test `null`, `true` and `"1"` against the stored schema. |
| `meta.instanceDigest` is absent from the run validator's identity list | The advertised shared validator does not require this identity. Post-mortem's later regenerated comparison compensates in that consumer. | Require the field and its canonical format centrally. |
| Attempt result validation checks only boolean `ok` | A successful-looking result can lack score fields. `isSuccess` then treats a missing ratio as failure rather than invalid evidence. | Use distinct result variants with finite numeric scores and consistent units; reject `{ok:true}`. |
| End success is checked against counts, not attempt results | The shared function alone does not establish one actual success event. Post-mortem adds a separate test for successful attempts in a failed run. | Derive first success from validated results; check it against the terminal state and early stopping. |
| `messagesSent` needs only to be a nonempty array | Message role/content types are unchecked; post-mortem dereferences the first item's content and labels it as a user task. | Validate the message shape and initial role before transcript construction; test empty objects and incorrect roles. |
| Memory and options are only weakly typed | Unknown memory strings and arrays used as options can evade the intended domain of the contract. | Enforce the registered memory enum and a plain options object with domain-specific fields. |

The distinction matters: a post-mortem rejection does not prove that the shared validator enforced the rule, and a validator acceptance does not prove that every consumer accepts the record. Report the responsible layer honestly. The goal is consistent states and outcomes, not an accumulating list of checks split among consumers.

### Finding 4: the new evidence-scope policy has not reached the judge prompt

**Objection — §5:** the plan now says claims about prompts or verifier feedback are unverifiable until typed evidence spans exist. The actual [judge instructions](C:/Users/Refur/LLMBreakthroughs/src/postmortem.js:42) ask for assessment against the complete record and an exact response quotation, but do not state that restriction. A matching response substring establishes quotation provenance, not that the quoted response supports a claim about another record type.

**Fix/test:** put the restriction into claim selection, judge instructions and human adjudication guidance now; add typed evidence later. A future fixture should use a claim whose truth depends only on the initial task or feedback, while an attempt merely repeats the claim. Require unverifiable under the current evidence schema. This test was not executed. The previously verified exact-span behavior remains repaired.

## 3. Is §4.2 implementable without interpretation? — §11.3

**Yes as a mathematical construction; no as a fully specified execution protocol.** The revision closes the specific v5 ambiguities: the weighted formula is explicit, both feature bounds must hold on the final sealed examples, the interface hides administrative identifiers, and failed construction has a stated disposition. There is no remaining algebraic objection here that warrants another conceptual rewrite.

For total weight `W > 0`, the formula

```text
U_hist = sum_z max(W_z+, W_z-) / W
       = 1 - sum_z min(W_z+, W_z-) / W
```

is the exact finite-set optimum for a classifier restricted to that feature. Checking the richer joint feature separately is necessary and now required. The constant-output classifier, class-specific majority classifier and conflicting-class construction supply straightforward independent checks of the calculation.

Four execution decisions remain necessary before confirmation:

1. **Freeze a concrete construction.** Publish the eligible strings and length bounds, positive path certificates, negative invariant inequalities, exact joint feature map, threshold, class quotas, matching constraints, rounding algorithm, tolerances and zero-weight rules. Export one complete small world and let a separate checker recompute both ceilings from its final examples. A prose requirement to do this is not the artifact.

2. **State the estimand after construction failures.** Section 4.2 explicitly excludes defective worlds from the denominator. That is permissible for a declared population conditional on successful construction; it does not estimate performance over all proposed worlds. Report proposed, calibration-eligible, construction-valid and evaluated counts by family, every excluded seed and the defect reason. Require a minimum number of valid independent worlds and a predeclared handling rule if it is not reached. Do not use the planned sample size in uncertainty calculations after exclusions reduce it.

3. **Make certificates and solver evaluations use the same execution semantics.** Enforce deterministic, pure per-pair evaluation; bind the validated quantity, classifier/prediction rule and resource budget to the scored artifact. Presentation-order tests are useful but are not a proof of purity. Do not confuse invariance to the order of evaluation pairs with permutation invariance of symbols inside a string: the latter is exactly what an out-of-L0 witness violates.

4. **Keep construction checks independent of outcomes.** Store the final set, both ceilings and its disposition before running any solver. A failed assertion should stop that world's evaluation and enter the disclosed defect ledger. Register whether a construction bug aborts the batch; changing the generator requires a new freeze, not silent repair of selected worlds.

The registered null bound must use the actual valid world count and its declared target population. For example, zero successes after exclusions uses `1 - 0.05^(1/n_valid)`, not the originally scheduled `n`. This is a consequence of the new disposition rule, not a new objection to the bound itself.

The missing L0 grammar/proof, exposure-helper AST list, identifiability equivalence relation and per-family nuisance specification remain pre-execution deliverables. They are not evidence that the corrected §4.2 construction is impossible. The custody wording in §§9–10 is now synchronized; the remaining doubled `##` in the §9 heading is cosmetic.

## 4. Strongest hostile reading

> The authors have closed the previously reproduced Date and recursion failures, and the finite-set separation argument is now coherent. Nevertheless, the claimed common typed contract is not called by the writers, validates only shallow result/message shapes, and relies on different additional checks in different consumers. The advertised duplicate-world defense hashes the seed into the purported content identity, defeating its stated purpose, while the reporter does not verify that supplied digests describe the paired worlds. The claim of an audited randomness boundary is not supported by the ten-capability test. Finally, excluding failed sealed constructions changes the population to which reported success rates and null bounds apply, without yet delivering a concrete checker-verified generator configuration. These are measurement and provenance defects that must be resolved before confirmatory conclusions; the paper cannot substitute another passing regression list for those contracts.

The plan answers the prior hostile paragraph substantially. It does not yet answer this one. Closure requires writer-side validation, coherent result/message/outcome schemas, semantic identity tied to artifacts, evidence for the pinned randomness policy, and one independently checked constructed world with explicit exclusion accounting. I have not demonstrated a new escape or host hang in this review, and the hostile paragraph should not imply that I have.

## 5. Ranked changes

1. **Actually enforce one typed contract — §§5, 8, 12.** Validate before work starts and before records are written; normalize input once, validate messages and result variants, and derive the terminal outcome from validated attempts. Align the judge's claim scope with §5 at the same time.

2. **Separate provenance from semantic world identity — §8.** Remove seed labels from the semantic digest, define the world being counted, and bind digests to artifacts with consistency across repeats and paired conditions. Keep provenance hashes separately, and state whether collisions are independent draws or excluded duplicates.

3. **Turn the remaining execution assumptions into freeze gates — §§3.4, 4.2, 6.** Resolve the pinned interpreter's randomness policy and export a complete checker-verified sealed-set example before confirmation. Register the conditional population, defect ledger and minimum valid-world count; the new-probe portion of this review remains incomplete under the user's stop instruction.
