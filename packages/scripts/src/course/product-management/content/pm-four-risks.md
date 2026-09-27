One finding from Roost's early research sounds like a gift: students want to pay in instalments. Many owners want the first month's rent plus a two-month deposit before move-in: ₹27,000 at the average rent. Split that into three payments and the biggest barrier to booking seems to vanish. The founder wants it live before June.

Ideas fail in a few predictable ways. Marty Cagan of Silicon Valley Product Group named four in "The Four Big Risks" (2017) and in the second edition of his book _Inspired_, published the same year.

## The four risks

- **Value:** will customers buy it, or users choose to use it?
- **Usability:** can users figure out how to use it?
- **Feasibility:** can our engineers build it with the time, skills and technology we have?
- **Business viability:** does it also work for the rest of the business, from finance and legal to operations and partners?

Cagan also assigns owners. The product manager owns value and viability, the designer owns usability, and the tech lead owns feasibility. He advises tackling them early, value and viability especially, before anyone writes production code: building the real thing is the most expensive way to learn that an idea fails.

Roost's instalment idea, run through all four:

| Risk        | The instalment question                                          | Owner     |
| ----------- | ---------------------------------------------------------------- | --------- |
| Value       | Will students, and the parents who often pay, pick Roost for it? | PM        |
| Usability   | Can a student pass a credit check on a phone without giving up?  | Designer  |
| Feasibility | Can five engineers integrate a lender before June?               | Tech lead |
| Viability   | Is Roost allowed to offer it, and who pays for it?               | PM        |

## Viability, worked

Roost cannot lend money itself. Lending in India is regulated by the Reserve Bank of India, so Roost would work through a bank or NBFC as its lending partner, under RBI digital lending rules (2022, consolidated in 2025) that govern how the money flows and how a platform is paid. A "no-cost" plan means someone other than the student pays the lender's fee. Suppose it is 4% of the amount financed and Roost pays it:

```text
Amount financed:       ₹27,000
Lender fee at 4%:      ₹27,000 × 0.04 = ₹1,080
Roost's commission:    8% × ₹9,000     = ₹720
Margin per booking:    ₹720 - ₹1,080   = -₹360
```

Every instalment booking loses Roost ₹360, even one that would never have happened without instalments, so volume makes it worse. The fix is to change who pays: the owner is the obvious candidate, because instalments bring students who could not have raised ₹27,000 at once, and the lender pays the owner in full on day one. Viability forced that design decision, and no usability test would have found it.

Value hides a trap too: students asked for instalments, but parents often pay. If parents send the deposit in one transfer anyway, the feature helps someone who is not paying.

## Where the list breaks

The risks are not independent. A flow nobody can finish has no value, and a six-month build may not be viable for a business whose bookings arrive in one season. Ownership means who must be convinced, not who works alone, and a PM who calls usability "the designer's problem" has misread Cagan. Nor does the list rank the risks for you. For instalments, viability can kill the idea outright, so it goes first. For a new search filter, value is the whole question.

## Predict, then verify

Your designer has a clickable prototype of the instalment flow, and 9 of 10 students in a usability test finished it. The tech lead estimates six weeks of work. Admissions season starts in eight weeks. Do you start building?

Answer: Not yet. The test retired usability risk and the estimate addresses feasibility, the two risks the PM does not own. Nine students finishing a flow shows they can use it, not that families will choose Roost for it or that Roost can afford it. Spend the two weeks of slack getting a lender's terms, with owners agreeing to carry the fee, and checking that paying families want it, while the tech lead starts work that does not depend on the lender. If viability fails, you lose two weeks, not eight, and never ship a feature that loses ₹360 a booking. The principle: evidence against one risk is not evidence against another, and value and viability come first.
