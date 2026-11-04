# Ninth review: PLAN v3.6

Reviewed 2026-11-03 against `docs/REVIEW-PROMPT-v9.md`. PLAN SHA-256: `d306650961a3d6e2cbd3aea6d637f251a17e4265703744865d1ea3a1adb09b35`.

**Verdict: the reported v8 record-binding failures are repaired. The confirmatory design is still not ready to freeze.** Reproducibility of the seed list does not establish its claimed sampling law; the retry policy is not implemented or represented as an auditable chain; and treatment metadata can still disagree with the archived request without rejection. The missingness arithmetic is correct for its stated iid binomial model, but that model needs to be reconciled with §8.

Scope: source inspection, pure numerical calculations, generator calls, and ordinary offline record fixtures. No adversarial sandbox execution, selftests, executable model submissions, or live API calls. The four worker processes intercepted the entire transport; all four reported zero WebAssembly instantiations. The fixtures contain synthetic records, not model-performance evidence. Source hashes were unchanged at completion.

Reproduction: `REVIEW-CHECKS-v9.mjs <repo> <evidence.json>`; results are in `REVIEW-EVIDENCE-v9.json`. There are 61 observations: 48 checks passed, 11 expected protections or behaviors were absent, and two observations document mathematical/sampling properties. These are engineering checks, not a benchmark pass rate. Source references below refer to the reviewed snapshot.

## 1. §11.1 — v8 regressions and new binding fixtures

**The requested v8 cases now fail for the intended reason.** I adapted the fixtures to provide valid v9 seed draws, execution slots, and scaffold hashes before introducing each inconsistency. An unmodified complete batch and correctly hinted, scaffolded, summary-memory, and last-code-memory controls all passed.

| Case | Observed v9 behavior |
|---|---|
| Inflated log baseline; wrong log sequence length | Rejected against regenerated references |
| Log budget or generator version differs from configuration | Rejected |
| Unhinted log assigned to hinted condition | Rejected |
| Same run reused across conditions or repeats | Rejected by slot binding |
| `trial-failed`, stage `interrupted`, links a completed log | Rejected as completed |
| Missing scaffold in a later condition | Zero requests and zero batch records |
| `k:3000` with omitted `n`, or explicit `n:4000` | Both rejected against effective `n` |
| Duplicate seeds | Rejected before requests |

Additional fixtures with wrong slot batch, condition, seed, or repeat; wrong model, memory, options, or oracle; and wrong scaffold path or hash were rejected. An internally consistent interrupted log passed the exploratory path; moving it to the wrong slot failed. The small-support collision fixture retained all four sampled seed entries and recorded coincident semantic worlds. These issues should be closed rather than rediscovered in v10.

**New finding: §8's “full binding” stops at the treatment labels.** `report.js:34–43` checks metadata; `validate.js:110–113` checks the shape of `messagesSent`. Neither establishes that the archived request implements those labels. The reporter accepted all of these otherwise valid complete batches:

- Config and metadata specify a hint, but the archived requests were rebuilt without the hint: `report/payload-hint-absent`.
- Config, path, and scaffold hash are correct, but `meta.system` contains only `SYSTEM_BASE`: `report/payload-scaffold-absent`.
- Metadata says `summary`, but the archived messages use full history: `report/payload-memory-wrong`.
- An archived `feedbackText` disagrees with the result and with the feedback in the next request: `report/payload-feedback-wrong`.

This does **not** demonstrate that the present writer sends the wrong treatment. Source inspection shows `run.js` constructs it consistently. It demonstrates that the promised reader-side consistency check cannot detect a stale prompt or incorrectly assembled treatment record. Nor is this a demand for cryptographic proof against an author rewriting every artifact: these contradictions are already visible inside the submitted artifacts.

**Fix/test:** freeze prompt-builder identity; reconstruct each request from the regenerated instance, registered hint/memory, and preceding archived history, then compare it with `messagesSent`. Bind the scaffold text used to construct `system` to its hash, and check the full system prompt. Check `feedbackText` against the registered formatter and the next request. The four fixtures above should then refuse, while the four treatment controls continue to pass. For interrupted requests, archive the outgoing request before transport: currently an unreceived response leaves no attempt record containing that request.

**New finding: resource summaries remain unbound.** In `report/row-tokens-unbound`, changing one row's token count from 40 to 1,000,000,000 while leaving its linked log unchanged produced a reported condition median of 1,000,000,000. `validateTrial` only type-checks this metric. Claim A includes resource comparisons, so this can corrupt a claimed endpoint even without changing success.

