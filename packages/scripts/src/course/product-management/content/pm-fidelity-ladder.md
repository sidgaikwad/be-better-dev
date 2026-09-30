In the video's opening story, Priya's team does not start the hostel app in code. The designers draw black and white wireframes, then a clickable prototype with filters and a mock booking. Students try it, and Priya fixes what trips them up before any code exists, because, in the instructor's words, "it's better to fix a sketch than fix a live app with bugs."

That is the economic case for design artifacts. Each level of fidelity costs more to make and to change, and each answers a different question.

## The ladder

1. **Sketch.** Pen on paper or a whiteboard, minutes each, thrown away freely. It answers: which approach? A single form, a three-step wizard, or a chat with the owner?
2. **Wireframe.** Grayscale boxes for layout, no color and no logo; the video calls wireframes an architectural blueprint. It answers: what information appears, in what order, on which screen?
3. **Clickable prototype.** Screens linked in a tool like Figma, often looking finished. It answers: can a person complete the task without help?
4. **Coded build.** Real data, real speed, real failures. It answers what the others cannot: does it work at scale, and does it change what people do?

Bill Buxton, in _Sketching User Experiences_ (2007), treats sketching and prototyping as different activities. Sketching is for getting the right design, exploring many options cheaply; prototyping is for getting the design right, refining one. No fidelity is better in general; the right one is the cheapest that answers your current question.

Compare the MVP lessons: an MVP without code tests whether anyone wants the thing, while a prototype usually tests whether people can use it. Different risks, same idea of learning before building.

## What a change costs at each rung

The UI versus UX lesson moved the ₹27,000 total due at booking from the form's last step to the listing page. Here is what that change costs at each rung:

```text
sketch            10 minutes of the designer
wireframe         1 hour
Figma prototype   half a day, relinking five screens
shipped app       1 designer day + 3 engineer days + QA
                  + a Play Store release, and any damage
                  the old version did while it was live
```

The last line is the one that grows. Suppose an untested redesign ships in June and drops the form's send rate from 62.5% to 55% for three weeks before anyone reverts it. About 3,000 students open the form in an average week:

```text
lost requests per week:   3,000 x 7.5%     = 225
lost bookings per week:   225 x 50%        = 112.5
lost commission per week: 112.5 x ₹720     = ₹81,000
three weeks:              ₹81,000 x 3      = ₹243,000
```

And June is not an average week. Five prototype sessions would have cost two days.

## Where fidelity misleads

High fidelity too early changes the feedback. Shown a polished screen, people comment on colors and fonts, and a team that spent days on it defends it. Show three rough sketches and people argue about the approach, the argument you wanted.

Low fidelity has the opposite blind spot. A gray box where the photo goes cannot test trust, and trust is Roost's product. Students judge a listing by its photos, its rent and its charges, so a Roost prototype needs real listing photos and real rupee amounts even when the layout is rough. Fidelity has more than one dial: how real it looks, how real it behaves, and how real its content is. Turn up the one your question depends on.

And a prototype lies about whatever it fakes: a college ID upload failing on a slow connection, an owner taking three days to reply. Those need the coded build.

## Predict, then verify

The designer has three ideas for the request form: one long page, a three-step wizard, and a chat with the owner. The founder wants a polished Figma prototype of the wizard, his favorite, for next week's review. In the same week the designer could instead make all three as rough clickable wireframes. Which do you ask for?

Answer: three rough wireframes, tested with students before the review. The open question is which approach works, answered cheaply at the low rungs across all three. A polished wizard answers a later question, whether this particular design is right, and would steer the review toward taste before any evidence exists. Polish the winner afterward. The principle: use the lowest fidelity that answers the current question, and choose between approaches before refining one.
