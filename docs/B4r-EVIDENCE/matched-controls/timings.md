# Reference members through the external adapter

All 14 members match on public, matched/padded and natural accuracy. This is a builder control, not the independent challenge. Each side fits once, then evaluates each pair in a fresh context with identical state/a/b contracts and budgets. Timings are separate observations on the same host; interpreter and host JIT warmup affect early observations. The code is identical on both sides. The complete stage records, cold-start preparation estimates, exact sources and result archives are adjacent.

| member | challenge accuracy | builder fit ms | external fit ms | builder challenge ms | external challenge ms | builder natural ms | external natural ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| count-linear | 0.500 | 18.13 | 2.61 | 153.10 | 145.92 | 147.36 | 144.47 |
| group-full | 1.000 | 10.23 | 10.68 | 86.58 | 85.69 | 89.72 | 87.76 |
| group-quotients | 0.500 | 222.56 | 215.82 | 82.83 | 81.53 | 81.38 | 79.89 |
| monoid-csp | 1.000 | 27.59 | 26.73 | 87.30 | 86.02 | 87.81 | 86.70 |
| joint-coarse | 0.500 | 33.27 | 31.91 | 188.65 | 195.34 | 193.69 | 192.55 |
| finite-state | 1.000 | 11.49 | 11.24 | 102.27 | 102.82 | 109.90 | 111.25 |
| rewrite-normal-form | 0.645 | 2.46 | 2.45 | 557.19 | 561.33 | 553.89 | 564.57 |
| grammar-cegis | 1.000 | 9.57 | 9.45 | 86.16 | 89.39 | 87.64 | 89.74 |
| nuisance-stumps | 0.500 | 26.50 | 26.70 | 484.68 | 492.86 | 671.92 | 678.90 |
| positional-template | 0.500 | 3.95 | 3.88 | 79.25 | 82.89 | 79.18 | 81.53 |
| bfs-b2 | 0.680 | 2.27 | 2.32 | 178.61 | 185.95 | 189.54 | 195.18 |
| bfs-4x | 0.795 | 2.47 | 2.29 | 359.66 | 356.55 | 415.02 | 418.93 |
| bfs-16x | 0.820 | 2.36 | 2.30 | 1248.69 | 1269.53 | 1408.50 | 1424.48 |
| bidirectional | 0.760 | 2.28 | 2.29 | 169.10 | 176.02 | 189.97 | 191.87 |

Assignment: one requested/effective F-nonabelian S3 example, one proposal accepted, no defects. It has 200 dependent challenge rows and 128 distinct pairs (64 short cores, 64 padded copies). No population interval. These example results do not substitute for the fixed corpus audit.

Source identity: `985bff1f1ed128cd16657fcee99c311e4965326c2d14ed480b7ecf466c5a409b`.
