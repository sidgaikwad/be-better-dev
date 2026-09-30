Roost shipped a redesigned search page on 1 May. In April, 20% of searching students sent a booking request; in May, 17.3% did. The engineer who built it is already preparing a rollback. Then someone cuts the same numbers by platform:

| Platform   | April searchers | April rate | May searchers | May rate |
| ---------- | --------------- | ---------- | ------------- | -------- |
| App        | 30,000          | 24%        | 26,000        | 25%      |
| Mobile web | 10,000          | 8%         | 24,000        | 9%       |
| Total      | 40,000          | 20%        | 50,000        | 17.3%    |

The requests behind it: April, 7,200 from the app and 800 from the web, 8,000 of 40,000. May, 6,500 and 2,160, 8,660 of 50,000. Both platforms improved, yet the total fell by 2.7 points.

## Simpson's paradox

This is Simpson's paradox: a trend that holds in every subgroup reverses when the groups are combined, because the groups changed size. Edward Simpson described it in 1951. In a well-known 1986 kidney stone study, one treatment did better on small stones and on large stones, yet worse overall, because it got more of the hard cases.

At Roost the cause is mix. In May, a large Pune college (hypothetical here) put a link to Roost's web search in its admission emails. Mobile web traffic went from 10,000 to 24,000, mostly students months from needing a room. The web converts at about a third of the app's rate, so each extra web searcher drags the average down even as both rates rise.

Both numbers are true. The per-platform rates answer "did the redesign make search better?": yes, on both. The total answers "how many requests did our traffic produce?", which planning needs. When a rate moves, check whether the mix under it moved before you blame the product.

## Where to cut

The video's instructor cuts a leaky funnel by cohort, time of day, region and age group. Drop-offs that rise on days with more than 1,000 users, he says, point to a system that does not scale; a 35 to 45 age group that drops more tells you whom to interview. Roost's standard cuts:

1. **Platform and app version**: app, mobile web, Android, iOS.
2. **City**: Pune, Bengaluru, Hyderabad, and whether the city is new.
3. **New or returning**, and signup cohort.
4. **Acquisition channel**: organic search, referrals, paid ads.
5. **Time**: hour, weekday, and season, since June is nothing like November.

Add the segment the personas and segments section found most valuable: first-year students moving from another city. In a month, 12.9% of them book, against 4.0% of everyone else. Any shift in the share of first-years moves the total with no change in the product.

## Segments find hypotheses, not proofs

The instructor's "more drop-offs above 1,000 users" pattern has two explanations: servers slow under load, or busy days are campaign days that bring students who were never going to book. The segment cannot tell them apart; page load times on those days can. The activation lesson made the same point about messaging and booking: a pattern in the data is a correlation until an experiment or a direct check confirms the cause.

The second trap is volume. At a 5% threshold, about 1 segment in 20 looks unusual by chance even when nothing is wrong.

## Predict, then verify

An analyst cuts last month's search-to-request rate by 3 cities, 2 app platforms (Android and iOS) and 4 weeks: 24 segments. One stands out: Bengaluru iOS in week 3, where 150 students searched and 21 sent requests, 14% against the usual 20%. The analyst proposes a sprint to hunt for an iOS bug. Do you agree?

Answer: no. With 150 students and a true rate of 20%, the standard error is the square root of 0.20 x 0.80 / 150, which is 0.033, or 3.3 points. A reading of 14% is 6 points low, about 1.8 standard errors, and a gap that large or larger happens about 7% of the time by chance. Across 24 segments you should expect 24 x 0.07, about 1.7, segments this far off with nothing wrong at all. Even if real, it is 9 missing requests a week. Check the same segment next week on fresh data, and start the bug hunt only if it stays low. A segment chosen because it looked odd is a hypothesis; confirm it on data you did not use to find it.