**Fix/test:** derive tokens from archived usage under a specified accounting convention, and recompute other derivable summary fields. Mark unavailable usage as unknown rather than silently treating it as zero. Include retry costs once retries exist. Require nonnegative finite resource fields; distinguish provider-reported consumption from estimates for unreceived responses.

The RNG vector pin now matches an independent host calculation: `97d517b95e4c6c159fc47b2565ee393d90a96d21410c429ed2343e03277869b5`. That closes the missing-reference-pin objection at source level. I did not execute the sandbox regression or re-certify runtime isolation.

## 2. §11.2 — sampling design and the without-replacement inequality

**The inequality is correct; the claim that the code implements its sampling premise is not established.**

For a simple random sample of `n` distinct seeds from a finite population of size `M`, with fixed binary outcomes and `K` successes,

\[
P(S=0)=\frac{\binom{M-K}{n}}{\binom{M}{n}}
=\prod_{j=0}^{n-1}\left(1-\frac{K}{M-j}\right)
\le (1-K/M)^n.
\]

If there are fewer than `n` failure seeds, the probability is zero. Otherwise every factor is at most `1-K/M`. Thus the usual zero-success binomial upper bound is conservative under this sampling design. Retaining distinct seeds that map to the same world is correct for the seed-induced distribution: collapsing them would change its weights. The target is not uniform over unique semantic worlds.

**But `validate.js:50–55` produces deterministic windows of a sequence, not an exact uniform sample of subsets.** It initializes the state as `master × constant`, increments by that same constant, hashes the state, truncates to 32 bits, and skips duplicate outputs. With the published example master `20261103`, the 40-element draws for this master and `20261104` share **39 elements**. The latter is exactly the first master's 41-element draw with its first element removed. This is recorded in `sampling/adjacent-masters`.

There is also a decisive counting objection to literal uniformity. The recurrence has at most `2^64` initial states. Yet

\[
\log_2\binom{2^{32}}{40}\approx1120.841.
\]

Most possible subsets therefore cannot be produced by any master. No distribution over those 64-bit states makes this procedure an exact simple random sample of all 40-subsets. This does not prove practically important bias for this generator; it disproves the asserted exact design justification. Ordinary seeded simulation can be useful, but its pseudorandomness assumption must be named rather than replaced by a false uniformity statement.

**Publishing a master also does not establish random selection of the master.** `validateConfig` establishes that a list follows from that master. It cannot distinguish a prospective random master from one chosen after examining many lists. §3.3's external freeze timestamp helps prevent post-freeze changes, but the protocol must also specify when and how randomness is obtained. A list can be selected before the freeze. There is no evidence here that the author did that; the design simply permits it.

**Specific repair:** freeze the generator, exclusions, draw count, analysis, and randomness source before the selected randomness is available. Derive labels from a recorded random stream and reject repeated seed labels until the registered count is reached. State the independent-uniform-bit assumption if claiming exact simple random sampling. A cryptographic stream expanded from public randomness is a practical alternative, but should be described as a computational approximation, with a specified algorithm and independent batch/domain identifiers. Do not use adjacent masters as supposedly independent replicate samples. Validate master representation without JavaScript integer-rounding ambiguity.

The acceptance-conditioning step also belongs in the sampling statement. After conditioning on calibration eligibility and sealed construction, the relevant finite population is the eligible seed set, of size `M_C`, and its success count is `K_C`; it is not automatically all `2^32` seeds. Register whether the proposed draw count is fixed and analysis conditions on the resulting eligible count, or whether a separately specified acceptance-sampling procedure is used. Preserve every rejected proposal. The denominator for the success bound must be the assigned construction-valid count.

For stochastic decoding, the literal fixed-`K` identity needs adjustment. The zero-success inequality can still be justified under a uniform subset and independent decoding: average the products of the seeds' failure probabilities, which are bounded by the corresponding power of their mean. State that argument and its independence assumptions, or freeze a precisely defined binary potential outcome per sampling unit. Do not silently switch between deterministic seed outcomes and repeated stochastic solves.

Finally, remove the obsolete §8 paragraph saying coincident digests are refused. `report.js:73–74` still says “WITH replacement,” and the report calls retained entries “independent draws.” Distinct draws without replacement are dependent. The finite-population argument, rather than literal independence, is what supports the stated zero-success bound.

## 3. §11.3 — two-layer missingness analysis and `bounds.js`

**The missingness repair is mathematically sound under a valid sampling model for a well-defined binary outcome.** Let `T` be the total number of successes that would be observed if all assigned outcomes were known, `s` the observed successes, and `u` the unresolved outcomes. Then `T ≤ s+u`. A valid upper confidence limit `U(T)` that is nondecreasing in the count remains conservative when replaced by `U(s+u)`. This requires no independence between resolution and success. The completeness gate is a defensible additional restriction on the primary claim.

