# Pre-registration: laggedRule

Status: all runs to date (2026-11-03, three runs, seed 1) are EXPLORATORY. The walls and this document were revised in
response to them; the addenda record exactly what was seen and when. The confirmatory protocol is frozen at the commit
tagged `confirm-phase1`; data collected before that tag is development data and is reported as such.

## The wall
Marginal symbol distribution is uniform, and the dependency is at a lag k in [12,40] via a fixed derangement g.
Order-0, order-1 and PPM order-6 approaches cannot beat 3 bits/symbol (confirmed by `npm run selftest`).

## Success criterion
<= 60% of fixed-length bits (<= 1.80 bits/symbol at A=8). Reference solver: ~1.40. Oracle: ~0.94.

## Key moves (what a successful trajectory must contain, in any form)
- KM1 **Look for dependence on earlier symbols at all, not just frequencies.** (conditional statistics)
- KM2 **Test individual lags far beyond the recent window.** The decisive move: the useful information is one sparse long-range position, not the dense recent context that every standard compressor assumes. Everything before this is pre-discovery.
- KM3 **Treat the dependence as a deterministic map plus noise** (predict-then-flag / escape coding), rather than a soft probability table.
- KM4 (optional, for near-oracle) adaptive/arithmetic coding over the predicted-vs-miss event.

## Predictions (falsifiable)
- P1: Most failed runs will contain KM1 but not KM2 — the model checks adjacent context and concludes "no structure".
- P2: Across failed runs, the distinct-idea count will be <= 1/3 of the attempt count (frame lock + diversity collapse).
- P3: The minimal content-free hint that flips failure will be one that says to look further back / measure more things, not one that says to drop an assumption.
- P4 (reworded 2026-11-03 after review 2; original wording retained in git history): post-revelation self-reports will mostly claim the idea was considered and dismissed; a judge with the full record will rate most such claims `unverifiable`, and `contradicted` only where the claim is a concrete behavioral statement refuted by the model's own code. Self-reports are descriptive; nothing causal is inferred from them.

## Confounds to watch
- The model may know "context mixing / PPM" generically and brute-force lags as a stock move. If so, KM2 comes for free and this domain is too easy; raise k's range or make g position-dependent.
- Hint wording leaks: a hint containing "lag", "earlier", "back" is NOT content-free for this domain. Ladder level 6 ("look further back") is borderline; treat a flip there as weak evidence.

## Addendum 2026-11-03 — wall raised (v1 -> v2), after one exploratory run on v1

v1 used k in [2,7]. The first real run (claude-sonnet-5-5, seed 1, 20-attempt budget) succeeded on attempt 1 at 1.727 bits/symbol
using a stock PPM order 0-6 context mixer with arithmetic coding. Its stated hypothesis ("noisy 16-step cycles") was wrong; the
tool covered lag 2 incidentally because a 6-symbol context contains the symbol 2 back. This is the confound listed above:
success by retrieval of a general technique, not by identifying the structure. Log: runs/laggedRule-s1-claude-sonnet-5-5-1793728512086.jsonl.

v2 moves k to [12,40]. `selftest` now includes a PPM order-6 solver, which scores 3.61 bits/symbol on v2 (fails). KM2 reworded to
match: the move is "look for one sparse long-range dependency", not merely "lags other than 1".

New observation worth measuring: "success without a correct model of the process". Add to analysis: for every successful trial,
does the stated idea identify the actual structure (lag k, a map), or does it name a generic method? Both count as success on the
verifier; only the first counts as discovery. This distinction was not in the v1 pre-registration.

## Addendum 2026-11-03 (b) — memory design and output cap

The second real run (seed 1, v2 wall) hit a harness bug: the output cap was 4000 tokens, and arithmetic-coder implementations
are longer than that, so 10 of 11 attempts were truncated mid-code and reported to the model only as "no code block". Fixed:
cap raised to 16000, truncation is now its own failure stage and the model is told its output was cut off.

Memory design decided: default is `full` (multi-turn; the model sees its own previous responses in full, each followed by the
verifier result). Rationale: the question is about repeated trying, and refining a near-miss is part of trying. `summary` and
`last-code` modes exist for a sensitivity check and must be reported if used. The pilot runs in `full`.

Observation from the truncated run, recorded for what it's worth: after its one scored attempt (3.006 bps, no gain), the model
pivoted to "mix single-lag models over lags 1-12" — KM2 appearing, with a search range that stopped one short of k=13.

## Addendum 2026-11-03 (c) — k-curve prediction, added after two exploratory runs on v2 and before any confirmatory run

Two real runs (both seed 1, k=13) showed the key move appearing with a bounded lag range: 1-12 in one run (missed), up to 24 in
the other (found). Hypothesis: the model has a default search horizon H; discovery rate is high for k < H and drops for k > H.

- P5: discovery rate on laggedRule is a decreasing function of k over [12,40], with a visible drop somewhere in [20,32].
- P6: the content-free hint that flips failures at large k is the "look further than you have been looking" rung, and it flips
  them at a rate higher than the other rungs; a flip there is evidence the gap is horizon-shaped, not concept-shaped.
- Interpretation rule (fixed now): success on laggedRule is level 1-2 on the discovery ladder (parameter search / method selection
  within a known technique). It is reported as a control for search breadth, never as discovery. See docs/PLAN.md.

Design: experiments/kcurve.json fixes k explicitly per condition (k in {12,16,20,24,28,32,36,40}); seeds vary the map g and the data.

## Addendum 2026-11-03 (d) — after external review (docs/REVIEW-RESPONSE.md)

- Verifier side channel fixed (encoder/decoder now run in separate contexts; regression test in selftest).
- The real winning program from run ...1793729634271 is kept at baselines/ and scored on every wall in selftest.
- hints.js redesigned: every rung with equal repeats plus no-hint and neutral controls; no early stopping. "Minimal flip level"
  is retired as a measurement; the measurement is per-rung effect vs control, selected on development worlds, confirmed on fresh ones.
- P6 is reworded: the "look further" rung has a larger effect than other rungs vs the no-hint control on fresh worlds.
- Unit of analysis is the world (seed). Contrasts are pre-registered in the experiment config and paired by world.
- Interpretation rule stands: laggedRule measures search within a known technique. It is not evidence about invention.

## Addendum 2026-11-03 (e) — after review 3

Verifier replaced by process isolation (see docs/PLAN.md §12). Logs are schema 2 (archived prompts). The three exploratory runs
in runs/exploratory/ predate schema 2 and the process-isolated verifier; their bit counts were produced by the shared-context
verifier. The real winning program is re-scored by selftest under the new verifier and still scores 0.995 bps on seed 1, so those
runs' scores stand as exploratory observations, but no confirmatory claim rests on them.
