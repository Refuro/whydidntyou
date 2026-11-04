# Build report v3 — B4r

Completed 2026-11-04. Registration and implementation began 2026-11-03.

Implements `BUILD-PROMPT-v3.md` and `DECISIONS-B4r.md`. The repaired source is pinned at `5e510b4` (sampler/admission commit `4d18ab7`); source identity `985bff1f1ed128cd16657fcee99c311e4965326c2d14ed480b7ecf466c5a409b`. No model API calls, new dependencies, sandbox adversarial probes, independent challenge, B5 or B6 work.

## Repairs and evidence

1. **Order leak.** Sampler `sealed-matched-padded-v2` permutes the fully expanded challenge with the domain-separated `sealed-matched-order-v2` PRF stream; natural rows use `sealed-natural-order-v2`. Sampler identity is included in the sealed digest. Historical evidence is unchanged. `test/b4r.test.js` retains the historical 200/200 decoder witness and 0/200 reversal, the reviewer's 24-world sample, and a separate fixed 64-proposal fixture draw. Among its 44 admitted noncommutative worlds the decoder scores 49.4545%, reversed 49.2955%, permuted 50.9432%. All fixture construction dispositions and scores are in `B4r-EVIDENCE/order-controls.json` and its companion ledger. This is a regression control, not a new population inference or a B5 audit.
2. **One contract.** Both adapters use `portfolio/contract.js` and `sandbox.runPairStage`: one budgeted public fit returning a string, then fresh runtime/context per pair with only state,a,b. Fit gets no version/digest envelope or test set. No prediction cache. Plain JavaScript and a two-source JSON package are both supported identically; reference members use the package to avoid loading unused fit code during inference. Every reference member was scored through the actual external adapter on the repaired S3 example; all 14 match on public, challenge and natural accuracy. Per-stage times and exact archived sources are in `B4r-EVIDENCE/matched-controls/summary.json` and `timings.md`.
3. **Admission.** The checker reconstructs effective classification, public identifiability, core digest, label/scale balance, registered neutral-prefix support, rounded multiplicities and final challenge ordering; it binds the PRF ambient name to the validated algebra. All three reviewer semantic fixtures refuse after their hashes are recomputed. Ambient/core/padding mutation controls also refuse. The deliberately separate reference enumerates all 203 partitions of the S3 example and independently computes counts, edit distance, LCS and two-sided congruences. Its two ceilings, nuisance imbalance and 58 conflict classes agree with production. See `B4r-EVIDENCE/example-admission.json`.
4. **Resources.** Heterogeneous counters are named member-specific search counters. The shared 60-million-work-unit ceiling is retired. Wall-clock fit/public/challenge/natural stages include fresh-context startup, code loading, state handling and cleanup. Actual module initialization is separate; standalone preparation is explicitly a cold-start estimate, with warm-module per-world fit also reported. Count/joint inference counters reproduce the reviewer's 12/4 and 16/4 fixtures; nuisance fit records 18,620 DP cells on the example; catalogue cells/congruence work are metered. Selector totals include all 14 fits and public selections plus the selected evaluation. Challenge/natural budgets are separate and equal, with no shared cache. Time/call failures have unavailable accuracy and stay in denominators.
5. **Support.** The analytic uniform oracle checks weights 1/(4K) against the simplex max-min optimum while preserving joint feature and nuisance constraints. Distinct support and paired dependence are in each world's result. The shared result field is named `paddingRobustnessGap`. Its padding interpretation applies to the matched/padded challenge; natural/control small-minus-large values are descriptive and do not establish size generalization. PLAN §3.4 and a dated preregistration addendum explicitly distinguish neutral-prefix padding from unregistered long-core generalization.
6. **Public export.** Version `sealed-matched-padded-v2-public-v2` is present in every public world JSON. Only training evidence plus a version/digest envelope is exported; the sealed list is private. Old sampler ledgers and legacy export versions are refused. The challenge prompt now references the repaired version and requires nuisance-preserving support critiques.

## Fixed audit

The fixed master 2026110304 assigns 512 proposals per requested family, 2,048 total. Every construction disposition precedes fitting. No replacements. Construction has completed with 1,720 accepted worlds: count 428, abelian 512, nonabelian 485, monoid 295. Monoid acceptance is 57.6172%; defects remain part of the benchmark definition. The four assignments reuse the same 512 seed values; rows within a world are dependent. No pooled independent-trial or coverage interval is claimed.