I independently computed the binomial CDF using a probability recurrence, rather than copying `bounds.js`'s log-combination calculation. Results agree within `1e-12`:

| Assigned `n` | Observed successes `s` | Unresolved `u` | Resolved-only upper bound | Conservative binomial upper bound |
|---:|---:|---:|---:|---:|
| 100 | 0 | 10 | 3.273803% | **16.371762%** |
| 100 | 0 | 0 | 2.951305% | 2.951305% |
| 100 | 5 | 10 | 11.326249% | 22.153691% |
| 100 | 0 | 100 | No resolved evidence | 100% |
| 59 | 0 | 0 | 4.950761% | 4.950761% |

Zero successes among 32 and 40 resolved worlds give 8.936820% and 7.215752%, respectively. Under the binomial assumptions, excluding a 5% rate requires `ceil(log(.05)/log(.95)) = 59` fully observed zero-success worlds. The proposed 32–40 cannot support that particular exclusion.

Three issues remain before calling this the registered analysis.

**First, `bounds.js` explicitly assumes iid observations, whereas §8 registers without-replacement sampling.** The zero-success inequality in §8 proves the zero-count case. It is not a proof that every positive-count binomial upper limit is conservative under every finite-population design. This matters because even zero observed successes with unresolved outcomes uses a positive count `s+u`.

A small exact counterexample makes that distinction concrete. Take a population of 79 seeds with 77 fixed successes, sample two without replacement, and use the binomial one-sided upper limit after observing one success:

\[
U(1;2)=\sqrt{0.95}\approx0.974679434,
\qquad p=77/79\approx0.974683544>U.
\]

The probability of observing at most one success is

\[
1-\frac{77\cdot76}{79\cdot78}\approx0.050308341>0.05.
\]

So the blanket extension is false. This is a counterexample to the general justification, **not a demonstration of material miscoverage at your actual population size and planned counts**. Resolve it by deriving or checking coverage for the actual design and endpoint, using a finite-population upper limit where its premises apply, or registering a sampling scheme compatible with the iid analysis. Small-population exhaustive checks and high-precision checks of the intended count range should be shipped with that choice. The 3.27%/16.37% example remains the correct iid calculation.

**Second, the calculation is not connected to the result ledger.** `report.js` never imports `bounds.js`. A confirmatory incomplete batch is refused after writing a missingness ledger; an exploratory incomplete batch uses available worlds and available repeats in its contrasts. It does not implement §4.5's bounds over all unknown paired outcomes. This is unfinished implementation for Phase 4, not evidence that a completed Phase 4 experiment was misanalyzed.

**Fix/test:** define one analysis entry point that reads the validated assignment/retry ledger and emits the gate result, `n/s/u`, conservative bound, and the separately qualified resolved-only diagnostic. Define the binary world endpoint explicitly when there are multiple solver repeats; do not pass fractional world success averages or count repeats as independent worlds. For a paired contrast, assign each missing arm outcome `[0,1]`, derive each world's possible difference interval, and then apply a registered population-confidence procedure. Merely averaging interval endpoints gives sample identification bounds, not automatically a 95% population interval. Refuse a confirmatory paired point estimate based on dropped worlds.

**Third, the new numerical API accepts impossible inputs.** Fixtures show that `successes:-1` produces an upper bound around `7.9e-31`; `unresolved:101,n:100` produces `resolved:-1`; fractional `n` is accepted; and `alpha:2` produces a negative resolved-only bound. `binomCdf(10,0,0)` and `binomCdf(10,10,1)` return `NaN` because of `0 × log(0)`. The valid examples above do not hit those endpoints.

**Fix/test:** assert integer nonnegative counts, `successes + unresolved ≤ n`, and `0 < alpha < 1`; explicitly handle zero assigned/resolved observations and CDF endpoints. Mark the resolved-only result unavailable when none resolved, and generate the confidence-level label from `alpha` instead of always saying 95%. These are small repairs, but an inferential function should not manufacture an extremely tight bound from an invalid negative success count.

## 4. §11.4 — is the retry protocol specific enough?

**No. Its main choices are now explicit, but the recorded unit and total budget are still underspecified.** `R=2`, fresh restarts, archived interrupted histories, uncertain-response consumption, fixed assignments, and a terminal stopping rule settle several earlier ambiguities. They do not yet define the complete executable protocol.

The ordinary fixture fails transport only on the second request. The first request returns a harmless response without code. Under the stated fresh-restart policy, the next run could complete using two further responses. Instead, `experiment.js:41–43` writes one interrupted terminal row and moves on: two requests total, no restart. The reporter correctly refuses this incomplete confirmatory batch.

