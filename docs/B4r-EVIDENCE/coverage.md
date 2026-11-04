# B4r builder coverage audit

Development evidence only. Independent solver challenge and B4r review remain pending; no portfolio freeze.

| requested family | proposed | eligible | construction valid | acceptance |
|---|---:|---:|---:|---:|
| F-count | 512 | 428 | 428 | 83.59% |
| F-abelian | 512 | 512 | 512 | 100.00% |
| F-nonabelian | 512 | 485 | 485 | 94.73% |
| F-monoid | 512 | 429 | 295 | 57.62% |

## Requested family

Success means accuracy >=95% within one construction-valid world. Natural and challenge scores are kept separate.

| family | n | member | sealed successes | mean sealed accuracy lower bound (failures=0) | natural successes | failed challenge | mean fit ms | mean public ms | mean challenge ms | mean natural ms |
|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| F-count | 428 | count-linear | 428 | 100.00% | 428 | 0 | 3.45 | 183.51 | 190.63 | 189.62 |
| F-count | 428 | group-full | 428 | 100.00% | 428 | 0 | 8.42 | 107.92 | 112.51 | 112.64 |
| F-count | 428 | group-quotients | 428 | 100.00% | 428 | 0 | 302.36 | 107.43 | 112.11 | 111.88 |
| F-count | 428 | monoid-csp | 428 | 100.00% | 428 | 0 | 21.56 | 106.66 | 112.98 | 111.82 |
| F-count | 428 | joint-coarse | 0 | 50.29% | 0 | 0 | 27.18 | 257.00 | 265.20 | 266.42 |
| F-count | 428 | finite-state | 319 | 87.55% | 319 | 0 | 61.51 | 106.98 | 137.85 | 137.72 |
| F-count | 428 | rewrite-normal-form | 15 | 68.73% | 15 | 0 | 2.95 | 175.40 | 688.26 | 685.68 |
| F-count | 428 | grammar-cegis | 428 | 100.00% | 428 | 0 | 10.94 | 106.42 | 112.47 | 111.80 |
| F-count | 428 | nuisance-stumps | 0 | 72.59% | 0 | 0 | 34.11 | 219.28 | 946.94 | 944.82 |
| F-count | 428 | positional-template | 250 | 79.21% | 250 | 0 | 5.94 | 106.63 | 108.86 | 107.64 |
| F-count | 428 | bfs-b2 | 0 | 50.40% | 0 | 0 | 2.94 | 243.73 | 242.07 | 239.20 |
| F-count | 428 | bfs-4x | 0 | 50.81% | 0 | 0 | 3.03 | 596.16 | 535.22 | 535.80 |
| F-count | 428 | bfs-16x | 0 | 51.58% | 0 | 0 | 3.00 | 2376.77 | 1903.23 | 1905.66 |
| F-count | 428 | bidirectional | 0 | 51.06% | 0 | 0 | 2.93 | 236.27 | 239.86 | 240.03 |
| F-count | 428 | ORACLE portfolio | 428 | — | — | — | — | — | — | — |
| F-count | 428 | public selector | 428 | — | — | — | 490.30 | 4930.17 | 190.63 | 189.62 |
| F-abelian | 512 | count-linear | 512 | 100.00% | 512 | 0 | 3.32 | 173.94 | 179.55 | 180.53 |
| F-abelian | 512 | group-full | 512 | 100.00% | 512 | 0 | 11.64 | 103.66 | 107.94 | 108.13 |
| F-abelian | 512 | group-quotients | 66 | 56.45% | 66 | 0 | 277.66 | 98.05 | 99.14 | 98.52 |
| F-abelian | 512 | monoid-csp | 512 | 100.00% | 512 | 0 | 38.54 | 103.28 | 107.89 | 108.10 |
| F-abelian | 512 | joint-coarse | 0 | 50.91% | 0 | 0 | 110.26 | 248.33 | 256.95 | 254.92 |
| F-abelian | 512 | finite-state | 70 | 57.87% | 70 | 0 | 157.27 | 94.27 | 100.20 | 100.07 |
| F-abelian | 512 | rewrite-normal-form | 24 | 65.06% | 24 | 0 | 2.79 | 168.61 | 654.21 | 650.50 |
| F-abelian | 512 | grammar-cegis | 512 | 100.00% | 512 | 0 | 27.40 | 103.20 | 106.69 | 108.03 |
| F-abelian | 512 | nuisance-stumps | 0 | 72.63% | 0 | 0 | 32.76 | 205.74 | 873.29 | 875.60 |
| F-abelian | 512 | positional-template | 364 | 85.55% | 364 | 0 | 6.02 | 101.12 | 104.27 | 104.72 |
| F-abelian | 512 | bfs-b2 | 0 | 51.08% | 0 | 0 | 2.80 | 250.96 | 240.70 | 238.71 |
| F-abelian | 512 | bfs-4x | 0 | 52.08% | 0 | 0 | 2.80 | 682.07 | 575.02 | 576.49 |
| F-abelian | 512 | bfs-16x | 0 | 53.59% | 0 | 0 | 2.81 | 2815.43 | 2150.16 | 2152.17 |
| F-abelian | 512 | bidirectional | 0 | 52.38% | 0 | 0 | 2.82 | 239.75 | 234.76 | 234.63 |
| F-abelian | 512 | ORACLE portfolio | 512 | — | — | — | — | — | — | — |
| F-abelian | 512 | public selector | 512 | — | — | — | 678.89 | 5388.41 | 179.55 | 180.53 |
| F-nonabelian | 485 | count-linear | 63 | 59.42% | 63 | 0 | 3.33 | 176.41 | 181.48 | 181.85 |
| F-nonabelian | 485 | group-full | 485 | 100.00% | 485 | 0 | 16.07 | 103.87 | 107.39 | 109.41 |
| F-nonabelian | 485 | group-quotients | 47 | 54.85% | 47 | 0 | 285.67 | 99.75 | 100.33 | 101.79 |
| F-nonabelian | 485 | monoid-csp | 485 | 100.00% | 485 | 0 | 40.46 | 104.54 | 108.70 | 109.29 |
| F-nonabelian | 485 | joint-coarse | 0 | 50.10% | 0 | 0 | 86.55 | 236.12 | 242.13 | 244.62 |
| F-nonabelian | 485 | finite-state | 253 | 76.08% | 250 | 0 | 109.47 | 100.49 | 116.93 | 121.14 |
| F-nonabelian | 485 | rewrite-normal-form | 90 | 79.12% | 24 | 0 | 2.82 | 167.03 | 487.65 | 616.89 |
| F-nonabelian | 485 | grammar-cegis | 485 | 100.00% | 485 | 0 | 21.24 | 104.27 | 108.08 | 109.72 |
| F-nonabelian | 485 | nuisance-stumps | 0 | 54.90% | 0 | 0 | 33.67 | 211.71 | 705.20 | 890.91 |
| F-nonabelian | 485 | positional-template | 178 | 68.35% | 178 | 0 | 5.53 | 101.03 | 101.61 | 102.55 |
| F-nonabelian | 485 | bfs-b2 | 0 | 66.45% | 0 | 0 | 2.82 | 256.26 | 253.81 | 248.54 |
| F-nonabelian | 485 | bfs-4x | 11 | 73.80% | 0 | 0 | 2.88 | 682.95 | 591.93 | 598.73 |
| F-nonabelian | 485 | bfs-16x | 34 | 77.55% | 0 | 0 | 2.81 | 2859.90 | 2048.47 | 2234.29 |
| F-nonabelian | 485 | bidirectional | 18 | 73.10% | 0 | 0 | 2.85 | 242.64 | 245.95 | 245.92 |
| F-nonabelian | 485 | ORACLE portfolio | 485 | — | — | — | — | — | — | — |
| F-nonabelian | 485 | public selector | 485 | — | — | — | 616.18 | 5446.96 | 115.12 | 116.93 |
| F-monoid | 295 | count-linear | 29 | 55.25% | 29 | 0 | 3.53 | 186.58 | 191.38 | 192.99 |
| F-monoid | 295 | group-full | 32 | 55.42% | 32 | 0 | 29.32 | 106.94 | 106.81 | 105.92 |
| F-monoid | 295 | group-quotients | 24 | 54.07% | 24 | 0 | 309.87 | 107.52 | 106.14 | 107.54 |
| F-monoid | 295 | monoid-csp | 295 | 100.00% | 295 | 0 | 56.09 | 113.05 | 116.97 | 117.03 |
| F-monoid | 295 | joint-coarse | 0 | 50.06% | 0 | 0 | 268.24 | 263.64 | 268.72 | 271.44 |
| F-monoid | 295 | finite-state | 243 | 91.30% | 244 | 0 | 89.09 | 110.34 | 134.42 | 141.38 |
| F-monoid | 295 | rewrite-normal-form | 78 | 80.40% | 13 | 0 | 2.97 | 176.06 | 532.71 | 700.20 |
| F-monoid | 295 | grammar-cegis | 295 | 100.00% | 295 | 0 | 39.86 | 114.05 | 117.32 | 118.17 |
| F-monoid | 295 | nuisance-stumps | 0 | 52.19% | 0 | 0 | 35.78 | 221.06 | 739.27 | 971.01 |
| F-monoid | 295 | positional-template | 17 | 52.88% | 17 | 0 | 5.43 | 106.79 | 106.40 | 106.90 |
| F-monoid | 295 | bfs-b2 | 3 | 66.91% | 0 | 0 | 3.07 | 308.00 | 313.10 | 292.97 |
| F-monoid | 295 | bfs-4x | 8 | 75.60% | 0 | 0 | 3.09 | 895.12 | 788.50 | 759.05 |
| F-monoid | 295 | bfs-16x | 27 | 81.70% | 0 | 0 | 3.02 | 3579.73 | 2678.22 | 2809.68 |
| F-monoid | 295 | bidirectional | 13 | 77.19% | 0 | 0 | 3.03 | 290.87 | 296.61 | 284.94 |
| F-monoid | 295 | ORACLE portfolio | 295 | — | — | — | — | — | — | — |
| F-monoid | 295 | public selector | 294 | — | — | — | 852.39 | 6579.74 | 124.18 | 124.79 |

