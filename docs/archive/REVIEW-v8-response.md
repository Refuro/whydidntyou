# Eighth review: whydidntyou, Plan v3.5

Reviewed on 2026-11-03, Pacific time. [PLAN.md](C:/Users/Refur/LLMBreakthroughs/docs/PLAN.md) SHA-256: `dd67066a73e7cc2c2bcd3b204fe2deccaa0b69b68addb7d47abfdc669019b46d`.

**Verdict: the specific v7 record failures are repaired, but three material problems remain. The resolved-only null bound does not identify the stated construction-valid population under outcome-dependent missingness. The declared with-replacement design contradicts the seed validator, and its world-collision bound is unjustified. The reporter binds rows to logs without fully binding those logs to the regenerated instance, treatment and execution slot.**

This review contains **63 recorded fixture observations and calculations**. It used ordinary local records, generator calls and intercepted model transport; no executable model submissions, sandbox probes or self-test were run. Workers prohibited WASM instantiation. No live model requests or repository-source changes were made. RNG findings below are source inspection, not an independent rerun of the author's sandbox tests.

Artifacts: [evidence](C:/Users/Refur/LLMBreakthroughs/docs/REVIEW-EVIDENCE-v8.json) and [ordinary fixture script](C:/Users/Refur/LLMBreakthroughs/docs/REVIEW-CHECKS-v8.mjs). These pin the reviewed source. Counts are observations, not a security or scientific-validity score.

```powershell
node docs/REVIEW-CHECKS-v8.mjs . "$env:TEMP\whydidntyou-v8-evidence.json"
```

## 1. Replayed fixtures and new failures — §11.1

### The v7 repairs pass their targeted checks

The fixtures were adapted to the new interfaces: arithmetic checks receive reference values; reporter fixtures have valid linked logs; the small collision fixture uses `n=100`, the new minimum. Otherwise an unrelated missing-log or option error would masquerade as a repaired check.

| v7 failure | v8 result |
|---|---|
| Interrupted hint arms counted as completed | Repaired. All three requests failed; each arm reported completed 0, interrupted 1, denominator 0. |
| Missing/wrong version pin, invalid missingness policy or coupling flag | Repaired. Zero requests and no batch records. |
| Invalid memory in a later condition | Repaired. Entire configuration refused before requests or batch creation. |
| Foreign-batch or duplicate failure record | Refused. |
| Completed and failed terminal records for the same slot | Refused. |
| Contradictory score ratio with a supplied reference | Refused. |
| Success beyond budget; interruption after success or exhaustion | Refused. |
| Reader budget above writer's maximum | Refused. |
| Summary outcome contradicting its linked log | Refused. |
| Copied secret contradicting regenerated instance | Refused. |
| Default-policy interruption ledger | Written with its reason before the missingness refusal. |
| Coincident semantic worlds under different seeds | Retained and reported, as the revised policy requests. |
| Judge output | Schema 4, provisional label and `humanReview: "pending"`; instruction scope retained. |

The ordinary writer seed/budget/message checks also pass. These objections should stay closed. The problems below concern remaining paths and assumptions, not denial of those repairs.

### 1.1 The supposedly authoritative score reference is still an unchecked log field

**Breaks §8's arithmetic and evidence claims.** [validate.js](C:/Users/Refur/LLMBreakthroughs/src/validate.js:117) validates a result against `meta.n`, `meta.baseline` and `meta.oracle`. The reporter regenerates the instance, but [its binding checks](C:/Users/Refur/LLMBreakthroughs/src/report.js:38) do not compare those metadata values with the instance.

Two synthetic record fixtures kept the correct seed, options, secret and instance/world digests, then made their log arithmetic internally consistent with an incorrect reference:

| Stored log | Actual regenerated task | Accepted classification |
|---|---|---|
| 12,000 bits, 4,000 symbols, baseline 100, ratio 0.03 | Baseline is 3; actual ratio is 1 | Success. |
| 12,000 bits, claimed length 8,000, 1.5 bits/symbol, ratio 0.5 | Length is 4,000; actual rate is 3 bits/symbol | Success. |

Both reports accepted the altered log and produced a −50 percentage-point contrast in the two-world fixture. These are stored-record consistency failures, not claims that the evaluator generated those scores or that submitted code escaped its boundary.