A second fixture supplies an interrupted run followed by a completed fresh run for the same slot. The reporter refuses the pair as duplicate terminal records. That is correct for its current schema, but demonstrates that the schema cannot represent the newly registered history as presently written. Keeping only the final row would conceal earlier interruptions and costs unless there is another validated chain linking them.

Before freezing §4.5, specify and implement:

1. **Outcome and budget unit.** Is the endpoint success of the whole interruption/restart procedure, or success of one solver run? Fresh restart draws a new trajectory; it is not observation of the original trajectory's missing outcome. Register the former if that is intended, state the per-run and total per-slot resource limits, and count discarded work. With two fresh retries, a slot can use parts of three solver runs. The missingness upper-bound argument requires a stable definition of the outcome whose unobserved value is being bounded.
2. **An append-only restart chain.** A slot owns execution indices `0,1,2`, each with a distinct run ID, status, reason, and log. Exactly one slot-level terminal summary references the complete chain. A valid completed failure or success terminates the slot; only an eligible interruption authorizes the next index. Validate missing indices, unlinked runs, attempts after terminal completion, and exhausted retries. Use collision-resistant run IDs rather than relying exclusively on milliseconds for restarts of the same slot.
3. **Failure classification and consumption.** Define whether setup failures, request timeouts, rate limits, process crashes, missing terminal records, and evaluation-boundary exceptions consume a restart, halt the batch, or leave a terminal unresolved slot. Separate provider/transport retries from solver restarts. Specify an outer deadline for an unreceived response and how the already dispatched request is recorded and charged. The writer currently does not archive the failed outgoing request itself.
4. **Scheduling and randomness.** Specify whether a fresh run uses fresh decoding randomness, whether arms and restarts are interleaved, and whether partial histories can reach a later run. Store those choices. A slow or unstable service can otherwise give the arms different opportunities or time periods despite equal nominal budgets.
5. **One stopping policy.** Remove or reconcile the remaining §4.5 sentence requiring a “minimum n_resolved” and “replacement limit” with the new fixed-assignment, no-resolution-based-continuation policy. No one should have to choose between contradictory instructions after failures occur.

The decisive fixture set is small and requires no solver code: interrupt then complete; interrupt twice then complete; interrupt three times; complete unsuccessfully with no retry; setup failure; unknown response; process termination with a dispatched request but no end record. Every case must produce the specified chain, total resource accounting, and one terminal slot outcome. Until then, label retries as a registered implementation requirement rather than an implemented harness feature.

## 5. §11.5 — hostile paragraph and three ranked changes

> The paper's narrowed claims are more defensible than an invention claim, but its confirmatory guarantees are still stronger than its design. A reproducible 64-bit sequence window is described as uniform sampling over 32-bit seed subsets, with no prospective source of random selection, and an inequality for zero successes is used to motivate an analysis that also evaluates positive counts. The two-restart policy is absent from the runner and cannot be represented by its terminal-record schema, leaving the experimental unit and consumed budget ambiguous. Treatment metadata is checked while contradictory archived prompts are accepted, and resource summaries remain editable independently of their evidence. The proposed missingness calculation is numerically correct under an iid model but is not connected to the actual sampling and retry ledger. Consequently, an observed bound or treatment contrast could still describe a different procedure from the one claimed. I would require one frozen, executable protocol whose sampling, requests, restart history, and inferential outputs agree before treating these results as confirmatory.

The plan answers the original invention-versus-search objection by withdrawing that inference in §0. It does not yet answer the objections in this paragraph. The remaining work is a finite set of protocol and validation decisions; another broader conceptual justification would not resolve them.

Ranked by expected improvement per unit of work:

1. **Repair the sampling justification and freeze the inferential unit (§4.5, §8).** Specify prospective randomness and the seed-induced target, remove the exact-uniform claim for the current master routine, and choose confidence calculations justified for the actual zero and nonzero counts. This prevents a precise numerical result from being attached to an unsupported sampling model.
2. **Implement and validate the complete slot/restart ledger (§4.5, §8).** Make the two-retry policy, accumulated costs, terminal outcome, and conservative missingness report derive from one recorded chain, and remove the obsolete replacement wording. The present writer/report pair cannot execute the registered policy.
3. **Bind archived request content and resource summaries to their evidence (§5, §8).** Add the hint/scaffold/memory/feedback consistency checks and recompute token totals, retaining the passing treatment controls. This closes the remaining ordinary record inconsistencies directly relevant to causal treatment and resource claims.
