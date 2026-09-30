Roost's founder sends the team one line: "Let students pay in instalments." Within a week there are three versions: an engineer has started on card EMIs over six months, the designer has drawn a loan application with a credit check, and marketing has a banner that says "zero cost". Nobody has decided how many parts, which amount is split (the monthly rent, or the ₹27,000 due before move-in), or who pays the lender.

The course's instructor describes exactly this: without a single source of truth, engineers build one thing, marketers promise another, and leadership expects a third. His remedy is the product requirements document (PRD).

## Three questions

In the video's definition, a PRD answers three questions: why are we building this, what exactly are we building, and how will we know it worked. Marty Cagan's "How To Write a Good PRD" (Silicon Valley Product Group, 2005) sets the same bar: state the product's purpose, features, functionality and behavior clearly and without ambiguity.

The video lists eight components:

1. Background: the problem, and why now.
2. Goals, for the business and the user.
3. Personas and use cases.
4. Requirements, must-haves apart from nice-to-haves.
5. User experience and flows, often with wireframes.
6. Edge cases and assumptions.
7. Success metrics.
8. Timeline and dependencies.

The top of Roost's PRD, covering why and how we will know:

```text
PRD: Instalment payments               v0.3, owner: PM
Problem   A family pays ₹27,000 before move-in (first
          month's rent ₹9,000, deposit ₹18,000). Of about
          8,000 booking requests a month, 4,000 end in a
          payment.
Evidence  "Let me pay in instalments": 24 mentions in a
          300-item sample of June feedback; raised by 3 of
          14 students interviewed.
Users     Payer: the student or, often, a parent.
          Owner: paid by the lending partner on day one.
Goal      More requests end in a booking, because the
          ₹27,000 can be paid in 3 parts.
Metrics   Read 30 days after launch in Pune and Bengaluru
          Adoption:  20% of bookings use instalments
          Outcome:   request-to-booking 50% -> 54%
          Guardrail: missed second instalments at most 3%
```

Three interviews and 24 mentions are a reason to test, not proof. Adoption shows families chose the option, the outcome that it changed whether they booked, and the guardrail that it did not get there by lending to families who cannot repay.

The video's opening story has its PM, Priya, write a PRD with targets: cut hostel booking time by 40%, and get 80% of users to upload verified documents. But 40% of what baseline, timed from which event to which, by when? A target nobody can measure on day one gets measured after launch, in whatever way looks best.

## Written after the evidence, kept alive

Cagan's paper lists ten steps, and "write it down" is the seventh, after defining the purpose and users and after prototyping and testing the concept with real users. The PRD records a solution that has survived contact with users, not the wish list that starts the work. SVPG now hosts it as a historical document; Cagan later dropped PRDs for prototypes and discovery, which shows what the order was for.

Common practice inverts it: nine pages of screens written first, then defended. The video points the right way: a PRD is not about long pages, and it stays a living document. Write the problem, users and metrics early, because they rarely change. Write the detailed requirements after the prototype test, because they will.

## Predict, then verify

It is March. The prototype test is in two weeks, engineering starts in three, and you have two drafts. Draft A runs nine pages, specifying every screen and error message; its only success measure is "live in Pune by 1 May". Draft B runs two pages: the problem with numbers, the users, the three metrics above, open questions, and a note that requirements follow the test. The founder prefers A: "engineers need detail." Which do you send?

Answer: B now, with requirements added in the week after the test. A answers only one of the three questions, what, and its success measure is a date, which would be met even if no family chose instalments. Its untested screens will be rewritten by the test, after the team has started defending them. B settles why and how you will know while there is time to disagree, and engineers get detail when it rests on evidence. The principle: a PRD's first job is agreement on the problem and the measure; the specification follows the test.