**Fix/test:** validate the log's reference values against the regenerated instance before validating result arithmetic. Prefer passing the regenerated `{n, baseline, oracle}` directly into result validation. Require positive, finite reference rates and the exact registered sequence length. Apply the same rule in post-mortems. A digest beside a metadata field does not verify that field's contents.

Related binding omissions also passed: a linked log with budget 1 under a row/config budget 2, and a linked log carrying a different generator-version string. The row had the correct current version, so its check did not validate the log's version. Add those fields to the shared binding contract rather than growing separate comparison lists in each reader.

### 1.2 Task identity is checked; treatment and execution identity are not

**Breaks §§5 and 8.** The reporter accepted all of these:

- A configured hinted condition backed by logs whose `meta.hint` was null.
- The same run reused as both conditions' observation for a seed.
- The same run reused as two nominal repeats. Four underlying run logs became eight reported trials with complete repeat counts.

The comparison verifies domain, options, model and memory, but not the registered hint/scaffold treatment or whether distinct execution slots actually have distinct runs. Those omissions can invalidate intervention effects and resource counts even when every task digest is correct.

**Fix/test:** bind each run to batch, condition, draw and repeat identity, and bind its actual prompt/scaffold content to the frozen condition. Require unique run identity for independent execution slots, with an explicit exception only for a registered shared-control design. Keep both the wrong-treatment and reused-run fixtures; matching worlds is necessary for pairing, while independent executions are necessary for the claimed repeat design.

### 1.3 Failure rows still do not validate their linked terminal state

**Breaks §8's separation of completed and interrupted work.** A typed `trial-failed` row linked to a completed run was accepted. The report treated its known completed observation as missing and used the supplied interruption reason. `validateTrialFailed` checks the row's shape and slot, but the reporter never checks the referenced log's state.

**Fix/test:** distinguish setup failure, which may have no run log, from interruption after run creation. For the latter, require and validate the linked log and its identity, `status: "interrupted"`, attempt count and reason. For the former, record a typed setup stage. This closes the reverse of the completed-row binding defect and prevents an observed outcome being relabeled unresolved.

### 1.4 Preflight and option canonicalization remain incomplete

Two smaller, directly observed issues remain:

- A missing scaffold file in the second condition was discovered only after the first condition's two requests. The batch was then incomplete. Generator preflight is not full experiment preflight; read and hash all required prompt/scaffold files before starting the batch.
- `make(1, {k:3000})` was accepted, while `make(1, {k:3000,n:4000})` was refused for violating `k <= n/2`. Both use the same effective `n=4000`. [validateOpts](C:/Users/Refur/LLMBreakthroughs/src/validate.js:44) applies the relative constraint only when both keys are explicitly present. Resolve defaults first, then validate the effective configuration consistently in writer, reader and generator.

The missingness ledger repair is correctly scoped to inferential refusal of an otherwise validated batch. Malformed configuration/records still refuse before ledger creation. Do not describe this as literally “before any refusal”; it does fix the v7 default-policy missingness failure.

## 2. Sampling design and coincidence probability — §11.2

**The intended with-replacement design would support the independent-draw argument, subject to §3 below. The implemented indexing and the claimed collision bound do not match it.**

### Repeated seed values are still forbidden

[validateConfig](C:/Users/Refur/LLMBreakthroughs/src/validate.js:53) rejects duplicate seed values. The ordinary configuration fixture `seeds: [1,1]` was refused before any requests. Yet repeated values are possible under sampling with replacement.

Allowing two *different* seeds to produce identical content does not repair this contradiction. Moreover, slot keys and world grouping use the seed itself. Simply removing the duplicate check would cause terminal-record collisions or combine independent draws as repeats.

**Fix/test:** distinguish `drawId`, seed value, semantic world identity and repeated solver execution. Store independent draw records with unique draw IDs; permit repeated seed values; pair arms and average repeats within draw ID. Record the seed-sampling distribution and the procedure that produced the frozen draw list. Alternatively, explicitly register unique seed sampling and justify the resulting approximation or sampling-design correction. The implementation cannot truthfully claim exact with-replacement sampling while rejecting one of its possible outcomes.

At 40 uniform draws from 32-bit seeds, this particular rejection is rare: about `1.81608e-7`. Its practical size can be acknowledged rather than exaggerated. It still does not justify the separate world-collision assertion.

