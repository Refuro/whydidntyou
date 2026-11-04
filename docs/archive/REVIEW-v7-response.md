# Seventh review: whydidntyou, Plan v3.4

Reviewed on 2026-11-03 against the local working tree. [PLAN.md](C:/Users/Refur/LLMBreakthroughs/docs/PLAN.md) SHA-256: `808e45f2e2d7f38210e27bb688c76a33a25f93800b11c413113cce9173674a4c`.

**Verdict: the main v6 repairs are present, but the measurement pipeline still changes the meaning of interrupted runs, accepts contradictory records, and lets the writer produce batches the reporter refuses. The RNG replacement is supported by source inspection; the shipped test and the claim of enforced quantity determinism are broader than the evidence. The revised null estimand needs reconciliation with the new distinct-world sampling policy.**

This round used source inspection and **49 ordinary record-fixture observations**, with Node v22.23.4. No sandbox submission or self-test was executed. Model transport was replaced locally; attempt responses contained no executable code, and workers prohibited WASM instantiation. No live model requests or project-source edits were made. Author-run sandbox regressions are not represented as independently rerun here.

Artifacts: [fixture evidence](C:/Users/Refur/LLMBreakthroughs/docs/REVIEW-EVIDENCE-v7.json) and [ordinary record checks](C:/Users/Refur/LLMBreakthroughs/docs/REVIEW-CHECKS-v7.mjs). The evidence pins all inspected source files. Fixture outcomes are targeted checks, not an aggregate certification score; the deliberately noncompliant judge response is labeled a semantic-enforcement demonstration rather than a model-behavior test.

To reproduce the record fixtures from the repository root with its dependencies installed:

```powershell
node docs/REVIEW-CHECKS-v7.mjs . "$env:TEMP\whydidntyou-v7-evidence.json"
```

## 1. Is the contract enforced consistently? — §11.1

**No.** `run.js` now calls validators before appending metadata, attempts and terminal records; the previous missing-call objection is closed. Completed experiment trials also pass through `validateTrial`. The gaps are now specific: incomplete experiment preflight, unvalidated failure records, inconsistent terminal states, and reported fields that are not tied to their purported evidence.

### 1.1 Interrupted hint runs become completed solver failures

**Breaks §§5 and 8.** The new `runAttempts` interruption path returns normally with `interrupted: true`. [hints.js](C:/Users/Refur/LLMBreakthroughs/src/hints.js:39) does not inspect that field. It stores `success: null` without an error, and its summary counts every result without an error as completed.

**Observed:** I made all three local hint-arm requests fail before any response. The underlying runs were interrupted, but each arm reported:

```text
assigned=1, completed=1, failed=0, wins=0, n=1
```

There were zero completed solver trials. The output nevertheless creates three negative observations and displays differences against the control. This can bias hint effects when request failure rates differ between arms. It directly contradicts the printed statement that API-failed jobs are excluded.

**Fix/test:** propagate terminal status and reason into hint-job records; increment the interruption count and keep these runs out of the completed-solve denominator under the registered policy. Audit every `runAttempts` consumer for the changed return contract. Retain this three-arm fixture and add a mixture of completed and interrupted arms so the denominator is checked, not merely the presence of a reason string.

### 1.2 Writers still produce batches their reader refuses

**Breaks §8's “configuration before any request” claim.** [experiment.js](C:/Users/Refur/LLMBreakthroughs/src/experiment.js:18) has a separate, partial configuration validator. It does not enforce all the reporter's policy fields or preflight every condition.

Each fixture below used one condition, one seed and two attempts. Each writer made **two mocked requests**, exited successfully and wrote a completed trial; the reporter then refused it:

| Configuration | Reporter refusal |
|---|---|
| Missing generator-version pin under `missingPolicy: "refuse"` | Required pin absent. |
| Pin set to an incorrect version | Actual generator version differs. |
| `missingPolicy: "typo"` | Invalid policy. |
| `sharedWorld: "false"` | Coupling flag is not boolean. |

A fifth fixture put an invalid memory mode in the second condition. The writer first completed the first condition's two requests, then wrote a setup-failure row for the second. This is validation during execution, not validation of the full design before execution.

**Fix/test:** use one configuration validator in both writer and reporter, covering the whole grid, version pins, policies, contrasts, domains, memory modes and option schemas. Run it before the batch header and first request. Keep a table-driven test requiring zero requests for each invalid configuration and requiring every completed writer-produced batch to be readable under its own policy.

### 1.3 Failure records bypass the contract

**Breaks §§8 and 12.** [experiment.js](C:/Users/Refur/LLMBreakthroughs/src/experiment.js:34) appends `trial-failed` records without a validator. [report.js](C:/Users/Refur/LLMBreakthroughs/src/report.js:17) separates them from successful trial records, but never validates their batch identity, slot, reason or uniqueness.

