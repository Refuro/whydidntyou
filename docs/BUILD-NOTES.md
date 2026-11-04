# Build notes — v1

Started 2026-11-03 against commit `7bcb668`, following `BUILD-PROMPT-v1.md`.
Baseline: dependency install with lifecycle scripts disabled; `LLM_MOCK=1 npm run selftest` passed.
No new dependencies, real model calls, or new adversarial sandbox probes are authorized by this build.
The first delivery stops after B2 for the requested review; B3–B6 remain pending that review.

## Decisions and plan edits

- A1: the prompt says both “decimal string” and “up to 64 hex characters”. Accept canonical decimal strings of 1–64 digits, hash their literal text, and reject numbers, signs, whitespace, and leading-zero aliases. This conservative intersection supports the prescribed masters without numeric conversion. The two example seed lists each contain 40 seeds.
- A1, PLAN §8: substitute the specified SHA-256 computational sampling assumption and prospective public-randomness requirement. Correct retained-draw terminology throughout the plan and reporter, and remove the obsolete digest-refusal sentence (A6).

## Validation checkpoints

- Baseline selftest: passed, including the existing compression controls and historical sandbox regressions.
