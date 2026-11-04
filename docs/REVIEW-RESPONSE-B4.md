# B4 implementation review

Reviewed 2026-11-03 at commit `60cb737f29ee1ea223a64c057e5e620f0643c6aa`, against `REVIEW-PROMPT-B4.md`, `DECISIONS-B4.md`, the two build prompts, the B2 review and decisions, the v2 build report, and the dated invariant-game registration. References and results below apply to an isolated snapshot of that commit.

**Disposition: do not freeze B4 yet.** The B2 repairs pass, and the within-library interpretation is appropriate. However, the new public challenge interface exposes a deterministic label-order leak that gives 100% accuracy without reading the rules or training labels. The purported independent checker also accepts demonstrated registration violations, and the resource accounting does not yet support fair comparisons between the builder portfolio and outside solvers. These are implementation and measurement defects under the current, narrower Claim A; they do not depend on reviving the abandoned invention claim.

Validation: **87/87 shipped ordinary tests passed.** Additional offline checks independently recomputed the exported example's laws, image draws, certificates, histogram ceiling, joint-feature ceiling, and nuisance balance. They also reproduced the failures below. A full independent rerun reproduced all **2,048 construction proposals/dispositions and all 1,720 accepted worlds**. Every one of the fourteen members' challenge and natural accuracy values matched the builder evidence: **48,160 accuracy comparisons, zero differences**. Timing measurements are not expected to match across runs.

No model API calls, new dependencies, or adversarial sandbox probes were used. The shipped tests ran ordinary reference and submitted-example solvers. The additional review script runs host-side data checks and shipped portfolio algorithms; it does not instantiate the sandbox. I did not run the legacy `src/selftest.js` or aggregate selftest. No implementation, preregistration, or historical evidence was edited.

## 1. Findings that block or qualify the freeze

### [P1] The unlabeled sealed export discloses the labels through order

**B4 prompt items 3, 5, 6 and 8; Decision 3 and the immediate adapter task; PLAN §§3.4, 3.5 and the interface requirement in §4.2.** The cause is in [sealed-sampler.js](C:/Users/Refur/LLMBreakthroughs/src/sealed-sampler.js:20), with exposure through [challenge-public.js](C:/Users/Refur/LLMBreakthroughs/src/portfolio/challenge-public.js:36) and [score-external.js](C:/Users/Refur/LLMBreakthroughs/src/portfolio/score-external.js:44).

For each matched class, the sampler stores `[negative, positive]`. It permutes the classes, flattens those two-entry arrays, appends their large-prefix copies, and expands each support point into consecutive duplicates. It never shuffles the final pairs. The public adapter preserves that ordering and embeds the entire unlabeled sealed array in every fresh solver context.

An ordinary data-only decoder needs three steps:

1. Scan the exported pairs in order, starting a new block whenever `(a,b)` differs from the preceding pair.
2. Label the first block negative, the second positive, and alternate thereafter.
3. Store those predictions by `(a,b)` for lookup.

This uses no rules, labeled examples, algebra, certificates, seed, or hidden fields. It scores **200/200 on the exported example and 200/200 on each of 24 additional accepted worlds**, twelve effective nonabelian and twelve effective monoid worlds regenerated from the recorded proposals. Reversing the exported example's pair order makes the same decoder score **0/200**. These are host-side reproductions, not claims that I executed this decoder through QuickJS.

Fresh per-pair execution does not prevent the failure: the public array lets a pure `reachable(a,b)` reconstruct the lookup independently on every call. Schema allowlisting correctly removes the literal `label` key but leaves an encoding of its value. The checked feature ceilings remain mathematically correct for their specified input features; the external solver receives additional information outside that feature map.

This does not invalidate the archived CSP accuracy: that implementation does not use the ordered public test array. It invalidates treating the current external interface as an answer-hidden challenge and comparing its successes without this shortcut control.

**Required repair and test:** independently permute the fully expanded final pair list, preserving each pair's label/certificate association, before hashing and exporting it. Register the change with a new sampler identity and retain the old evidence as historical. Add the demonstrated decoder as a data-leak regression, with reversal/permutation controls and fresh-world evaluation. Also test that the intended pure per-pair prediction interface does not depend on export order. Decide explicitly whether the complete unlabeled test batch is solver input; if it is, give all compared methods that same access and call the task transductive. A private per-pair evaluation contract should supply training evidence and the current pair instead.

