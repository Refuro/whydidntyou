# B4 builder coverage audit

Development evidence only. Independent solver challenge and B4 review remain pending; no portfolio freeze.

| requested family | proposed | eligible | construction valid | acceptance |
|---|---:|---:|---:|---:|
| F-count | 512 | 428 | 428 | 83.59% |
| F-abelian | 512 | 512 | 512 | 100.00% |
| F-nonabelian | 512 | 485 | 485 | 94.73% |
| F-monoid | 512 | 429 | 295 | 57.62% |

## Requested family

Success means accuracy >=95% within one construction-valid world. Natural and challenge scores are kept separate.

| family | n | member | sealed successes | mean sealed accuracy | natural successes | mean fit operations | mean fit ms | mean scoring ms |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| F-count | 428 | count-linear | 428 | 100.00% | 428 | 562 | 0.06 | 0.89 |
| F-count | 428 | group-full | 428 | 100.00% | 428 | 10865 | 0.42 | 0.70 |
| F-count | 428 | group-quotients | 428 | 100.00% | 428 | 6001 | 0.29 | 0.70 |
| F-count | 428 | monoid-csp | 428 | 100.00% | 428 | 11818 | 0.84 | 0.69 |
| F-count | 428 | joint-coarse | 0 | 50.29% | 0 | 15544 | 1.13 | 1.37 |
| F-count | 428 | finite-state | 319 | 87.55% | 319 | 60856 | 2.38 | 1.08 |
| F-count | 428 | rewrite-normal-form | 15 | 68.73% | 15 | 10 | 0.01 | 27.32 |
| F-count | 428 | grammar-cegis | 428 | 100.00% | 428 | 9027 | 0.47 | 0.69 |
| F-count | 428 | nuisance-stumps | 0 | 72.59% | 0 | 75186 | 1.60 | 24.49 |
| F-count | 428 | positional-template | 250 | 79.21% | 250 | 3481 | 0.24 | 0.49 |
| F-count | 428 | bfs-b2 | 0 | 50.40% | 0 | 10 | 0.00 | 8.19 |
| F-count | 428 | bfs-4x | 0 | 50.81% | 0 | 10 | 0.00 | 37.12 |
| F-count | 428 | bfs-16x | 0 | 51.58% | 0 | 10 | 0.00 | 175.85 |
| F-count | 428 | bidirectional | 0 | 51.06% | 0 | 10 | 0.00 | 8.89 |
| F-count | 428 | ORACLE portfolio | 428 | — | — | — | — | — |
| F-count | 428 | public selector | 428 | — | — | — | — | — |
| F-abelian | 512 | count-linear | 512 | 100.00% | 512 | 567 | 0.06 | 0.90 |
| F-abelian | 512 | group-full | 512 | 100.00% | 512 | 22174 | 0.65 | 0.69 |
| F-abelian | 512 | group-quotients | 66 | 56.45% | 66 | 4203 | 0.24 | 0.26 |
| F-abelian | 512 | monoid-csp | 512 | 100.00% | 512 | 22563 | 1.51 | 0.69 |
| F-abelian | 512 | joint-coarse | 0 | 50.91% | 0 | 26409 | 1.83 | 1.40 |
| F-abelian | 512 | finite-state | 70 | 57.87% | 70 | 190961 | 5.98 | 0.40 |
| F-abelian | 512 | rewrite-normal-form | 24 | 65.06% | 24 | 11 | 0.01 | 24.06 |
| F-abelian | 512 | grammar-cegis | 512 | 100.00% | 512 | 28256 | 1.18 | 0.69 |
| F-abelian | 512 | nuisance-stumps | 0 | 72.63% | 0 | 76941 | 1.61 | 24.80 |
| F-abelian | 512 | positional-template | 364 | 85.55% | 364 | 5209 | 0.29 | 0.55 |
| F-abelian | 512 | bfs-b2 | 0 | 51.08% | 0 | 11 | 0.00 | 8.77 |
| F-abelian | 512 | bfs-4x | 0 | 52.08% | 0 | 11 | 0.00 | 42.70 |
| F-abelian | 512 | bfs-16x | 0 | 53.59% | 0 | 11 | 0.00 | 207.42 |
| F-abelian | 512 | bidirectional | 0 | 52.38% | 0 | 11 | 0.00 | 9.35 |
| F-abelian | 512 | ORACLE portfolio | 512 | — | — | — | — | — |
| F-abelian | 512 | public selector | 512 | — | — | — | — | — |
| F-nonabelian | 485 | count-linear | 63 | 59.42% | 63 | 566 | 0.06 | 1.01 |
| F-nonabelian | 485 | group-full | 485 | 100.00% | 485 | 28512 | 0.87 | 0.76 |
| F-nonabelian | 485 | group-quotients | 47 | 54.85% | 47 | 3195 | 0.23 | 0.24 |
| F-nonabelian | 485 | monoid-csp | 485 | 100.00% | 485 | 21723 | 1.49 | 0.75 |
| F-nonabelian | 485 | joint-coarse | 0 | 50.10% | 0 | 25536 | 1.78 | 1.57 |
| F-nonabelian | 485 | finite-state | 253 | 76.08% | 250 | 123354 | 4.17 | 0.96 |
| F-nonabelian | 485 | rewrite-normal-form | 90 | 79.12% | 24 | 10 | 0.01 | 26.20 |
| F-nonabelian | 485 | grammar-cegis | 485 | 100.00% | 485 | 21385 | 0.87 | 0.76 |
| F-nonabelian | 485 | nuisance-stumps | 0 | 54.90% | 0 | 76470 | 1.59 | 28.03 |
| F-nonabelian | 485 | positional-template | 178 | 68.35% | 178 | 2832 | 0.23 | 0.41 |
| F-nonabelian | 485 | bfs-b2 | 0 | 66.45% | 0 | 10 | 0.00 | 13.38 |
| F-nonabelian | 485 | bfs-4x | 11 | 73.80% | 0 | 10 | 0.00 | 58.89 |
| F-nonabelian | 485 | bfs-16x | 34 | 77.55% | 0 | 10 | 0.00 | 263.47 |
| F-nonabelian | 485 | bidirectional | 18 | 73.10% | 0 | 10 | 0.00 | 13.69 |
| F-nonabelian | 485 | ORACLE portfolio | 485 | — | — | — | — | — |
| F-nonabelian | 485 | public selector | 485 | — | — | — | — | — |
| F-monoid | 295 | count-linear | 29 | 55.25% | 29 | 565 | 0.06 | 0.98 |
| F-monoid | 295 | group-full | 32 | 55.42% | 32 | 44574 | 1.31 | 0.25 |
| F-monoid | 295 | group-quotients | 24 | 54.07% | 24 | 2240 | 0.24 | 0.23 |
| F-monoid | 295 | monoid-csp | 295 | 100.00% | 295 | 34794 | 1.92 | 0.75 |
| F-monoid | 295 | joint-coarse | 0 | 50.06% | 0 | 38472 | 2.24 | 1.65 |
| F-monoid | 295 | finite-state | 243 | 91.30% | 244 | 102555 | 3.20 | 1.26 |
| F-monoid | 295 | rewrite-normal-form | 78 | 80.40% | 13 | 10 | 0.01 | 28.62 |
| F-monoid | 295 | grammar-cegis | 295 | 100.00% | 295 | 40496 | 1.42 | 0.76 |
| F-monoid | 295 | nuisance-stumps | 0 | 52.19% | 0 | 75159 | 1.56 | 28.26 |
| F-monoid | 295 | positional-template | 17 | 52.88% | 17 | 1380 | 0.19 | 0.24 |
| F-monoid | 295 | bfs-b2 | 3 | 66.91% | 0 | 10 | 0.00 | 16.96 |
| F-monoid | 295 | bfs-4x | 8 | 75.60% | 0 | 10 | 0.00 | 74.33 |
| F-monoid | 295 | bfs-16x | 27 | 81.70% | 0 | 10 | 0.00 | 319.65 |
| F-monoid | 295 | bidirectional | 13 | 77.19% | 0 | 10 | 0.00 | 17.00 |
| F-monoid | 295 | ORACLE portfolio | 295 | — | — | — | — | — |
| F-monoid | 295 | public selector | 294 | — | — | — | — | — |

