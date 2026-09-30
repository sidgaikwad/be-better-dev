On 6 May 2013, Adobe said it would make no more versions of Creative Suite. A year earlier, the Creative Suite 6 Master Collection had an estimated street price of $2,599, paid once. Creative Cloud, its replacement, cost $49.99 a month on an annual plan. Adobe's revenue fell from a record $4.40 billion in fiscal 2012 to $4.06 billion in fiscal 2013, and Adobe expected fiscal 2014 to be flat. By fiscal 2017, revenue was $7.30 billion.

The arithmetic explains the dip. $49.99 × 12 = $599.88 a year, and $2,599 / $49.99 = 52 months before a subscriber has paid what one box buyer paid. A sale that arrived in one payment now arrives over years, so revenue falls even while customers sign up. Adobe was betting subscribers would stay beyond 52 months, and that $49.99 would bring in people who never paid $2,599. The number to watch was not revenue: annualized recurring revenue from creative subscriptions grew from $153 million to $768 million during fiscal 2013.

## What SaaS changes

The video's instructor describes SaaS, software as a service, by contrast with the software CD: you log in through a browser, the vendor runs everything in the cloud, and you never install or update anything. Google Workspace, Zoom, Canva and Slack work this way, billed monthly or yearly. He lists the PM's daily concerns: onboarding, so new users reach value quickly; retention and churn, so they do not cancel; prioritizing a stream of live requests; and deciding what is free and what is paid.

The deeper change is who carries the risk. A box buyer paid up front and bore the risk of disliking the product. A subscriber can leave any month, so the vendor must earn the revenue again every month. That is why onboarding and churn become the PM's job rather than support's.

## MRR, worked

Monthly recurring revenue (MRR) is the monthly value of every active subscription. An annual plan of ₹12,000 counts as ₹1,000 a month; one-time setup fees do not count. Annual recurring revenue (ARR) is MRR × 12.

Take PGDesk, a hypothetical SaaS that PG owners use to track rent and occupancy: Basic at ₹1,000 a month, Pro at ₹2,500. Here is September:

```text
Start MRR     220 Basic × ₹1,000 + 80 Pro × ₹2,500   = ₹420,000
New           25 Basic + 5 Pro = ₹25,000 + ₹12,500    = +₹37,500
Expansion     12 upgrade to Pro: 12 × ₹1,500          = +₹18,000
Contraction   4 downgrade to Basic: 4 × ₹1,500        =  -₹6,000
Churned       18 Basic + 3 Pro = ₹18,000 + ₹7,500     = -₹25,500
Net new MRR   37,500 + 18,000 - 6,000 - 25,500        = +₹24,000
End MRR       219 Basic × ₹1,000 + 90 Pro × ₹2,500    = ₹444,000
ARR           ₹444,000 × 12                          = ₹5,328,000
```

The headline is MRR up ₹24,000, or 5.7%. Now split it. The existing base moved by 18,000 - 6,000 - 25,500 = -₹13,500: without a single new customer, MRR would have fallen.

## Where the pitch overreaches

The video says SaaS lets you serve 10 users or 10,000 on the same infrastructure. The cost of one more customer is low, not zero: hosting, support and especially AI features cost money per use. In Kyle Poyar's 2025 survey of over 240 B2B companies, hybrid pricing, a subscription plus usage charges often tied to AI, rose from 27% to 41% in one year. The free-versus-paid line has a rule too: put the paywall on something that grows as the customer succeeds, such as beds managed, not on the feature that first shows the value.

## Predict, then verify

PGDesk's CEO shows the board "MRR up 5.7%, our best month" and asks for a quarter focused on doubling new sales. The support lead adds that 15 of the 21 accounts that cancelled in September had signed up in the last 90 days and never finished setting up their rooms. Which number should the product team own next quarter?

Answer: The base's movement, -₹13,500, not new MRR. Every month, ₹13,500 of the ₹37,500 that sales brings in, 36%, only refills what the base lost. Most of that loss is a product failure, customers who never reached value, and doubling sign-ups would double the owners who arrive, fail at setup and leave. Sales can own new MRR; the product team should own onboarding until the base stops shrinking. The principle: in a subscription business revenue is re-earned every month, so the PM watches what existing customers do, not only what new ones sign.