### The birthday expression bounds seed repetition, not generated-world coincidence

Let `M=2^32`. For uniform independent seed draws,

```text
P(any repeated seed among 40 draws)
  <= C(40,2)/M
   = 780 / 4294967296
   = 1.8160790205e-7.
```

The exact value is `1.8160788612e-7`. The plan's looser `40^2/2^33 = 1.8626451492e-7` is a valid seed-repetition bound under these assumptions.

For generated worlds, let `p_w` be the probability that a seed maps to semantic world `w`. Then

```text
P(W1 = W2) = sum_w p_w^2.
```

An injective seed-to-world mapping makes this `1/M`. A many-to-one mapping makes it larger. RNG-state width alone supplies no upper bound of `1/M` on world coincidence.

**Concrete counterexample within the registered option domains:** hiddenPeriod with `{A:8,p:1,L:1,n:4000}` has at most eight worlds. Its key is one of eight symbols; both 4,000-symbol arrays repeat that symbol. Thus 40 draws necessarily contain coincident worlds, with probability **1**, despite containing 8,000 symbols per world. Generating seeds 1–40 produced exactly eight semantic digests in the fixture. No model or sandbox execution was involved.

This does not establish a high collision rate for the default noisy configuration. It disproves the general bound asserted from the 32-bit state space. A default-specific claim needs its own injectivity or collision-probability argument; sequence length by itself is not one.

**Fix/test — §8:** remove the world-collision bound or replace it with a justified, configuration-specific result. Retaining and reporting genuine coincidences is sufficient for iid sampling; their rarity is not required for the binomial model. Delete the older §8 paragraph that still says coincident digests are refused. Keep the small-support fixture as a regression for the retention policy.

## 3. Measure, retries and `n_resolved` — §11.3

**The target measure is clearer, but the proposed resolved-only bound is still not justified for that target. This is a substantive inference defect, not a missing label.**

The plan targets certified success over calibration-eligible, construction-valid worlds. Write `C` for that eligibility event and `E` for obtaining a resolved evaluation. The target is `P(success | C)`. Counting only resolved evaluations directly measures `P(success | C,E)`. Those are equal only under a suitable missingness assumption, or after a justified correction. Stating the unresolved count beside the estimate does not make them equal.

### A numerical counterexample

Suppose 100 construction-valid worlds are assigned, 90 resolve with zero successes and 10 remain unresolved. The proposed calculation is:

```text
1 - 0.05^(1/90) = 0.0327380 = 3.27%.
```

The ten unresolved worlds could all be ones on which the model would succeed. The observed data then do not exclude a 10% success fraction in that assigned cohort. More generally, if success-prone worlds systematically remain unresolved, resolved runs can show zero successes at any sample size while the construction-valid population has a substantial success probability.

A finite retry cap does not establish independence between resolution and potential success. Context length, response length, difficult instances and model-specific service behavior can affect resolution. Using the same assigned worlds in both exposure arms also does not guarantee the same resolved subset.

### Register an analysis that matches the missingness claim

There are three coherent routes:

1. Resolve the fixed evaluation set under the frozen protocol, or withhold the intended population conclusion if the required completeness gate fails.
2. Register and justify a missingness model, with sensitivity analysis, that permits inference from resolved evaluations to the declared target population.
3. Keep unresolved observations as unknown and report bounds allowing their outcomes to vary. For a conservative upper bound under the iid fixed-sample design, treat unresolved outcomes as possible successes for the bounding calculation while retaining their unresolved status in the data.

For the example above, the third route uses ten possible successes out of 100. Inverting the binomial tail gives a one-sided 95% upper bound of **16.37%**, not 3.27%. Specifically, solve `P_p(Binomial(100,p) <= 10)=0.05`, giving `p=0.1637176`. This is deliberately conservative and does not relabel the missing observations as observed successes. For a paired exposure contrast, likewise allow unknown per-world outcomes to vary or specify a defensible missingness analysis; dropping incomplete pairs changes the target.

### The retry protocol is not yet a preregistration

“R retries,” a minimum resolved count and a replacement limit remain placeholders. Before freezing, specify:

