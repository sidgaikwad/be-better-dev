A hypothetical shop runs the instructor's add-to-cart idea as a proper test, with 10,000 shoppers per arm. Control converts 500 (5.0%); treatment converts 560 (5.6%), a 12% relative lift. The p-value is 0.058, just above 0.05, so the team writes "no significant effect" and moves on.

That verdict is wrong. Run the same two rates on 40,000 shoppers per arm and p falls to 0.00015. The button may well have worked; the test was too small to tell.

## Four numbers set the size

- **Baseline rate**: the OEC today, here 5%.
- **Minimum detectable effect (MDE)**: the smallest change the test is built to catch, as an absolute difference called delta.
- **Significance level**: the false-alarm risk you accept, conventionally 0.05.
- **Power**: the chance of detecting a real effect the size of the MDE, conventionally 80%.

With significance at 0.05 and power at 80%, the rule of thumb from Gerald van Belle's _Statistical Rules of Thumb_ (2002), which Ron Kohavi and colleagues use in their 2009 survey of web experiments and again in _Trustworthy Online Controlled Experiments_ (Kohavi, Diane Tang and Ya Xu, 2020), is:

```text
n per variant = 16 x variance / delta^2
variance of a conversion rate p = p x (1 - p)
```

The 16 bakes in both conventions (use 21 for 90% power). For the shop:

```text
variance = 0.05 x 0.95 = 0.0475
delta    = 12% of 0.05 = 0.006
n        = 16 x 0.0475 / 0.006^2 = 0.76 / 0.000036 = 21,111 per variant
```

The shop needed about 21,000 per arm and had 10,000. Even if the true lift was exactly 12%, its test had about a 47% chance of reaching significance: a coin toss.

The delta is squared: halve the effect you want to see and you need four times the users. In Kohavi's survey, at 5% conversion, catching a 5% change needs about 121,600 users per variant; catching a 20% change needs 7,600.

## Roost's arithmetic

About 10% of Roost's searchers go on to book, and an average month has 40,000 of them. Variance is 0.10 x 0.90 = 0.09.

| Lift to detect     | Delta | Per variant | Both arms | Months of searchers |
| ------------------ | ----- | ----------- | --------- | ------------------- |
| 2% (10.0 to 10.2)  | 0.002 | 360,000     | 720,000   | 18                  |
| 5% (10.0 to 10.5)  | 0.005 | 57,600      | 115,200   | 2.9                 |
| 10% (10.0 to 11.0) | 0.010 | 14,400      | 28,800    | 0.7                 |

Roost cannot see a 2% gain in bookings at all, and a 5% gain takes most of a season, across which June's first-years and October's stragglers are different populations. A small product can only detect big effects.

## What a small product does instead

1. **Test bigger changes.** A bold change that might move bookings 10% is testable in three weeks; a copy tweak aiming at 2% never is.
2. **Measure close to the change, on the users it touches.** When checkout changes, Kohavi's survey analyses only shoppers who reach it. A Roost change to the screen after a student sends a request touches only the 8,000 monthly requesters, half of whom book. Variance is 0.5 x 0.5 = 0.25; a 10% lift is a delta of 0.05; n = 16 x 0.25 / 0.0025 = 1,600 per variant, or 3,200 requesters, about 12 days.
3. **Do not A/B test what you cannot power.** Ship small, reversible changes on judgment and usability sessions, watching the guardrails.

## Predict, then verify

The designer proposes a new photo layout on listing cards and expects bookings per searcher to rise from 10.0% to 10.3%. She plans a four-week test in October. Will it answer the question?

Answer: no. A 3% lift is a delta of 0.003, so n = 16 x 0.09 / 0.000009 = 160,000 per variant, or 320,000 searchers: eight months of traffic. Four weeks gives 20,000 per arm, which can reliably catch only sqrt(16 x 0.09 / 20,000) = 0.0085, a lift of about 8.5%, nearly three times what she expects. It can only return "not significant", which will read as the layout failing. Skip it: ship the layout as a change you can undo, on the strength of usability sessions, and spend testing traffic on changes big enough to see. The principle: size the test before building it; if the effect you expect is smaller than the MDE you can afford, the test cannot answer.
