One card has sat in Roost's In Progress column for five weeks: "Instalment payments". At the sprint review there is nothing to show, because nothing works until everything does: the partner integration is half done, the checkout screen waits for it, and the reminders wait for both. A card that big is not a story. It is an epic, a story too large to finish in one sprint, and it has to be split before anyone can see progress.

## INVEST

Bill Wake published six tests for a good story on 17 August 2003, as the acronym INVEST:

- **Independent**: stories do not overlap, so they can be built in any order.
- **Negotiable**: not a contract; details are worked out together.
- **Valuable**: each story is worth something to the user on its own.
- **Estimable**: understood well enough to estimate roughly.
- **Small**: in Wake's words, at most a few person-weeks, and some teams hold stories to a few person-days.
- **Testable**: the writer could write a test for it, the last lesson's criteria.

Wake's image for Valuable is a layer cake: database, services, interface. Splitting by layer gives a story for the tables, one for the API and one for the screens. Each is small and none is worth anything alone, so they fail Independent too: the screens cannot be tested until the API ships. Split vertically instead, so every story is a thin slice through all the layers that a user could try.

## Splitting patterns

Richard Lawrence's "Patterns for Splitting User Stories" (2009) gives nine ways to find vertical slices. Four do most of the work:

1. **Workflow steps**: one step of the journey at a time, thinnest end-to-end path first.
2. **Business rule variations**: the main rule first, each exception as its own story.
3. **Variations in data**: one city, one kind of user or one channel first.
4. **Simple before complex**: the happy path first, failure paths after.

The instalments epic, split with those four:

```text
Story                                         Est.  Pattern
S1  Payer sees the 3-part schedule, applies,  5 d   workflow,
    partner approves, part 1 paid (Pune,            simple first
    rooms opted in by operations)
S2  Partner pays the owner within 1 working   3 d   workflow
    day of approval
S3  Reminders by SMS before each due date     3 d   workflow
S4  Decline: offer full payment, hold room    2 d   rule
    for 24 hours
S5  Day-30 payment fails: retry, tell payer   3 d   rule
S6  Move-in date changes: rebuild schedule    2 d   rule
S7  Owner opts in from the owner app          4 d   data
S8  WhatsApp when an SMS is not delivered     3 d   data
```

That is 25 engineer-days in eight slices a tester can try; S1 alone is a working, if narrow, instalment booking.

## Where splitting goes wrong

Two traps. Splitting by task: "design the schedule screen" and "write the partner client" are tasks, and tasks live inside a story, not beside it. And Lawrence's own warning about simple-first: it is easy to call S1 done while S4 and S5 sink down the backlog, and the feature ships without its failure paths. Tie the failure stories to the release, whatever their rank.

How small is small enough? Lawrence's guide says six to ten stories should fit in a sprint by the time they reach the top of the backlog. Five engineers on two-week sprints have about 50 engineer-days, so at most 5 to 8 days a story (50 ÷ 10, 50 ÷ 6). Every story above fits.

## Predict, then verify

For the happy path, S1 to S3, the tech lead proposes splitting by layer as more efficient: partner integration and database (10 days), then checkout screens (6 days), then reminders (5 days), 21 days in all. Building the same scope as vertical slices, S1 first, costs about 10% more, he estimates, because some code is revisited. The riskiest unknown is whether the partner's approval service behaves as documented. Which plan?

Answer: the vertical split. By layers, nothing a person can try exists until day 16, when the screens meet the integration and the partner's service first runs in a real flow. With S1 first, a real application reaches the partner in about 5 days, so the riskiest unknown surfaces in week one. Ten percent of 21 is about 2 days, a cheap price for 16 - 5 = 11 days of earlier warning. The principle is Wake's layer cake: slice vertically, because a story proves something only when a user can try it.