## Effective family

Success means accuracy >=95% within one construction-valid world. Natural and challenge scores are kept separate.

| family | n | member | sealed successes | mean sealed accuracy lower bound (failures=0) | natural successes | failed challenge | mean fit ms | mean public ms | mean challenge ms | mean natural ms |
|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| F-count | 428 | count-linear | 428 | 100.00% | 428 | 0 | 3.45 | 183.51 | 190.63 | 189.62 |
| F-count | 428 | group-full | 428 | 100.00% | 428 | 0 | 8.42 | 107.92 | 112.51 | 112.64 |
| F-count | 428 | group-quotients | 428 | 100.00% | 428 | 0 | 302.36 | 107.43 | 112.11 | 111.88 |
| F-count | 428 | monoid-csp | 428 | 100.00% | 428 | 0 | 21.56 | 106.66 | 112.98 | 111.82 |
| F-count | 428 | joint-coarse | 0 | 50.29% | 0 | 0 | 27.18 | 257.00 | 265.20 | 266.42 |
| F-count | 428 | finite-state | 319 | 87.55% | 319 | 0 | 61.51 | 106.98 | 137.85 | 137.72 |
| F-count | 428 | rewrite-normal-form | 15 | 68.73% | 15 | 0 | 2.95 | 175.40 | 688.26 | 685.68 |
| F-count | 428 | grammar-cegis | 428 | 100.00% | 428 | 0 | 10.94 | 106.42 | 112.47 | 111.80 |
| F-count | 428 | nuisance-stumps | 0 | 72.59% | 0 | 0 | 34.11 | 219.28 | 946.94 | 944.82 |
| F-count | 428 | positional-template | 250 | 79.21% | 250 | 0 | 5.94 | 106.63 | 108.86 | 107.64 |
| F-count | 428 | bfs-b2 | 0 | 50.40% | 0 | 0 | 2.94 | 243.73 | 242.07 | 239.20 |
| F-count | 428 | bfs-4x | 0 | 50.81% | 0 | 0 | 3.03 | 596.16 | 535.22 | 535.80 |
| F-count | 428 | bfs-16x | 0 | 51.58% | 0 | 0 | 3.00 | 2376.77 | 1903.23 | 1905.66 |
| F-count | 428 | bidirectional | 0 | 51.06% | 0 | 0 | 2.93 | 236.27 | 239.86 | 240.03 |
| F-count | 428 | ORACLE portfolio | 428 | — | — | — | — | — | — | — |
| F-count | 428 | public selector | 428 | — | — | — | 490.30 | 4930.17 | 190.63 | 189.62 |
| F-abelian | 652 | count-linear | 604 | 98.65% | 604 | 0 | 3.35 | 175.14 | 181.26 | 181.66 |
| F-abelian | 652 | group-full | 652 | 100.00% | 652 | 0 | 10.42 | 103.53 | 108.32 | 108.63 |
| F-abelian | 652 | group-quotients | 137 | 60.51% | 137 | 0 | 280.19 | 99.14 | 100.61 | 100.33 |
| F-abelian | 652 | monoid-csp | 652 | 100.00% | 652 | 0 | 33.39 | 103.50 | 108.21 | 108.05 |
| F-abelian | 652 | joint-coarse | 0 | 50.81% | 0 | 0 | 90.69 | 246.68 | 256.42 | 254.45 |
| F-abelian | 652 | finite-state | 143 | 61.78% | 143 | 0 | 139.89 | 95.99 | 105.24 | 105.14 |
| F-abelian | 652 | rewrite-normal-form | 31 | 65.89% | 31 | 0 | 2.79 | 169.30 | 659.11 | 654.56 |
| F-abelian | 652 | grammar-cegis | 652 | 100.00% | 652 | 0 | 23.29 | 103.33 | 107.20 | 108.61 |
| F-abelian | 652 | nuisance-stumps | 0 | 72.39% | 0 | 0 | 32.63 | 207.66 | 879.83 | 884.10 |
| F-abelian | 652 | positional-template | 443 | 83.97% | 443 | 0 | 5.92 | 101.39 | 104.81 | 105.15 |
| F-abelian | 652 | bfs-b2 | 0 | 51.04% | 0 | 0 | 2.81 | 249.17 | 239.86 | 238.84 |
| F-abelian | 652 | bfs-4x | 0 | 52.00% | 0 | 0 | 2.82 | 668.49 | 571.20 | 570.63 |
| F-abelian | 652 | bfs-16x | 0 | 53.47% | 0 | 0 | 2.81 | 2750.98 | 2110.33 | 2112.47 |
| F-abelian | 652 | bidirectional | 0 | 52.31% | 0 | 0 | 2.83 | 239.26 | 234.91 | 235.08 |
| F-abelian | 652 | ORACLE portfolio | 652 | — | — | — | — | — | — | — |
| F-abelian | 652 | public selector | 651 | — | — | — | 633.84 | 5313.54 | 173.77 | 174.42 |
| F-nonabelian | 377 | count-linear | 0 | 50.00% | 0 | 0 | 3.31 | 176.26 | 180.58 | 181.55 |
| F-nonabelian | 377 | group-full | 377 | 100.00% | 377 | 0 | 19.02 | 104.51 | 107.06 | 109.43 |
| F-nonabelian | 377 | group-quotients | 0 | 50.00% | 0 | 0 | 285.41 | 99.27 | 99.44 | 101.08 |
| F-nonabelian | 377 | monoid-csp | 377 | 100.00% | 377 | 0 | 47.94 | 104.87 | 109.22 | 109.95 |
| F-nonabelian | 377 | joint-coarse | 0 | 50.00% | 0 | 0 | 105.87 | 235.28 | 239.39 | 243.55 |
| F-nonabelian | 377 | finite-state | 201 | 76.66% | 198 | 0 | 118.84 | 100.36 | 115.99 | 121.08 |
| F-nonabelian | 377 | rewrite-normal-form | 85 | 82.29% | 19 | 0 | 2.82 | 166.14 | 435.72 | 606.85 |
| F-nonabelian | 377 | grammar-cegis | 377 | 100.00% | 377 | 0 | 25.06 | 104.71 | 108.67 | 110.22 |
| F-nonabelian | 377 | nuisance-stumps | 0 | 50.04% | 0 | 0 | 34.18 | 210.99 | 653.72 | 890.92 |
| F-nonabelian | 377 | positional-template | 113 | 64.99% | 113 | 0 | 5.55 | 101.18 | 100.80 | 101.89 |
| F-nonabelian | 377 | bfs-b2 | 0 | 70.92% | 0 | 0 | 2.83 | 261.10 | 260.53 | 253.27 |
| F-nonabelian | 377 | bfs-4x | 11 | 80.15% | 0 | 0 | 2.88 | 705.24 | 606.93 | 616.93 |
| F-nonabelian | 377 | bfs-16x | 34 | 84.62% | 0 | 0 | 2.82 | 2976.29 | 2087.99 | 2326.46 |
| F-nonabelian | 377 | bidirectional | 18 | 79.16% | 0 | 0 | 2.85 | 245.65 | 250.44 | 250.15 |
| F-nonabelian | 377 | ORACLE portfolio | 377 | — | — | — | — | — | — | — |
| F-nonabelian | 377 | public selector | 377 | — | — | — | 659.38 | 5591.87 | 107.06 | 109.43 |
| F-monoid | 263 | count-linear | 0 | 50.00% | 0 | 0 | 3.52 | 186.38 | 190.68 | 192.66 |
| F-monoid | 263 | group-full | 0 | 50.00% | 0 | 0 | 32.09 | 106.83 | 105.99 | 104.90 |
| F-monoid | 263 | group-quotients | 0 | 50.00% | 0 | 0 | 311.20 | 107.36 | 105.12 | 106.50 |
| F-monoid | 263 | monoid-csp | 263 | 100.00% | 263 | 0 | 61.07 | 113.72 | 116.87 | 117.78 |
| F-monoid | 263 | joint-coarse | 0 | 50.00% | 0 | 0 | 298.55 | 265.80 | 269.31 | 271.91 |
| F-monoid | 263 | finite-state | 222 | 92.33% | 223 | 0 | 90.81 | 110.77 | 134.31 | 142.56 |
| F-monoid | 263 | rewrite-normal-form | 76 | 81.45% | 11 | 0 | 2.99 | 175.88 | 511.81 | 696.76 |
| F-monoid | 263 | grammar-cegis | 263 | 100.00% | 263 | 0 | 43.56 | 114.85 | 117.10 | 117.94 |
| F-monoid | 263 | nuisance-stumps | 0 | 50.00% | 0 | 0 | 36.11 | 221.65 | 711.51 | 967.79 |
| F-monoid | 263 | positional-template | 3 | 50.57% | 3 | 0 | 5.39 | 106.54 | 105.38 | 106.13 |
| F-monoid | 263 | bfs-b2 | 3 | 68.83% | 0 | 0 | 3.07 | 314.64 | 319.74 | 296.51 |
| F-monoid | 263 | bfs-4x | 8 | 78.45% | 0 | 0 | 3.10 | 923.11 | 809.41 | 778.83 |
| F-monoid | 263 | bfs-16x | 27 | 85.12% | 0 | 0 | 3.02 | 3683.91 | 2742.82 | 2889.68 |
| F-monoid | 263 | bidirectional | 13 | 80.19% | 0 | 0 | 3.04 | 295.18 | 301.93 | 288.54 |
| F-monoid | 263 | ORACLE portfolio | 263 | — | — | — | — | — | — | — |
| F-monoid | 263 | public selector | 263 | — | — | — | 897.50 | 6726.61 | 116.87 | 117.78 |

