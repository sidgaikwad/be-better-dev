In 2012 a Microsoft employee working on Bing proposed a change to how ads displayed their headlines. It would take an engineer a few days. It was one of hundreds of ideas, the program managers ranked it low, and it sat for more than six months. Then an engineer, seeing how cheap it was, ran an A/B test. Within hours the treatment tripped a "too good to be true" alert, which usually means a bug. It was not a bug. Revenue was up 12%, which Ron Kohavi and Stefan Thomke put at more than $100 million a year in the United States alone, without hurting the user-experience metrics. They called it the best revenue idea in Bing's history (Harvard Business Review, September 2017).

The story is usually told as a lucky find. The more useful reading is that the people prioritizing could not tell this idea from the hundreds around it, and neither can you.

## The base rate

The same article gives the numbers behind that. At Microsoft as a whole, about one third of tested ideas improve the metric they target, one third make no significant difference, and one third make it worse. At Google and Bing only about 10% to 20% of experiments generate positive results. Kohavi's 2015 KDD keynote puts it bluntly: features are built because teams believe they are useful, and most fail to move the metrics they were designed to improve. Marty Cagan makes the same point from the product side, writing in 2013 that at least half of product ideas will not work.

These are companies with strong teams and plenty of data. The low rate is not incompetence. Mature products have already taken the obvious wins, and people are poor at predicting how strangers will react to a change.

## What shipping untested costs

Take nine ideas and Microsoft's thirds, and suppose each one moves bookings by 2% when it moves at all:

```text
ship all nine untested
  3 winners x +2%  = +6%
  3 flat    x  0%  =  0%
  3 losers  x -2%  = -6%
  net              =  0%, for nine features of work

test all nine, ship the winners
  3 winners x +2%  = +6%
```

The untested roadmap does the same work and gets nothing, and nobody can say which feature hurt. The negative third is what makes testing pay: it is not only finding winners, it is refusing to ship the losers.

The sample size lesson adds Roost's constraint: a 2% change in bookings cannot be detected at Roost's traffic. So Roost's practice follows from both lessons. Test the bold changes on bookings, test smaller ones on a metric close to the change, and for what cannot be tested, assume about one in three is doing harm, keep it reversible and watch the guardrails.

## Confidence scores and roadmaps

Intercom's RICE, from the RICE lesson, scores confidence at 100%, 80% or 50%. If your team's tested ideas win about a third of the time, an 80% default is fiction. Score an untested idea at 50%, the scale's floor, and give 80% or 100% only when there is evidence behind it: a previous test, a fake door, a signal that came up unprompted in interview after interview. Better still, keep your own record of tests and wins, and calibrate against it.

For roadmaps, the base rate is the argument for committing to outcomes rather than features. A dated list of features promises that each one works, and the data says most will not.

## Predict, then verify

A planning offsite produces six features for the season. Each champion expects a 5% lift in bookings, and all six are scored at 80% confidence. The founder wants to promise investors 30% more bookings. What do you commit to?

Answer: about 10%, as an outcome, and a plan to test all six. At a one-third success rate, expect two winners: 1.05 x 1.05 = 1.1025, about a 10% gain, and only if the two expected losers are caught. Shipped untested, those losers cancel the winners and the season nets roughly nothing. Each 5% test on bookings needs about 115,200 searchers, close to three months of average traffic and less in June, but overlapping tests can share the same students, since Kohavi's survey found strong interactions between tests rare, so all six can run at once. The principle: a roadmap is a portfolio of bets, and its value must be priced at the rate at which ideas actually fail.
