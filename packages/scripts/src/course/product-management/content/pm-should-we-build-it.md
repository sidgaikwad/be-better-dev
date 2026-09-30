In November 2017 the fitness app Strava published a global heatmap: every run and ride its users had shared, drawn as glowing lines on a world map. In January 2018 Nathan Ruser, a 20-year-old Australian student, pointed out what the map showed in the deserts of Syria and Afghanistan: bright loops where soldiers jogged the perimeters of military bases, some of them secret. Nothing had broken or leaked. The feature did exactly what it was designed to do, and that was the problem.

## The assumption nobody owns

The assumption testing lesson gave Teresa Torres's five kinds of assumption: desirability, viability, feasibility, usability, and ethical, that the product harms no one. The first four have owners: the designer, the engineers, finance. Nobody's target depends on the fifth, so teams skip it. Treat it like the others: write it down, judge the damage if false, and look for evidence. Three questions surface it:

1. **Who could this hurt, including people who never use it?** Strava's harmed parties never opened the app.
2. **What would someone who wants to cause harm do with it?** Guttorm Sindre and Andreas Opdahl proposed misuse cases in 2000: a use case written for an actor you do not want, so the requirements can defend against them.
3. **Who pays when it works exactly as designed, and did they choose to?** Harm that falls on people who cannot see it or opt out weighs more than harm to people who can.

## A pre-mortem for harm

Gary Klein described the pre-mortem in Harvard Business Review in September 2007: before a project starts, the team imagines it has already failed and writes down why. It makes raising doubts the assignment rather than disloyalty. Aim it at harm by changing one line: it is a year from now, and this feature hurt someone. Who, and how?

Roost's owners have asked for tenant ratings: after a stay, the owner rates the student out of five, with a note, and other owners see the rating before accepting a request. Owners are half the marketplace, and they want it. The pre-mortem:

```text
Feature   Owners rate students after a stay; other owners
          see the rating before accepting a request.
Misuse 1  A student disputes a ₹4,000 unlisted charge. The
          owner rates her one star: "troublemaker".
Misuse 2  An owner marks down students for their religion,
          their diet, or who visits them.
Harm      Students learn that complaining costs them their
          next room, and stop complaining.
Who pays  Students, who did not ask for it, cannot see it,
          and cannot leave it behind.
```

The harm lands on the one behavior Roost's strategy depends on: students telling Roost when a listing is not as promised. Each misuse needs a guardrail; where none answers it, the feature changes or dies. Write the pre-mortem into the risks section the PRD hard sections lesson asked for, so the decision is on the page.

Two failure modes wait at the edges. Every feature can be misused by someone, and a team that blocks everything on that ground ships nothing; weigh how severe the harm is, how many it reaches, and whether it can be undone. And a review signed after the build is theater. Ask the questions when the opportunity is chosen, while "no" is still cheap.

## Predict, then verify

Operations pilots tenant ratings at 100 Hyderabad properties for two months. Disputes from those properties fall from 30 a month to 18, 40% down. Scaled to all of Roost's 360 disputes a month, that is 216, and the north star, happy move-ins, rises from 3,240 to 3,384. Owner satisfaction jumps. But operations' spot checks found unlisted charges at 3% of pilot move-ins, before the pilot and during it. Do you roll it out?

Answer: No. The charges did not fall; the complaints did. A happy move-in is defined as one with no dispute in 30 days, so a feature that makes students afraid to dispute raises the north star by measuring silence. The 144 extra "happy" move-ins a month are students who had a problem and kept quiet. Ship a narrow version instead: owners can flag only unpaid rent, which Roost's payment records confirm, and the student sees the flag and can contest it. The principle: when a metric improves because the people being harmed stop telling you, the metric is measuring fear, and harm to people who cannot see it or leave it is a veto, not a tradeoff.