The fixed audit is complete: 24,080 fits and 14,448,000 fresh-context pair evaluations, with zero evaluation failures. All 48,160 challenge/natural accuracy comparisons with historical B4 match. The current scores were rerun in full; historical scores are excluded from freeze inputs. Coverage exceeds 200 accepted worlds in every requested and effective family. The finite-monoid CSP and oracle portfolio succeed on 1,720/1,720; the implementable public selector succeeds on 1,719/1,720. The family remains within the registered library on this admitted audit corpus. No interval is attached to these counts.

| requested family | proposed | accepted | acceptance | effective accepted classification |
|---|---:|---:|---:|---|
| F-count | 512 | 428 | 83.59% | 428 count |
| F-abelian | 512 | 512 | 100.00% | 512 abelian |
| F-nonabelian | 512 | 485 | 94.73% | 377 nonabelian + 108 abelian |
| F-monoid | 512 | 295 | 57.62% | 263 monoid + 32 abelian |

Effective denominators are count 428, abelian 652, nonabelian 377 and monoid 263. The one selector miss is in the effective abelian group. Full per-member requested/effective coverage, natural controls, all three BFS curves, fit/public/challenge/natural wall-clock, preparation estimates and selector totals are in `B4r-EVIDENCE/coverage.md` and `summary.json`. `reconciliation.json` binds the completed row/call counts and source identity.

Monoid defects: 119 infeasible registered matched supports, 45 insufficient short consequence rules, 15 unavailable bounded identity padding words, 22 negative-pair exhaustion cases and 16 non-identifiable cases. The complete reasons and requested-to-effective proposal flow for every family are in the summary and construction ledgers. The additional 64 proposals in the order-decoder fixture are separately labeled and do not enter these audit denominators.

The full export contains all 1,720 accepted worlds at `challenge/public-sealed-matched-padded-v2-public-v2/`; every JSON has export version `sealed-matched-padded-v2-public-v2` and no sealed batch. The private index and exact file/ledger hashes validate against the same pinned source. Repeating the export is a verified no-op. See `B4r-EVIDENCE/public-export-validation.json`; the separate single-world export and complete private example remain available for review.

## Validation and limitations

`LLM_MOCK=1 npm test`: 92/92 passing, including all new semantic, ordering, contract, counter and exporter fixtures. Focused repaired tests: 22/22 before the full suite. Both scoring shards were checked on a one-world fixture (including the empty shard) after the final scheduling change. The aggregate adversarial selftest was not run, per the author's prohibition on sandbox adversarial probing. No adversarial probes were added or executed.

Budgets are registered development settings, not a freeze: 20 seconds fit; 20 seconds independently per public/challenge/natural set; 2 seconds per pair; 200 pair calls; reference member-specific fit ceiling 2,000,000 units. The interpreter interrupt remains cooperative, not a hard external supervisor. Eight fixed scoring workers share the recorded machine; contention affects measured wall time. Standalone cold-start numbers are estimates, not separately repeated cold starts for every world. Count/feature/catalogue counters are explicitly scoped units, not complete instruction counts. The independent checker is intentionally limited to small tables (at most six elements); production congruence closure handles larger ones.

`docs/B4-EVIDENCE/`, historical example/export evidence and `docs/archive/` are unchanged. Historical B4 code is retained under explicit `-b4` entry names for witnesses; it is excluded from the active exporter/audit. B4r review and the separate independent challenge must precede author decisions, portfolio freeze, B5 and B6.


## Handoff

Completed the seven v3 items, the versioned example/full export, 14 matched external controls and the full fixed audit. The review request is `docs/REVIEW-PROMPT-B4r.md`; the eventual challenger uses the updated `docs/CHALLENGE-PROMPT-B4.md`. Matched reference source archives are reviewer material, not permitted challenger reading. No independent challenge was run by the builder.

Stop here. B4r review and the separately authorized independent challenge come next, then author decisions and portfolio freeze. B5/B6 and real-model pilots remain gated. Commits are local; nothing was pushed.
