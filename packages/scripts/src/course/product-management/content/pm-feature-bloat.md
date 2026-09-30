Two seasons ago Roost shipped Make an Offer: a button on each listing that lets a student propose a lower rent. It demoed well. Today 1,200 students a month use it, 2% of 60,000. Owners reply to 22% of offers, and about 40 bookings a month follow an accepted one, 1% of bookings. Support gets 90 tickets a month from students who believed an offer had been accepted, and 30 of those become disputes at about ₹1,000 each to resolve. The feature breaks whenever payments change, and keeping it working takes about 15% of one engineer. Nobody has proposed removing it, because removing things is nobody's job.

## What a feature costs after launch

A feature's price is not its build cost. It keeps charging:

- **Maintenance:** every change nearby must keep it working, and it must be tested every release.
- **Interface weight:** it takes space and attention on a screen that has other jobs.
- **Support:** confused users write in, and someone answers.
- **Explanation:** onboarding, help pages and sales demos must cover it.
- **Constraint:** future designs must fit around it.

Most products carry a lot of this. Pendo, which sells product analytics, reported in 2019 that across 615 of its customers' products, about 80% of features were rarely or never used. Treat that as indicative, since the vendor sells the tool that measures it. The course's instructor puts it plainly: a good PM deletes features that are not being used, finds them through analytics, and spends the freed capacity on features with a positive effect.

## The feature audit

Des Traynor of Intercom described a simple audit: plot each feature by adoption (what share of users use it at all) and frequency (how often they use it). Roost's version, from one month of events:

| Feature         | Adoption | Frequency                     |
| --------------- | -------- | ----------------------------- |
| Search          | 94%      | Several times a week          |
| Saved shortlist | 41%      | Weekly                        |
| Chat with owner | 33%      | Weekly, during a search       |
| Compare view    | 4%       | Once or twice, before booking |
| Make an Offer   | 2%       | Once                          |

Traynor's point is that a low-adoption feature has four possible futures, and only one is removal:

1. **Kill it.**
2. **Increase adoption:** users who would value it do not know it exists.
3. **Increase frequency:** it works but is used too rarely to matter.
4. **Improve it deliberately:** the idea is right and the execution is not.

Adoption tells you where to look. The decision comes from what the feature does for outcomes and whether it fits the strategy. Make an Offer fails both. Its bookings are mostly students who would have booked through chat, its disputes cost ₹30,000 a month, and it cuts against Roost's promise that the listed rent is the rent. Kill it.

## Removing one without a revolt

The sunsetting lesson ran a retirement on the users' calendar. A button inside a product people keep using can go faster, with the same care:

1. **Measure before announcing.** Hide it from 20% of students for four weeks outside the season and compare their bookings with everyone else's. If bookings hold, the evidence is on your side.
2. **Tell the people who used it.** Message the 1,200 students and the owners who replied to offers: what is going, when, why, and what to use instead (chat with the owner).
3. **Delete the code, not just the button.** A hidden feature still carries its maintenance and constraint costs.
4. **Expect loud replies from a small group.** Count them against the 98% who never touched it.

## Predict, then verify

Compare view is used by 4% of students, 2,400 a month, and those students book at 25% (600 bookings), against 5.9% for everyone else (3,400 of 57,600). An engineer notes it breaks with every listing change, about three engineer-days a month, and proposes removing it on the audit's numbers. Do you?

Answer: No, not on adoption alone. The 25% probably overstates what the feature causes, since serious students compare before they book. But the stakes are lopsided: 600 bookings at ₹720 commission is ₹432,000 a month, so even if only a tenth of those bookings depend on it, ₹43,200 a month outweighs three engineer-days. Run the holdout: hide it for a share of students off-season and measure bookings. If they hold, remove it; if they fall, invest to make it cheaper to maintain. The principle: adoption finds the candidates for removal, but outcomes and carrying cost decide which ones go.
