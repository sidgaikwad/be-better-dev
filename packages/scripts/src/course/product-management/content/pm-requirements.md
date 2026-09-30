The course's instructor gives a notification feature two performance targets: delivery within 1 second of the trigger time, and reaching 95% of users without failure. He adds that 1 second is a long time, since engineers usually talk in 100 or 200 milliseconds. On Roost's instalment reminders, the same targets point the wrong way. Nobody is harmed by a due-date reminder that arrives ten minutes late. A reminder that never arrives can cost a missed payment, and 95% means one family in twenty gets none.

## What it does, and how well

A functional requirement says what the product must do; a non-functional one says how well: performance, reliability, security, accessibility. The template the video attributes to Uber has one of each: show the rider the driver's ETA, and load the booking screen within 2 seconds.

"Within 2 seconds" still leaves questions: every load or most, on what phone? An average hides the slow tail, so a real target names a percentile and conditions. Google's Core Web Vitals, for example, want a page's largest content to render within 2.5 seconds at the 75th percentile of page loads. Roost's instalment requirements:

```text
Functional
F1  The payer can choose "Pay in 3 parts" at checkout on
    any room whose owner has opted in (Pune, Bengaluru).
F2  Before applying, the payer sees the schedule (3 equal
    parts: now, day 30, day 60), the partner's name, and
    the fee: none if each part is paid on time.
F3  The partner pays the owner within 1 working day of
    approval, less its fee.
F4  Reminders go out 3 days and 1 day before each due date.
Non-functional
N1  The payment page loads in under 2 seconds for 90% of
    visits on a mid-range Android phone over 4G.
N2  99.5% of reminders are delivered within 15 minutes of
    schedule, by SMS or, when SMS fails, WhatsApp.
N3  PAN and bank details go straight to the partner; Roost
    stores only the decision and the schedule.
N4  Every step works with a screen reader and at 200% text.
```

Someone who was not in the room can check each line: that is the test of a requirement.

## Edge cases and dependencies

Edge cases are what the happy path forgets. The video gives two: an invalid email address (show an error in the notification settings), and a due date changed after a reminder was sent (cancel it and send one for the new date). Roost's equivalents, and more:

- **The payer's phone number is wrong.** Verify it with a one-time code on entry, so a bad number is never saved.
- **The owner moves the move-in date after the schedule is set.** Cancel pending reminders, rebuild the schedule, and send the payer the new dates.
- **The day-30 payment fails.** Retry after two days and tell payer and student; after seven days the partner's collections process takes over.
- **The partner declines the application.** Offer to pay in full, and hold the room for 24 hours.

Dependencies (the partner's approval service, the SMS and WhatsApp providers, an opt-in screen in the owner app) run on someone else's schedule, so each needs a name beside it.

Keep this at the level of the feature; acceptance criteria for single user stories are the next section's subject.

## Where the numbers come from

Non-functional numbers are usually picked by habit: 2 seconds, 99.9%. Each extra nine of reliability costs more than the last, so derive the number from what it protects. The reminders protect a guardrail already in the PRD: missed second instalments at most 3%.

## Predict, then verify

To save a week, engineering proposes SMS only, which the provider says delivers about 95% of messages. The partner's data from other merchants: reminded payers miss 2% of payments, unreminded ones 40%. A WhatsApp fallback lifts delivery to 99.5% for one more week, which the schedule can absorb. Is the week worth it?

Answer: yes. With SMS alone: 0.95 × 2% + 0.05 × 40% = 1.9% + 2.0% = 3.9%, over the 3% guardrail before anything else goes wrong. With the fallback: 0.995 × 2% + 0.005 × 40% = 1.99% + 0.2% = 2.19%, inside it. The video's 95% sounds strict and is not: the 5% without a reminder produce more missed payments than all the reminded payers together, while its 1-second target is strict where nothing depends on it. The principle: set a non-functional target from the business consequence it protects, not from a round number.