Do not treat “B5 comes later” as permission to freeze this defect. It is already demonstrated in the B4 artifact. Any challenge scores obtained from the current export must retain that version label and be rerun after the repair.

### [P2] The independent checker verifies some properties, then trusts others that determine admission

**B4 prompt item 4; B3-e; PLAN §§3.2–3.4.** [check-invariant-world.js](C:/Users/Refur/LLMBreakthroughs/src/check-invariant-world.js:18) checks paths and inequalities, recomputes the submonoid object, and verifies the two ceilings. It does not independently establish that the claimed effective family, stratum construction, or identifiability disposition is correct. In particular, its final admission check accepts the supplied `kernelClasses: 1` instead of recomputing it.

The review script constructs three ordinary semantic fixtures from the exported example. It recomputes the generator-content, sealed-world, and instance digests and updates the associated construction digest, so these are not checksum-corruption tests:

| Fixture | Why it violates the registration | Checker result |
|---|---|---|
| Change effective family to `F-count` | The generated submonoid remains noncommutative | Accepted |
| Mark every sealed pair `small` | The required 100-pair large reporting stratum disappears despite unchanged long strings | Accepted |
| Replace the public training set with 200 certified `('', '')` positives | Public evidence no longer identifies one kernel | Accepted |

For the last fixture, rerunning the project's certificate-free identifiability audit finds **10 consistent assignments and three inequivalent representations**, with `recoverable: false`; the checker still accepts the copied one-class disposition. The actual adapter's regeneration-and-digest binding adds protection against substituting these artifacts into its existing corpus. This finding is about what the independent checker certifies, not a demonstrated bypass of that adapter binding.

There is also common-mode dependence: the sampler and checker import the same `realizedChecks`, feature construction, and congruence enumerator. A second function call catches incorrect LP weights, but cannot independently catch a shared feature-definition error. My separate checker enumerated all 203 set partitions of the six-element example, tested congruence laws directly, and independently implemented counts, edit distance and LCS. It agrees on this example: **216 associativity triples; 680 pair labels/certificates; two proper congruences; both ceilings 0.5; nuisance imbalance zero; 58 conflicting histogram classes.** That validates the example, not every table size or future change.

**Required repair and test:** recompute effective classification and public identifiability, check stratum counts and registered padding/support properties, reconstruct the core digest from the artifact's actual content, and bind the image-stream ambient name to the validated algebra. Reject the three fixtures above. Maintain an independent, deliberately small reference implementation for exported-example feature and congruence checks. Alternatively narrow the checker's name and report to the exact properties it verifies, and add a separate admission verifier before claiming an independently checked accepted world.

### [P2] Some “conservative” operation charges are demonstrably below the work performed

**B4 prompt item 5; Decision 5; PLAN §§1–2.** [portfolio/run.js](C:/Users/Refur/LLMBreakthroughs/src/portfolio/run.js:54) generally charges `a.length + b.length` for a prediction unless it has a special case. That is not a conservative bound for several registered kernels.

On the example's first pair, lengths three and one with a three-symbol alphabet, inert iterable wrappers counted actual character visits inside the shipped models:

| Member | Actual character visits | Charged scoring operations |
|---|---:|---:|
| `count-linear` | 12 | 4 |
| `joint-coarse` | 16 | 4 |

`counts` scans a word once per alphabet symbol; `jointKey` additionally folds it. The counts above exclude arithmetic, map operations and serialization, making them particularly simple counterexamples to the claimed bound. Fitting has further uncharged work: [features.js](C:/Users/Refur/LLMBreakthroughs/src/portfolio/features.js:28) computes nuisance edit/LCS features before charging only the resulting vector cells; the example alone requires 18,620 dynamic-programming cells. Proper-congruence/catalog construction also happens outside the named assignment/check meters.

There is a second comparison cost: the implementable selector fits and publicly scores all fourteen members, but the output does not provide its aggregate charged work. Its cost is not the cost of its eventual winning member. World-specific fitting is not offline library preparation that can disappear from the comparison.

**Required repair and test:** define the work unit precisely and meter it consistently, or call these quantities member-specific search counters and stop presenting their shared 60-million ceiling as comparable primitive work. Charge feature preparation and catalogue preparation explicitly, or register and report their amortization. Emit selector totals across all fitted/publicly scored members plus its selected evaluation. Use the measured 12/4 and 16/4 fixtures to test corrected bounds. This does not establish that the current CSP successes would disappear under corrected charges; it establishes that the resource claim is not yet supported.

