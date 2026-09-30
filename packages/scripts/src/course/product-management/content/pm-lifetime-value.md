The course's instructor works out lifetime value aloud. He imagines a food delivery app (he names Swiggy and calls the numbers hypothetical) whose average customer orders ₹10,000 of food a month, of which the app keeps ₹2,000. Customers, he says, stay five to seven years, so he multiplies by 60 months: ₹120,000. A minute later the same customer is worth ₹500,000 over five years, and he suggests the app could spend ₹50,000 to win and keep one. Neither figure comes from how long customers actually stay.

## Lifetime comes from churn

The churn math lesson showed that at a monthly churn rate m, the average customer stays about 1 / m months. Lifetime value (LTV) is the margin a customer brings each month times that lifetime:

```text
LTV = margin per customer per month / monthly churn
```

David Skok, the venture investor whose guides to SaaS metrics are the usual reference, writes the same formula as ARPA (average revenue per account) x gross margin % / churn rate. Rerun the instructor's customer with churn assumed at 4% a month:

```text
Margin per customer per month      ₹2,000
Monthly churn (assumed)            4%
Expected lifetime = 1 / 0.04       25 months
LTV = ₹2,000 x 25                  ₹50,000
Still ordering at month 60         0.96^60 = 8.6%
```

For 60 months to be the average, churn would have to be 1 / 60 = 1.7% a month, with 82% of customers still ordering after a year: a claim to check in the cohort table, not to assume. At 4%, the instructor's ₹50,000 to win a customer is that customer's entire lifetime margin.

The ₹500,000 has a second error: it is nearer five years of revenue (₹10,000 x 60 = ₹600,000) than of margin. Revenue-based LTV at the same churn is ₹10,000 / 0.04 = ₹250,000, five times too high, because it counts money that goes to restaurants and riders. Use margin: what is left after the cost of serving the customer, discounts included.

## Roost's students do not churn

A student pays Roost nothing; the owner pays the ₹720 commission. She is active for a few weeks around June, silent for the rest of the year, and her relationship with Roost ends when her degree does, not at a steady monthly rate. So count bookings instead. Roost's data for 1,000 first-years who booked in June:

```text
Year 1   1,000 bookings
Year 2     350   (35% move and book again on Roost)
Year 3     250
Year 4     120   (four-year degrees only)
Total    1,720 bookings, or 1.72 per student
```

Each booking leaves Roost about ₹525 of its ₹720 after payment fees, dispute handling and verification. Student LTV = 1.72 x ₹525 = ₹903.

The shortcut, four years at one booking a year and ₹720 each, gives ₹2,880, 3.2 times too high. It repeats both of the instructor's errors: revenue instead of margin, and the bookings a student could make instead of the ones students do make.

## Success caps the student's value

A student who changes rooms every year books four times. One who finds a room worth keeping books once. Roost's promise is a room worth keeping, so the better it does its job, the closer student LTV gets to one booking. That is not a flaw to fix. It means the student side cannot fund much acquisition, and most of what a good stay is worth shows up elsewhere: in seniors who tell first-years which app to trust, and in owners whose beds stay full.

## Predict, then verify

Roost pays coaching centres ₹300 for each student who books through them. A rival now offers the centres ₹1,000 a student, and the partnerships lead wants to match: "a student is worth four bookings at ₹720, so ₹2,880, and ₹1,000 is cheap." Do you match?

Answer: No. A student is worth ₹903, not ₹2,880, so ₹1,000 loses ₹97 per student even if every forecast holds. Only ₹525 of the ₹903 arrives with the first booking; the other ₹378 depends on a minority of students moving in later years. Offer up to ₹525, so each student pays back on the booking you can see, accept losing the centres that want more, and compete on something the rival cannot copy cheaply, such as verified room lists a centre can hand its students. The principle: LTV is margin times the purchases customers actually make, and it sets the ceiling on acquisition spend, not the target.
