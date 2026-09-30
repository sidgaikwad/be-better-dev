An experiment on Bing once carried a ranking bug that made search results very poor. By the two numbers search engines are judged on over the long run, the broken version won: distinct queries rose by more than 10% and revenue by more than 30%. Ron Kohavi and colleagues at Microsoft published it in 2012 as one of five puzzling outcomes. Users who could not find answers searched again, and with worse results the ads looked relatively more useful.

## Decompose until the value shows

The puzzle dissolves once the top metric is split into factors that multiply back to it:

```text
queries per month = queries per session x sessions per user x users per month
```

Worse results raised queries per session, because each task took more searching. In an experiment both versions get about the same number of users by design, so the last factor is fixed. That leaves sessions per user as the factor that means value, since people return to a search engine that works, while queries per session should fall when search improves. Kohavi concluded that sessions per user belongs in the measure of success.

That is what a **metric tree**, also called a driver tree, is for. You write the north star as arithmetic over its drivers, check that the drivers multiply or add back to it, and give each branch an owner. Here is Roost's tree for the north star from the previous lesson, happy move-ins, in an average month:

```text
students who search                      40,000
x share who send a booking request   20% = 8,000 requests
x share accepted and paid            50% = 4,000 bookings
x share who move in                  90% = 3,600 move-ins
x share with no dispute in 30 days   90% = 3,240 happy move-ins
check: 40,000 x 0.20 x 0.50 x 0.90 x 0.90 = 3,240
```

Each line has a team. Search and design own the request rate, operations and the owner side own acceptance, and verification owns the last two, because fake listings and hidden charges stop move-ins and start disputes. Because the factors multiply, a 10% relative gain on any line is a 10% gain at the top: moving the request rate from 20% to 22% gives 3,564, which is 324 more. Which line to push is then a question of cost and evidence, not of which line looks worst.

## Guardrails

A tree tells you what to push, not what the push may cost off the tree. Charles Goodhart observed in 1975 that a statistical regularity tends to collapse once people lean on it for control. Marilyn Strathern later gave the popular version: when a measure becomes a target, it ceases to be a good measure.

The defense is a **guardrail metric**. Microsoft's experimentation team describes guardrails as aspects of the product you do not want to degrade but do not expect to improve, such as page load time, crash rate and abandonment. It recommends alerts on them. Pick them before the work starts, each with a threshold, and treat a breach as a stop on the ship decision however good the target looks. For Roost, sensible guardrails are app uninstalls and notification opt-outs, owner complaints, and the verification backlog, since a team pushing listing volume could quietly let unverified rooms through.

Keep them few. Two to four guardrails get watched; twenty become a dashboard nobody reads.

## Predict, then verify

A growth engineer tests a push notification, "New PGs near your campus", sent three times a day to students who have searched. Over four weeks, sessions per student rise 18% and booking requests rise 3%. Weekly uninstalls among those students rise from 1.5% to 3.5%. Ship it?

Answer: not as designed, and the tree shows why in north-star units. The gain: 3% of 8,000 requests is 240 more, and 240 x 0.50 x 0.90 x 0.90 = 97 more happy move-ins a month. The cost: 2 extra points of uninstalls on 40,000 searching students is 800 students a week, or 3,200 over the four weeks, and each searching student is worth 0.081 happy move-ins a month (3,240 / 40,000). That is 3,200 x 0.081 = 259 a month lost. Net, about 162 fewer a month, while sessions looked like the best result of the quarter. Cut the frequency to one a week, retest, and hold the uninstall guardrail at its old level. The principle: price every guardrail breach through the tree, and never let the target's gain be counted without it.