Natural scoring also shares each member's remaining budget and prediction cache after challenge scoring. Separate output columns therefore do not mean independent equal-budget evaluations. The archived audit has **zero total-budget exhaustion events**, so I found no demonstrated accuracy loss from that ordering in these data. Before comparisons, either register the sequential evaluation estimand explicitly or evaluate each distribution from the same post-fit state and budget, with standalone and amortized costs distinguished.

### [P2] Outside-solver resource curves use a different fitting and execution regime

**B4 prompt items 5–6; Decisions 1 and 5; the immediate adapter task.** [score-external.js](C:/Users/Refur/LLMBreakthroughs/src/portfolio/score-external.js:37) accurately reports its policy: top-level fitting repeats in **201 fresh contexts per world**, including inspection. The builder portfolio fits once in Node and caches predictions across public, challenge and natural sets. The adapter repeatedly parses the full public evidence too, and outside solvers receive the complete unlabeled sealed array while builder fitting receives only rules and training pairs.

This is disclosed, so it is not concealed accounting. It still prevents interpreting “20 seconds” as the same budget on both sides. For a solver with fitting time `F` and prediction cost `P`, the structural distinction is roughly `F + 200P` versus `201F + 200P`, before interpreter/startup differences. A challenger can propose a stronger algorithm and lose because it is forced to refit 201 times. Conversely, access to all test inputs can improve its algorithmic performance.

**Required comparison control:** run public-only reference implementations through the outside adapter as well and report that matched comparison. Alternatively provide an explicitly budgeted fit-once stage for both sides, followed by frozen per-pair inference. Specify equal information access. Until then retain external results as results under their own execution contract, not as evidence that a method needs more algorithmic work than a builder member. This need not reopen the existing interpreter boundary or require sandbox probing.

### [P2] Decision 3 understates what the restricted support and “large” pairs mean

**B4 prompt item 3; Decision 3; PLAN §3.4.** I accept restricting claims to the registered support. I overturn its unconditional acceptance “for the freeze as stated,” both because of the order leak and because the size and feasibility interpretations need further qualification.

The implemented support is narrower than “bounded walks and unequal-fold pairs”: it keeps **only the first representative of each label in each matched joint-feature/nuisance class**, then at most 32 classes. Thus there are at most 64 small support points, copied with a neutral prefix into at most 64 large support points, then repeated to make 200 scored rows. The example has 128 distinct pairs, and all 100 large rows are exact prefixed copies of their corresponding small rows, including labels and multiplicities.

The LP has an analytic solution on this selected support. With `K` retained matched classes, give each of the `4K` support points weight `1/(4K)`. Each feature/nuisance class is label-balanced; positive and negative masses are each 1/2; small and large masses are each 1/2; both feature ceilings are 1/2. No minimum weight can exceed `1/(4K)` because the weights sum to one. Uniform weights therefore attain the max-min optimum. The example's 128 weights equal `1/128` to numerical tolerance (maximum deviation about `1.14e-15`).

Consequently, once a matched class and valid padding exist, the 0.70 constraint does not test a difficult feasibility tradeoff: the support construction has already arranged a 0.50 ceiling. “Infeasible” chiefly diagnoses failure to obtain that specially paired support, not resistance to coarse features on the broader task distribution. Restricting this statement to bounded strings alone is still insufficient; specify the representative-selection and matching restriction too.

The large stratum tests robustness and cost under neutral-prefix padding of the same short problems. It does not establish generalization to independently generated long combinatorial problems. Natural long strings are a useful separate control, but their presence does not change what the challenge's small/large gap measures.

**Required disposition:** retain this construction as a named matched/padded challenge, report distinct support size and paired dependence, and label the gap as padding robustness. Add the analytic uniform-weight solution as a sampler oracle. For an actual size-generalization claim, separately register longer independently constructed cores or derivations and score them separately. Do not silently replace the present family to recover a desired wall.

The challenger's outside-support question should explicitly distinguish distributions that preserve the nuisance constraints. Changing the ceiling outside this support is trivial if those constraints may be abandoned: balanced positives `(s,s)` and unequal-length negatives with different invariant values yield a length-feature ceiling of one. A substantive challenge must specify which constraints remain fixed and compare ceilings under those same constraints.

