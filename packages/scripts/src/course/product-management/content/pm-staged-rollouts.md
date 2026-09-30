On July 19, 2024, at 04:09 UTC, CrowdStrike released a content update for its Falcon security sensor on Windows. A defect in it crashed the machines that loaded it. It was reverted at 05:27 UTC, 78 minutes later, but any Windows machine running a recent sensor and online in that window could already have it. Microsoft estimated 8.5 million devices were affected, under 1% of all Windows machines, and flights, banks and hospitals were disrupted. CrowdStrike's review promised to deploy such updates in stages, starting with a canary.

The defect was one mistake. Sending it to everyone at once was a second, separate decision.

## Four release stages

A release usually passes through stages, each answering a different question.

1. **Alpha**: the team and a few invited users. Does the core work at all?
2. **Closed beta**: invited real customers. Does it solve their problem in their conditions?
3. **Open beta**: anyone who opts in. Does it hold up at volume?
4. **General availability (GA)**: everyone, fully supported.

The stages are promises as much as tests. Google Cloud makes this explicit: a Preview carries no SLA or support commitment, while GA is ready for production and covered by an SLA where one applies. In October 2020 it cut four stages (early access, alpha, beta, GA) to two, for predictability. A stage can also become a hiding place: Gmail kept its beta label from 2004 until July 2009.

## Flags and the percentage ladder

A feature flag is a condition whose value changes at runtime, so deploying code and releasing it become separate acts. Pete Hodgson's taxonomy on Martin Fowler's site (October 2017) names four kinds: release toggles hide unfinished work, experiment toggles split users for A/B tests, ops toggles act as kill switches, and permission toggles gate a feature by plan or group.

A percentage rollout is usually a stable hash, so a user who sees the feature at 5% still sees it at 25%:

```ts
const enabled = hash(`${userId}:new-checkout`) % 100 < rolloutPercent
```

The common ladder is 1, 5, 25, 50, then 100%; the video's instructor describes apps starting at 5%. At each step you watch guardrails (errors, latency, payment failures, support tickets) against a halt rule written in advance. For a hypothetical app with 2,000,000 daily users:

```text
1% of 2,000,000 daily users: 20,000 users
Expected errors at 0.5%: 20,000 x 0.005 = 100 a day
Observed: 240 errors, so 240 / 100 = 2.4x baseline
Halt rule: 1.5x baseline, so the flag goes off
Exposed: 20,000 people, not 2,000,000
```

A flag flip takes seconds and no deploy; a rollback takes as long as your pipeline.

## Where it breaks

Hodgson calls flags inventory with a carrying cost, and old ones are dangerous. On August 1, 2012, Knight Capital deployed trading code that reused a flag which once switched on a retired function, Power Peg. A technician missed one of eight servers, and there the flag woke the old code. The SEC found Knight lost more than $460 million in about 45 minutes. Remove each flag once its rollout is done.

Some effects cannot be flagged back: a flag limits who is affected, not a payment already taken or a message already sent.

## Predict, then verify

Roost's rebuilt checkout, with instalments, is ready in late May. An engineer proposes 1, 5, 25, 50 and 100%, a day per step. Roost sees about 300 checkout starts a day, with a 2% baseline payment failure rate. Would this ladder catch a defect that doubles failures to 4%?

Answer: no, because each step is sized by the calendar, not by events. At 1%, 3 checkouts a day produce 0.06 expected failures, or 0.12 if doubled. At 5%, 15 checkouts give 0.3 against 0.6. At 25%, 75 checkouts give 1.5 against 3, still inside ordinary luck. A count's natural wobble is about its square root, so to separate 2% from 4% you want roughly 500 checkouts: 10 failures expected against 20, a gap of about three wobbles (the square root of 10 is about 3.2). At 25% that takes about seven days; at 1% it would take 167. So start with Roost's own staff as the alpha, hold 25% until 500 checkouts have passed (a failed payment can be retried, so that week is cheap), then go to 100% with the kill switch ready. The principle, as the sample size lesson showed for tests: a step ends when it has seen enough events to answer its question.