## Effective family

Success means accuracy >=95% within one construction-valid world. Natural and challenge scores are kept separate.

| family | n | member | sealed successes | mean sealed accuracy | natural successes | mean fit operations | mean fit ms | mean scoring ms |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| F-count | 428 | count-linear | 428 | 100.00% | 428 | 562 | 0.06 | 0.89 |
| F-count | 428 | group-full | 428 | 100.00% | 428 | 10865 | 0.42 | 0.70 |
| F-count | 428 | group-quotients | 428 | 100.00% | 428 | 6001 | 0.29 | 0.70 |
| F-count | 428 | monoid-csp | 428 | 100.00% | 428 | 11818 | 0.84 | 0.69 |
| F-count | 428 | joint-coarse | 0 | 50.29% | 0 | 15544 | 1.13 | 1.37 |
| F-count | 428 | finite-state | 319 | 87.55% | 319 | 60856 | 2.38 | 1.08 |
| F-count | 428 | rewrite-normal-form | 15 | 68.73% | 15 | 10 | 0.01 | 27.32 |
| F-count | 428 | grammar-cegis | 428 | 100.00% | 428 | 9027 | 0.47 | 0.69 |
| F-count | 428 | nuisance-stumps | 0 | 72.59% | 0 | 75186 | 1.60 | 24.49 |
| F-count | 428 | positional-template | 250 | 79.21% | 250 | 3481 | 0.24 | 0.49 |
| F-count | 428 | bfs-b2 | 0 | 50.40% | 0 | 10 | 0.00 | 8.19 |
| F-count | 428 | bfs-4x | 0 | 50.81% | 0 | 10 | 0.00 | 37.12 |
| F-count | 428 | bfs-16x | 0 | 51.58% | 0 | 10 | 0.00 | 175.85 |
| F-count | 428 | bidirectional | 0 | 51.06% | 0 | 10 | 0.00 | 8.89 |
| F-count | 428 | ORACLE portfolio | 428 | — | — | — | — | — |
| F-count | 428 | public selector | 428 | — | — | — | — | — |
| F-abelian | 652 | count-linear | 604 | 98.65% | 604 | 567 | 0.06 | 0.90 |
| F-abelian | 652 | group-full | 652 | 100.00% | 652 | 18862 | 0.57 | 0.69 |
| F-abelian | 652 | group-quotients | 137 | 60.51% | 137 | 4162 | 0.23 | 0.30 |
| F-abelian | 652 | monoid-csp | 652 | 100.00% | 652 | 19749 | 1.31 | 0.69 |
| F-abelian | 652 | joint-coarse | 0 | 50.81% | 0 | 23554 | 1.62 | 1.39 |
| F-abelian | 652 | finite-state | 143 | 61.78% | 143 | 165871 | 5.34 | 0.49 |
| F-abelian | 652 | rewrite-normal-form | 31 | 65.89% | 31 | 10 | 0.01 | 23.82 |
| F-abelian | 652 | grammar-cegis | 652 | 100.00% | 652 | 23544 | 1.00 | 0.69 |
| F-abelian | 652 | nuisance-stumps | 0 | 72.39% | 0 | 76242 | 1.59 | 24.81 |
| F-abelian | 652 | positional-template | 443 | 83.97% | 443 | 4747 | 0.28 | 0.53 |
| F-abelian | 652 | bfs-b2 | 0 | 51.04% | 0 | 10 | 0.00 | 8.60 |
| F-abelian | 652 | bfs-4x | 0 | 52.00% | 0 | 10 | 0.00 | 41.54 |
| F-abelian | 652 | bfs-16x | 0 | 53.47% | 0 | 10 | 0.00 | 201.00 |
| F-abelian | 652 | bidirectional | 0 | 52.31% | 0 | 10 | 0.00 | 9.18 |
| F-abelian | 652 | ORACLE portfolio | 652 | — | — | — | — | — |
| F-abelian | 652 | public selector | 651 | — | — | — | — | — |
| F-nonabelian | 377 | count-linear | 0 | 50.00% | 0 | 566 | 0.06 | 1.04 |
| F-nonabelian | 377 | group-full | 377 | 100.00% | 377 | 34765 | 1.03 | 0.78 |
| F-nonabelian | 377 | group-quotients | 0 | 50.00% | 0 | 3049 | 0.24 | 0.19 |
| F-nonabelian | 377 | monoid-csp | 377 | 100.00% | 377 | 25229 | 1.74 | 0.76 |
| F-nonabelian | 377 | joint-coarse | 0 | 50.00% | 0 | 29080 | 2.04 | 1.63 |
| F-nonabelian | 377 | finite-state | 201 | 76.66% | 198 | 136944 | 4.47 | 1.01 |
| F-nonabelian | 377 | rewrite-normal-form | 85 | 82.29% | 19 | 10 | 0.01 | 27.02 |
| F-nonabelian | 377 | grammar-cegis | 377 | 100.00% | 377 | 25731 | 1.02 | 0.78 |
| F-nonabelian | 377 | nuisance-stumps | 0 | 50.04% | 0 | 77145 | 1.60 | 28.91 |
| F-nonabelian | 377 | positional-template | 113 | 64.99% | 113 | 2738 | 0.23 | 0.38 |
| F-nonabelian | 377 | bfs-b2 | 0 | 70.92% | 0 | 10 | 0.00 | 14.95 |
| F-nonabelian | 377 | bfs-4x | 11 | 80.15% | 0 | 10 | 0.00 | 65.13 |
| F-nonabelian | 377 | bfs-16x | 34 | 84.62% | 0 | 10 | 0.00 | 288.16 |
| F-nonabelian | 377 | bidirectional | 18 | 79.16% | 0 | 10 | 0.00 | 15.17 |
| F-nonabelian | 377 | ORACLE portfolio | 377 | — | — | — | — | — |
| F-nonabelian | 377 | public selector | 377 | — | — | — | — | — |
| F-monoid | 263 | count-linear | 0 | 50.00% | 0 | 566 | 0.06 | 0.99 |
| F-monoid | 263 | group-full | 0 | 50.00% | 0 | 49147 | 1.43 | 0.20 |
| F-monoid | 263 | group-quotients | 0 | 50.00% | 0 | 1898 | 0.24 | 0.19 |
| F-monoid | 263 | monoid-csp | 263 | 100.00% | 263 | 37889 | 2.08 | 0.76 |
| F-monoid | 263 | joint-coarse | 0 | 50.00% | 0 | 41580 | 2.40 | 1.68 |
| F-monoid | 263 | finite-state | 222 | 92.33% | 223 | 106756 | 3.27 | 1.31 |
| F-monoid | 263 | rewrite-normal-form | 76 | 81.45% | 11 | 10 | 0.01 | 29.47 |
| F-monoid | 263 | grammar-cegis | 263 | 100.00% | 263 | 44616 | 1.54 | 0.78 |
| F-monoid | 263 | nuisance-stumps | 0 | 50.00% | 0 | 75515 | 1.57 | 28.72 |
| F-monoid | 263 | positional-template | 3 | 50.57% | 3 | 1216 | 0.19 | 0.22 |
| F-monoid | 263 | bfs-b2 | 3 | 68.83% | 0 | 10 | 0.00 | 18.03 |
| F-monoid | 263 | bfs-4x | 8 | 78.45% | 0 | 10 | 0.00 | 78.77 |
| F-monoid | 263 | bfs-16x | 27 | 85.12% | 0 | 10 | 0.00 | 336.85 |
| F-monoid | 263 | bidirectional | 13 | 80.19% | 0 | 10 | 0.00 | 17.99 |
| F-monoid | 263 | ORACLE portfolio | 263 | — | — | — | — | — |
| F-monoid | 263 | public selector | 263 | — | — | — | — | — |

