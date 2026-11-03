# Pre-registration: laggedRule

Written BEFORE any model run. Do not edit after runs begin; add a dated addendum instead.

## The wall
Marginal symbol distribution is uniform, and the dependency is at a lag k in [2,7] via a fixed derangement g.
Order-0 and order-1 approaches cannot beat 3 bits/symbol (confirmed by `npm run selftest`).

## Success criterion
<= 60% of fixed-length bits (<= 1.80 bits/symbol at A=8). Reference solver: ~1.40. Oracle: ~0.94.

## Key moves (what a successful trajectory must contain, in any form)
- KM1 **Look for dependence on earlier symbols at all, not just frequencies.** (conditional statistics)
- KM2 **Test lags other than 1.** The decisive move. Everything before this is pre-discovery.
- KM3 **Treat the dependence as a deterministic map plus noise** (predict-then-flag / escape coding), rather than a soft probability table.
- KM4 (optional, for near-oracle) adaptive/arithmetic coding over the predicted-vs-miss event.

## Predictions (falsifiable)
- P1: Most failed runs will contain KM1 but not KM2 — the model checks adjacent context and concludes "no structure".
- P2: Across failed runs, the distinct-idea count will be <= 1/3 of the attempt count (frame lock + diversity collapse).
- P3: The minimal content-free hint that flips failure will be one that says to look further back / measure more things, not one that says to drop an assumption.
- P4: "Why didn't you try that" answers will mostly say `considered_dismissed`, but the log will show the lag idea never appeared (confabulation).

## Confounds to watch
- The model may know "context mixing / PPM" generically and brute-force lags as a stock move. If so, KM2 comes for free and this domain is too easy; raise k's range or make g position-dependent.
- Hint wording leaks: a hint containing "lag", "earlier", "back" is NOT content-free for this domain. Ladder level 6 ("look further back") is borderline; treat a flip there as weak evidence.
