Score Roost's student channels against the ₹903 a student is worth, from the lifetime value lesson:

```text
Channel               CAC     LTV:CAC
Coaching partners     ₹300    903 / 300 = 3.0
Student ambassadors   ₹500    903 / 500 = 1.8
Paid Instagram        ₹900    903 / 900 = 1.0
Blended               ₹286    903 / 286 = 3.2
```

The blended ratio passes the most quoted test in unit economics. Coaching partners only just reach it, and the other two channels fail it.

## Where 3 to 1 comes from

The LTV:CAC ratio divides what a customer is worth by what it cost to win them. The line at 3 is usually traced to David Skok's guide "SaaS Metrics 2.0", online since early 2013: the best SaaS businesses he saw had a ratio above 3, sometimes as high as 7 or 8, and he paired it with recovering CAC in under 12 months. It is an observation, not a derivation.

Why 3 is safer than 1: LTV counts margin, and margin still has to pay for engineering, offices and management, so a ratio of 1 recovers acquisition and nothing else. LTV is also a forecast that assumes churn stays put. A ratio of 3 leaves room for overheads and for the forecast being wrong.

The payback lesson's SaaS product shows the two lines working together: $40 a month of margin at 2.5% churn is an LTV of 40 / 0.025 = $1,600, and a $500 CAC gives 1,600 / 500 = 3.2. It passes the ratio and just misses the payback line at 12.5 months: viable, but slow to fund.

A very high ratio is not automatically good news. Once a business clears his lines, Skok's advice is to "hit the accelerator pedal". A company sitting at 8 to 1 with a five-month payback is usually winning fewer customers than it profitably could, and leaving the rest to a competitor.

## Net revenue retention

Subscription companies add a second ratio: how much of last year's revenue the same customers still bring. Net revenue retention (NRR) follows one cohort's monthly recurring revenue (MRR):

```text
NRR = (starting MRR + expansion - contraction - churned MRR) / starting MRR
```

A hypothetical SaaS company's existing customers start the year at $100,000 of MRR. Over twelve months they upgrade by $15,000, downgrade by $3,000, and cancel $5,000:

```text
NRR = (100,000 + 15,000 - 3,000 - 5,000) / 100,000 = 107%
GRR = (100,000 - 3,000 - 5,000) / 100,000          = 92%
```

Gross revenue retention (GRR) leaves out expansion, so it cannot pass 100%. Above 100% NRR, the base grows even in a year when sales wins nobody. Skok calls expansion that outweighs losses negative churn, "the ultimate solution to the churn problem". It also breaks the simple LTV formula: with net churn at or below zero, margin divided by churn has no sensible answer, so Skok values such customers with discounted cash flow instead.

NRR belongs to subscriptions. Roost's commission is per transaction, so it has none, but Featured listings do. The churn math lesson showed 3% monthly churn keeps 69.4% of Featured owners after a year. Unless staying owners spend more, say by featuring a second property, Featured's NRR sits near 69%, and sales must replace almost a third of the base every year to stand still.

## Predict, then verify

Another hypothetical SaaS company earns $40 a month per account at 2.5% churn, an LTV of $1,600. It spends $200 to win each account: a ratio of 8 and a payback of 5 months. The CFO wants to hold marketing flat and show a profit. The growth lead has tested a new channel that brings 300 accounts a month at $450 each, though its early accounts churn at 3% a month. Fund it?

Answer: Yes, at the tested scale. The channel's accounts are worth $40 / 0.03 = $1,333, so its own ratio is 1,333 / 450, about 3.0, and its payback is 450 / 40 = 11.25 months, inside both of Skok's lines. The blended ratio of 8 was a sign of underinvestment, not of health: the company was turning down customers it could win at a profit. Judge the channel on its own numbers, not the blend, and stop scaling when its CAC or its churn rises. The principle: 3 to 1 and 12 months are the bar for the marginal customer, and a ratio far above them is growth left unbought.
