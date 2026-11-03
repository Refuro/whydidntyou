# Fourth review: whydidntyou, Plan v3.1

Reviewed on 2026-11-03 against the local working tree. The reviewed [PLAN.md](C:/Users/Refur/LLMBreakthroughs/docs/PLAN.md) has SHA-256 `e300417a6a5418b8d03262c57dd4c49fa37d5a613e38b94e06dfc54cb8c3798d`. The evidence file records hashes for the plan, request and all source files; those hashes still matched after testing.

**Verdict: several v3 failures are repaired, but the verifier still accepts zero-bit compression through a file channel, and submitted code can terminate the evaluator parent. Do not freeze confirmatory runs on this implementation.** Reporter and post-mortem repairs are substantial but incomplete. The formal ceiling and feasibility argument are now mostly correct; the remaining design gap is turning a weighted distribution guarantee into the promised finite sealed-set certificate.

I ran the shipped self-test, the archived v3 harness, schema-2 adaptations and new adversarial probes on Node v22.23.4, Windows. The archived harness aborts because its schema-1 post-mortem fixture is now correctly refused; blanket refusals of obsolete fixtures are not evidence that their underlying defects were repaired. The new fixtures exercise the intended paths under schema 2.

Tests used a source-only working copy, synthetic data, dummy credentials and local model-response stubs. No paid model calls or training were run. The process-termination probe targeted only its disposable evaluator parent. The environment probe read only a reviewer-injected dummy marker. A loopback network test was inconclusive because even its unrestricted control received `EACCES`; I did not relax the environment's restrictions or count that as proof of network isolation.

Reproduction artifacts:

- [REVIEW-EVIDENCE-v4.json](C:/Users/Refur/LLMBreakthroughs/docs/REVIEW-EVIDENCE-v4.json): 77 entries, including individual outcomes, diagnostics and source hashes. Diagnostic/inconclusive entries have `pass: null`; this is not a 77-test certification score.
- [REVIEW-CHECKS-v4.mjs](C:/Users/Refur/LLMBreakthroughs/docs/REVIEW-CHECKS-v4.mjs) and [REVIEW-CHECKS-v4-extra.mjs](C:/Users/Refur/LLMBreakthroughs/docs/REVIEW-CHECKS-v4-extra.mjs): executable checks, creating a separate source copy beside the chosen evidence file.

From the repository root in PowerShell:

```powershell
node docs/REVIEW-CHECKS-v4.mjs . "$env:TEMP\whydidntyou-v4-evidence.json"
node docs/REVIEW-CHECKS-v4-extra.mjs "$env:TEMP\whydidntyou-v4-evidence.json"
```

## 1. Process boundary and regression verification — §11.1

### The old failures are repaired

The shipped self-test passes. Its real lag-bank winner still succeeds on seed-1 laggedRule at approximately **0.995 bits/symbol** and fails on seed-1 hiddenPeriod at **2.558 bits/symbol**, with the source hash checked.

I also ran the nine original v3 submissions individually, using a 200 ms VM budget and a separate 6-second outer supervisor. Every one now returns a normal rejection without requiring that outer supervisor to kill the evaluator:

| Original v3 case | Result |
|---|---|
| Global variable stash | PASS: rejected. |
| Shared `Math` stash | PASS: rejected. |
| Throwing decoder proxy | PASS: decode failure returned. |
| Looping decoder proxy | PASS: 200 ms VM timeout. |
| `console.log.constructor` host-global stash | PASS: separate processes break this stash channel. |
| Context-constructor host-global stash | PASS: separate processes break this stash channel. |
| Looping exception `message` getter | PASS: rejection without invoking that getter. |
| Replaced `JSON.stringify` coercion trap | PASS: rejected. |
| Queued Promise loop | PASS: evaluator returns; child exits. |

This is a real improvement. In particular, JSON bytes crossing a process boundary cannot carry a live JavaScript getter into the parent.

### New failures: SQLite bypasses the filesystem restriction

This complete submission passes with **`ok: true`, `bits: 0`, `success: true`**:

```javascript
const p = console.log.constructor('return process')();
const { DatabaseSync } = p.getBuiltinModule('node:sqlite');
const db = new DatabaseSync('review-v4-channel.sqlite');

function encode(s) {
  db.exec('CREATE TABLE IF NOT EXISTS channel (id INTEGER PRIMARY KEY, payload TEXT)');
  db.prepare('INSERT OR REPLACE INTO channel VALUES (1, ?)').run(JSON.stringify(s));
  return '';
}

function decode() {
  return JSON.parse(db.prepare('SELECT payload FROM channel WHERE id=1').get().payload);
}
```

