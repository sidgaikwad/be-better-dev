At the instalments kickoff, the tech lead estimates six weeks. Then requests arrive, each reasonable alone. Operations wants instalments on monthly rent too, not just the upfront ₹27,000: four more weeks. Marketing wants parents abroad, many of whom have no PAN (India's tax ID, which the partner's checks require): two weeks and a second partner. The founder wants Hyderabad at launch: a week of operations training. Someone asks for a choice of three or six parts: two weeks. Six weeks has become fifteen, and admissions season is eight weeks away.

The course's instructor warns that teams chase shiny ideas until the MVP has doubled in size. Here it more than doubled, one polite request at a time.

## The template the video walks through

The video walks through a PRD template it attributes to Uber, recreated in Notion. Its provenance is not public, but the sections are sound:

1. Version control: name, version, owner, last update.
2. Project team: each role, and what to contact them for.
3. Problem definition: objective, context, opportunity, success metrics ("80% ride completion rate within two months").
4. High-level solution, in a paragraph or two.
5. Proposed approach: the flow step by step.
6. Product definition: functional and non-functional requirements.
7. Release criteria: what must be true before it goes live.
8. Out of scope: in the video's example, no referral program or coupons in version one.
9. Risks, each with a mitigation.
10. Team feedback and open questions.
11. Tasks, on a board.

Teams skip 7 to 10, because each records a limit or a doubt, and writing those down feels like weakness. It is the opposite.

## Roost's version

```text
Release criteria (Pune soft launch, May)
  - 100 instalment bookings, payment failures under 2%
  - Every owner paid within 1 working day of approval
  - Support has answers for decline, missed payment, cancel
Out of scope for v1                    Revisit
  - Instalments on monthly rent        day-90 review
  - Payers without a PAN               with a second partner
  - Hyderabad                          day-30 review
  - Choosing the number of parts       v2
Risks                        Mitigation
  Partner has never approved Soft launch in Pune; surge
  more than 40 in a day      limit agreed before June
  Families miss payments     Reminders before each due date;
  and blame Roost            pause applications above 3%
Open questions               Owner           Decide by
  Refund if a student        PM and partner  10 April
  cancels before move-in?
  Share the partner will     Partner         12 April
  decline?
```

Each out-of-scope line carries a moment to revisit. That turns "no" into "not now, and here is when we look again", the MoSCoW lesson's "won't have this time". It also reassures the people who asked, the section's second purpose in the video. Hyderabad has one more reason: a city without instalments is the comparison that shows whether the feature changed bookings.

## Risks, questions, and assumptions

A risk is an event that might happen, with a mitigation you can act on now. "Timeline risk: medium" names no event and no action, so it is not an entry. An open question needs an owner and a date: one still open on launch day has been answered by default, usually by whoever wrote the code. An assumption, one of the video's eight components, is a question you chose not to ask. List it so it can be challenged.

Value and viability, from the four risks lesson, should be retired by now (who pays the lender's fee was settled before this draft), so what remains are delivery risks, which get mitigations rather than experiments.

One mild disagreement with the video: link the PRD to the team's tracker rather than keep a tasks board inside it. Two task lists drift apart.

## Predict, then verify

Week three of the six-week build, with three weeks left and the June campaign five weeks away. A rival app announces monthly rent in parts, and the founder asks you to add it now. The tech lead estimates four more weeks. What do you do?

Answer: keep it out of version one, and state the cost in the founder's terms: three weeks plus four is seven, two more than the five available, so adding it means no instalments at all for the June campaign. Record the request under the monthly-rent line, with what would bring it back: Roost's repayment data at the day-90 review. A competitor's announcement is not evidence that Roost's students want it. The principle: an out-of-scope line is a decision with reasons, and it reopens for new evidence, not new pressure.
