In the video's chapter on valuable features, the course's instructor describes a shopping page where users move the cursor around but rarely reach the add-to-cart button, perhaps because it sits somewhere shoppers do not expect. His hypothesis: move the button and see whether the add-to-cart rate rises. The instinct is right; the obvious way to check it is not.

## Why before and after lies

Suppose Roost moves its "Request to book" button above the listing photos on 20 May, and in June booking requests jump 60%. The button did not do that. June is when first-years hunt for rooms, so nearly everything rises in June. A before-and-after comparison measures the button plus the season plus any marketing push, and cannot pull them apart.

A **controlled experiment**, or A/B test, pulls them apart by running both versions at the same time. Each arriving student is assigned at random to **control** (the current page) or **treatment** (the moved button), and both groups live through the same season, ads and outages. Randomization makes the groups alike in everything, measured or not, except the change, so a gap between them bigger than chance can only come from the change. That is what lets a test claim cause instead of correlation.

## The test plan

Write the plan before the code ships. Here is Roost's version of the instructor's idea:

```text
Hypothesis:  students miss the request button below the photos;
             moving it above them raises booking requests
Unit:        student account, hashed into 100 buckets
Split:       buckets 0-49 control, 50-99 treatment
OEC:         booking requests per searching student
Guardrails:  request cancellations, app crash rate
Duration:    4 full weeks, fixed now
Decision:    ship if the OEC rises with p < 0.05
             and no guardrail breaks
```

Three lines carry the weight. The **unit** is the student, not the visit, so each student sees one page all month instead of both. The **OEC**, Ron Kohavi's overall evaluation criterion, is the one metric the decision rests on, agreed before any data arrives. Kohavi's advice is to agree on it early and to choose one that predicts long-term value rather than a click, which is why the OEC here is requests, not taps. The **duration** is fixed in advance, because a p-value assumes the sample size was chosen before the data arrived.

## Reading the result

An average month brings 40,000 searching students, so 20,000 per arm. Control sends 4,000 booking requests (20.0%); treatment sends 4,200 (21.0%). Is one point real?

```text
pooled rate    = 8,200 / 40,000 = 0.205
standard error = sqrt(0.205 x 0.795 x (1/20,000 + 1/20,000))
               = sqrt(0.162975 x 0.0001) = 0.00404
z              = (0.210 - 0.200) / 0.00404 = 2.48
two-sided p    = 0.013
```

The **p-value** answers one narrow question: if the button made no difference, how often would random assignment alone produce a gap at least this large? About 1.3% of the time. That is below the 0.05 threshold in the plan, so the result is **statistically significant**. The threshold also means that when a change truly does nothing, about 1 test in 20 still comes out significant.

What it does not say matters as much. It is not a 98.7% chance the button works; that needs a prior belief about how often changes like this work, and at mature companies most do not. It is not the size of the effect: the estimate is one point, with a 95% confidence interval of roughly 0.2 to 1.8 points. And it is not importance, which is a question of what a point is worth in bookings.

## Predict, then verify

A designer runs the instructor's version of this test and measures button taps. Treatment raises taps on "Request to book" by 15% (p = 0.001). Booking requests: control 4,000, treatment 4,040 out of 20,000 each, which works out to p = 0.62. Paid bookings are flat. The designer wants to report a 15% win. Do you?

Answer: no. The OEC in the plan is booking requests and it moved 1% with p = 0.62, which is noise. More taps with the same requests means students tapped, reached the request form, and left: the button got easier to hit, but the decision did not get easier to make. Record the test as flat and follow the real clue: 15% more students now open a form they abandon. The principle: the metric named before the test decides it, and a proxy that moves on its own is a lead to investigate, not a result.
