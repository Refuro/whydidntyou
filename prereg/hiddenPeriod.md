# Pre-registration: hiddenPeriod (HELD-OUT — do not tune scaffolds or hint ladders on this family)

## The wall
Symbols follow a hidden key K of length L in [200,400] by position (i mod L), 80% signal / 20% noise. Marginal uniform. Context models (order-1 to order-6, PPM-style) score ~0.9 of baseline: the period is long enough that contexts recur only ~10-20 times and rarely match exactly, so they cannot memorize it. Only position-dependence works.

## Success criterion
<= 60% of fixed-length bits. Reference: ~1.52 (0.50 of baseline). PPM order-6: ~0.9 of baseline (fails).

## Key moves
- KM1 Notice that the same symbol recurs at regular distances / autocorrelation peaks at L.
- KM2 **Model the data as a function of position (index mod L)**, not of earlier symbols. Decisive.
- KM3 Transmit the key once and flag matches.

## Purpose
This family exists so that a scaffold built from laggedRule post-mortems can be tested on a wall whose key move is different in kind (position vs. symbol dependence). If the scaffold raises success here, it generalizes. If it only helps on laggedRule, it was a leak.

## Addendum 2026-11-03 — wall raised (v1 -> v2), before any data collection

v1 used L in [11,30], p=0.85. `selftest` showed stock PPM order-6 at 0.63 of baseline — within reach of a better-implemented
context model. Probe over L in {30..500} x p in {0.85, 0.8}: PPM ratio rises from 0.63 to 0.98 as L grows; reference stays ~0.46-0.51.
Chosen: L in [200,400], p=0.8 (PPM ~0.88-0.95, reference ~0.50). No model has been run on this family yet.
