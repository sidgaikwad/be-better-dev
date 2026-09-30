Thirty days after instalments went live in Pune and Bengaluru, the team is celebrating: 27% of bookings used instalments, against a target of 20%. The number is real. Whether the launch worked is a different question, and it depends on what was written down before launch day.

## Review against the targets you set before

A post-launch review compares results with targets set in advance, never with whatever looks good afterwards, so write the targets, guardrails and review dates before launch. Common review points are day 2 (is anything broken), day 30 (are the leading metrics moving) and day 90 (the lagging ones). The review has four parts: what we expected, what happened, why, and what we change.

Take the owner dashboard, the tier 2 release from this section's first lesson. Its target: raise the share of owners updating room availability weekly from 40% to 50%. At day 30 it is 44%.

```text
Target lift   = 50% - 40% = 10 points
Actual lift   = 44% - 40% = 4 points
Progress      = 4 / 10 = 40% of the target lift
Why           = most owners open the dashboard; few reach availability
Decision      = iterate: put availability on the first screen
Next review   = day 60
```

Record the decision too: iterate, extend the review, and roll back are all legitimate. As the lesson on why most ideas fail showed, most changes do not move the metric they target, so a launch is a hypothesis tested at full scale, and a rollback is a result.

## Which metrics to read

The video lists GTM effectiveness metrics in nine groups: revenue, acquisition (new customers, CAC), market penetration (share, awareness), engagement (usage, NPS), sales (velocity, win rate, deal size), marketing performance (return on spend, cost per lead), channel effectiveness, operations (time to market, time to value), and retention (churn, renewals). Nine groups is a menu. Pick the three to five that map to the launch's goal.

The instructor argues that retention metrics make little sense during a launch, since nearly every customer is new. That has it backwards. Acquisition can be bought with a campaign; early retention cannot, so it is the most honest signal a launch produces. For instalments the retention signal is whether families pay the second and third instalments, which shows only at days 30 and 60. So this launch needs a day 90 review booked before it starts.

## The first thirty days

Mostly from the video's post-launch list, in the order that matters:

1. Triage bugs, tickets and feedback daily in week one, then weekly.
2. Tell users what you fixed, so complaints visibly lead somewhere.
3. Thank the early adopters, who carried the risk.
4. Feed what you learned into the roadmap, not only the bug queue.
5. Remove the rollout flag once the feature is at 100% and stable.

## Blameless, and written down

When something went wrong, keep the review blameless. The Google SRE book's chapter on postmortem culture defines a postmortem as a written record of impact, actions taken, root causes and follow-ups, one that finds contributing causes without indicting any person or team. Its reasoning: "You can't 'fix' people, but you can fix systems and processes." Set triggers in advance, such as user-visible downtime, lost data or a rollback, so nobody has to argue for a review.

## Predict, then verify

Day 30 for instalments. Adoption is 27% of 6,000 bookings in Pune and Bengaluru, against a 20% target. Total bookings there are 4% above forecast. Hyderabad, where instalments are not live yet, is 3% above its own forecast. Of families whose second instalment has fallen due, 5% missed it, against a guardrail of 3%. Marketing wants to launch Hyderabad next week. Do you?

Answer: not yet. Adoption beat its target, but adoption is closer to an output than an outcome, in the outputs and outcomes lesson's terms: many of the 1,620 families (27% of 6,000) would have booked anyway and just chose the new way to pay. The outcome is extra bookings, and against Hyderabad's 3% the launch explains about 1 point, roughly 60 bookings. The guardrail is breached: across all 1,620 families, 5% would be 81 missed payments, against 49 at the 3% limit. Fix the approval rules and reminders, review at day 60, and expand when the guardrail holds. The principle: judge a launch on the outcome and guardrails you wrote down before it, not on the number that looks best after.
