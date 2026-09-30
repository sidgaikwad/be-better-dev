In the first two weeks of June, 10,000 students sign up for Roost, and 1,000 of them book a room within 30 days. The pirate metrics lesson defined Roost's activation as shortlisting two or more verified rooms in week one, a hypothesis to test against who actually books. This lesson runs that test.

## What activation means

Activation is the earliest action, with a threshold and a time window, that separates users who go on to get lasting value from those who do not. The aha moment is the same thing from the user's side: the point where the product's value stops being a promise. It gives onboarding a target in the first days, long before retention can be measured.

Two well-known examples:

- **Facebook.** Chamath Palihapitiya, who ran Facebook's growth team, said in a 2012 talk that its biggest realization was to get each new user to 7 friends in 10 days; by his account, the team focused on little else.
- **Slack.** Stewart Butterfield told First Round Review in 2015 that, judging by which companies stuck, a team that had exchanged 2,000 messages had really tried Slack, and 93% of those teams were still using it.

Each counts the core action, per person or per team. Neither company published the analysis behind its number, so treat both as their leaders' accounts, not as benchmarks.

## Finding Roost's event

For Roost, "comes back" is the wrong outcome: a student who books in week two and never opens the app again has succeeded. The outcome is a booking within 30 days. Compare booking rates for students who did each candidate action in their first week and those who did not:

| First 7 days                | Did it | Booked | Did not | Booked |
| --------------------------- | ------ | ------ | ------- | ------ |
| Shortlisted 2 or more rooms | 6,000  | 14%    | 4,000   | 4%     |
| Messaged an owner           | 2,000  | 30%    | 8,000   | 5%     |
| Scheduled a visit           | 1,000  | 55%    | 9,000   | 5%     |

Each row accounts for all 1,000 bookings. For messaging, 2,000 at 30% is 600 and 8,000 at 5% is 400. Now weigh lift, coverage, and whether the product can move it:

1. Shortlisting is common but weak: 14% against 4% is a 3.5x lift, and it mostly signals browsing. The pirate metrics hypothesis holds, barely.
2. Scheduling a visit has the largest lift, 11x, but it sits one step before the booking. An event that close restates the outcome and leaves onboarding little to do.
3. Messaging an owner has a 6x lift, happens early, and covers 600 of the 1,000 eventual bookers. The product can make it easier with a one-tap "Is this room still available?" button. It becomes the new working definition.

## A correlation is a hypothesis

The table cannot show that messaging causes bookings. Students who message early may be the ones with an admission letter and a move-in date, who would book anyway. Benn Stancil of Mode argued in 2015 that numbers like Facebook's tend to be round figures picked from a range, more useful as a rallying cry than as a measured threshold.

The video advises A/B testing onboarding flows against the activation rate. Keep the test but change its judge: randomize the one-tap button and count bookings, not messages.

## Predict, then verify

The test runs on 10,000 June signups, split evenly. Control: 20% message an owner and 10% book. With the button: 36% message and 11% book. The designer proposes auto-sending an inquiry to three owners whenever a student shortlists a room, which would push messaging past 80%. Ship the button? Build the auto-send?

Answer: ship the button and reject the auto-send. In each group of 5,000, the button moved 800 extra students into messaging (1,000 to 1,800) and produced 50 extra bookings (500 to 550). That is a 6% booking rate among the students it nudged, barely above the 5% of students who never message, against 30% for students who message on their own. Messaging is mostly a marker of intent and only slightly a cause. Still, 50 bookings are ₹36,000 in commission per 5,000 signups, so the button ships. The auto-send would inflate the activation number with no intent behind it and bury owners under inquiries they cannot tell from real ones, damaging the side that has to answer. An activation event is a proxy for the outcome: the moment you push it directly, judge the change by the outcome.
