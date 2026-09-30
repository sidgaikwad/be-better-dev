The course's video sketches a sprint plan for a new app: sprint one builds login and signup, sprint two the dashboard, sprint three basic analytics. At the end of sprint one, a user can create an account in an app that does nothing. Two weeks of work, and nobody learned whether the product is worth having.

Scrum's own rulebook would push back on that plan, and the reason is its most useful idea for a PM: every sprint has a goal, and the goal is a reason, not a list.

## The 2020 Scrum Guide

Ken Schwaber and Jeff Sutherland developed Scrum in the early 1990s. Their Scrum Guide, last revised in November 2020, defines three things.

**Accountabilities.** One Scrum Team, typically 10 or fewer people:

- The **Product Owner** maximizes the value of the team's work, sets the Product Goal and orders the Product Backlog. One person, not a committee; at most product companies, the PM.
- The **Scrum Master** makes sure the team works by Scrum and gets impediments removed.
- The **Developers**, everyone who builds, designers included, turn backlog items into a usable increment each sprint. They size the work, not the Product Owner.

**Events.** The Sprint has a fixed length of one month or less and contains the other four: Sprint Planning (why is this sprint valuable, what can be done, how), the Daily Scrum (15 minutes, for the Developers, to inspect progress toward the goal), the Sprint Review (show stakeholders the result and adapt what comes next), and the Retrospective (improve how the team works).

**Artifacts, each with a commitment.** The Product Backlog commits to the Product Goal, the Sprint Backlog to the Sprint Goal, the Increment to the Definition of Done. Work that misses the Definition of Done cannot be released or even shown at the Review.

A Roost sprint written that way. Five engineers for two weeks is about 50 engineer-days, and the stories are the instalment slices from the story-splitting lesson:

```text
Product Goal: a family can pay for a room in parts
Sprint Goal:  a Pune parent pays the first instalment
              of a real booking, and the owner is paid

Sprint Backlog (a forecast)                 Est.
  S1 schedule, apply, approval, part 1      5 d
  S2 partner pays the owner in 1 day        3 d
  S3 SMS reminders before due dates         3 d
  S4 decline: offer full payment            2 d
  Owner-app map pin fix                     8 d
  Bug and support rotation                  10 d
  Scrum events and refinement               6 d
Planned: 37 of 50, the rest for leave and surprises
```

Only S1 and S2 are needed for the goal, on purpose.

## What is fixed and what flexes

The sprint's length is fixed and so is its goal. The scope is a forecast: when the work turns out different than expected, the guide has the Developers renegotiate the Sprint Backlog with the Product Owner "without affecting the Sprint Goal". A goal smaller than the backlog is what makes that possible.

Only the Product Owner can cancel a sprint, and only when its goal has become obsolete: the partner withdraws, a regulation changes. Pressure from a senior person is not obsolescence.

The video has the PM running the standup, asking what is being worked on, what is blocking and what is done. Those echo the three standard questions the 2020 guide removed, and the guide gives the Daily Scrum to the Developers. The PM's job is to be reachable right after it. And the guide never mentions story points or velocity; those came from elsewhere, story points from Extreme Programming.

## Predict, then verify

Day 4 of the sprint above. The lending partner reveals that approval arrives by a later callback, and S1 grows from 5 engineer-days to 10. The founder says to cancel the sprint and replan. The tech lead suggests extending it by three days. What do you do as Product Owner?

Answer: neither. Keep the goal and the end date, and move S3 (3 days) and S4 (2 days) to the next sprint: exactly the 5 days S1 grew by, while S1 and S2 still meet the goal. Cancelling is wrong because the goal is still valid, only harder. Extending is wrong because a sprint whose length stretches stops being a unit anyone can forecast with. The principle: the Sprint Goal is the commitment and the backlog is a forecast, so when the work surprises you, trade scope inside the sprint and leave the goal alone.