Requested → effective acceptance flow: `{"F-count":{"F-count":428},"F-abelian":{"F-abelian":512},"F-nonabelian":{"F-nonabelian":377,"F-abelian":108},"F-monoid":{"F-monoid":263,"F-abelian":32}}`.

Defect reasons and proposal classification flow: `{"F-count":{"proposed":512,"eligible":428,"constructionValid":428,"reasons":{"insufficient short consequence rules":79,"constant invariant cannot supply negative labels":5},"effectiveClassifications":{"F-count":512},"eligibilityRate":0.8359375,"acceptanceRate":0.8359375},"F-abelian":{"proposed":512,"eligible":512,"constructionValid":512,"reasons":{},"effectiveClassifications":{"F-abelian":512},"eligibilityRate":1,"acceptanceRate":1},"F-nonabelian":{"proposed":512,"eligible":485,"constructionValid":485,"reasons":{"insufficient short consequence rules":16,"non-identifiable":9,"constant invariant cannot supply negative labels":2},"effectiveClassifications":{"F-nonabelian":380,"F-abelian":132},"eligibilityRate":0.947265625,"acceptanceRate":0.947265625},"F-monoid":{"proposed":512,"eligible":429,"constructionValid":295,"reasons":{"B3: infeasible registered matched string support":119,"insufficient short consequence rules":45,"B3: no bounded identity padding word for large challenge stratum":15,"negative-pair budget exhausted":22,"non-identifiable":16},"effectiveClassifications":{"F-monoid":441,"F-abelian":71},"eligibilityRate":0.837890625,"acceptanceRate":0.576171875}}`.