## 2. Answers to the eight requested B4 checks

| Requested item | Finding and disposition |
|---|---|
| **1. B2 repairs** | R1–R4 pass the shipped regressions. The actual contract-confusion fixture is rejected through batch, report and postmortem validation. Genuine compression/reachability controls remain valid. The 78-digit maximum source value and beyond-Number-precision conversion round-trip exactly. The public audit agrees with private/altered-certificate versions across the sixteen historical worlds. Positive-count and unresolved-count inference is explicitly unavailable; zero-count binomial inference is the only available procedure. These B2 blockers are closed. |
| **2. Recovery** | The exercised single-writer recovery path passes: receipt is fsynced before parsing/scoring; raw text and usage survive; execution IDs are preplanned; source/config identities and prior-prefix digests are checked; valid orphan work is recovered; successive completed resumes are no-ops; partial records are preserved and cause a separate abandonment disposition. An unreceived dispatched request remains charged and authorizes the next registered execution rather than reuse of its index. This is not a claim of exactly-once delivery at the remote provider or concurrent-resume safety. |
| **3. Distribution/sampler** | Domain-separated image and alphabet streams remove the old positional construction rule; rejection sampling removes modulo bias under the registered PRF assumption. Accepted worlds are conditioned on construction, identifiability and support feasibility, so the accepted image distribution is not uniform. Every fixed proposal and its disposition is retained. The support, order and size objections in §1 must be resolved or explicitly narrowed before freeze. |
| **4. Independent checker** | The authentic exported example independently passes all requested finite-law, image-draw, label, ceiling and nuisance calculations. The shipped positional-convention tests pass. The checker is nevertheless incomplete as an admission verifier, demonstrated by the three accepted invalid fixtures above. |
| **5. Complete portfolio** | All fourteen registered entries are present in every accepted-world row. Fitting and public selection receive the intended public view; selector choice precedes sealed scoring. The finite-state representation correctly compares full transformations with `q^q` possible states; 4,096 image-choice steps per `q` is a truncated search budget, not exhaustive inference over that class. `grammar-cegis` really is the disclosed finite-fold template grammar with public counterexample refinement, not open-ended program synthesis. These language declarations are acceptable; resource comparability is not yet established. |
| **6. Independent challenge** | Still required. This implementation review does not satisfy it: I have read the generator. The current prompt, public export and archived external-score reports enable a source-unexposed challenge, subject to the repairs above. Keep every tried method and setting, including order-only and other shortcut controls, with their outcomes. Give the challenger a versioned repaired export before treating the challenge as the freeze input. |
| **7. Positional requirement** | Confirmed: no universal-failure requirement and no exclusion of passing worlds. Historical construction rejection and chance success under the amended draw are different facts. Retain the historical 16/16 result and amended success rates by effective family. The current regression criterion is the right one. |
| **8. Claims** | Accept the within-library result and descriptive development scope. None of this demonstrates invention, capability absence, leakage absence, or confirmatory performance. Natural/challenge results, oracle selection and public selection must remain separate, with the budget/cache qualification above. A source-unexposed challenger also does not make the task designer-blind. |

## 3. Audit, denominators and reporting

The stored evidence contains exactly **2,048 proposals**, 512 per requested family, with no missing disposition or replacement. Every one of the 1,720 accepted worlds has all fourteen portfolio entries bound to the corresponding construction index and digest.

| Requested family | Proposed | Accepted | Acceptance |
|---|---:|---:|---:|
| Count | 512 | 428 | 83.59% |
| Abelian | 512 | 512 | 100.00% |
| Nonabelian | 512 | 485 | 94.73% |
| Monoid | 512 | 295 | 57.62% |

Effective-family counts are **428 count, 652 abelian, 377 nonabelian, 263 monoid**. Those are not interchangeable with requested-family denominators: effective abelian includes commuting draws from other ambient families. Report the requested-to-effective flow, defect reasons and acceptance rates alongside performance. The especially large monoid exclusion rate is part of the benchmark definition, not an incidental implementation detail.

The finite-monoid CSP solves 1,720/1,720 accepted challenge sets; the public selector solves 1,719/1,720. Largest-budget BFS succeeds on 34 effective nonabelian and 27 effective monoid worlds. The recorded positional member succeeds on 250/428 count, 443/652 abelian, 113/377 nonabelian and 3/263 monoid worlds. Retain those successes; they are not construction failures.

