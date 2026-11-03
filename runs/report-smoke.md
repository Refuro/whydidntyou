# Report: smoke

File: runs/experiment-smoke.jsonl. Batch: smoke-1793745084038. Model: mock. Generator versions: laggedRule=laggedRule-v2.
Configured: 2 conditions × 2 worlds × 1 repeats × 3 attempts = 4 trials. Present: 4. Missing: 0.


**EXPLORATORY BATCH (missingPolicy=exploratory). Not a confirmatory result.**

## Per condition (world-level; each number is a mean over worlds of within-world fractions)

| condition | domain | worlds present / configured | worlds with all repeats | success-by-budget @ 1/3 | tokens/trial (median) |
|---|---|---|---|---|---|
| baseline | laggedRule | 2 / 2 | 2 | 0% / 0% | 0 |
| scaffold | laggedRule | 2 / 2 | 2 | 0% / 0% | 0 |

## Per world (successes/repeats)

| world | baseline | scaffold |
|---|---|---|
| seed 1 | 0/1 | 0/1 |
| seed 2 | 0/1 | 0/1 |

## Pre-registered contrasts (paired by world; percentile bootstrap over world differences)

The FIRST contrast is the primary endpoint (95% interval). Any others are EXPLORATORY: shown at nominal 95% with no family-wise error control across them (this is the registered policy; see PLAN.md §8). sharedWorld is a declared assumption, not a verified coupling; see the generator coupling test registered for the domain.

- PRIMARY: scaffold − baseline (laggedRule): 0 pp, bootstrap interval withheld (uninformative: every world difference is identical, 0, n=2). No discordant worlds observed. Inference for this contrast is UNRESOLVED pending the registered bounded-outcome fallback.; n=2 paired worlds

## Success by hidden k, per condition (world-level)

| condition | k | worlds | success-by-budget @ 1/3 |
|---|---|---|---|
| baseline | 13 | 1 | 0% / 0% |
| baseline | 16 | 1 | 0% / 0% |
| scaffold | 13 | 1 | 0% / 0% |
| scaffold | 16 | 1 | 0% / 0% |

_World = independently generated instance (seed) within a condition. All rates are means over worlds of within-world success fractions; success-by-budget @b = share solved within b attempts, world-averaged, with no conditioning on success. Per-condition population intervals are deliberately not shown._