- The actual retry count, trigger, schedule and whether retry resumes the same history or starts a fresh solver run.
- Which requests consume tokens, time and attempts, including uncertain cases where the provider may have generated a response that was not received.
- Which outcomes are solver failures, invalid certificates, evaluation failures or unresolved infrastructure events. A solver exceeding its registered execution budget should not disappear as an infrastructure exclusion.
- The fixed assignment/draw count, common arm set, handling of missing repeats, and the stopping rule. Register the inference for any resolution-based stopping rule rather than assuming a fixed-sample formula still applies.

The current code records interruptions but does not implement the Phase 4 retry policy; that can remain an explicit pre-execution gate. The immediate design fix is to stop asserting that disclosure plus `n_resolved` alone supports the construction-valid population bound.

## 4. RNG evidence and the narrowed purity statement — §11.4

**The revised regression is adequate for its narrow installation-and-locking check. The purity statement is now correctly separated as a future interface requirement.** The former four-bit comparison and inference that a fixed RNG alone enforces purity should be marked closed.

Source inspection of [selftest.js](C:/Users/Refur/LLMBreakthroughs/src/selftest.js:142) confirms that it checks sixteen full 32-bit outputs against a host reference, equality across two instances, both descriptor flags, ineffective assignment and failed redefinition. This addresses accidental installation failures and the weak observation used in v7. It does not prove absence of every ambient channel, and the current “no channel is known” language should retain that limit. I have not independently executed those checks.

The host reference repeats the same recurrence as the prelude. It is an independent execution, not an independently derived algorithm oracle. Pin a reviewed expected vector or vector hash in the freeze so a coordinated edit to both copies cannot silently redefine the registered sequence. This is a modest regression improvement, not grounds to revive the old four-bit objection.

The remaining wording issues are concrete:

- §12 and the source comment qualify host-time seeding as likely, but §6 still says it was **verified** by two different sequences 1.2 seconds apart. That observation establishes variation across runs, not its cause. Make the active claim agree with the qualified evidence.
- “The execution environment is deterministic” is too broad when completion uses a wall-clock interrupt. Specify deterministic successful value computation from canonical state, with completion/failure handled separately. This is not a new channel finding.
- The proposed fresh-state quantity interface is the right contract, but it is not implemented yet. Gate Phase 2 on a test that repeated same-input evaluations agree, witness inputs are evaluated under identical reset rules, and invalid evaluations never serve as witness outputs. Bind the exact quantity and evaluation protocol to the certificate and sealed score.

The per-evaluation reset must include all candidate state, not merely the PRNG. Given that requirement, the narrowed purity paragraph is conceptually sound. No additional adversarial sandbox execution is needed to resolve the review's current objections.

## 5. Hostile paragraph and ranked changes — §11.5

> The revision repairs the prior bookkeeping failures, but the confirmatory interpretation remains unsupported. It reports an exact independent-draw null bound after selecting resolved evaluations, without an assumption or bound connecting that subset to the construction-valid population. Its claimed with-replacement design rejects repeated seed draws, and its world-collision estimate confuses seed cardinality with injectivity of the generator; an allowed 8,000-symbol configuration has only eight worlds. The reporter's stronger log checks still validate arithmetic against editable metadata rather than the regenerated task, permit wrong-treatment logs and reused executions, and can relabel a completed linked run as unresolved. These are defects in the estimand and evidence chain, not residual sandbox conjectures. Until the sampling, missingness and run-to-condition contracts agree, the reported rates and contrasts cannot carry the stated population claims.

The plan now answers the targeted v7 regressions. It does not answer this paragraph. Closure requires a missingness-valid population analysis, an executable draw-identity policy, and end-to-end binding of task, condition, execution and result.

1. **Fix the unresolved-outcome inference — §4.5.** Register completeness gates, a justified missingness analysis or conservative unknown-outcome bounds; do not use `n_resolved` alone to bound success over all construction-valid worlds. This has the largest scientific impact because perfect logging would not repair the current estimand mismatch.

2. **Finish the log-to-instance and log-to-condition binding — §§5, 8.** Derive score references from the regenerated instance, check budget/version/treatment, require distinct executions for distinct slots, and validate linked interrupted logs. The new ordinary fixtures make these repairs directly testable without sandbox probes.

3. **Make the draw design executable and correct the collision claim — §8.** Introduce draw IDs separate from seed values and solver repeats, or explicitly register the unique-seed alternative and its inference. Retain/report semantic coincidences and remove the unjustified 32-bit upper bound on their probability.