All four family audits reuse the same 512 seed values. Rows within a world are dependent. No pooled independence claim or interval is made. Failed evaluations remain in denominators; full accuracy bounds are reconstructible from failure counts. Member-specific counters are in the JSON summary and row logs.

## All retained BFS settings

| requested family / setting | mean sealed accuracy | successful worlds | tested positions | visited nodes | maximum depth | mean exhaustion frequency |
|---|---:|---:|---:|---:|---:|---:|
| F-count / bfs-b2 | 50.40% | 0 | 63134267 | 10929556 | 5 | 99.60% |
| F-count / bfs-4x | 50.81% | 0 | 322849076 | 43577965 | 7 | 99.18% |
| F-count / bfs-16x | 51.58% | 0 | 1600047382 | 173229177 | 7 | 98.41% |
| F-abelian / bfs-b2 | 51.08% | 0 | 98246989 | 12998790 | 8 | 98.90% |
| F-abelian / bfs-4x | 52.08% | 0 | 521011461 | 51287388 | 12 | 97.85% |
| F-abelian / bfs-16x | 53.59% | 0 | 2611766448 | 199021513 | 13 | 96.19% |
| F-nonabelian / bfs-b2 | 66.45% | 0 | 111361102 | 10638005 | 6 | 83.38% |
| F-nonabelian / bfs-4x | 73.80% | 11 | 510156051 | 38398547 | 9 | 75.87% |
| F-nonabelian / bfs-16x | 77.55% | 34 | 2357039374 | 133878175 | 11 | 71.20% |
| F-monoid / bfs-b2 | 66.91% | 3 | 101713995 | 5610560 | 8 | 83.05% |
| F-monoid / bfs-4x | 75.60% | 8 | 445443580 | 19655514 | 10 | 74.34% |
| F-monoid / bfs-16x | 81.70% | 27 | 1876480180 | 64953516 | 25 | 67.66% |

