# Fifth review: whydidntyou, Plan v3.2

Reviewed on 2026-11-03 against the local working tree. The reviewed [PLAN.md](C:/Users/Refur/LLMBreakthroughs/docs/PLAN.md) has SHA-256 `c481d81f71282ff8bc384f6e309bacf376cd7a1ffa6bf9556694aa76a3559f0b`. Tests used Node v22.23.4 and the already installed `quickjs-emscripten`/core **0.32.0**. The evidence records source/lockfile hashes and the tested WASM binary hash.

**Verdict: the WASM change closes the reproduced Node filesystem/process channels, but the clock remains reachable and permits an uncounted timing channel. Ordinary recursion also escapes the evaluator's error handling and leaves a run with only its metadata record.** Those are blockers for the claimed verifier contract. The older reporter and quotation-validation failures are largely repaired; several new record-integrity failures remain. The central finite-set bound and post-conditioning feasibility objections are now resolved at the mathematical specification level.

I replayed prior submission payloads using the new asynchronous API and translated reporter/post-mortem fixtures to schema 3. Running old scripts unchanged would test an obsolete synchronous API or merely trigger schema rejection. Tests ran in a separate source copy with the installed dependencies, synthetic inputs and intercepted local model responses. No paid model requests, training, external publication or source changes were performed.

Reproduction artifacts:

- [REVIEW-EVIDENCE-v5.json](C:/Users/Refur/LLMBreakthroughs/docs/REVIEW-EVIDENCE-v5.json): 95 verification records, including repeated timing trials and individual fixture outcomes. This is a record of targeted checks, not a certification score.
- [REVIEW-CHECKS-v5.mjs](C:/Users/Refur/LLMBreakthroughs/docs/REVIEW-CHECKS-v5.mjs) and [REVIEW-CHECKS-v5-extra.mjs](C:/Users/Refur/LLMBreakthroughs/docs/REVIEW-CHECKS-v5-extra.mjs): runnable reproductions. They copy source and installed dependencies, excluding `.env`, into a separate directory beside the evidence file.

From the repository root, with the locked dependencies installed:

```powershell
node docs/REVIEW-CHECKS-v5.mjs . "$env:TEMP\whydidntyou-v5-evidence.json"
node docs/REVIEW-CHECKS-v5-extra.mjs "$env:TEMP\whydidntyou-v5-evidence.json"
```

## 1. Verifier and capability probes — §11.1

### Old channels blocked; the shipped self-test passes

The shipped capability probe returns `0000000`. All sixteen shipped regressions pass, and the real lag-bank program retains the expected seed-1 outcomes: approximately **0.995 bits/symbol, success**, on laggedRule and **2.558, failure**, on hiddenPeriod. Its source hash is still checked.

Independent replays confirm the following outcomes:

| Prior payload | Result |
|---|---|
| Global stash; shared `Math` stash | PASS, each: no cross-instance data recovered. |
| Throwing decoder proxy; looping decoder proxy | PASS, each: rejection/interruption returned. |
| Console-constructor host escape; context-constructor host-global stash | PASS, each: no host process or shared stash recovered. |
| Looping exception-message getter; replacement JSON serializer; queued Promise loop | PASS, each: evaluator returned a rejection. |
| Exception `Symbol.toStringTag` getter; descriptor-trapping proxy | PASS, each: interrupted within the interpreter. |
| Parent termination; inherited environment; host filesystem access | PASS for those reproduced routes: unavailable host access is rejected. |
| SQLite channel | PASS: unavailable host process/module access prevents the v4 channel. |
| Network access through host `getBuiltinModule` | PASS for that route: no process/module loader recovered. |

These are route-specific results. I found no new arbitrary filesystem, process or environment access. The findings below do not require a WASM memory-safety escape.

### The clock capability probe reports `111`

[sandbox.js](C:/Users/Refur/LLMBreakthroughs/src/sandbox.js) saves the real constructor as global `__OrigDate`. The replacement `Date` also reuses its prototype, whose `constructor` still points to the real constructor. All three of these expressions return a live timestamp:

```javascript
__OrigDate.now()
Date.prototype.constructor.now()
new Date().constructor.now()
```

I ran a successful `runSide` probe returning one bit per expression, testing whether each produces a positive timestamp. It returns **`111`**, where the claimed capability policy requires `000`. This complements the shipped `0000000`: its sixth bit checks only `Date.now()`, so its result does not establish that no clock is reachable.

