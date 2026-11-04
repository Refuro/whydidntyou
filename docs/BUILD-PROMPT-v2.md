# Build request v2: close the B2 review, then packages B3–B6

You are the builder. Read, in order: `docs/BUILD-PROMPT-v1.md` (rules and packages; still in force), `docs/DECISIONS-B2.md`, `docs/REVIEW-RESPONSE-B2.md` (the review of your B2 delivery), then your own `docs/BUILD-REPORT-v1.md` and `docs/BUILD-NOTES.md`. Same rules as v1: no new dependencies, no model calls (`LLM_MOCK=1`), no sandbox probing, no edits to archives or existing prereg files except dated addenda, every repair ships with its fixture, stop at B4 with `docs/REVIEW-PROMPT-B4.md`. Finish with `docs/BUILD-REPORT-v2.md`.

## Step 1 — repairs that gate B3 (do these first, commit, run `npm test`)

R1. **Contract-bound success.** The success rule comes from the regenerated domain instance, never from the result record. `validateResult`/`isSuccess`: require the result variant to match the domain's contract, validate that variant's fields only, reject foreign fields (a compression result with `accuracy`), reject impossible combinations (no `<code>` parsed but a successful execution result). Fixtures: failing compression control, passing compression control, the reviewer's `compression-result-contract-confusion` record (must refuse), a genuine reachability control.

R2. **Master representation.** Decimal text, length bound raised to hold any 256-bit value (78 digits); exact BigInt conversion from source hex with the original bytes and the decimal both recorded in the manifest; reject leading-zero aliases, signs, whitespace. Fixtures: `0`, leading zero, the 64×`f` pulse (78 digits), a value beyond JS number precision round-tripping exactly.

R3. **Public identifiability.** The constraint/enumeration function accepts certificate-free public examples and returns identical assignment and kernel-class counts with certificates present, absent or altered; private path-coverage is a separate function that returns `unavailable` without certificates. Fixture: run the audit on `publicEvidence(inst).trainingPairs` for all 16 development worlds and assert count equality with the private run.

R4. **Inferential status in `bounds.js` (Decision 2, as amended by the review).** When s = u = 0 the inferential result is the provider-randomness binomial zero-success upper bound (mean-of-products argument; needs no M_C). For s + u > 0, inference is `unavailable` (trivial bound 1) unless a registered procedure exists — none does yet. The hypergeometric and plug-in figures remain `diagnostics` with an explicit `inferentialValidity: 'none'` field; rename the `conservative` field accordingly; `gate.passed` means completeness only. Fixture: the reviewer's p-between-bounds example (coverage 5.0000011% at n=100) must be reproduced as a test demonstrating why the hypergeometric figure is diagnostic.

## Step 2 — B3–B6 per BUILD-PROMPT-v1.md, with these additions

B3-a. **Generator amendment (pre-freeze, version bump, dated addendum to `prereg/invariantGame.md`):** latent images are sampled uniformly over admissible assignments (subject to the registered non-commutativity and identifiability checks), not placed at the first alphabet positions; the public alphabet listing is independently permuted. Add a test that permuting the public alphabet while preserving the task leaves every public-evidence statistic unchanged. Historical worlds are not altered; `SELFTEST-B2.json` stays historical.

B3-b. **Durable defect ledger.** Every proposed seed is recorded with requested family, effective classification, assignment/class counts, acceptance or defect reason (including `non-identifiable` and every B3 construction defect), before any solver runs. Proposal/eligible/construction-valid counts for the reporter come from this ledger, never from summaries. Acceptance rates by family are reported; defects are never replaced by convenient draws.

B3-c. **Receipt durability.** Persist the received raw response and usage *before* parsing and scoring (`received-unscored` state); recovery either rescores from the archived response or marks the slot unresolved, by a registered rule (choose: rescore; it is deterministic). Fixture: interruption at the writer boundary between receipt and scoring.

B3-d. **Resume (Decision 8).** `--resume` validates the partial prefix, records `resumedFrom` with the prior state digest, preserves all dispatched/received work, and continues only unfinished slots under the same indices and budgets; idempotent on repeated invocation; abandons (with recorded disposition) rather than repairs an inconsistent batch. Fixtures: repeated resume; interruption after terminal completion; orphan log; partial final record; changed source/config hash (refuse); receipt-before-score failure. Reconcile the "mixed/resumed batches are refused" sentence in PLAN §8 to "resumed only through the validated resume path".

B3-e. **Sealed construction and checker** as in v1 B3, plus: both realized ceilings (histogram and joint-feature) recomputed after rounding by an independent function; the exported world includes the defect-ledger entry; the checker refuses a world whose public alphabet ordering reveals image positions (regression for B3-a).

B4-a. **Portfolio additions:** the positional-template baseline the review describes (enumerate registered ambient templates and positional image assignments; select with public rules/labels; report fitting cost) — it must fail after B3-a and its pre-amendment score on the 16 historical worlds is recorded for the write-up; BFS reported with visited nodes, tested positions, max depth, budget-exhaustion frequency and resource curves; all challenged budget settings retained, not only the ones that preserve the wall.

B6-a. **Model-loop integration:** keep raw classifier success and certified-quantity success as separate fields end to end; the presence of a quantity is never a certificate.

Document every plan edit by section in `BUILD-NOTES.md`, including the §13 terminology edit the review noted as unlisted.
