# Review request: whydidntyou, Phase 2–3 plan

You are reviewing an experimental design before it is run. Your job is to find what is wrong with it. Be adversarial. A review that mostly agrees is a failed review; the plan has not been tested by anyone outside the person who wrote it, and the author would rather hear every objection now than from a referee later.

## The project in two sentences

We want to measure whether language models can make the kind of move a breakthrough requires — inventing a method or a concept that was not in their toolkit — as opposed to searching for the right setting of a method they already know. When they fail, we want to measure what was missing: the smallest hint that fixes it, what the model says afterwards about why it didn't try that, and whether that explanation matches its actual attempts.

Repo: https://github.com/Refuro/whydidntyou

## Read, in this order

1. `docs/PLAN.md` — the design under review. Everything below is about this file.
2. `prereg/laggedRule.md` — the Phase 1 pre-registration, including addenda that record what already went wrong and how the walls were raised. This shows the kind of failure the Phase 2 design is trying to prevent.
3. `README.md` — the measurements as currently defined, and the protocol.
4. `docs/WHY-THIS-WORKS.md` — the plain-language justification. Check whether the claims it makes to a lay reader are ones the design can actually support.
5. Skim `src/domains/laggedRule.js`, `src/sandbox.js`, `src/prompt.js`, `src/run.js` to see how a domain, verifier and attempt loop are built, so your suggestions for Phase 2 fit the harness.

## What has already happened (so you don't re-discover it)

- Phase 1's first wall was beaten on attempt 1 by a stock technique (PPM context mixing) while the model held a wrong hypothesis about the data. We now distinguish "passed the verifier" from "named the structure".
- The raised wall was beaten in 3 attempts by sparse context mixing with lags up to 24 (the hidden lag was 13). A sibling run searched lags 1–12 and missed. We classify this as level 1–2 on the ladder in PLAN.md §0, not as discovery, and we are now measuring the "search horizon" as a control.
- The author's own objection, which motivated Phase 2: "this is a puzzle of known knowledge, not discovery." Your review should take that objection as the standard. Does Phase 2 actually escape it?

## What to produce

Write your review as Markdown with these sections, in this order. Be concrete: name the section of PLAN.md you are objecting to, say what breaks, and propose a specific fix or a specific test. Vague concerns ("this might be hard") are not useful.

### 1. Fatal flaws
Anything that, if true, means the experiment cannot support its central claim ("this measures invention, not search"). If you find none, say so and explain why you looked and didn't find one.

### 2. Answers to the seven open questions in PLAN.md §7
One by one. Where the question asks you to compute something (sample size, §7.6), compute it and show the assumptions.

### 3. Leakage and designer-knowledge
PLAN.md §1 claims the generator keeps the designer's knowledge out of the wall by minting the invariant randomly and deriving rules from it. Attack that claim. Can the *form* of the rules reveal the invariant family? Can the labeled training pairs? Can the dial level be inferred from the prompt? Propose a leakage test the author can run before any model sees the task.

### 4. Is the dial real?
§2.4 orders invariant families D0–D4 by "enumerability". Is that ordering defensible for a model that knows group theory and program synthesis? For each level, say what a strong model's first move would be and whether that move is level 1–2 or level 3–4 on the ladder. If D3 is a stock move for such a model, propose what sits above it.

### 5. The measurements
For each automatic novelty check in §2.3 (conservation check, generalization gap, named-method judge, derive-vs-enumerate), say: what does it actually detect, what does it miss, and how would a model pass it without having done the thing it is supposed to detect?

### 6. Phase 3 (vintage model)
Is optimal coding 1928→1952 the right target? What leaks could exist in a pre-1931 corpus for this specific target? Is the capability-floor control in §3.2 sufficient to interpret a null result?

### 7. Statistics and reporting
Sample sizes, the choice of Wilson intervals, the contrast reporting, what should be pre-registered that isn't, and what a referee at a serious ML venue would reject on sight.

### 8. The strongest hostile reading
Write the paragraph a skeptical referee would write to reject the paper. Then say whether the plan, as written, already answers it, and if not, what would.

### 9. Ranked changes
The changes you would make, ranked by how much they improve the experiment per unit of work. Top five, each in one or two sentences, each tied to a section of PLAN.md.

## Constraints on your review

- Do not rewrite the plan. Review it.
- Do not soften objections because the design is thoughtful; the author asked for the opposite.
- Where you are uncertain, say what evidence or test would resolve it rather than hedging.
- If you think the whole framing (the four-level ladder in §0) is wrong, say so in section 1 and propose the replacement. That is in scope.
- Assume the reader knows the repo; do not summarize it back.
