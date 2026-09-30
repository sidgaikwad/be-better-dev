The video's instructor describes a funnel where 50% of users drop off between step one and step two, and 70% drop off between step two and step three. Work it from 1,000 people: 500 reach step two, and 30% of those, 150, reach step three. The overall conversion is 15%. Two drop-offs that each sound survivable have lost 85% of the people who started.

## Step conversion and overall conversion

A funnel is an ordered list of events. A user counts at a step only if they did every earlier step first, within a time limit called the conversion window. Two rates come out of it:

- **Step conversion**: users at this step divided by users at the step before. It tells you where people leave.
- **Overall conversion**: users at the last step divided by users at the first. It tells you whether the leaving matters.

Overall conversion is the product of the step rates: 0.5 x 0.3 = 0.15. When someone quotes a drop-off, turn it into the fraction who continue before multiplying: a "70% drop" means 0.3, not 0.7.

Here is Roost's path from search to booking in an average month, counting unique students with a 30-day window:

```text
step                          students   step rate   overall
1. searched                     40,000                100%
2. opened a listing             32,000      80%        80%
3. opened the request form      12,800      40%        32%
4. sent a request                8,000      62.5%      20%
5. booked and paid               4,000      50%        10%
check: 0.80 x 0.40 x 0.625 x 0.50 = 0.10
```

The biggest loss is at step 3: 19,200 students viewed a listing and never started a request. That is mostly browsing, since a student looks at many rooms and requests one. Step 4 loses fewer, 4,800, but they had chosen a room and started typing. Losing intent that late usually means the product got in the way. As the pirate metrics lesson warned about the biggest percentage drop, the biggest absolute drop is not automatically the target either.

## Three definitions that change the number

Three choices made when building a funnel, often silently, change its rates:

1. **Users or events.** Amplitude counts unique users by default. Count events, and a student who opens the form four times inflates step 3 and deflates step 4.
2. **Order.** "In this order" allows other events between steps; "exact order" does not, and punishes a student who rechecks the photos mid-form.
3. **Conversion window.** Amplitude's default is one day. Roost's median student takes 9 days from first search to booking. Suppose only 1 booking in 6 happens within a day of the first search: a one-day window would then report 1.7% where the true figure is 10%, and the team would chase a leak that does not exist.

Put the choices in the funnel's title, such as "unique students, in order, 30 days".

## The funnel says where, not why

The instructor's next move is the right one: once you know where people leave, look closer. His example is an add-to-cart page where cursor movement shows people circling and never reaching a button placed somewhere unexpected. That evidence comes from watching behavior, not counting it.

For Roost's step 4, the funnel only says 4,800 students left the form. Twenty session recordings and ten phone calls take two days. Suppose they show students stalling at a required "parent's phone number" field, because they have not yet told their parents which room they chose. A designer can act on that, and no event count would have named it. Quantitative data finds the step; qualitative evidence finds the reason.

## Predict, then verify

The designer adds a "Compare rooms" screen between viewing a listing and opening the form. A month later, per 32,000 listing viewers: 45% open Compare (14,400), 80% of those open the form (11,520), and 65% of those send a request (7,488). Every step rate beats the old 40% and 62.5%, so the designer calls it a win. Is it?

Answer: no. Before the change, 32,000 viewers produced 8,000 requests, 25%. After it, they produced 7,488, 23.4%: 512 fewer requests a month, about 256 fewer bookings at the 50% booking rate. A new step adds another factor below 1, so every step can look healthy while the end-to-end rate falls. Judge a funnel change by overall conversion between two fixed events that existed before and after the change, never by the step rates alone.
