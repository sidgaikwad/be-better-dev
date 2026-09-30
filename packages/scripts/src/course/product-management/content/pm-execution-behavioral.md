Two questions from one interview loop. "Bookings fell 20% last week. What do you do?" And an hour later: "Tell me about a time you disagreed with an engineer." The first candidate answer to the first is "I'd survey users to find out why." The first answer to the second is "We had a disagreement, but we worked through it as a team." Both lose the round.

## Execution: diagnose, then choose

Execution questions come in two shapes. The first is **a metric moved**. The metric drop lesson gave the order of checks: is the data real, is the baseline right, what did we change, what changed outside, where is it, why. In an interview you cannot open a dashboard, so the same order becomes questions and stated hypotheses, and the interviewer supplies the data:

```text
Me: Is the drop in the payments ledger too, or only the dashboard?
Them: Both.
Me: Compared with the same week last year, is 20% unusual?
Them: Last year that week fell 5%.
Me: So about 15 points are unexplained. Did anything ship?
Them: An Android release on Tuesday.
Me: Then I'd split by platform and version before anything else.
```

The survey skipped every cheap check and would take weeks.

The second shape is **choose a metric**: "What would you measure for a new parent page?" Work from goal to behavior to number, as the metric trees lesson did. The goal is parents trusting a room enough to pay. The behavior is a parent-approved booking paid quickly. The metric: median days from request to payment for bookings where a parent opened the page. Then name a guardrail, move-in disputes within 30 days, so the page cannot win by rushing families into bad rooms. One metric with no guardrail invites the obvious follow-up.

## Behavioral: STAR

Behavioral questions rest on one idea: past behavior predicts future behavior. The consultancy DDI says it introduced the STAR format in 1974 with Targeted Selection, its behavioral interviewing system. A STAR answer has four parts: **Situation**, **Task** (what you were responsible for), **Action** (what you did), **Result** (what happened, in numbers, and what you learned). A developer's answer to the disagreement question:

```text
S  Our team planned a two-sprint rewrite of the search API before admissions.
T  I owned the release plan and thought the rewrite put the season at risk.
A  I pulled a week of logs: 80% of slow queries hit one unindexed filter.
   I proposed an index first and the rewrite after the season, and asked
   the lead engineer to test it with me before the planning meeting.
R  The index cut p95 search latency from 2.1 s to 400 ms in three days.
   The rewrite shipped in October. I learned to bring data, not a position.
```

Say "I", keep it near two minutes, and spend most of it on Action and Result. The "we worked through it" answer failed because it had no action and no result.

Prepare five or six stories before any loop, each able to answer several questions: a disagreement you resolved, a decision made with incomplete data, a failure and what you changed, influence without authority, saying no to someone senior, and a time data changed your mind.

## Predict, then verify

This question closes the course. It is Chennai's first June. Two weeks in, 2,000 requests produced 500 bookings, a 25% booking rate against 50% in the other cities. The interviewer's data: of the 1,500 requests that did not book, 900 were declined by owners because the room was full, 400 stopped at the deposit screen, and 200 went quiet. The city lead wants to double the ambassador budget. What do you recommend?

Answer: add verified supply, not demand. The data is real and the new city has no baseline, so the segment decides: 900 of 1,500 losses, 60%, are full rooms, which makes supply the constraint, as the marketplace economics and go-to-market lessons showed. More ambassadors would mostly buy rejections. Spend on verification visits instead, at about ₹800 per new verified property and 5 bookings each. Then treat the 400 at the deposit screen as a trust problem, since most Pune first-years who leave that screen cite worry about paying online, and never list unverified rooms to close the gap. That answer draws on the whole course: check the data, find where the loss sits, fix the constraint, and protect what customers trust you for. Told later with its result, it is also a STAR story.
