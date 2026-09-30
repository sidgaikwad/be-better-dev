On 1 May, Roost shipped a new onboarding for property owners: a call from operations on day one and a prompt to answer the first student inquiry within an hour. In mid-July the founder opens the dashboard. Thirty-day retention of new owners was 34% before the change and is 39% now. Five points for a quarter's work: was it worth it?

The figure is correct and answers the wrong question.

## Building the table

A cohort is a group of users who started in the same period. For each cohort you record the share still active at fixed ages:

```text
D(n) retention = cohort members active on day n / cohort size
```

Settle two definitions first. "Active" means the action that carries value, not an app open: for an owner, answering an inquiry or updating availability. And say whether the number is bounded (active on day n itself) or unbounded (active on day n or any later day). Unbounded never reads lower, so a chart that mixes the two shows a trend that is not there.

Roost's owner table on 15 July, grouped by the month each owner listed:

| Listed in | Owners | D1  | D7  | D30     |
| --------- | ------ | --- | --- | ------- |
| February  | 100    | 70% | 45% | 34%     |
| March     | 120    | 68% | 44% | 35%     |
| April     | 150    | 71% | 46% | 34%     |
| May       | 125    | 76% | 61% | 52%     |
| June      | 200    | 75% | 60% | not yet |

June has no D30 yet: a cell fills only when the whole cohort reaches that age, which is why real cohort tables are triangles.

## Reading it two ways

Read across a row and you see one cohort's life, with each checkpoint asking its own question. D1: did the first day work? D7: did the first week deliver value, meaning an inquiry arrived and got an answer? D30: is this owner in the core that stays?

Read down a column and you compare cohorts at the same age. This is the only fair test of whether the product is improving, because every number in the column had the same time to decay. The D7 column runs 45, 44, 46, then jumps to 61 and 60. The step lands in May, when the onboarding shipped, and holds for June.

The founder's 39% pools every owner who listed from February to May:

```text
D30 owners:   34 + 42 + 51 + 65 = 192
All owners:   100 + 120 + 150 + 125 = 495
Pooled D30:   192 / 495 = 38.8%
Before May:   (34 + 42 + 51) / (100 + 120 + 150) = 127 / 370 = 34.3%
```

The May cohort moved from about 34% to 52%, an 18-point gain. Pooled with three older cohorts, it shows up as 4.5 points. A blended number is dominated by whoever is oldest and largest, so it moves slowly in either direction. The course's instructor defines retention as returning users over total users, a pooled number of this kind; prefer the cohort version.

## Decay, plateau, and the rare smile

As the product-market fit lesson showed, the first thing to check in a row is whether the tail settles on a plateau above zero, a core that found lasting value, or keeps sliding.

Rarely, a curve smiles: retention at a later age beats an earlier one, because lapsed users return once the product becomes more valuable, usually as a network fills in. Before crediting one to the product, check the calendar: a seasonal business lifts every cohort at once.

## Predict, then verify

In mid-August the table gains a D60 column. April's cohort reads 34% at D30 and 41% at D60. The designer calls it a smile and credits the referral badge that launched in June. What do you check before agreeing?

Answer: check what the older cohorts did in the same calendar weeks. April's D60 falls in June, when student inquiries flood in and every owner has a reason to open the app. If the February and March cohorts, at much older ages, also rose in June, the lift is the season, not the badge. Comparing at the same age tells you about the product; a rise in every cohort in the same weeks tells you about the season. Credit the badge only if April rose clearly more than they did, or better, test it against a control group.
