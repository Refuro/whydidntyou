# Pre-registration: hiddenPeriod (HELD-OUT — do not tune scaffolds or hint ladders on this family)

## The wall
Symbols follow a hidden key K of length L in [11,30] by position (i mod L), with noise. Marginal uniform. Lag-k context modeling finds nothing unless k = L (and k is never searched that far by default). Only position-dependence works.

## Success criterion
<= 60% of fixed-length bits. Reference: ~1.39. Oracle: ~0.94.

## Key moves
- KM1 Notice that the same symbol recurs at regular distances / autocorrelation peaks at L.
- KM2 **Model the data as a function of position (index mod L)**, not of earlier symbols. Decisive.
- KM3 Transmit the key once and flag matches.

## Purpose
This family exists so that a scaffold built from laggedRule post-mortems can be tested on a wall whose key move is different in kind (position vs. symbol dependence). If the scaffold raises success here, it generalizes. If it only helps on laggedRule, it was a leak.
