The video's search story ends with three acceptance criteria. Type "biryani" and the results show biryani dishes. Type the first three letters, "bir", and suggestions appear. Results take no more than 100 milliseconds. QA runs them. "Biryani" works. Then a tester types "biriyani", a spelling many menus use, and gets nothing. Is the story done? The criteria do not say, so the answer depends on who argues longest.

## What criteria are for

Acceptance criteria are the conditions a story must meet to be done: Jeffries' confirmation from the last lesson. The instructor puts it plainly for his notification story: if these are not met, the story is not done. QA tests against them, and so does the PM at the demo.

That works only if each criterion has one reading. The biryani ones do not. "Shows biryani dishes" does not say whether a restaurant named Biryani House counts, or whether spelling variants must match. "After three letters" is clearer. "Within 100 milliseconds" does not say measured where: on the server, or on a student's phone over 4G, as the requirements lesson insisted.

## Given, When, Then

Dan North gave criteria a shape that forces the gaps shut. In "Introducing BDD", first published in _Better Software_ in March 2006, he describes working out a template with business analyst Chris Matts: given some initial context, when an event occurs, then ensure some outcomes. His example is a cash machine: given the account is in credit and the card is valid, when the customer requests cash, then the account is debited, the cash is dispensed and the card is returned.

Given fixes the starting state, When names one event, and Then lists outcomes a person can observe. In 2008 Aslak Hellesøy's Cucumber made the form executable, with a syntax he named Gherkin; the form works without the tool.

The instalment story from the last lesson, with its criteria:

```text
Story  As a parent paying for my daughter's first room, I
       want to split the ₹27,000 due before move-in into
       three payments, so that I can hold the room this week.

1  Given a Pune room with rent ₹9,000 and deposit ₹18,000,
     whose owner has opted in to instalments
   When the payer chooses "Pay in 3 parts"
   Then the schedule shows ₹9,000 today, on day 30 and on
     day 60, the partner's name, and no fee if paid on time

2  Given a room whose owner has not opted in
   When the payer reaches checkout
   Then "Pay in 3 parts" is not offered

3  Given the partner declines the application
   When the decision reaches the payer
   Then full payment is offered and the room is held
     for 24 hours
```

Scenario 3 is an edge case from the requirements lesson, now a test. The video's notification edge case converts the same way: given a reminder was sent, when the due date moves, then the old reminder is cancelled and a new one scheduled.

## What good criteria leave out

Criteria describe behavior a user can see, not implementation: "then the API returns 200" tests a choice engineering should be free to change. Checks that apply to every story, such as code review and passing tests, belong in the team's shared definition of done, not in each story.

Write the criteria before the sprint, with an engineer in the room; written after the build, they describe what was built. And count them: a story that needs ten scenarios is usually two or three stories, the subject of the next lesson.

## Predict, then verify

A budget filter story says: "Given a budget of ₹8,000, when the student applies the filter, then only rooms with rent at or under ₹8,000 appear." It passes. At the demo, operations points out that 310 of Roost's 1,200 properties add a compulsory monthly charge, so a ₹7,500 room with a ₹1,000 maintenance fee costs ₹8,500 and still appears. The designer wants the story reopened. Do you reopen it?

Answer: no. Mark it done, and write a new story, "the filter uses rent plus every compulsory charge", at the top of the next sprint. The story met its criteria. Reopening it teaches the team that criteria can be rewritten at the demo, and then they stop ending arguments. The gap was the PM's: hidden charges were known from Roost's first interviews, so the rent-only criterion was a writing failure. The principle: criteria are fixed before the build, and a gap found after it becomes new work, not a failed story.
