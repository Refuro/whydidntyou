# B4r review request — private-pair contract and repaired sampler

Review the v3 repairs against `REVIEW-RESPONSE-B4.md`, `DECISIONS-B4r.md` and `BUILD-PROMPT-v3.md`. Begin with `BUILD-REPORT-v3.md`. This is the mandatory stop before author decisions/freeze and B5/B6. The independent solver challenge is a separate session; the builder's matched controls do not satisfy that gate. No model API calls or sandbox adversarial probes in this review.

## Evidence to inspect

- `docs/B4r-EVIDENCE/registration.json`, four complete construction ledgers, four merged portfolio logs, their eight shard logs, `summary.json` and `coverage.md`. The fixed assignment is 2,048 proposals, master 2026110304, with no replacement. Source identity, machine and worker schedule are recorded. The old `docs/B4-EVIDENCE/` remains historical.
- `examples/invariantGame-world-b4r-1.json`, its construction ledger, and `docs/B4r-EVIDENCE/example-admission.json`. The independent reference enumerates all 203 partitions of the S3 table instead of using production congruence closure.
- `docs/B4r-EVIDENCE/order-controls.json` and its separate 64-proposal fixture ledger. These are regression fixtures, excluded from fixed-audit coverage counts.
- `docs/B4r-EVIDENCE/matched-controls/summary.json` and `timings.md`, all 14 exact source packages, and the external adapter's archived sources/rows/reports. These reference implementation archives are reviewer material, not permitted challenger reading. All 14 public/challenge/natural accuracy triples matched.
- `docs/B4r-EVIDENCE/tests.log`: 92 ordinary tests pass. The new tests are in `test/b4r.test.js`; exporter and adapter tests were updated to refuse the retired interface. Historical host-scoring witnesses explicitly import `run-b4.js`.
- Versioned export `challenge/public-sealed-matched-padded-v2-public-v2/` and single-world control export `challenge/example-sealed-matched-padded-v2-public-v2/`. Every file has that exportVersion. The host indices stay outside the public directories. Reviewer access may include private ledgers; the independent challenger must not inspect them.

## Questions and requested checks

1. Does final-list permutation close the demonstrated order decoder, preserving label/certificate association? Compare the historical 200/200 decoder and 0/200 reversal with the fresh, reversal and permutation controls. Verify the current exported schema contains no sealed list. Does fit see only public evidence, and each isolated inference see only state,a,b without row order, scale, digest or prior state?
2. Trace a reference member and an external submission through `contract.js` / `runPairStage`. Both plain JS and the two-source package use the same path. Confirm exactly one fit, a serialized string boundary and fresh runtime/context per inference; no host solver execution, cross-set memoization or shared evaluation budget. The interpreter module alone is reused.
3. Recompute the three semantic fixtures after rebinding hashes: wrong effective family, all-small sealed scale and non-identifying training. Confirm refusal is semantic rather than a stale checksum. Also inspect actual core-digest reconstruction, image-stream ambient binding and registered padding/multiplicity checks. Assess the limited independent feature/congruence reference against the exported example.
4. Check the 12/4 and 16/4 counter fixtures and explicitly charged nuisance/catalogue preparation. Counters remain member-specific, not comparable instructions. Verify stage wall-clock includes context/load/state/cleanup; compare both sides of all 14 controls. Standalone preparation is labeled a cold-start estimate; actual module startup and warm-module fit are separate. Is that distinction sufficiently clear? Confirm selector totals include every fit/public selection plus the selected evaluation. Review any recorded time/call failures with denominators retained.
5. Verify the analytic uniform optimum 1/(4K), K<=32, against simplex while holding nuisance constraints fixed. Confirm per-world distinct support and neutral-prefix dependence, `paddingRobustnessGap`, and PLAN §3.4's restriction of the estimand. A new long-core distribution is future work, not part of this build.
6. Reconcile each score row to an accepted ledger entry and each fixed proposal to a disposition. Check requested-to-effective flow, all defects, monoid acceptance 295/512, and the reused 512 seed values across families. No interval on complete portfolio coverage; no pair-level or pooled-family independent-trial claim.
7. Check the new export/version binding and refusal of legacy sampler ledgers/exports. Confirm the updated challenger prompt references this version and requires nuisance-preserving sampler critiques. Old leaking-version scores cannot enter a freeze.

Read-only checker:

```powershell
node src/check-invariant-world.js examples/invariantGame-world-b4r-1.json
$env:LLM_MOCK='1'
npm test
```

A full independent rerun must use a new output directory, never overwrite B4 or B4r evidence:

```powershell
node src/portfolio/audit.js <new-review-evidence-directory>
```

The eight-worker wall-clock schedule is part of the recorded development audit; timings depend on host/load. The interrupt is cooperative. Exact solver outputs should be compared separately from timing differences and explicitly retained evaluation failures. Keep all attempted methods and budgets. Write `docs/REVIEW-RESPONSE-B4r.md` with ranked findings and concrete fixtures. Do not freeze, start B5/B6, or run a real model pilot.