Historical positional-template accuracy: 16/16 worlds at 100%.

Coverage of at least 200 accepted worlds in every requested AND effective family: true.

Every proposed seed, defect, per-world fit, score and resource count is in the adjacent JSONL files. Regeneration uses the pinned source and seed/options; no defect is replaced.

## Preparation and selector totals

These tables are derived from the adjacent completed summary and rows. Standalone preparation is a cold-start estimate, not a second fit. Warm preparation is measured fit time with the interpreter module reused. Solver state is never reused between inference contexts.

| effective family | member | mean standalone preparation estimate ms | mean warm preparation ms |
|---|---|---:|---:|
| F-count | count-linear | 17.37 | 3.45 |
| F-count | group-full | 22.34 | 8.42 |
| F-count | group-quotients | 316.28 | 302.36 |
| F-count | monoid-csp | 35.48 | 21.56 |
| F-count | joint-coarse | 41.10 | 27.18 |
| F-count | finite-state | 75.43 | 61.51 |
| F-count | rewrite-normal-form | 16.87 | 2.95 |
| F-count | grammar-cegis | 24.86 | 10.94 |
| F-count | nuisance-stumps | 48.03 | 34.11 |
| F-count | positional-template | 19.86 | 5.94 |
| F-count | bfs-b2 | 16.86 | 2.94 |
| F-count | bfs-4x | 16.95 | 3.03 |
| F-count | bfs-16x | 16.92 | 3.00 |
| F-count | bidirectional | 16.85 | 2.93 |
| F-abelian | count-linear | 19.80 | 3.35 |
| F-abelian | group-full | 26.87 | 10.42 |
| F-abelian | group-quotients | 296.64 | 280.19 |
| F-abelian | monoid-csp | 49.84 | 33.39 |
| F-abelian | joint-coarse | 107.14 | 90.69 |
| F-abelian | finite-state | 156.34 | 139.89 |
| F-abelian | rewrite-normal-form | 19.24 | 2.79 |
| F-abelian | grammar-cegis | 39.74 | 23.29 |
| F-abelian | nuisance-stumps | 49.08 | 32.63 |
| F-abelian | positional-template | 22.37 | 5.92 |
| F-abelian | bfs-b2 | 19.26 | 2.81 |
| F-abelian | bfs-4x | 19.27 | 2.82 |
| F-abelian | bfs-16x | 19.26 | 2.81 |
| F-abelian | bidirectional | 19.28 | 2.83 |
| F-nonabelian | count-linear | 26.04 | 3.31 |
| F-nonabelian | group-full | 41.76 | 19.02 |
| F-nonabelian | group-quotients | 308.15 | 285.41 |
| F-nonabelian | monoid-csp | 70.67 | 47.94 |
| F-nonabelian | joint-coarse | 128.60 | 105.87 |
| F-nonabelian | finite-state | 141.58 | 118.84 |
| F-nonabelian | rewrite-normal-form | 25.56 | 2.82 |
| F-nonabelian | grammar-cegis | 47.80 | 25.06 |
| F-nonabelian | nuisance-stumps | 56.92 | 34.18 |
| F-nonabelian | positional-template | 28.28 | 5.55 |
| F-nonabelian | bfs-b2 | 25.57 | 2.83 |
| F-nonabelian | bfs-4x | 25.62 | 2.88 |
| F-nonabelian | bfs-16x | 25.56 | 2.82 |
| F-nonabelian | bidirectional | 25.58 | 2.85 |
| F-monoid | count-linear | 14.84 | 3.52 |
| F-monoid | group-full | 43.41 | 32.09 |
| F-monoid | group-quotients | 322.52 | 311.20 |
| F-monoid | monoid-csp | 72.39 | 61.07 |
| F-monoid | joint-coarse | 309.87 | 298.55 |
| F-monoid | finite-state | 102.13 | 90.81 |
| F-monoid | rewrite-normal-form | 14.31 | 2.99 |
| F-monoid | grammar-cegis | 54.88 | 43.56 |
| F-monoid | nuisance-stumps | 47.43 | 36.11 |
| F-monoid | positional-template | 16.71 | 5.39 |
| F-monoid | bfs-b2 | 14.39 | 3.07 |
| F-monoid | bfs-4x | 14.42 | 3.10 |
| F-monoid | bfs-16x | 14.34 | 3.02 |
| F-monoid | bidirectional | 14.36 | 3.04 |

| effective family | selector mean all-fit ms | selector mean public-selection ms | selector mean total challenge ms | selector mean total natural ms |
|---|---:|---:|---:|---:|
| F-count | 490.30 | 4930.17 | 5611.18 | 5610.17 |
| F-abelian | 633.84 | 5313.54 | 6121.27 | 6121.93 |
| F-nonabelian | 659.38 | 5591.87 | 6358.34 | 6360.71 |
| F-monoid | 897.50 | 6726.61 | 7741.09 | 7742.01 |

Selector totals include every member fit and public selection, chosen-member evaluation, and actual module-initialization time when incurred. The two evaluation totals are separate alternatives, each starting from the same fitted state; neither reuses the other set's budget. Per-member counters remain separate in the row logs; heterogeneous counters are not summed into comparable instructions.

Reconciliation: 24,080 fit calls; 14,448,000 inference calls (public, challenge and natural); zero failed evaluations; all 48,160 challenge/natural accuracy comparisons against historical B4 agree. Historical scores remain excluded from freeze inputs: the current scores were fully rerun under the repaired contract.