Observed ordinary record fixtures:

- A failure record from a **different batch** supplied the reason for a missing trial in this batch.
- Two failure records for the same slot were accepted; the first reason won.
- A completed trial and a failure record for the same slot were accepted together. The report said the batch was complete, with no missing trials; the contradictory failure disappeared from its accounting.
- Under the default `missingPolicy: "refuse"`, a legitimate interruption caused refusal **before** the `.missing.json` ledger was written. The refusal reported a count, without the recorded reason. Exploratory mode did preserve the reason.

**Fix/test:** give failure records their own typed variant and validate all records before partitioning them. Permit one terminal outcome per `(batch, condition, seed, repeat)`, unless an explicit retry-event protocol says otherwise. Reject conflicting or foreign records. Produce the missingness/diagnostic ledger before refusing inferential analysis; refusal should not require switching to exploratory mode to see the reasons.

### 1.4 Typed numbers do not establish a coherent outcome

**Breaks §8's derived-success contract.** [validateResult](C:/Users/Refur/LLMBreakthroughs/src/validate.js:32) checks finite fields but not their arithmetic relationships. [validateEnd](C:/Users/Refur/LLMBreakthroughs/src/validate.js:60) derives success from the supplied ratio but does not always enforce the budget or legal terminal state.

These fixtures were accepted:

| Accepted record | Contradiction |
|---|---|
| `bits=12000`, `bitsPerSym=3`, `baseline=3`, `ratioToBaseline=0` | The supplied ratio classifies an uncompressed result as success. |
| Metadata budget 1; first attempt fails; second succeeds; completed end says success 2 | Success occurred outside the declared budget. |
| `status: "interrupted"` after an already successful attempt | The writer stops at success and cannot produce this state. |
| `status: "interrupted"` after all budgeted attempts have failed | The writer would have completed the failed run. |

The reader also accepts metadata budgets above 1000, while the writer's normalizer refuses them. These are concrete reader/writer disagreements; they are not claims that the current evaluator spontaneously emits forged scores.

**Fix/test:** derive ratios from authoritative counts, sequence length and positive reference rates; reject inconsistent or out-of-domain metrics. Enforce `attemptsUsed <= maxAttempts` for every terminal state, and require interruption to occur before success and before exhaustion under the current protocol. Use one budget range. Test the state transitions, including illegal combinations, rather than treating each field's type as sufficient validation.

The options contract is similarly incomplete: the normalization-only fixture `{A:1, p:2, n:-1, k:0}` was accepted. I did **not** generate or execute that configuration. Register and enforce domain-specific ranges, integrality and applicable keys before generation; “finite number with a known key” is not a valid generator configuration.

### 1.5 Regenerated digests do not authenticate reported outcomes or strata

**Breaks §8's reporting integrity.** The reporter now correctly regenerates instance identity. It still trusts `success`, `attemptsUsed` and the copied `secret` independently of the linked run or regenerated instance.

Two fixtures demonstrate the distinction:

- A trial row claimed success on attempt 1 while linking to the writer-produced log containing two failed attempts and `success: null`. The reporter accepted it and changed condition A's success rate to 50%, producing a −50 percentage-point contrast. It never opened the linked log.
- A row retained correct instance/world digests but replaced its displayed secret with `{k:999}`. The reporter accepted it and printed a hidden-lag stratum at 999.

**Fix/test:** validate and bind each trial summary to its run log, or derive the summary from that validated log. Use the regenerated secret for stratification, or require exact agreement. A digest of the intended task does not cover independent fields placed beside it. These checks protect against stale or incorrectly merged summaries as well as deliberate edits.

There is still a `Number(meta.seed)` in post-mortem reconstruction, but schema-4 validation now rejects nonnumeric stored seeds first. That residual conversion is redundant, not the earlier coercion bypass. Remove it for consistency without presenting it as an active failure.

## 2. Required record fixtures — §11.2

The requested v6 cases now have executable, non-sandbox evidence:

| Requested case | Result and scope |
|---|---|
| Invalid writer budgets | Zero, fractional, nonnumeric and greater-than-1000 budgets refused before requests. |
| Invalid writer seeds/memory | Null, boolean, out-of-domain seed and unknown memory mode refused before requests. |
| Numeric command-line values | String seed `"1"` and budget `"2"` normalize once; numeric seed is stored and the completed log validates. |
| Stored-field coercion | Stored string, boolean and null seeds refused. |
| Identical semantic content under different seed labels | Verified using an actual small-support generator fixture; see below. |
| Arbitrary provenance/semantic digests | Valid-length arbitrary hashes refused against regenerated content. |
| Different digests across repeats | Refused during regeneration. |
| Different digests across identically configured paired conditions | Refused during regeneration. |
| Explicit versus omitted ordinary defaults | Same semantic digest, different provenance digest, as intended. |
| Interruption before first response | `meta`, interrupted `end`, zero attempts consumed. |
| Interruption after one response | `meta`, `attempt`, interrupted `end`, one attempt consumed. |
| Interrupted run through experiment/post-mortem | Experiment records the failure; exploratory report retains its reason; post-mortem refuses before requests. Default-ledger and hint-consumer defects are in §1. |

For the same-content test, hiddenPeriod with `{A:2, p:1, L:1, n:1}` produced the same secret `K=[1]`, sample `[1]` and test `[1]` for seeds **1 and 3**. Their semantic digests matched and provenance digests differed. The reporter refused them as duplicate worlds. This is a deliberately small valid support that exercises the collision policy, **not evidence that the default 4000-symbol experiment contains duplicate worlds**. The v6 digest-design objection is closed.

The repeat/pair fixtures were caught by regeneration before the later consistency checks. They establish end-to-end refusal, not independent coverage of every defensive branch.

### Judge scope: repaired instruction, limited evidence

The scope restriction now reaches the judge. I used the claim “The task prompt told me to test lag thirteen,” repeated in an attempt response, and checked the captured request. It explicitly said prompt-dependent claims must be unverifiable even if an attempt repeats them. A compliant stubbed answer was recorded as unverifiable.

A deliberately noncompliant stubbed answer saying “supported,” with that exact attempt quotation, was accepted by substring validation. This identifies the enforcement boundary; it does **not** measure how often a real judge ignores the instruction. The former missing-instruction objection is closed. Actual compliance remains a model/human annotation question, consistent with the plan's separation of provenance and entailment.

**Fix/test — §5:** keep raw judge labels provisional until the registered human scope/entailment review, or record that status explicitly. Include prompt-dependent, feedback-dependent and response-supported controls in the blinded annotation set and report violations. Do not claim that a mock returning the desired label validates a judge's behavior.

Documentation cleanup: §5 and the post-mortem comments still describe schema 3, and post-mortem output itself remains schema 3 while its input is schema 4. Distinct artifact schemas are possible, but document that distinction. Remove the obsolete §8 digest paragraph that still attributes collision detection to the seed-bearing digest.

## 3. Is the randomness evidence adequate? — §11.3

**Adequate source evidence for the direct replacement; inadequate evidence for the full §6 wording.** I did not execute the RNG tests.

[sandbox.js](C:/Users/Refur/LLMBreakthroughs/src/sandbox.js:21) installs a fixed-seed generator before submitted code runs and defines the original Math object's `random` property as non-writable and non-configurable. The obvious v6 path is addressed in the implementation. Calling the algorithm xorshift128+ in a comment while implementing xorshift128 is a naming error, not evidence of an ambient channel.

Three claims need narrowing or stronger evidence:

1. **The regression compares only four random bits.** [selftest.js](C:/Users/Refur/LLMBreakthroughs/src/selftest.js:141) reduces four outputs to `floor(random()*2)`, compares two runs, then tests one attempted assignment. A wrongly retained but locked RNG with independent fair outputs has a **1/16 = 6.25%** probability of matching the four-bit sequence by chance. A locked constant generator also passes the equality check. Use a full-precision registered output vector or digest of many outputs, compare against an independently computed expected vector, and inspect the property descriptor. Cross-run equality alone does not verify the specified generator.

2. **Different pre-replacement sequences do not identify time as their cause.** Two runs 1.2 seconds apart establish variation across runs, not specifically host-time seeding. Retain pinned implementation/build evidence for the causal claim, or call the observation nondeterminism. The author may have stronger evidence; the quoted two-run observation alone is insufficient.

3. **Deterministic RNG initialization does not enforce a pure quantity.** A stateful program can produce different outputs on repeated calls even with a fixed seed. The existing harness creates fresh encoder/decoder instances; it does not yet implement the Phase 2 witness-evaluation interface. The conclusion that §4.2 quantity determinism is “therefore enforced” gets ahead of that implementation. Define fresh canonical state per quantity evaluation, including PRNG state, or otherwise enforce purity; evaluate both witness strings under that contract. Do not let a timeout or other invalid evaluation count as a differing quantity output. Wall-time interruption also makes completion near the budget boundary sensitive to execution conditions even when successful values are deterministic.

The assignment test concerns one property on the original Math object, not immutability of every reachable program binding. Replacing that property with a fixed generator is useful; proving all program behavior deterministic is a different obligation. None of these observations demonstrates a new clock channel, host escape or engine defect. Keep the “no channel is known” statement separate from the unearned universal enforcement statement.