The encoder and decoder share the same filesystem and working directory. They communicate through the SQLite database, although ordinary `node:fs.writeFileSync` is denied in a separate probe. The database was created only in the review's disposable source copy and contained the synthetic test sequence.

This directly falsifies [runner.js:6](C:/Users/Refur/LLMBreakthroughs/src/runner.js:6)'s assertion that a host escape reaches a realm with no I/O. Deleting globals and replacing `process.binding` does not remove `process.getBuiltinModule`. Node's documentation for the tested version explicitly warns that its filesystem permissions cover `fs` and do not guarantee denial through other interfaces such as `node:sqlite`; it also disclaims protection against malicious code. [Node v22.23.4 permissions documentation](https://nodejs.org/docs/latest-v22.x/api/permissions.html)

### New availability and environment probes

| Case | Result | Observation |
|---|---|---|
| SQLite encoder-to-decoder file channel | **FAIL** | Accepted zero-bit compression. |
| `process.kill(process.ppid, 'SIGTERM')` after host escape | **FAIL** | Disposable evaluator parent terminated with exit code 1, without returning a result. |
| Read injected `process.env.REVIEW_CANARY` | **FAIL** | Child read the dummy parent environment marker. |
| Write via host `node:fs` | PASS, narrowly | `ERR_ACCESS_DENIED`; this does not cover SQLite. |
| Thrown proxy looping in `getOwnPropertyDescriptor` | PASS for parent containment | Runner's external limit killed the child after 1,700 ms; parent returned failure. |
| Thrown object looping in `Symbol.toStringTag` | PASS for parent containment | Same hard-timeout behavior. |
| HTTP relay through a loopback broker | INCONCLUSIVE | Both the submitted code and unrestricted control received `EACCES`. |

The termination reproduction is simply:

```javascript
const p = console.log.constructor('return process')();
function encode() { p.kill(p.ppid, 'SIGTERM'); return ''; }
function decode() { return []; }
```

Thus I did not need to hang the parent indefinitely to defeat its supervision: the child can kill it. The two exception probes also show that [runner.js:39](C:/Users/Refur/LLMBreakthroughs/src/runner.js:39) still invokes submitted behavior outside the VM timeout. The new external timeout contains those cases, so they are no longer the v3 parent-hang bug; correct the comment rather than presenting the error formatter itself as safe.

**Fix — §§1.1, 6, 10:** enforce filesystem, network and process-interaction restrictions outside the submitted JavaScript runtime. Encoder and decoder need storage that cannot communicate, a minimal environment, no ability to signal the controller, and externally enforced resource limits. Separate working directories alone do not deny access to a shared absolute path. A deterministic bounded-language interpreter is another defensible route for Phase 2/4. Removing just SQLite would patch this reproduction while leaving the untrusted runtime in charge of its own restrictions.

**The new self-tests overstate their coverage.** The “file channel via require” submission never obtains the host `require`/`process`; it can fail before testing the intended filesystem restriction. The “network globals absent” case throws when a network global exists, but the test treats every rejection as success, so it passes whether that assertion holds or fails. Check the relevant capability or expected error explicitly, include a positive control that can distinguish the states, and retain the end-to-end SQLite reproduction.

### Other repairs verified

The actual `runAttempts` loop now archives schema 2, the exact system text and exact per-attempt request messages: a two-attempt intercepted-request test matched them byte-for-byte after JSON serialization. Hints now reject fractional/infinite budgets and the old `borderline` category; forwarding of summary memory and lag 36 passes. Partial records carry the new batch/domain/model/hint metadata, and an injected first-call failure yields assigned/completed/failed counts of 3/2/1 across three arms. `experiment.js` refuses an existing batch filename and leaves its contents unchanged.

Those fixes do not justify “full provenance” yet: hint partial records still do not independently contain the attempt/repeat budget, complete schedule, category, generator hash or frozen configuration hash. That matters if a process is interrupted before its final summary is appended. Add an immutable batch header before the first job and reference its digest from every partial record.

## 2. Reporter verification — §11.2

The tests below use schema-2 metadata and otherwise valid trial rows. The repaired manifest checks therefore run, rather than failing at the schema gate.

| Case | Result | Observation |
|---|---|---|
| Known complete paired fixture | PASS | Differences 1 and 0 give 50 percentage points. |
| Forged domain | PASS | Refused. |
| Forged options | PASS | Refused. |
| Forged memory | PASS | Refused. |
| Forged model | PASS | Refused. |
| Forged batch ID | PASS | Refused. |
| Out-of-range repeat | PASS | Refused. |
| Unconfigured seed or condition | PASS, each | Refused. |
| Mixed generator versions | PASS | Refused. |
| Duplicate trial or multiple metadata records | PASS, each | Refused. |
| Unequal repeats | PASS | Both success-by-budget entries are 50%, correctly averaging worlds first. |
| World absent in both arms | PASS | Expected-grid missing entries and an empty per-world row are emitted. |
| All paired differences zero | PASS | Numeric bootstrap interval withheld. |
| All paired differences one | PASS | Numeric interval withheld; no false “no discordant worlds” statement. |
| Different options without `sharedWorld` | PASS | Contrast refused. |
| Different options with boolean `sharedWorld: true` | PASS | Contrast computed with the declared assumption stated. |
| Secondary contrast | PASS for current code policy | Explicitly exploratory at nominal 95%. |

The new failures are not variations of the already repaired domain mismatch:

| New case | Result | Why it matters |
|---|---|---|
| All generator versions omitted | **FAIL** | Accepted and reports `laggedRule=undefined`. |
| Every row uses the same forged generator version | **FAIL** | Accepted. Adding expected-version fields to the fixture's configuration/header has no effect because no such pin is enforced. |
| `success: -1` | **FAIL** | Treated as a success, including at the first budget. |
| `success: 99` under a three-attempt budget | **FAIL** | Counts as a success in the contrast and per-world table while contributing zero to the success-by-budget curve. |
| `success: "yes"` | **FAIL** | Same disagreement between truthiness-based success and numeric budget comparison. |
| Trial reports a 99-attempt budget under a three-attempt configuration | **FAIL** | Accepted. |
| Configuration seeds `[1,1,2]` | **FAIL** | The same world is included twice: the 50-point contrast becomes 67 points with `n=3`. Header says four of six trials present but zero missing. |
| `sharedWorld: "false"` | **FAIL** | Truthy string authorizes pairing across options. |

**Fix the manifest contract — §8.** Validate the configuration itself, including unique seeds/condition IDs, integer budgets and strict booleans. Require nonempty provenance fields and compare generator/instance hashes against a frozen expected manifest. [report.js:31](C:/Users/Refur/LLMBreakthroughs/src/report.js:31) currently tests only consistency among observed version labels; it does not establish that any label is the registered version. A manually maintained version string also needs a content hash if code may change without a version bump.

Validate outcomes before computing any statistic: `success` must be null or a positive integer within the registered budget and consistent with `attemptsUsed`; successful early stopping and unsuccessful budget exhaustion need explicit rules. Validate `maxAttempts`, completion status and failure type. Use the same validated success event in tables, curves and contrasts. The `success: 99` fixture is particularly useful because it exposes internally contradictory results in one report.

**Missingness is listed, not governed.** [report.js:41](C:/Users/Refur/LLMBreakthroughs/src/report.js:41) prints that a registered policy applies, but the code has no implemented policy contract. It averages available repeats and pairs available worlds. A fixture adding `missingPolicy: "refuse"` is ignored; that key is currently unsupported, which illustrates the missing configuration mechanism rather than a regression in an existing field. Decide whether an incomplete batch is exploratory-only, retried, or analyzed under a specific exclusion policy, then enforce that choice. Truncating the missing list at twenty entries also requires a complete machine-readable missingness artifact.

**Two remaining interpretation fixes:**

- `sharedWorld: true` is an assertion, not verification that the generator shares the intended latent draws. Retain it, but register a generator-specific coupling test or shared latent-instance digest, especially when options alter random-number consumption. Do not infer the substantive coupling from the reporter accepting a boolean.
- Withholding a degenerate percentile interval is correct. Saying magnitude uncertainty is “not estimable” is too broad: distribution-free bounded-outcome intervals remain possible. State that this bootstrap is uninformative, then use the registered fallback or explicitly leave inference unresolved.

Finally, **§8 and §12 contradict each other**. §8 still promises Bonferroni-adjusted secondaries and says they are implemented; §12 and the current reporter instead make them exploratory at nominal 95%. The exploratory policy is defensible, but there must be one authoritative policy before freezing. This is not just a stale comment in an archived file.

## 3. Post-mortem verification — §11.3

### Routing and ordinary validation now pass

With a local request interceptor, the responder actually requested `review-solver` and the judge actually requested `review-judge`; the saved identities match. A valid quotation is accepted. Individually fabricated claims, fabricated evidence, nonexistent attempt IDs, invalid categories and invalid assessment values all become **`unresolved`**. This fixes the specific v3 routing and ordinary fabricated-quote failures.

Missing end records, successful end records, wrong secrets, wrong generator versions, missing attempts, duplicate metadata and nonconsecutive attempt numbers are each refused before any model request. These are meaningful repairs.

### The archived full record is still incomplete in two ways

**Summary and last-code runs do not receive the full history.** [postmortem.js:28](C:/Users/Refur/LLMBreakthroughs/src/postmortem.js:28) takes only `last.messagesSent`, then appends the last response and result. Under summary memory, that last request contains summaries, not earlier raw responses. Under last-code memory it still omits earlier raw explanations and older code.

Both sentinel tests reproduced the omission. Worse, line 29 prints that the responder now sees the full record, although it does not. In full-memory runs, the archived system/scaffold and earlier raw responses do reach the responder; the defect is conditional on memory mode, not a failure of the new archiving itself.

**The judge still does not receive the complete archive.** It receives raw attempts, result summaries and the reveal, but not the original system/scaffold or task requests. A claim such as “the prompt constrained me to technique X” cannot be checked without that context. The original system/task sentinels were absent from its request.

**Fix — §5:** construct an explicitly labeled audit record from every archived attempt's request, response and verifier result, plus the original system message. Supply that record to both roles under a registered truncation/refusal policy. Keep the solver's original limited-memory view distinguishable from the additional retrospective record. Do not substitute “the last original request” for “the complete original record.”

### A semantically changed code quotation is accepted as verbatim

[postmortem.js:42](C:/Users/Refur/LLMBreakthroughs/src/postmortem.js:42) collapses all whitespace before matching. The following raw code and proposed evidence therefore match:

```javascript
// Original attempt:
function f() { return
true; }

// Accepted alleged quote:
return true;
```

These have different JavaScript behavior: the original return is terminated at the newline; the alleged quote returns true. The probe stored the assessment as **`supported`**, with no validation problems. Thus the current check validates neither literal verbatim code nor a semantics-preserving normalization.

Require exact spans in the archived source, with attempt ID and offsets, and preserve line breaks. Display the surrounding context for adjudication. Exact spans still do not prove that the evidence entails the claim; the judge/human audit must handle that separate question.

A second fixture with `assessment: "unverifiable"`, attempt 999 and fabricated evidence is accepted without validation problems because evidence checks apply only to supported/contradicted labels. This does **not** create a false contradiction label, but it retains invented evidence in a supposedly validated record. Require null/empty evidence for that branch or validate any evidence supplied.

### Remaining log-validation holes

An end record claiming failure is accepted even when an attempt's verifier result satisfies success. An end record placed before the attempts is also accepted. Both fixtures make two model requests. Validate record order, required field types, budget completion and consistency between attempt outcomes and the end record. Merely finding one metadata record and one end record does not establish a completed failed run.

## 4. Formal commitments: precise enough to implement? — §11.4

**The core proofs are now correctly framed. The complete sampling/evaluation procedure is still underspecified.** The one-sided nonmembership witness, ordered pair-histogram feature and per-world empirical ceiling are appropriate. The joint-feature linear feasibility constraints are also valid on a fixed finite support with fixed nonnegative weights and balanced label mass. Noncommutative generated images and the feature-separable control families are now distinguished correctly.

Five points require a decision before implementations can be compared against the plan.

### 4.1 The conflict-mass equality needs a qualification

§4.2 says that balanced conflicting mass `alpha` gives `U_hist = 1 - alpha/2`. It guarantees **`U_hist <= 1 - alpha/2`**. Equality additionally requires that the remaining mass contains no label conflicts.

For example, three feature classes with positive/negative masses

```text
(0.1, 0.1), (0.3, 0.1), (0.1, 0.3)
```

have total label masses 1/2 each. The balanced class has mass 0.2, but the true ceiling is `0.1 + 0.3 + 0.3 = 0.7`, not 0.9. The intended 20%-conflict sufficient condition for a ceiling at most 90% survives; the equality does not. The executable arithmetic probe records this example.

Also specify whether the sealed score is unweighted or weighted. With weights `w_i`, replace class counts by class masses and divide by total mass. The classifier score, conflict fraction and ceiling must use the same weights; counts from one measure and a ceiling from another are not interchangeable.

### 4.2 A population feature ceiling does not automatically survive sampling

The LP bounds a weighted distribution on enumerated support. §4.2's certificate instead computes the best histogram classifier on the **realized sealed set**. These are different objects.

Consider one million equally probable feature classes, each containing a balanced positive and negative example. The distribution's optimal feature-only accuracy is 50%. Draw 100 examples independently: the probability that all 100 feature classes are distinct is

```text
product from i=0 to 99 of (1 - i/1,000,000) = 0.995062...
```

On such a realized sample, the empirical feature-only ceiling is **100%**: each class has only one observed label. No submitted solver can exceed that ceiling. A valid population-level challenge can therefore almost always fail to provide the experiment's finite-set separation certificate. This is a feature-space counterexample to the sampling inference, not a claim to have implemented a million-class invariant generator.

**Fix/test — §§3.4.5, 4.2:** specify a sealed sampling construction that preserves the required conflicting mass, for example sampling matched conflict blocks with predetermined label/weight quotas. Alternatively, change the stated guarantee and inference to a population bound with its own statistical treatment. Generate fresh evaluation data using the chosen construction, then test that the realized ceiling stays below the registered threshold without conditioning on model performance. Distinguish fresh random sampling from disjoint examples, and state how calibration and sealed supports overlap.

### 4.3 Define the exact support, features and order of conditioning

The LP is implementable only after freezing:

- Alphabet and string-length bounds; which labeled pairs are eligible; how every positive's rewrite path and every negative's invariant inequality are certified.
- The joint feature map: full quotient values, equality indicators, count vectors, or another registered tuple. Those choices can give different optimum accuracies.
- Numerical `tau`, score weights, solver tolerances and the rounding procedure used to realize finite sample counts.
- Whether nuisance matching is joint or marginal, exact or approximate, and whether it is imposed inside the LP or applied afterwards.

As currently ordered, §3.4.4 can change the support/weights that satisfied §3.4.3. Recompute the bound after all conditioning and rounding, or impose those constraints in the same feasibility problem. Register infeasibility of the **full string-level problem**, not just its algebra-value prerequisite. Noncommutativity is an eligibility condition, not a theorem that the requested bound and nuisance matching are feasible.

For a small counterexample, restrict candidate strings to `ab` and `ba` with noncommuting images, and suppose the available positive pairs within that support are identical-word pairs. Negatives distinguish `ab` from `ba`. Positive edit distance is zero and negative edit distance is nonzero; exact edit-distance matching is infeasible even though the noncommuting products and histogram conflicts exist. The full LP should reject that support and report why, rather than silently weakening matching or regenerating until the failure disappears.

### 4.4 Separate a language witness from a conservation proof

§4.2 now honestly permits bounded empirical conservation checks. Such a check supports “passed the registered conservation tests,” not global conservation. P-language can still be certified by a valid deterministic witness, but “certified out-of-L0 success” in §4.5 must not imply that every component is proved when conservation is sampled.

Register the candidate interface, pure execution semantics, equality representation, certificate search budget and exact conservation test distribution/bounds. Report separately: task pass, empirical/proved conservation status, and out-of-L0 witness status. “Unknown” remains unknown. The actual grammar/proof and helper-document AST list remain execution gates; acknowledging them in the plan does not substitute for those artifacts.

### 4.5 Close the adjacent definitions that the LP/audit depends on

§3.5 still says “unchanged in substance” while imposing a below-55% nuisance ceiling. Define which features are nuisance for each family: intended count signal in F-count cannot simultaneously be a forbidden nuisance shortcut. Similarly, §3.2 still needs bounds/moduli for the augmented summaries and a bounded representation class plus equivalence relation for its identifiability count. These are implementation choices affecting admissible worlds, not wording that can safely be left to whichever developer writes the generator.

## 5. Disclosed designer knowledge and a credible freeze — §11.5

**The fallback is acceptable for the narrowed transfer claim.** It establishes a frozen test under disclosed designer knowledge; it establishes neither author blindness nor independent choice of the family. §3.3 now says that correctly. Update §9's custodian-commitment requirement and §10's “custodian seals F-sealed” step to agree with the selected fallback.

The minimum credible timestamping arrangement is:

1. **One exact freeze manifest.** Include the source commit and content hashes for the family/generator, sampler, portfolio, scaffold/prompts, models/settings, budgets, seed procedure, exclusion/retry policy and statistical endpoints. Include the active protocol version and an explicit declaration that this is the confirmatory freeze. Archive referenced bytes, not just mutable filenames or version labels.
2. **One independently verifiable external timestamp binding its digest before confirmatory execution.** Retain the receipt/proof and verification procedure. A valid signed timestamp from an independent timestamp authority can establish prior existence of the specified digest; that is the purpose of the timestamp protocol. A public repository makes the committed material inspectable but does not turn the author's Git dates into external time evidence. [RFC 3161](https://www.rfc-editor.org/rfc/rfc3161)
3. **Link execution to that freeze.** Each batch records the manifest digest. Publish the manifest, proof, all confirmatory batch dispositions and any amendments. Amendments get a new manifest and timestamp before affected runs; previously observed outcomes remain disclosed.

OpenTimestamps is another concrete option if the retained proof is completed and independently verified. Its initial submission may be pending, so do not treat the mere existence of an `.ots` file as a completed time bound; verify that the attested existence precedes the confirmatory run. [OpenTimestamps client documentation](https://github.com/opentimestamps/opentimestamps-client#usage)

**What the receipt cannot prove:** that the author had not already inspected outcomes, that no alternative protocols were also timestamped, or that the eventually reported runs are all the runs attempted. Publicly designate one active freeze before execution, log every started confirmatory batch, and disclose abandoned or superseded freezes. The external receipt makes a freeze credible as a commitment; it does not manufacture historical blindness. No timestamp submission or external publication was performed during this review.

## 6. Hostile referee paragraph for v3.1 — §11.6

> The revised scientific claims are appropriately limited, and several prior implementation errors have been repaired. Nevertheless, the current protocol cannot support confirmatory results. Its purportedly isolated verifier still accepts zero-bit compression by communicating through SQLite, and submitted code can terminate the controller process. The reporter validates many identity fields but accepts missing or uniformly forged generator versions, impossible success indices and duplicate configured worlds that change both the effect estimate and sample size. Post-mortems omit earlier raw history under limited-memory conditions while claiming to provide it, and their quotation validator can accept a code excerpt whose behavior has been changed by removing a newline. The formal histogram bound is sound on a specified empirical set, but the plan does not explain how its weighted support construction preserves that bound in a fresh finite sealed sample; nuisance conditioning and weighting remain consequential unspecified choices. The disclosed-knowledge transfer claim is acceptable, but a timestamp must bind a complete, uniquely designated protocol and actual execution. These are observable failures and unresolved design decisions, not objections to a now-withdrawn invention claim.

The plan answers the old exposure-versus-capability objection and many individual v3 reproductions. It does not answer this paragraph yet. The evidence needed is concrete: an enforced execution boundary that defeats the new channel and parent-termination probes, a strict run/configuration schema with internally consistent outcomes, full archived post-mortem records with exact evidence spans, and a sampler demonstration that preserves its claimed certificate after matching, rounding and sealed sampling.

## 7. Top three remaining changes

1. **Replace self-imposed JavaScript restrictions with an enforced execution boundary — §§1.1, 6, 10.** The SQLite channel and controller termination invalidate correctness and availability despite the passing self-test; make them end-to-end acceptance tests for the replacement, and make capability tests distinguish denial from an unrelated failure.

2. **Finish the record contract and remove contradictory protocol statements — §§5, 8–9, 12.** Validate configuration uniqueness, pinned generator identity, outcome/budget consistency and typed coupling; provide complete post-mortem archives and exact quote spans, and choose one secondary-analysis/missingness policy. These are relatively inexpensive repairs with immediate effects on whether reported numbers and labels mean what they say.

3. **Demonstrate the certificate on actual sealed samples, then timestamp the complete freeze — §§3.3–3.5, 4.2–4.5, 10.** Resolve weighting, conflict-block construction, nuisance conditioning and infeasibility before a model run; publish a small generator/LP/certificate example that retains the required ceiling after final sampling. Bind that implementation and the registered estimands into the disclosed-knowledge commitment.
