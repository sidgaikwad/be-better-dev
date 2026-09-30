The interviewer says: "Design a product that helps parents choose housing for a child moving away to college." Thirty seconds later the candidate is listing features: virtual reality tours, an AI chatbot, instalment payments, a safety score. The interview is already going badly: nobody knows which parent, which problem, or why these features.

Product sense questions ("design X for Y", "improve X") test whether you can get from a vague prompt to a defended recommendation in about 35 minutes. The path is graded, not the product.

## CIRCLES, run once

Lewis C. Lin introduced the CIRCLES method in _Decode and Conquer_ (2013). The seven letters are a checklist that keeps you from skipping to solutions. Run on the prompt above:

1. **Comprehend the situation.** Ask: a new product or part of an existing one? What is the goal? If the interviewer lets you choose, say your assumption aloud: "a feature inside a student housing marketplace, goal: more bookings completed by parents."
2. **Identify the customer.** Parents are not one group. Pick one: parents in another city paying for a first-year's room they cannot visit. Say why: they hold the money and have the least information.
3. **Report customer needs.** Write them as user stories: "As a parent far away, I want to know the room is as shown, so I can pay without travelling." Others: know the full cost; know the area is safe.
4. **Cut through prioritization.** Pick one need and give the reason. The first need wins, and you can cite evidence: in Roost's 14 student interviews from the customer interviews section, "parents won't pay until someone has seen the room" came up 9 times.
5. **List solutions.** Three, deliberately different.
6. **Evaluate trade-offs.** Score them against the chosen need, not in general.
7. **Summarize.** The recommendation, the reason, the metric you would watch, and the biggest risk.

Step 6 on paper:

| Solution                                                       | Meets the need                     | Cost to run                   | Time to ship |
| -------------------------------------------------------------- | ---------------------------------- | ----------------------------- | ------------ |
| Visit report: a verifier's dated photos, video and a checklist | High                               | Needs verifiers in every city | Six weeks    |
| Live video walkthrough booked with the owner                   | Medium: the owner holds the camera | Low                           | Three weeks  |
| Virtual reality tour                                           | Low: shows the room, not the truth | High per property             | Months       |

## What interviewers score

Interview guides from _Cracking the PM Interview_ (Gayle Laakmann McDowell and Jackie Bavaro, 2013) onward agree on the core: a chosen goal, a chosen user with a reason, needs that come before features, prioritization you can defend, at least one idea that is not obvious, trade-offs named honestly, and a clear recommendation at the end. The interviewer should be able to follow your reasoning without asking where you are.

Where CIRCLES breaks is in the hands of a candidate who recites it. Lin's own advice is to understand why each step exists, and interviewers mark down framework theater: ten minutes spent listing every possible customer, or a needs list with no choice at the end. The steps that carry the most weight are the second and fourth, where you pick one and say why. A candidate who never names the acronym but chooses a user, a need and a solution with reasons outscores one who recites every letter and chooses nothing.

## Predict, then verify

You have five minutes left. The visit report meets the need best, but the interviewer adds a constraint: "Assume the marketplace in the question can afford verifiers in only one of its three cities this year." The owner's video walkthrough, by contrast, could run in all three. Do you keep the visit report as your recommendation, or switch?

Answer: keep it where it can run, and say plainly what the other cities get. The chosen need is trust in a room nobody has seen, and a walkthrough filmed by the owner is evidence from the party the parent distrusts. So: launch visit reports in the one city, measure the share of parent-approved bookings that pay within two days against the other cities, and use that gap to argue for verifiers elsewhere. Offer the walkthrough as a stopgap and name its limit; switching to it wholesale would abandon the need you prioritized. The principle: a constraint changes where and when you ship, not which need you are solving, unless it makes that need unsolvable.
