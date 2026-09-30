At 11 on a Tuesday, an engineer building the instalment schedule posts a question: can the deposit be split too, or only the first month's rent? You are in student interviews all day and answer the next morning. By then she has either waited a day or guessed, and a guess on a payment rule is a day of rework waiting to happen.

Multiply it. If each of Roost's five engineers hits one blocking question a week, a two-week sprint has 10. Answered the next day, that is 10 engineer-days, a fifth of the sprint's 50, spent waiting or guessing. Answered within two hours, it is 10 x 2 = 20 hours, about 2.5 engineer-days.

The course's video puts the PM's delivery job in one line: remove blockers, like clarifying requirements or resolving dependencies. You are not coding, but you are in it. That job has four parts.

## Answer within hours

Be reachable right after the standup, and keep a block of the afternoon free for questions. Write every answer into the ticket, so the next person who asks finds it. When you do not know, say who decides and by when: "the lending partner confirms deposit rules by Thursday" unblocks planning even without the answer. And chase the dependencies yourself.

## Say which is fixed: the date or the scope

Something will run late, and the useful move is deciding in advance what gives. Suppose the rest of the instalments release is 110 story points, and the team's last three sprints finished 21, 26 and 19.

```text
average velocity   (21 + 26 + 19) / 3 = 22 points
point forecast     110 / 22 = 5 sprints
range, best        110 / 26 = 4.2, so 5 sprints
range, worst       110 / 19 = 5.8, so 6 sprints
say:               "5 to 6 sprints", 10 to 12 weeks
```

A single number claims a precision the history lacks. Then decide what moves. Roost's dates are usually fixed by the season, since most bookings land between June and August, so scope is the variable. When scope is fixed instead, say a legal requirement for the partner, move the date. Refusing to choose ends with both slipping and quality paying.

## Make room for the debt

Code taken on in a hurry charges interest: the owner app's listing form breaks with every change, and each fix takes longer. Engineers see it; the backlog rarely does, because debt never wins a RICE score against a feature. Hold a fixed share of every sprint for it, decided with the tech lead. Roost holds 10 engineer-days a sprint, 20% of capacity, for bugs and debt (the rotation in the Scrum lesson's sprint), and does not borrow from it when a feature runs late.

## Never turn velocity into a target

Velocity is a forecasting tool for the team. Ron Jeffries, who says he may have invented story points, wrote in 2019 that he regrets how they are used: to compare teams, to track estimates against actuals, and to push for more. The last one fails fastest. Ask a team for more points and a 3-point story becomes a 5; velocity rises and nothing ships sooner. This is Goodhart's law, named for the economist Charles Goodhart: a measure that becomes a target stops being a good measure.

Jira and Trello, which the video lists among a PM's tools, are the smallest part of this: an afternoon to learn. The job is the answers, the trade-offs and the protection.

## Predict, then verify

Four sprints remain before 1 June. The forecast above says 110 points needs 5 to 6. The founder says: "Push the team to 28 points a sprint; 4 x 28 = 112, done." What do you do?

Answer: refuse the target and cut the scope. At the worst recent velocity, 4 x 19 = 76 points is a plan you can commit to; at the average, 4 x 22 = 88 is likely. Order the release by value, draw the committed line at 76, mark 76 to 88 as likely, and move the rest to July in writing. A 28-point target would get 28-point sprints by inflating estimates, or by cutting testing on a payment feature just before the season's peak of about 2,000 bookings a week. The principle: when the date is fixed, scope is the variable, and velocity is a forecast you plan with, never a target you push.