**A concrete encoder-to-decoder timing channel:** the same program below was evaluated on one-symbol binary inputs `0, 1, 1, 0`, in separate fresh interpreter instances on each side:

```javascript
const clock = Date.prototype.constructor;

function encode(s) {
  const target = s[0] * 1000 + 250;
  for (;;) {
    const phase = clock.now() % 2000;
    if (phase >= target && phase < target + 100) break;
  }
  return '';
}

function decode() {
  return [clock.now() % 2000 < 1000 ? 0 : 1];
}
```

All four trials returned **`ok: true`, zero bits and `success: true`**, under a 3.5-second per-side budget. The decoder recovers the symbol from the time at which the encoder releases control. The input symbol is absent from the submitted source and counted bitstring.

This is a deliberately small channel test, **not a demonstrated zero-bit solution to the 4,000-symbol laggedRule wall**. It nevertheless falsifies §6's universal claim that the bitstring is the only encoder-to-decoder channel. A slow or noisy channel is still an uncounted channel.

**Fix — §6:** remove the native Date capability at context creation, rather than replacing one global while retaining aliases. The installed API explicitly supports `newContext({intrinsics: {...DefaultIntrinsics, Date: false}})`; introduce a deterministic replacement only if the task actually requires one. Audit all reachable intrinsic paths and use probes that report capability bits before relying on a failure test. The relevant option is documented in the [installed API declarations](C:/Users/Refur/LLMBreakthroughs/node_modules/quickjs-emscripten-core/dist/index.d.ts:573).

Also correct “we import none” and “residual risk is a memory-safety escape” in §6 and the source comments. Not injecting custom JavaScript functions does not establish that the interpreter's built-in facilities expose no ambient information. Here the bypass is an ordinary reachable constructor.

### Normal JavaScript can still break the attempt loop

New rejection/termination probes used a 200 ms interpreter budget and an external 4-second supervisor:

| New case | Result | Observation |
|---|---|---|
| Backtracking regular expression | PASS | Interpreter interruption returned a failure. |
| Load-time exception with looping `toJSON` | PASS | Error conversion completed under its additional deadline. |
| Load-time exception with looping message getter | PASS | Rejected. |
| Load-time proxy with looping getter | PASS | Rejected. |
| Non-string wrapper JSON result | PASS | Rejected. |
| Looping setter on injected `__dataJson` | PASS for containment | Returned a failure; no outer kill needed. |
| Allocation loop | PASS for bounded completion | Returned `out of memory`; elapsed about 1.76 seconds, exceeding the requested 200 ms. |
| Deeply nested array/stringification | **FAIL** | `evaluate` rejected with host-side `RangeError: Maximum call stack size exceeded`. |
| Ordinary recursive function | **FAIL** | Same uncaught RangeError; runtime disposal also emitted a QuickJS assertion diagnostic. |

The minimal recursion case is:

```javascript
function encode() {
  function f() { return f() + 1; }
  return f();
}
function decode() { return []; }
```

An end-to-end `runAttempts` test, using a locally fabricated response containing this program, rejected with that RangeError and left **only a `meta` record**. There was no attempt record or end record. Thus a submitted program can abort the collection path instead of producing a counted failed attempt. This is not a host-code-execution finding; it is a failure of the evaluator and logging contract.

