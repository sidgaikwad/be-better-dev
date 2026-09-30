It is the second Monday of September. The weekly dashboard says Roost made 1,100 bookings last week, down from 2,000 the week before: a 45% drop. The CEO's message arrives before standup: "What broke?" This is the most common analytics question a PM gets, and a wrong first move wastes days.

The root cause lesson found the map pin by listing hypotheses across every facet and rejecting them one at a time, which is the video instructor's "question everything" advice. A metric drop needs the same discipline plus an order: run the cheap checks that can end the investigation first.

## The order of checks

1. **Is the data real?** Compare the dashboard with an independent source of truth. For bookings, that is the payments ledger. Check for tracking changes: a renamed event or an app version that stopped firing one looks exactly like a collapse. Twyman's law, from the test pitfalls lesson, applies: a dramatic number is usually wrong.
2. **Is it a drop against the right baseline?** Compare with the same period last year, not last week, whenever the business is seasonal.
3. **What did we change?** Releases, tracking, prices, emails, operations. Read the log for the days just before the drop.
4. **What changed outside?** Competitors, partner outages (payment gateways, maps), holidays, exam and admission calendars.
5. **Where is it?** Segment by platform, app version, city and funnel step until the drop sits in one place.
6. **Why?** Form one hypothesis that explains the segment, test it, and confirm the fix moves that segment back.

## Roost's September, worked

Step 1: the ledger shows 1,100 paid bookings too. The drop is real.

Step 2 changes the size of the problem. Most bookings land between June and August, so the first week of September always falls. Last year the last week of August had 1,600 bookings and the first week of September 1,040, a 35% fall. Applying the same ratio:

```text
expected this week = 2,000 x (1,040 / 1,600) = 2,000 x 0.65 = 1,300
actual this week   = 1,100
shortfall          = 200, or 15% below expected
```

Of the 900 lost bookings, 700 are the calendar. The problem is 200 bookings, not 900. Requests came in at 2,600, exactly the 1,300 expected bookings divided by the usual 50% booking rate, so the leak sits between request and payment.

Steps 3 and 4: the release log shows Android version 4.2 on 2 September, with a new payment page. Nothing else shipped. No competitor launched, and the payment gateway reports no incidents.

Step 5 localizes it, using each segment's requests and the usual 50% rate:

| Segment     | Requests | Expected bookings | Actual |
| ----------- | -------- | ----------------- | ------ |
| iOS and web | 780      | 390               | 390    |
| Android 4.1 | 820      | 410               | 410    |
| Android 4.2 | 1,000    | 500               | 300    |

The whole shortfall sits in one version: 4.2 converts requests at 30%. Step 6: engineers try the new page on the five most common Android phones among Roost's users, and on two of them the UPI payment app never opens. The team halts the rollout and ships 4.2.1 with the old page. Within two days, 4.2.1 converts at 50%, while nothing else moves. The hypothesis is confirmed because the fix moved the broken segment and only that segment.

Without step 2, the team would have hunted a 900-booking disaster, and any fix would have looked like a failure when September stayed low.

## Predict, then verify

Mid-July, Bengaluru's search-to-request rate falls from 20% to 16% for a week, while Pune and Hyderabad hold at 20%. The same week, a rival app launches a TV campaign in Bengaluru, and the CEO wants to answer with a ₹500 discount. Bengaluru searchers that week rose from their usual 5,000 to 7,000. Discount or not?

Answer: no discount, because nothing was lost. Requests went from 5,000 x 20% = 1,000 to 7,000 x 16% = 1,120, so Bengaluru gained 120 requests. If the usual 5,000 still converted at 20%, the 2,000 new searchers converted at 6%, which fits students the rival's advertising sent looking for any hostel app. The rate fell because the denominator grew with low-intent searchers, the same mix effect as the cutting-the-data lesson. Confirm by splitting new from returning searchers, then watch whether the newcomers book over the next few weeks, given the 9-day median. Before reacting to a falling rate, check its numerator and denominator separately.
