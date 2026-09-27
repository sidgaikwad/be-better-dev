Roost's first spec, written before the company had a PM, listed 14 features for three cities: search with filters and maps, reviews, chat, roommate matching, instalments, an owner dashboard, payments, refunds, and accounts with password reset. The engineers estimated nine months. Bookings come once a year, from June to August, so nine months meant learning nothing until the second season.

## One job, one group, one place

The video's MVP module says to find the single most important feature that solves the problem: not five, one. Its example is Uber: in the video's telling, the first version did not split fares, rate drivers or schedule rides. It asked only whether you could open an app, book a ride from A to B, and get there. The record agrees. Travis Kalanick's founding post on Uber's site describes a test run in New York in January 2010 with three cars, then a San Francisco launch on May 31, 2010 that began with the founders inviting friends.

Airbnb started narrower still. In late October 2007 a design conference, the ICSID/IDSA World Congress, came to San Francisco and hotel rooms were scarce. Brian Chesky and Joe Gebbia put three air mattresses in their apartment, charged $80 each, and hosted three guests: a designer from Boston, a father of five from Utah, and Amol Surve, a recent design graduate from Mumbai. One event, one apartment, one kind of guest, and the founders as hosts. It tested whether strangers would pay to sleep in a stranger's home.

"One feature" is shorthand. Scope the MVP to one job for one group of users, and cut everything that serves another job or another group. For Roost's first season:

```text
Job:    A first-year student from another city finds a
        verified room near campus before she arrives.
Group:  First-years at one Pune campus.
Place:  60 verified rooms within 3 km of that campus.
```

| Step or feature          | First season | Instead                                |
| ------------------------ | ------------ | -------------------------------------- |
| Browse verified rooms    | Built        | A plain list, no filters               |
| Verification             | By hand      | Operations visits each room            |
| Booking and payment      | By hand      | UPI to Roost, receipt on WhatsApp      |
| Refunds, password reset  | Not built    | Handled by phone                       |
| Reviews, chat, roommates | Not built    | Other jobs, or covered by verification |

The video says the same about the back office: an MVP needs no billing system, password reset or refund automation. Handle those by hand for now.

## Cut jobs, not steps

The job map lesson broke a job into steps. An MVP can drop whole jobs, but not a step of the one job it serves. A student who finds a room but cannot secure it has not been served, and the test measures nothing. Steps can be manual. They cannot be missing.

One step is never cut: the one that makes you different. Drop verification to save the visits, and Roost's first season would test a listings page, which is what the college WhatsApp groups already are. Keep the differentiator, even by hand, because it is the hypothesis.

Paul Graham made the same case in "Do Things That Don't Scale" (2013): do by hand early what software will do later, and start in a market small enough to win, the way Facebook began with only Harvard students. Manual work has a ceiling, though, and volume finds it.

## Predict, then verify

It is April of Roost's first year. Operations spends about 40 minutes on each booking: calls with the owner, confirming the UPI payment, the receipt, a call on move-in day. The forecast is 150 bookings from June to August. An engineer offers to automate payments and receipts in five weeks, which moves launch from May 1 to June 5. Do you wait?

Answer: Launch on May 1, by hand. The manual load is 150 × 40 = 6,000 minutes, or 100 hours across about 13 weeks: under eight hours a week, one person's day. Waiting gives up May, when first-years start searching, in a business with one season a year. The manual work also shows where payments go wrong, which improves the eventual automation. At today's peak of about 2,000 bookings a week, 40 minutes each would be over 1,300 hours a week, roughly 33 full-time people, which is why today's Roost automates it. The principle: automate a step when volume makes doing it by hand cost more than building it, not before the job is proven.