**Fix — §§1.1, 5–6, 8:** catch interpreter/FFI exceptions at the outer host boundary and return a bounded failure result; make attempt logging resilient to those failures. Configure the interpreter stack below the host/WASM stack limit demonstrated on the supported runtime, and test cleanup after interruption and traps. An interrupt handler is a cooperative limit, not a hard wall-time guarantee: retain an external supervisor if the protocol promises a hard deadline. The library exposes runtime limits and requires explicit resource disposal; the harness must handle failures across that entire lifetime. [QuickJS runtime documentation](https://github.com/justjake/quickjs-emscripten#runtime)

The v5 architecture is substantially better than the Node permission-model implementation. That improvement does not justify treating its adapter, capabilities or lifecycle as proved correct.

## 2. Reporter and provenance — §11.2

### The v4 fixtures now behave correctly

All fixtures below used otherwise valid schema-3 records, pinned generator versions and outcomes consistent with early stopping unless that field was deliberately corrupted.

| Case | Result |
|---|---|
| Known paired differences 1 and 0 | PASS: 50-percentage-point estimate. |
| Forged domain, options, memory, model, batch, seed, repeat or condition | PASS, each: refused. |
| `success: -1`, `99` or `"yes"` | PASS, each: refused. |
| Wrong attempt budget; success/attempt-count disagreement | PASS, each: refused. |
| Mixed, missing, uniformly forged or unpinned generator versions | PASS, each: refused in the confirmatory policy. |
| Duplicate configured seeds or condition IDs | PASS, each: refused. |
| Duplicate trial or multiple metadata records | PASS, each: refused. |
| Missing world under `refuse` | PASS: incomplete batch refused. |
| Missing world under `exploratory` | PASS: development-only warning and complete machine-readable missing list. |
| Unequal repeats under exploratory policy | PASS: world-first success-by-budget gives 50%/50%. |
| All differences zero or all differences one | PASS, each: bootstrap withheld and inference marked unresolved. |
| Different options without coupling declaration | PASS: contrast refused. |
| Boolean `sharedWorld: true` | PASS: declared coupling accepted and labeled. |
| String `sharedWorld: "false"` | PASS: refused. |

The exploratory-secondary policy now agrees between §8 and the reporter. Do not repeat the former Bonferroni contradiction as an outstanding issue.

### New failure: distinct seed integers can name the same generated world

The reporter accepts seeds `1` and `4294967297` as two unique integers. For the current laggedRule generator, they produce **identical secret, sample and test arrays**. The SHA-256 of those three components was identical:

```text
42619635fa23769dab68707bba53808b5d64fda012fca2bd314c2d8052be5dc6
```

The cause is the generator's 32-bit random-state normalization: adding `2^32` to these seed inputs produces the same effective state. A report fixture using those two labels was accepted as **two paired worlds**.

This is not evidence that the existing small-seed pilot has duplicated worlds. It is evidence that configuration uniqueness does not establish the declared unit of analysis. The defect matters if larger/random seed identifiers are introduced or batches are combined under different seed conventions.

**Fix — §8 and the generator contract:** register the permitted seed domain, reject aliases before execution, and record the effective generator identity. For this implementation, a checked unsigned-32-bit seed range is an immediate restriction; a canonical instance/shared-draw digest provides a stronger audit against mistaken world identity. Distinguish intentional repetitions of one world from independent world draws. Include both alias rejection and cross-option coupling in the generator-specific tests.

### Other remaining record checks

| New case | Result | Required repair |
|---|---|---|
| Omit both batch ID and model from metadata and every trial | **FAIL** | Accepted with `Batch: undefined. Model: undefined.` Require nonempty typed identity fields before equality comparisons. |
| Failed trial claims `budgetExhausted: false` despite exhausted counts | **FAIL** | Accepted. Validate the redundant flag or derive it centrally and stop treating the unchecked value as provenance. |

The first case exposes the distinction between “all rows agree” and “the identity exists.” Finish validation of required fields in one shared schema used before execution and before reporting. This is preferable to adding another isolated condition for each discovered fixture.

Version pins are now enforced as strings, which repairs the v4 test. Content hashes of the generator, runtime and complete freeze remain necessary for the stronger commitment in §3.3. The current experiment/run records do not yet enforce a freeze-manifest digest; that should be an explicit pre-freeze gate, not inferred from the presence of a version label.

### Hint-header repair and a new startup regression

The header is written before its three test jobs; recomputing its SHA-256 matches `headerDigest`, and every job references that digest. The header includes the ladder contents, categories, budgets and schedule. That repair passes.

However, with no existing `runs/` directory, `hints.js` fails while writing that first header: `ENOENT ... runs/hint-effects.partial.jsonl`. Previously `runAttempts` created the directory before partial output; the new header runs earlier. Create the output directory before writing the header. This is a small, directly reproduced startup regression, separate from the scientific issues.

## 3. Post-mortem record and exact quotations — §11.3

### The important v4 repairs pass

For `full`, `summary` and `last-code` runs, sentinel tests confirm that **both roles now receive the original system prompt, initial task, earlier raw response, earlier feedback and final raw response**. This fixes the summary-memory omission. The responder actually uses the saved solver model, the judge actually uses `--judge-model`, and the recorded identities agree.

| Validation case | Result |
|---|---|
| Exact claim/evidence with valid attempt ID | PASS: accepted, with offsets recorded. |
| Fabricated claim or fabricated evidence | PASS, each: unresolved. |
| Nonexistent evidence attempt | PASS: unresolved. |
| Invalid category or assessment | PASS, each: unresolved. |
| `return true;` quoted from code containing `return\ntrue;` | PASS: unresolved; whitespace normalization is gone. |
| Unverifiable assessment carrying fabricated evidence | PASS: unresolved. |
| Unverifiable assessment with null attempt and empty evidence | PASS: accepted as unverifiable. |
| Missing end, successful end, successful attempt under failed end | PASS, each: refused before requests. |
| Wrong secret/version, missing attempt, duplicate metadata, nonconsecutive attempts | PASS, each: refused before requests. |
| End before attempts or unexhausted budget | PASS, each: refused before requests. |

### The judge still loses the final verifier feedback

The responder receives `FINAL_FEEDBACK_SENTINEL`; the judge does not, under all three memory modes. [postmortem.js](C:/Users/Refur/LLMBreakthroughs/src/postmortem.js) builds the judge transcript with `record.slice(0, -1)`, dropping the last user message. That message contains both the final verifier feedback and the reveal. Supplying the reveal separately does not restore the omitted feedback.

A statement about why the final attempt failed can therefore be judged without the result that could support or contradict it. For a one-attempt run, this also removes the only verifier feedback.

**Fix — §5:** maintain the complete archived record separately from the reveal/post-mortem instructions. Give both roles every archived result, then add the reveal separately. Validate equality of the intended record content at each consumer, including the last element; checking only the presence of an early sentinel misses this defect.

The evidence schema also permits citations only to raw attempt responses. Claims about prompt constraints or verifier feedback cannot cite those record types through `evidenceAttempt` plus an attempt-response substring. Either restrict the claim-selection task to assertions supportable by raw submissions, or add typed evidence spans for system/task/response/feedback. Exact spans establish provenance, as the plan now acknowledges; human adjudication still establishes entailment.

### Log validation remains partial

Four malformed variants of an otherwise valid failed run were accepted and made both requests:

- `end.maxAttempts: 99` while the metadata budget and attempt count are 2.
- `budgetExhausted: "false"`, a truthy string.
- Missing `meta.system`.
- Missing `end.success` instead of explicit null.

**Fix — §5:** require typed, present fields before truthiness or equality tests, cross-check both budget fields, and require explicit null for a failed end state. Missing system text must refuse the purported full-record path. Reuse the same run/outcome validation contract as the reporter so the two tools do not disagree on which records are trustworthy.

## 4. Are §§4.2 and 3.4(6) implementable now? — §11.4

**The mathematical objections from v4 are closed. The plan now gives a coherent construction; completing a numerical protocol still requires a configuration and a few explicit interface decisions.** I would not ask for another conceptual redesign of the histogram ceiling or feasibility program.

The following commitments are sufficient in principle:

- A one-sided witness proves nonmembership in the permutation-invariant reference language; lack of a witness remains unknown.
- The empirical ceiling is calculated within each world on ordered pair-histogram classes.
- Balanced conflicting mass gives an upper bound, with equality qualified correctly.
- Score, conflict mass and ceiling use the same weights.
- Constructing conflict blocks with fixed label/weight quotas addresses the v4 independently sampled-set counterexample.
- Recomputing after matching and rounding, and checking full string-level feasibility, addresses the earlier algebra-only and conditioning gaps.

Do not mistake those mathematical commitments for a fully determined implementation. Resolve these remaining choices in the registered configuration and tests:

**1. Write the weighted formula explicitly.** For nonnegative example weights, define `W_z+` and `W_z-` as positive/negative mass in class `z`, and `W` as total mass. Then

```text
U_hist = sum_z max(W_z+, W_z-) / W
       = 1 - sum_z min(W_z+, W_z-) / W.
```

The printed count formula is the equal-weight special case. Specify whether quotas produce integer multiplicities or retained evaluation weights, how floating-point/tolerance errors are handled, and whether zero-weight examples count anywhere. A small audit should recompute the ceiling independently from final exported examples and weights, not trust an LP status flag.

**2. Specify the relationship between the histogram and joint-feature certificates.** A histogram conflict block need not be a conflict block for the richer tuple of registered quotient/count features. Compute both bounds on the final sealed set, or state clearly which one is only a population-support guarantee. If §3.4's joint-feature threshold is intended to hold empirically on sealed examples, its quotas must preserve conflicts in the appropriate joint feature classes too. “Verify U_hist” alone does not enforce the richer bound.

**3. Register the block-generation and access interface.** Fix the finite support, word/rule bounds, exact feature tuple, threshold, quotas, weighting, matching and rounding settings. Define whether the submitted classifier sees one pair, an entire batch, block IDs or a stable order. Randomize presentation and require permutation-invariant evaluation behavior where the certificate assumes a pure per-pair function. Otherwise predictable positive/negative positions or observable block metadata can distinguish examples that the stated feature-only classifier cannot distinguish. Test that reordering or relabeling administrative IDs does not change a frozen quantity's outputs or score.

**4. Resolve sealed verification versus acceptance.** §3.4.5 says sealed evaluation pairs are never used for instance acceptance; §4.2 now checks their realized ceiling before use. These can coexist if the latter is a fail-closed assertion of the construction, with failures reported as generator defects under a frozen disposition rule. They cannot silently become “keep drawing sealed sets/worlds until the threshold passes.” Register what happens to a failed construction, its world denominator, and any replacement seeds before outcomes are observed.

**5. Demonstrate one complete, independently checkable world.** The next useful artifact is an exported small example containing the algebra, rules, positive rewrite-path certificates, negative invariant inequalities, eligible support, feature assignments, feasible weights/quotas and final sealed set. An independent checker should confirm conservation of the planted invariant, labels, both relevant feature ceilings and nuisance constraints after every transformation. This is the test that resolves remaining ambiguity; another prose assurance does not.

Three adjacent commitments remain pending rather than disproved: the actual L0 grammar/proof and allowed-helper AST list; the representation bounds/equivalence relation for §3.2's identifiability count; and the per-family distinction between intended signal and nuisance features in §3.5. Keep them as explicit pre-execution gates. Also preserve the distinction between a language witness, bounded empirical conservation and a conservation proof in reported endpoints.

Finally, the disclosed-knowledge fallback is now specified adequately in §3.3. Its heading says §§9–10 use the same wording, but §9 still asks for a custodian commitment and §10 still says a custodian seals the family. Synchronize those active instructions. This is documentation cleanup, not a renewed objection to the accepted fallback.

## 5. Hostile referee paragraph for v3.2

> The revision repairs the reproduced Node escape routes and most earlier outcome/quotation-validation errors, and its finite-set separation argument is now conceptually coherent. However, the verifier's strongest claim remains false: the original Date constructor is reachable, and the authors' evaluator accepts zero-bit transmission of a binary symbol through execution timing despite reporting that every capability is absent. Ordinary recursive code also raises an uncaught host-side exception and disappears from the attempt record, compromising failure counts. The reporter still accepts missing batch/model identity and treats distinct seed labels that generate identical random streams as independent worlds. The supposedly complete post-mortem record omits final verifier feedback from the judge. Before confirmatory interpretation, the work needs an audited capability/lifecycle boundary, one consistent typed record contract, and an exported generator example verifying both histogram and joint-feature bounds on the actual final sealed examples. These failures concern observable measurement integrity; they do not depend on reviving the withdrawn claim that corpus absence proves latent capability absence.

The plan answers much of the previous hostile paragraph. It does not yet answer this one. The decisive evidence would be the new clock probe returning zeros, the timing submissions failing, recursive submissions recorded as bounded failed attempts, aliased world seeds rejected or grouped correctly, complete final feedback at both post-mortem roles, and a checker-verified constructed sealed example.

## 6. Top three remaining changes

1. **Remove native clock reachability and contain interpreter failures — §§1.1, 5–6.** Disable the Date intrinsic, audit remaining capability paths, and make interpreter traps produce logged failures; retain an external deadline if hard wall time is part of the budget. These repairs directly address an observed uncounted channel and lost attempts without discarding the improved WASM architecture.

2. **Use one typed run/experiment contract and actual generator identity — §§5, 8.** Require present batch/model/system fields, strict outcome/budget types, nonaliased seed identities and complete feedback at both post-mortem consumers; create the hint output directory before its header. Most changes are small and prevent inconsistent counts, missing evidence and silent provenance gaps.

3. **Replace remaining promises with one auditable generator-to-sealed-set example — §§3.2–3.5, 4.2–4.5.** Freeze the numerical choices and interface, preserve and independently recompute both required feature bounds after matching/rounding/block construction, and register construction-failure handling. Then bind the working implementation and its protocol into the already specified freeze manifest.
