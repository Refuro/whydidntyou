# Why this works, explained simply

## The question

Could an AI have discovered calculus on its own, if it only knew what people knew before calculus?

And if it couldn't: what exactly was missing? Not "it failed," but *which idea* never showed up, and could we have gotten it there with a small push?

## Why you can't test that directly

To test it directly you'd need an AI that knows all the math before calculus and nothing after. But calculus is in everything written since 1700: physics, engineering, economics, even the words people use. You can't cut it out. And if you only train on writing from before 1700, there isn't enough of it to make an AI smart enough to try.

It's like asking "could my kid have invented chess?" You can't un-teach chess. And a kid who has never seen any games at all isn't a fair test either.

## The trick: make up a brand-new puzzle

Instead of hiding an old answer, we invent a new one nobody has ever seen.

We write a secret rule and use it to generate a long list of numbers. The AI gets the list and one job: **write a program that stores the list using as few bits as possible.**

The rule's *settings* are ours, made up fresh: they aren't in any book or training set. But the *kind* of rule may well be familiar, and a method for that kind of rule may be in the AI's toolkit. That distinction turned out to be the whole story (see "What happened on day one").

## Why "compress it" is the right job

Compression means finding pattern. If the list were truly random, no program could store it in fewer bits than the raw numbers. To make it much shorter, a program has to capture the structure the hidden rule creates — not necessarily by naming our rule, but by modeling what it does.

Think of describing a picture over the phone. If it's random noise you have to name every single dot. If it's a hundred dots in a straight line you can say "a hundred dots in a row" and you're done. The shorter your description, the more of the pattern you found.

So the number of bits is an honest score. It can't be argued with, and because we know the rule we can compute what an ideal model of it would score on average, which gives us a floor to measure against.

## Why this is like calculus (at tiny scale)

Calculus was a pattern that was *there* in the world (how things change smoothly) that nobody had named or used yet. Finding it meant noticing structure everyone was looking at but nobody had seen.

Our secret rule is the same kind of thing. The structure is right there in the numbers. Nobody has named it. Finding it means looking at something in a way you haven't looked before.

It's much smaller than calculus. But it's the same *shape* of task: there is a wall, everyone's usual moves don't get over it, and getting over it requires an idea that isn't in your bag yet.

## Making sure the wall is real

Before we test any AI we test the puzzle. We write the obvious programs ourselves: count how often each number appears, look at what tends to follow what, use the standard textbook compressor. All of them must fail. Then we write a program that knows the secret, and it must succeed.

If the obvious programs get through, the puzzle is too easy and we make it harder. This happened on day one (see below).

## What we actually measure

1. **How often does it get through?** Not once: many tries, many puzzles, so we get a rate with error bars.
2. **How many different ideas did it have?** Twenty attempts that are all the same idea in different clothes is a different failure from twenty different ideas that all miss.
3. **Which hints help, and by how much?** We have a ladder of hints from vague ("something here isn't what it seems") to pointed. Each one is compared against trying again with no hint at all, so a hint only gets credit for successes the AI wouldn't have had anyway.
4. **What does it say afterwards?** We show it the answer and ask "why didn't you try that?" Then we check whether its story matches what it actually tried. AIs, like people, often tell a tidy story that isn't true.
5. **Does the lesson transfer?** We take whatever we learn from the first kind of puzzle, turn it into generic advice with no spoilers, and try it on a *different* kind of puzzle we never tuned on. If the advice helps there too, that's evidence it's about how the AI searches rather than about this puzzle. It isn't proof — advice can carry a strategy without carrying an answer — so the second puzzle family is chosen before we start and never used for tuning.

Number 5 is the one that matters. Numbers 1 to 4 are what make it possible.

## What happened on day one

The first real run got through on the first try. But when we read what it did, its guess about the rule was *wrong*. It had reached for a general-purpose tool that happens to cover a lot of patterns at once, including ours, without ever identifying which pattern was there.

That's like opening a lock with a master key. The lock opened, but nobody learned the combination.

So we moved the lock: the secret now lives somewhere the master key doesn't reach. And we added a new thing to measure: for every success, did the AI *name the actual structure*, or just win with a big hammer? Only the first one is discovery.

## What makes this publishable rather than a blog post

- The rules of the game (what counts as the key idea, what counts as success, what we predict will happen) are written down and committed before the confirmatory runs. Early exploratory runs changed the design — that's recorded, dated, and labeled as exploration, not evidence.
- Every number is a rate over many trials with a confidence interval, not one dramatic run.
- There's a held-out puzzle family that nothing is tuned on. That's the difference between a practice test and the real test.
- The whole thing is code. Anyone can re-run it.

## What it can't tell us

This is small. Finding a hidden rule in a number list is not inventing a new kind of mathematics. Calculus needed new *concepts*, not just a pattern. So a result here is a floor, not a ceiling: if an AI can't do this, that's informative; if it can, it doesn't mean it could do calculus.

More importantly: with an AI that has read everything, we can never be sure a method was *absent* from its toolkit. So the honest claim this project can make is "the AI did better (or worse) than a specific set of known methods we wrote down in advance," not "the AI invented something." To test invention properly you need an AI whose toolkit you know completely — which means training one yourself on material you wrote. That's a later phase.

It also only tests one way of being stuck. There are others. But you have to start with a wall you can actually measure, and this is one.
