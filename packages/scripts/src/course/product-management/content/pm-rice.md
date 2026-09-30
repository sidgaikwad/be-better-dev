The video's instructor calls RICE the most popular prioritization framework he has seen. His example is a task app choosing between reminders, project templates and advanced reporting. Reminders win with 800 x 3 x 0.9 / 2: that is 2,400, then 2,160, then 1,080. The arithmetic is easy; the work is in the four numbers.

## The four inputs

RICE comes from Intercom's Sean McBride, who described it on Intercom's blog (the version live today is dated January 2018). He built it against pet ideas beating broader ones, effort being discounted and confidence ignored.

- **Reach**: people or events per time period, such as customers per quarter.
- **Impact**: the effect on each person reached, on a fixed scale: 3 massive, 2 high, 1 medium, 0.5 low, 0.25 minimal.
- **Confidence**: 100% high, 80% medium, 50% low. Below 50% is a moonshot.
- **Effort**: person-months, whole numbers, or 0.5 for very small work.

Score = Reach x Impact x Confidence / Effort. The video uses 90% confidence, which is not on McBride's scale, and effort in hours, days or weeks. The coarse scales exist on purpose: they stop arguments over 85% versus 90%.

The instructor adds a point many write-ups skip: impact is measured against the company's current goal. If the goal is sales, a feature that lifts ratings but not sales has low impact.

## Roost's season, scored

Roost's season goal is request-to-booking, from 50% to 60%. About 26,000 bookings from June to August means about 52,000 requests. Reach counts the requests whose outcome a feature could change:

| Feature                          | Reach  | Impact | Conf. | Effort | Score |
| -------------------------------- | ------ | ------ | ----- | ------ | ----- |
| Weekly availability confirmation | 6,760  | 2      | 80%   | 2      | 5,408 |
| Map pin fix                      | 5,200  | 0.5    | 100%  | 0.5    | 5,200 |
| "Ask a senior" reviews           | 15,000 | 1      | 50%   | 3      | 2,500 |
| Owner chat                       | 20,800 | 0.5    | 50%   | 3      | 1,733 |
| Instalments                      | 6,000  | 2      | 50%   | 4      | 1,500 |

Where the inputs come from:

```text
Availability  26 of 200 "available" listings full in May: 13%
              13% of 52,000 = 6,760; 6,760 x 2 x 0.8 = 10,816
              10,816 / 2 = 5,408
Pin fix       owner-app listings since April: 10% of requests
              5,200 x 0.5 x 1.0 = 2,600; 2,600 / 0.5 = 5,200
Ask a senior  first-year requests with a same-college reviewer
              15,000 x 1 x 0.5 = 7,500; 7,500 / 3 = 2,500
Owner chat    owner replies after more than a day: 40%
              20,800 x 0.5 x 0.5 = 5,200; 5,200 / 3 = 1,733
Instalments   3 of 14 interviewees want to split the payment
              3/14 of 28,000 families at the deposit = 6,000
              6,000 x 2 x 0.5 = 6,000; 6,000 / 4 = 1,500
```

## Where it breaks

The top two are 4% apart, which is a tie: every input is a guess, and the score multiplies their errors. Discuss the top few rather than ranking by the last digit.

Now change the goal. A wrong pin makes a listing look closer, so it attracts requests and bookings; the damage comes later, as "farther than shown" cancellations, which rose from about 40 a month to 110 in July. If the season goal were fewer cancellations, impact would be 2 and the same data would score 5,200 x 2 x 1.0 / 0.5 = 20,800, far ahead. Impact means nothing without a named goal.

McBride says the score is not a hard and fast rule: dependencies and table-stakes features can justify going against it. The score makes that trade-off visible.

## Predict, then verify

The founder says instalments deserve impact 3, massive, and should come first. Does rescoring put them on top? If not, what would?

Answer: No. At impact 3 they score 6,000 x 3 x 0.5 / 4 = 2,250, still fourth. Even at full confidence they reach 6,000 x 3 x 1.0 / 4 = 4,500, below both leaders. At impact 3 and 50% confidence they need 5,408 x 4 / 1.5 = about 14,400 families, 2.4 times the reach: evidence that far more families want to split the payment than 3 in 14 interviews suggest. If the founder still wants it first, that is a legitimate call, recorded as an override with its reason. The principle: RICE turns a disagreement about priorities into a disagreement about inputs, which data can settle.
