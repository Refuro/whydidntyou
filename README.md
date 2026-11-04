# whydidntyou

**Can a language model independently re-make a breakthrough humans already made? If it fails, why? What was the gap between what it tried and the solution?**

That is what this repo tries to measure.

## Where this came from

The premise came up while building a Dolby Vision driver for a Raspberry Pi 4 with an AI assistant. We were up against a wall: CPU-bound, with a fixed amount of work that had to be done per frame. Out of frustration I asked the AI to find a *novel* way to compress that work further. It didn't. But it raised a question that stuck: can AI independently discover breakthroughs of that kind at all?

Consider calculus. If a model were given the same mathematics humans had before calculus, could it independently discover calculus? If not, why not? What is the gap between what the model attempts and the breakthrough? Not "did it pass or fail," but what was *missing* from its search — and whether that gap has a pattern that could be closed.

`whydidntyou` is a harness for measuring that, rigorously enough to publish. It gives a model a problem whose specific answer cannot be in any training set (it is generated from a secret rule), lets the model try repeatedly against an exact verifier, logs every attempt, and then — on failure — measures which hints help relative to a no-hint control, reveals the answer, asks the model why it never tried that, and checks that explanation against the log for contradictions.

What the harness can and cannot claim is stated in `docs/PLAN.md` §0–1. In short: it measures a model's search relative to a frozen library of known methods and explicit budgets. It cannot certify that a method was absent from a trained model's toolkit; that requires a model whose training data is fully controlled (Phase 4).

The first domains are compression problems on purpose. That is where the question started, and compression has the cleanest possible verifier: discover the structure or you cannot shrink the data, and the oracle tells you exactly how far you are from the wall.

One dependency (`quickjs-emscripten`, the WASM-hosted interpreter that runs submitted programs). Node 20+. Calls the Anthropic API directly with `fetch`.

## Why synthetic domains

Removing a real breakthrough (calculus, Huffman coding) from a model's training data is not possible without also removing the capability that would let it derive the breakthrough. So instead of erasing a known answer, we mint an unknown one: a generative process with a hidden rule, built so that compressing well requires modeling the structure that rule creates (checked against a registered set of known compressors in `selftest`, not asserted). The specific answer is new by construction; the *kind* of structure may be familiar, which is why every result is reported against a frozen baseline library rather than as discovery. The oracle (the true process) gives an expected bits-per-symbol floor to measure against.

Two compression families are wired into the model loop:

| family | hidden structure | the "key move" | role |
|---|---|---|---|
| `laggedRule` | `s[i] = g(s[i-k])` with noise; `k` in 12..40, `g` a derangement | find the one sparse long-range dependency, outside the window stock compressors look at | main |
| `hiddenPeriod` | `s[i] = K[i mod L]` with noise; `L` in 200..400 | model as a function of *position*, not earlier symbols | **held out** for the transfer test |

Both have a uniform marginal, so frequency coding and context modeling gain nothing. `npm run selftest` proves the wall: naive, order-1 and PPM order-6 solvers all fail, a solver that knows the secret succeeds. (The first versions of both walls were too low — a frontier model cracked `laggedRule` v1 on attempt 1 with stock PPM without ever identifying the structure. The `prereg/` addenda record what changed and why.)

## Measurements (defined before running; see `prereg/`)

The unit of analysis is the sampled world (seed). Repeat 0 is primary; later repeats are exploratory and remain separate. Unknown arm outcomes produce sample identification intervals. The provider-randomness population upper bound is available only for resolved zero-success evidence; positive or unresolved counts have inference unavailable and the trivial bound 1.