## All retained BFS settings

| requested family / setting | mean sealed accuracy | successful worlds | tested positions | visited nodes | maximum depth | mean exhaustion frequency |
|---|---:|---:|---:|---:|---:|---:|
| F-count / bfs-b2 | 50.40% | 0 | 63134267 | 10929556 | 5 | 99.60% |
| F-count / bfs-4x | 50.81% | 0 | 322849076 | 43577965 | 7 | 99.18% |
| F-count / bfs-16x | 51.58% | 0 | 1600047382 | 173229177 | 7 | 98.41% |
| F-abelian / bfs-b2 | 51.08% | 0 | 98246785 | 12998782 | 8 | 98.90% |
| F-abelian / bfs-4x | 52.08% | 0 | 521011257 | 51287380 | 12 | 97.85% |
| F-abelian / bfs-16x | 53.59% | 0 | 2611766244 | 199021505 | 13 | 96.19% |
| F-nonabelian / bfs-b2 | 66.45% | 0 | 74045322 | 7736142 | 6 | 83.38% |
| F-nonabelian / bfs-4x | 73.80% | 11 | 346872866 | 28375103 | 9 | 75.87% |
| F-nonabelian / bfs-16x | 77.55% | 34 | 1637346769 | 100950067 | 11 | 71.20% |
| F-monoid / bfs-b2 | 66.91% | 3 | 63403877 | 3798124 | 8 | 83.05% |
| F-monoid / bfs-4x | 75.60% | 8 | 281109256 | 13521804 | 10 | 74.34% |
| F-monoid / bfs-16x | 81.70% | 27 | 1201287379 | 45672364 | 25 | 67.66% |

Historical positional-template accuracy: 16/16 worlds at 100%.

Coverage of at least 200 accepted worlds in every requested AND effective family: true.

Every proposed seed, defect, per-world fit, score and resource count is in the adjacent JSONL files. Regeneration uses the pinned source and seed/options; no defect is replaced.
