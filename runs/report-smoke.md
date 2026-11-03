# Report: smoke

File: runs/experiment-smoke.jsonl. Conditions: 2. Configured: 2 worlds × 1 repeats × 3 attempts. Trials present: 4 of 4 expected.

## Per condition (world-level)

| condition | domain | worlds | complete worlds | mean world success rate | success-by-budget (attempts 1,3,6,9,max) | tokens/trial (median) |
|---|---|---|---|---|---|---|
| baseline | laggedRule | 2 | 2 | 0% | 0% / 0% | 0 |
| scaffold | laggedRule | 2 | 2 | 0% | 0% / 0% | 0 |

## Per world

| world (domain/seed/opts) | baseline | scaffold |
|---|---|---|
| laggedRule|1|{} | 0/1 | 0/1 |
| laggedRule|2|{} | 0/1 | 0/1 |

## Pre-registered contrasts (paired by world; bootstrap percentile CI over worlds)

_No contrasts pre-registered; none computed._

## Discovery by hidden k (world-level; pools conditions that share k)

| k | worlds | conditions | mean world success rate | success-by-budget (1,3,6,9,max) |
|---|---|---|---|---|
| 13 | 2 | baseline,scaffold | 0% | 0% / 0% |
| 16 | 2 | baseline,scaffold | 0% | 0% / 0% |

_World = independently generated instance (domain, seed, generator options). Rates are means over worlds of within-world success fractions. Success-by-budget = share of trials solved within b attempts (no conditioning on success). Contrast CIs are percentile bootstraps over paired world differences; the first configured contrast is primary at 95%, the rest are Bonferroni-widened among themselves. Population intervals per condition are deliberately not shown._