| measurement | plain-language meaning | where |
|---|---|---|
| **Discovery rate** | Out of N independent tries at this kind of problem, how often did the model crack it within the attempt budget? | `report.js` |
| **Success by budget** | What share of trials were solved within 1, 3, 6, 9… attempts? Reported as a curve, never as a median over successes (which rewards models that only solve easy worlds). | `report.js` |
| **Distinct ideas per 10 attempts** | How many *different* ideas were in those attempts, as opposed to variations on the same idea? 10 = every attempt new; 2 = it mostly repeated itself. | `report.js`, `analyze.js` |
| **Key-move coverage** | Did the decisive idea (pre-registered in `prereg/<domain>.md`) appear anywhere in the trajectory, even in a failed form? | `analyze.js --judge` |
| **Hint effect** | For each rung of a hint ladder, how much does success rate change compared with an equal-budget no-hint control? Selected on development worlds, confirmed on fresh ones. | `hints.js` |
| **Self-report category** | After seeing the answer, does the model say it never thought of it, thought of it and dropped it, lacked the concept, or ran out of budget? | `postmortem.js` |
| **Self-report contradiction** | Is that claim contradicted by the log? ("I never considered it" when an attempt's code contains it.) Non-mention is not evidence either way. | `postmortem.js` cross-check |
| **Transfer gain** | Does a scaffold built from `laggedRule` post-mortems raise discovery rate on the *held-out* `hiddenPeriod` family? Reported as a percentage-point difference with CI. | `report.js` contrasts |

The transfer gain is the headline, with one caveat the reviewers made explicit: cross-family improvement shows a scaffold carries something general, not that it carries no strategy. The transfer family is chosen before any pilot and never opened during development.

## Setup

```bash
npm install
cp .env.example .env     # add your ANTHROPIC_API_KEY
npm run selftest         # verifies the sandbox, the scorer and the wall; no API needed
```

To exercise the whole pipeline without spending anything: `LLM_MOCK=1` before any command (canned responses).

## Workflow

```bash
# 1. One run, watch it think
node src/run.js --domain laggedRule --seed 1 --attempts 20

# 2. On a failed run: reveal, ask why, classify, cross-check against the log
node src/postmortem.js --log runs/<that-run>.jsonl

# 3. Minimal-nudge search on that instance (short runs per hint level)
node src/hints.js --domain laggedRule --seed 1 --attempts 6 --repeats 3

# 4. Per-run analysis (add --judge to score ideas against pre-registered key moves)
node src/analyze.js --judge runs/<run>.jsonl

# 5. The real experiment: conditions × seeds × repeats, then the report with CIs
node src/experiment.js experiments/pilot.json
node src/report.js runs/experiment-pilot.jsonl      # -> runs/report-pilot.md
```

Scaffolds (`scaffolds/*.md`) are appended to the system prompt via `--scaffold` or a condition's `"scaffold"` field. Build them from what the post-mortems and hint ladders tell you — then test them on `hiddenPeriod`, never tune them on it.

## Protocol for a publishable run

1. **Pre-register.** `prereg/<domain>.md` holds the key moves, success criterion, and falsifiable predictions. Write them before the first real run; never edit after, only append dated addenda.
2. **Baseline.** Pilot configs are development only. For a confirmatory run, ≥32–40 independent worlds per primary condition (the world is the unit of analysis; repeats measure within-world noise and come second). One primary contrast; secondaries Bonferroni-adjusted.
3. **Post-mortem every failed baseline trial.** Collect the categories and the "generic advice" sentences.
4. **Hint ladder on a subset** (≥5 instances, ≥3 repeats per level). Report the distribution of minimal flip levels, not a single number.
5. **Build one scaffold** from steps 3–4. Freeze it.
6. **Run the four-condition experiment** (baseline / scaffold × main / held-out). The held-out contrast is the headline.
7. **Human spot-check** 30 random idea-clusters and 30 postmortem classifications; report agreement with the automated labels.
8. **Report** temperature, model id, attempt budget, token cost per trial (logged), and the exact prompts (`src/prompt.js`).

## Known limitations

- The lexical distinct-idea proxy under- and over-splits; it is a dashboard number. Publish the judged version.
- "Content-free" hints are never perfectly content-free. Level 6 of the shipped ladder ("look further back") is borderline for `laggedRule`; treat a flip there as weak evidence and say so.
- Passing the verifier is not the same as discovering the structure: a model can win with a generic method while holding a wrong hypothesis about the process (this happened on v1). For every success, also record whether the stated idea names the actual structure. The harness is designed for walls to be raised when a stock tool gets through; `selftest` is where you prove the new wall holds.
- One model, one prompt template. Replicate across at least two model families before claiming anything about "LLMs".

## Layout

```
src/
  domains/        laggedRule.js, hiddenPeriod.js  (make(seed) -> instance; referenceCode(inst))
  sandbox.js      verifier: runs model JS in isolated QuickJS/WASM, round-trip check, bits/symbol
  llm.js          fetch-based Anthropic client + LLM_MOCK
  prompt.js       the one prompt template, parsing of <idea>/<code> blocks
  run.js          attempt loop -> runs/<run>.jsonl
  hints.js        minimal-nudge ladder search -> runs/hint-ladders.jsonl
  postmortem.js   reveal + why + classify + log cross-check -> runs/postmortems.jsonl
  analyze.js      per-run analysis; --judge scores key moves
  experiment.js   grid runner -> runs/experiment-<name>.jsonl
  report.js       validates every record against the config and its run log; world-level report -> runs/report-<name>.md
  validate.js     the one typed contract (schema 5) used by writers and readers
  draw-seeds.js   registered seed draw for confirmatory batches
  bounds.js       explicit inference status and separately labeled numerical diagnostics
  ideas.js        lexical distinct-idea proxy
  selftest.js     proves the wall
prereg/           pre-registered key moves and predictions (write before running)
hints/            hint ladders (ordered JSON arrays)
scaffolds/        generic discovery scaffolds for the transfer test
experiments/      grid configs
runs/             logs (gitignored)
```

## License

Code: MIT (see `LICENSE`). Run logs, pre-registration documents and write-ups: CC BY 4.0.

## Schema 5 evidence and offline checks

`npm test` runs the retry-chain, request-reconstruction, resource-binding, sampling and exact coverage fixtures. `npm run selftest` retains the compression wall and historical sandbox regressions.

Each assigned slot owns at most three fresh executions (indices 0–2). Only interruption permits a retry; a completed success or budget-exhausted failure terminates immediately. Setup failure terminates unresolved. One `slot-terminal` links every `slot-execution`. Requests are written before transport, and an unreceived response remains a dispatched record. Run IDs use 16 random bytes.

Reports regenerate requests and instances, validate the full chain, and sum named usage fields across retries. Missing usage is `unknown`. The report and adjacent `.analysis.json` emit completeness gates, provider zero-success inference, non-inferential hypergeometric/plug-in diagnostics, and sample identification bounds for contrasts with unknown outcomes. Repeats are separate binary endpoint strata, not extra independent worlds. Historical schemas are not silently upgraded.

Adapted review 9: `node test/REVIEW-CHECKS-v9.mjs . docs/REVIEW-EVIDENCE-schema5.json`. The archived reviewer scripts remain unchanged.

## Invariant game — B4r review checkpoint

B2 review findings are repaired. The current generator (`invariantGame-v2-b3`) samples symbol images independently of the public alphabet listing. The B2 implementation and its 16 historical worlds remain available as `invariantGame-b2.js`.

B3 adds the durable construction-defect ledger, a certified sealed sampler, the bounded LP and independent realized-ceiling checks, and validated batch resume. B4 implements the solver portfolio, public-only selector, separately labeled oracle portfolio, positional-template control and all registered BFS resource curves. The B4 evidence remains historical. B4r repairs final-list ordering and admission, gives builder and external solvers the same fit-once/private-pair contract, and reports wall-clock by stage. The sampler is `sealed-matched-padded-v2`; its large rows measure padding robustness, not long-core size generalization. See `docs/BUILD-REPORT-v3.md`, `docs/B4r-EVIDENCE/coverage.md` and `docs/REVIEW-PROMPT-B4r.md`. The versioned public export and submission format are documented in `src/portfolio/README.md`.

```powershell
$env:LLM_MOCK='1'
npm test
node src/check-invariant-world.js examples/invariantGame-world-b4r-1.json
node src/portfolio/run.js examples/invariantGame-world-b4r-1.json
# Regenerate the full fixed audit in a NEW directory; existing evidence is not overwritten.
node src/portfolio/audit.js docs/B4r-EVIDENCE-reproduction
# Resume a compatible incomplete batch. Completed batches are a no-op.
node src/experiment.js --resume runs/experiment-name.jsonl
```

Responses are persisted as `received-unscored` before parsing/scoring. Resume binds the prior-state digest and source/config identity, uses archived receipts, and preserves execution indices and budgets. Inconsistent evidence is retained with an adjacent `.disposition.json` abandonment record.

Exact public-source seed conversion: `node src/draw-seeds.js --source-hex <1-to-32-bytes-as-hex> --n 40`. The output records original hex, bytes and canonical decimal. Direct decimal masters allow up to 78 digits and reject aliases, signs and whitespace.

**B4r review stop:** the builder coverage audit is not an independent challenge or a freeze. The independent solver-author challenge remains required. B5 leakage audits, B6 model-loop integration, real-model pilots and Phase 4 remain gated. No real-model calls were made in this build.