## 4. Does §4.5 state the estimand correctly? — §11.4

**It repairs the construction-exclusion issue, subject to conditions the new §8 policy now complicates.** Using actual `n_valid`, declaring a construction-valid population, recording the staged denominator and requiring a new freeze for generator changes are the right commitments. Three remaining points must be explicit.

### Construction-valid is not the same as completed by this model

State the probability measure, not only the support: probability of certified success for a fixed checkpoint, budget and decoding protocol, over the registered world-generating distribution conditional on calibration eligibility and successful sealed-set construction. Use the same construction-valid world set for the exposed/withheld comparison.

“Actually evaluated” must not introduce an unacknowledged model-dependent completion filter. Request failures, unfinished jobs and construction defects are different events. Register retry/censoring handling and report unresolved evaluations; do not remove a difficult model's interrupted runs and claim a rate over all construction-valid worlds. The hint bug in §1.1 is a concrete example of how this distinction can be lost downstream.

### Distinct-world sampling is not the independent-draw model used by the null bound

Section 8 now refuses independent draws that happen to have identical semantic content and calls the population “distinct generated worlds.” That describes an exclusion policy, not a probability distribution or a sampling design. Rejecting repeated content does not make the generator uniform over its distinct outputs.

The derivation of `1 - 0.05^(1/n_valid)` uses `P(zero successes) = (1-p)^n_valid` for independent trials with common success probability. Keeping only distinct worlds creates a without-replacement or batch-conditioned design. The exact binomial expression does not follow automatically. The current reporter goes further than excluding one seed: it refuses the whole file at the first collision. The plan has not specified what batch/seed replacement then occurs.

**Fix/test:** register the draw, collision and replacement algorithm and the target weighting. Either retain genuinely independent draws with coincidences identified as such, or analyze a specified distinct-world sampling design. For uniform sampling without replacement from a finite population of size `N` with `K` successful worlds, the zero-success probability is `C(N-K,n)/C(N,n)`; nonuniform generation needs its own design calculation. If collisions are argued negligible, give a bound under the actual generator and state the approximation. Do not quietly retain an exact independent-draw interval after changing the sampling scheme.

### Freeze the conditional comparison and stopping rule

Fix the minimum valid count, replacement limits and response to a failed minimum before outcomes. A rule that continues only after seeing failures is not the registered fixed-sample zero-event experiment. Likewise, the construction-valid subset and family mixture must not vary between exposure arms. The defect ledger should be written before any solver result and retained even when reporting refuses a batch.

Under the independent-draw interpretation and those gates, the revised zero-event calculation is fine. Under the new distinct-world policy as currently stated, the target measure and interval justification remain incomplete. This is a sampling issue, not another objection to the corrected finite-set histogram ceiling.

## 5. Hostile paragraph and ranked changes — §11.5

> The revision repairs semantic world digests and several previously missing writer checks, but its measurement contract still fails end to end. The new interruption return value is silently counted as a completed solver failure by the hint experiment. Experiment writers spend requests on configurations their own reporter refuses; failure records bypass batch and uniqueness checks; and accepted outcome summaries can contradict their linked attempt logs while parameter curves use unverified copied secrets. The randomness regression observes only four bits and does not establish the claimed purity of future quantity evaluations. Finally, the paper combines an independent-world null bound with a distinct-world rejection policy whose probability measure and replacement rule are unspecified. These defects can change denominators, outcomes and the population being estimated. Passing another set of local type checks does not make the proposed confirmatory measurements interpretable.

The plan does not yet answer that paragraph. It now answers the v6 complaints about absent writer calls, seed-bearing semantic identity and the missing judge-scope instruction; those should stay closed. The remaining objections require observable consistency across consumers and a specified sampling design.

1. **Preserve interruption throughout the pipeline — §§5, 8.** Fix hint denominators, validate `trial-failed` records with one terminal outcome per slot, and always emit the diagnostic missingness ledger. This is the highest-return repair because the current code converts transport failures into scientific observations.

2. **Make configuration and outcome validation genuinely shared — §8.** Preflight every condition and policy before requests, enforce legal budget/state transitions and consistent score arithmetic, then bind reported outcomes to validated logs and strata to regenerated secrets. Retain the writer-to-reader fixtures as the acceptance test.

3. **Freeze the sampling and quantity-evaluation contracts before confirmation — §§4.2, 4.5, 6, 8.** Specify the distinct-world sampling measure and matching inference, implement purity/reset semantics, and replace the four-bit RNG comparison with an exact expected-vector check. Keep these as execution gates rather than stating that the current tests already establish them.
