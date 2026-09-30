The video's fitness tracker passes business analysis in one sentence: break-even at 50,000 units, 100,000 forecast for the first year, so "probably 6 months" to break even. Two questions go unasked. Where does 50,000 come from? And what would have to be wrong for the tracker to lose money?

## The business case

Kotler describes business analysis as a review of projected sales, costs and profit, to see whether they meet the company's objectives. At its core is one ratio: break-even units equal fixed costs divided by contribution per unit, where contribution is what each sale leaves after the costs that come with it. The video gives no costs, so here is a plausible set for its hypothetical tracker:

```text
Retail price                                ₹4,000
Retailers and marketplaces keep 25%         ₹1,000
Net price to the company                    ₹3,000
Components and assembly                     ₹1,500
Packaging, shipping and returns               ₹300
Contribution per unit       3,000 - 1,800 = ₹1,200

Fixed costs, first year
Design, firmware and app               ₹30,000,000
Tooling and certification              ₹10,000,000
Launch marketing                       ₹20,000,000
Total                                  ₹60,000,000

Break-even      ₹60,000,000 / ₹1,200 = 50,000 units
Profit at 100,000 units
  100,000 x ₹1,200 - ₹60,000,000 = ₹60,000,000
```

Two common mistakes hide in the first lines. Using the ₹4,000 retail price instead of the ₹3,000 the company receives inflates contribution to ₹2,200 and cuts break-even to 27,273 units. Leaving launch marketing out of fixed costs makes almost anything look profitable.

The forecast needs a check of its own. If the company's research counts 2 million buyers a year for fitness bands at this price in its channels, 100,000 units is a 5% share in year one for a new brand. That is a claim to defend, not a given.

## Sensitivity

Change one assumption at a time:

| Change              | Contribution | Break-even | Profit at 100,000 |
| ------------------- | ------------ | ---------- | ----------------- |
| None                | ₹1,200       | 50,000     | ₹60,000,000       |
| Retail price ₹3,500 | ₹825         | 72,727     | ₹22,500,000       |
| Components ₹1,800   | ₹900         | 66,667     | ₹30,000,000       |
| Sales of 60,000     | ₹1,200       | 50,000     | ₹12,000,000       |

A 12.5% price cut removes 62.5% of the profit, because contribution is a small difference between two large numbers: the net price falls ₹375, which is 31% of the ₹1,200 contribution. Each change alone still leaves a profit. Together they may not: a rival's price war brings a lower price and fewer units at once, and at ₹3,500 with 70,000 units the tracker earns 70,000 x ₹825 = ₹57,750,000 against ₹60,000,000 of fixed costs, a loss. Test the assumptions that move together.

## Units are not months

The instructor's six months divides 100,000 evenly across the year: 8,333 a month, 50,000 by month six. Hardware sells in bursts; the example's own launch sold 10,000 units in its first month. And almost all of the ₹60,000,000 is spent before the first sale, so cash is lowest on launch day and recovers only as fast as sales come in. Break-even units says whether the product can pay for itself. When it does depends on the sales curve, which the business case should draw month by month.

## Predict, then verify

Roost's move-in check sells for ₹999. A verification visit costs about ₹600 and payment fees and support ₹49, so contribution is ₹350. The report tool, verifier training and marketing cost ₹1,400,000 in the first year. The Pune test suggests 9% of 48,000 bookings, 4,320 checks. But 26,000 of those bookings land from June to August, when operations is fully booked and temporary verifiers cost ₹800 a visit. Do you approve the build?

Answer: Not as designed. On paper, break-even is ₹1,400,000 / ₹350 = 4,000 checks, just under the 4,320 forecast. Counting the peak: 9% of 26,000 is 2,340 checks at ₹999 - ₹849 = ₹150 each, ₹351,000; the other 1,980 earn ₹350 each, ₹693,000. That is ₹1,044,000 of contribution against ₹1,400,000 of fixed costs, a loss of ₹356,000. The assumption that flips the answer is the June visit cost, not demand. Take the video-call version from the screening lesson's Pugh matrix to a concept test: if a call costs ₹150 of verifier time, contribution rises to ₹800, break-even falls to 1,750 checks, and the forecast clears it more than twice over. The principle: find the assumption that changes the sign of the answer, and test that one before building.
