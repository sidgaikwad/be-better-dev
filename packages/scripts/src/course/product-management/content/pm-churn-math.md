Roost sells Featured listings: owners pay monthly to rank at the top of search near a campus. 300 owners pay, and 3% of them cancel each month. The sales lead's slide says Roost loses 36% of Featured owners a year. Later, the planning deck forecasts next year's base without subtracting anyone. Both are wrong, in opposite directions.

## Churn compounds

Monthly churn applies to whoever is left, not to the starting base. At a monthly churn rate m, each month keeps (1 - m) of the month before, so a year keeps (1 - m) to the power 12:

```text
3% a month:   0.97^12 = 0.694    kept 69.4%, lost 30.6%
5% a month:   0.95^12 = 0.540    kept 54.0%, lost 46.0%
Naive:        3% x 12 = 36%      5% x 12 = 60%
```

Multiplying by 12 overstates the annual loss, by 5.4 points at 3% and by 14 points at 5%, because it keeps charging churn on owners who already left. For 300 owners at 3%, the year runs 300, 291, 282, and down to 300 x 0.694 = 208 by month 12.

The conversion runs backwards too. A competitor reporting 30% annual churn is losing 1 - 0.70^(1/12) = 1 - 0.9707 = 2.9% a month, not the 2.5% you get by dividing by 12.

The average customer stays about 1 / m months: 33 months at 3%, 20 at 5%. Lifetime value is built on that lifetime, which is why halving churn roughly doubles what each customer is worth.

## Customers or rupees

Featured now has two prices, one for a small PG and one for a large hostel: ₹2,000 and ₹6,000 a month. Roost has 240 small and 60 large subscribers:

```text
Small:   240 x 2,000 = 480,000
Large:    60 x 6,000 = 360,000
Monthly revenue      = 840,000
```

Nine owners cancelling is 3% customer churn either way. The cost depends on which nine:

```text
9 small owners leave:  9 x 2,000 = 18,000    18,000 / 840,000 = 2.1% revenue churn
9 large owners leave:  9 x 6,000 = 54,000    54,000 / 840,000 = 6.4% revenue churn
```

A large hostel that downgrades to the small price is revenue churn with no customer churn at all. Report both. Customer churn counts the owners the product is failing; revenue churn is what the business feels. When revenue churn runs above customer churn, your biggest accounts are the ones leaving, and they are the first segment to call.

## The leaky bucket

A base holds steady only when new customers replace departing ones. The stand-still number is base times churn: 300 x 3% = 9 new Featured owners a month to stay at 300.

If you add N customers a month and lose a share m of the base, the base settles where the two flows match, N = base x m, which puts it at N / m. Adding 15 a month at 3% churn, Featured heads toward 15 / 0.03 = 500. At 5% churn the same sales effort tops out at 15 / 0.05 = 300. Churn sets the ceiling that acquisition can reach.

Seasonality needs care: owners buy Featured before the June rush and some cancel in September, so compare September with last September, not with August.

## Predict, then verify

Featured churn has crept up to 6% a month. Sales signs 15 new owners a month and forecasts 300 + 15 x 12 = 480 by next June. To reach 600, sales asks to double the team and sign 30 a month. Owners who cancel say Featured brings them nothing outside the season. Where does the base go on the current plan, and which do you fund?

Answer: on the current plan the base shrinks. Roost loses 300 x 6% = 18 owners a month and adds 15, so the first month ends at 297 and the base drifts toward 15 / 0.06 = 250. Doubling sales lifts the ceiling to 30 / 0.06 = 500, still short of 600, and doubles a cost that recurs every month. Cutting churn back to 3% at the current 15 a month reaches the same 500 ceiling, and every owner then stays about 33 months instead of 17. Fund the churn fix first, for example a seasonal plan owners can pause from September to March, then scale sales into a bucket that holds. The principle: a forecast that ignores churn can be wrong in direction, not just size, and the ceiling is monthly acquisition divided by churn.
