Roost's button test is planned for four weeks. The PM opens the dashboard every morning. On day 3 it shows booking requests up 9% with p = 0.03, and she wants to ship before the weekend. The dashboard computed it correctly, and it is still probably wrong. Here are four common ways a correctly computed result lies.

## Peeking

A p-value assumes the sample size was fixed before the data arrived. Checking every day and stopping the first time p dips below 0.05 gives noise many chances to cross the line, and you stop exactly when it does. Evan Miller showed the size of the damage in "How Not To Run an A/B Test" (2010): in his example, checking after every observation and stopping at the first significant reading turned a nominal 5% false-positive rate into 26.1%. Peek ten times, he notes, and what the dashboard calls 1% significance is really about 5%.

The fix is the plan from the A/B tests lesson: the duration is written down before launch, and the result is read once, at the end. If you need to look early, use a sequential design, which sets a stricter threshold for each planned look, or a Bayesian method built for continuous monitoring. The one early stop that is always allowed is a broken guardrail. Kohavi's 2009 survey points out that because delta is squared, a bug that drops the OEC 20% in a test sized for 1% shows up in 1/400 of the planned time.

## Novelty and primacy

The same survey names two opposite effects. **Novelty**: a new design draws curiosity clicks, which flatters the treatment for the first days. **Primacy**: experienced users are slower with a changed layout until they relearn it, which flatters the control. Roost's returning students know where the request button used to be; a first-year arriving in June does not. Two defenses: run whole weeks, and more than one, so the effect can settle; and compare new users alone, since neither effect touches someone who never saw the old version.

## Sample ratio mismatch

With a 50/50 split, the two arms' user counts should be close. When they are not, something treats the arms differently, and every number downstream is suspect. Microsoft's experimentation team reports that about 6% of its A/B tests have a **sample ratio mismatch** (SRM). It checks with a chi-squared test and a deliberately strict threshold of p < 0.0005:

```text
configured 50/50, observed 50,000 vs 48,800, expected 49,400 each
chi-squared = 600^2 / 49,400 + 600^2 / 49,400 = 7.29 + 7.29 = 14.57
p = 0.00013, below 0.0005: SRM, do not read the results

observed 50,000 vs 49,700, expected 49,850 each
chi-squared = 0.45 + 0.45 = 0.90, p = 0.34: fine
```

The causes are mundane: a redirect that loses some users, a logging change on one side, a filter that drops more of one arm. In one Microsoft case, an MSN carousel variant made people click so much that a bot detector filtered real users out of it.

## Many metrics, and Twyman's law

Report twenty metrics at a 0.05 threshold on a change that does nothing, and the chance at least one comes out significant is 1 - 0.95^20 = 64%. That is why the plan names one OEC and treats the rest as diagnostics. For surprises, Kohavi quotes Twyman's law: "any figure that looks interesting or different is usually wrong." A big jump is a reason to check the plumbing before celebrating.

## Predict, then verify

On day 5 of the four-week button test, the dashboard shows booking requests up 22% in treatment, p = 0.004. The split is 50/50, and 10,300 students are in control and 9,700 in treatment. Ship now?

Answer: no, and stop reading this run. Check the split first: expected 10,000 each, so chi-squared = 300^2 / 10,000 + 300^2 / 10,000 = 9 + 9 = 18, p = 0.00002, far below 0.0005. That is an SRM. Treatment is missing 600 students it should have, perhaps ones whose phones failed to load the new page before it logged them, and students who never saw a working page were unlikely to send requests, so treatment's rate is inflated. The 22% is also Twyman territory, and day 5 is a peek. Find the cause, fix it, and restart with the duration fixed. The principle: validate the split before reading any result, because an SRM invalidates everything computed after it.