The source hash in the builder's audit predates the adapter additions. That historical hash should stay historical. The review records the current snapshot hash and verifies the regenerated construction evidence and results, rather than rewriting the builder's registration hash to pretend it was produced later.

These are development observations on an examined corpus. Do not attach a confirmatory interval to 1,720/1,720. Do not treat 200 repeated/matched rows within a world as 200 independent trials. The four requested-family audits reuse the same 512 seed values with different configurations, so pooling all rows as independent draws also requires an argument the current report does not make. Future uncertainty should follow the registered world/proposal design and family stratification; positive-count inference remains unavailable under Decision 7. The current sample coverage requirement is satisfied, but coverage of a count target is not coverage of a confidence procedure.

## 4. Disposition of DECISIONS-B4.md

| Decision | Review disposition |
|---|---|
| **1. Within-library interpretation** | Accept. Do not expand the existing family merely because the CSP solves it. A later library-resistant family must remain separately registered and separately reported. |
| **2. Positional regression** | Accept without modification. Measured chance successes must remain in the data. |
| **3. Support and large stratum** | Overturn unconditional freeze acceptance. Repair the order leak and state the first-representative restriction, analytic balancing and padding-only interpretation. The restricted construction itself can remain a valid descriptive task. |
| **4. Third-session challenge** | Retain. It remains outstanding and this review is not a substitute. Repair/version the challenged inputs and compare methods under matched information and execution contracts. |
| **5. Budgets** | Retain all builder and challenger curves. Do not freeze common-resource claims until accounting units and reference execution controls are settled. |
| **6. Sequence** | Retain the B4 stop. Repair demonstrated defects and complete the independent challenge before the freeze decision. B5/B6 and any real-model pilot remain later gates; this review authorizes none of them. |
| **7. Statistics** | Accept. Keep the zero-count result and explicit positive-count unavailability; do not let a completeness flag imply inferential validity. |

## 5. Ranked changes

1. **Remove the deterministic order channel before further challenge scoring** (B3 sampler; B4 adapter; PLAN §§3.4–3.5). Shuffle the fully realized list, retain/version old artifacts, and make the reproduced data-only decoder plus permutation controls permanent regressions.
2. **Make accepted-world checks recompute admission facts** (B3-e; B4 item 4). Reject incorrect effective classification, absent large strata and non-identifiable public evidence even when their digests are internally consistent; retain a small independent feature checker.
3. **Fix or narrow the resource units, and report selector cost** (PLAN §§1–2; B4 item 5). The demonstrated 12/4 and 16/4 undercharges are cheap regression fixtures; uncharged preparation and all-member selection work must be accounted for before making resource claims.
4. **Match the challenger and reference execution/input contracts** (Decisions 1, 4–5). At minimum run reference methods through the outside adapter, so repeated fitting and interpreter startup are visible controls instead of confounds in the proposed budgets.
5. **Name the support and size estimands accurately** (Decision 3; PLAN §3.4). Report first representatives, distinct weighted support, exact class balancing and neutral-prefix duplication; use a separately registered long-core distribution if algorithmic size generalization is an intended result.

## 6. Reproduction artifacts

- `REVIEW-CHECKS-B4.mjs`: offline additional checks, including the order decoder, independently recomputed example properties, checker semantic fixtures and resource-count witnesses.
- `REVIEW-EVIDENCE-B4.json`: structured results, snapshot/source hashes, sample world digests and audit comparison.
- `REVIEW-TESTS-B4.txt`: complete 87-test output.
- `REVIEW-AUDIT-B4.txt`: independent audit progress/completion log.

Run the additional checks against the pinned checkout. The optional last argument compares a completed independently rerun audit with the builder evidence:

```powershell
$env:LLM_MOCK='1'
node docs/REVIEW-CHECKS-B4.mjs . review-evidence.json
# Full audit: use a new directory, never the original evidence directory.
node src/portfolio/audit.js review-independent-audit
node docs/REVIEW-CHECKS-B4.mjs . review-evidence-with-audit.json review-independent-audit
```

The isolated reproduction and all of its per-world files remain at `C:/Users/Refur/SonyTv/whydidntyou-review/B4-HEAD-60cb737/review-tmp/independent-audit`. No new source-unexposed solver challenge was performed as part of this review.
