import type { SectionSeed } from "../../types"

export const pmDesignAndUsability: SectionSeed = {
  slug: "pm-design-and-usability",
  title: "Design and usability",
  description:
    "What a PM needs to know about design without being a designer: UI and UX, the fidelity ladder from sketch to prototype, testing with five users, and the heuristics that catch problems early.",
  badgeIcon: "🎨",
  badgeTitle: "Design partner",
  units: [
    {
      slug: "what-design-covers",
      title: "What design covers",
      description:
        "The screen versus the whole experience, and the cheapest artifact that answers each question.",
      lessons: [
        {
          slug: "pm-ui-vs-ux",
          title: "UI is not UX",
          summary:
            "The interface is the paint job; the experience is the whole drive, including the owner who never replies. The PM owns the problem, the outcome and the parts off the screen.",
          contentFile: "pm-ui-vs-ux.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Roost's exit poll says 36% of form leavers did not expect ₹27,000 due at booking. What kind of problem is that mainly?",
              options: [
                "A UI problem, fixed by making the total larger",
                "A copywriting problem, fixed by rewording step four",
                "A UX problem about when Roost discloses the cost",
                "An engineering problem in how the total is computed",
              ],
              answer: 2,
              explanation:
                "The number is on the screen; it just arrives at the last step, after the student has invested effort. When the truth reaches the user is part of the experience, and moving it earlier is a journey decision, not a styling one.",
            },
            {
              kind: "mcq",
              prompt: "Reviewing the designer's draft, which comment fits the PM's role best?",
              options: [
                '"Three of five students missed the total on this screen"',
                '"Make the total bold and red so nobody misses it"',
                '"Use our brand orange instead of this blue"',
                '"Move the button to the top right, like the rival app"',
              ],
              answer: 0,
              explanation:
                "The PM brings the problem and the evidence and leaves the fix to the person who owns usability. Dictating a solution turns a problem into a request in disguise and stops the designer from finding a better answer.",
            },
            {
              kind: "predict",
              prompt:
                "Roost shows the ₹27,000 total on the listing page. Form opens fall from 12,800 to 10,900 a month, and sent requests rise from 8,000 to 8,200. What should the team conclude?",
              options: [
                "The change failed, since 1,900 fewer students reached the form",
                "The result is neutral, since the two changes roughly cancel out",
                "The change needs a new visual design before it can be judged",
                "The change worked, since the journey now yields more requests",
              ],
              answer: 3,
              explanation:
                "What matters is the outcome of the whole journey: 200 more requests a month, from students who already know the price. Students who leave at the listing instead of at step four have lost less time, so fewer form opens is not a loss.",
            },
          ],
        },
        {
          slug: "pm-fidelity-ladder",
          title: "Sketch, wireframe, prototype",
          summary:
            "Each rung costs more to make and to change and answers a different question; use the lowest fidelity that answers yours, and test before code.",
          contentFile: "pm-fidelity-ladder.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which question is a grayscale wireframe best placed to answer?",
              options: [
                "Whether students trust a listing enough to request it",
                "What information appears, in what order, on which screen",
                "Whether the upload works on a slow mobile connection",
                "Which of three brand color schemes students prefer",
              ],
              answer: 1,
              explanation:
                "A wireframe fixes structure and order without the cost of visuals or code. Trust needs real photos and prices, network behavior needs a coded build, and color is exactly what a wireframe leaves out.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does a Roost prototype need real listing photos and rupee amounts even when its layout is rough?",
              options: [
                "Because stakeholders will not approve a gray prototype",
                "Because Figma cannot link screens that have placeholder images",
                "Because rough layouts make students comment on colors instead",
                "Because students judge trust by the content, so it must be real",
              ],
              answer: 3,
              explanation:
                "Fidelity has several dials: looks, behavior and content. Roost's product is trust, which students read from photos, rent and charges, so content is the dial the test depends on.",
            },
            {
              kind: "predict",
              prompt:
                "The designer has three ideas for the request form, and one week. The founder wants a polished prototype of his favorite for the review. What gives the most useful review?",
              options: [
                "Rough clickable wireframes of all three, tried with students",
                "A polished prototype of the founder's favorite design",
                "A coded version of the favorite behind a feature flag",
                "A written spec comparing the three ideas side by side",
              ],
              answer: 0,
              explanation:
                "The open question is which approach works, which is cheap to answer across all three at low fidelity. Polishing one first answers a later question and steers the review toward taste before there is evidence.",
            },
          ],
        },
      ],
    },
    {
      slug: "finding-problems-early",
      title: "Finding problems early",
      description:
        "Watching five users, inspecting with a checklist, and the process that wraps them.",
      lessons: [
        {
          slug: "pm-usability-testing",
          title: "Testing with five users",
          summary:
            "Five users find most of the problems in a design because each new one mostly repeats the last; run rounds of five and fix between them, and never report a percentage.",
          contentFile: "pm-usability-testing.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "If each user reveals 31% of a design's usability problems, what share do three users reveal?",
              options: ["About 93%", "About 31%", "About 67%", "About 84%"],
              answer: 2,
              explanation:
                "Problems found are 1 - (1 - 0.31)^n, not 31% times n, because later users mostly repeat what earlier ones showed. For three users that is 1 - 0.329, about 67%; five users reach about 84%.",
            },
            {
              kind: "predict",
              prompt:
                'In a usability test, a student pauses for twelve seconds over the "Send request" button and then taps it. What should the facilitator do?',
              options: [
                "Ask afterward whether the student would use the feature",
                "Note the pause, and ask what the student expected to happen",
                "Explain what the button does so the session can continue",
                "Ignore it, since the student completed the task in the end",
              ],
              answer: 1,
              explanation:
                "Hesitation is the data: it marks where the design and the user's expectations disagree. Asking what they expected, without explaining, reveals the mismatch, which in Roost's test was a fear of being charged.",
            },
            {
              kind: "mcq",
              prompt:
                "Four of five students in a test thought sending a request would charge them. How should the PM report it?",
              options: [
                '"4 of 5 thought it would charge them; we relabeled it"',
                '"80% of students think the request button charges them"',
                '"Most students misunderstand the form, so we need a bigger study"',
                '"The result is anecdotal, since five users cannot show anything"',
              ],
              answer: 0,
              explanation:
                "Five users are enough to find a problem but not to measure how common it is, so report the count and the fix, not a percentage. Calling it anecdotal throws away a finding that four of five people hit.",
            },
          ],
        },
        {
          slug: "pm-heuristics",
          title: "Ten heuristics",
          summary:
            "Nielsen's ten heuristics let three to five people find many problems in half an hour each, but they find violations, not consequences, and do not replace watching users.",
          contentFile: "pm-heuristics.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Roost's form lets students pick a move-in date before the room is free, and the owner declines later. Which heuristic does that break?",
              options: [
                "Visibility of system status",
                "Recognition rather than recall",
                "Aesthetic and minimalist design",
                "Error prevention",
              ],
              answer: 3,
              explanation:
                "The design allows an error it could have stopped by disabling unavailable dates. Error prevention asks for exactly that, which beats any message sent after the owner declines.",
            },
            {
              kind: "mcq",
              prompt:
                "Why should heuristic evaluators review the interface separately before merging lists?",
              options: [
                "Because the severity scale only works for individual ratings",
                "Because each evaluator finds a different part of the problems",
                "Because group sessions take longer than individual reviews",
                "Because Nielsen's heuristics forbid discussing findings",
              ],
              answer: 1,
              explanation:
                "A single evaluator finds about 35% of the problems on average, and different evaluators find different ones. Working together first tends to produce one person's list with the others agreeing.",
            },
            {
              kind: "predict",
              prompt:
                "Three evaluators review the request form and log six problems. Which top reason students gave for leaving is the review least likely to have caught?",
              options: [
                'The college ID upload failing with "Error 413"',
                "Too many steps with no sign of how many remain",
                "Not expecting ₹27,000 due at the end of the form",
                "Having to retype the room's name on the last step",
              ],
              answer: 2,
              explanation:
                "Heuristics inspect the interface, and the total is displayed clearly; the problem is that the business discloses it too late. No heuristic asks whether the timing of the truth matches what users expect.",
            },
          ],
        },
        {
          slug: "pm-design-thinking",
          title: "Design thinking and the double diamond",
          summary:
            "Discover and define the problem, then develop and deliver the solution, diverging and converging twice; without evidence and a decision, the workshop is theater.",
          contentFile: "pm-design-thinking.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does the first diamond of the double diamond produce?",
              options: [
                "A defined problem, chosen after exploring the issue widely",
                "A shortlist of solutions, chosen after a brainstorm",
                "A tested prototype, ready to hand to engineering",
                "A launch plan, with the metric that will judge it",
              ],
              answer: 0,
              explanation:
                "Discover widens the view of the problem and Define narrows it to one statement to solve. Solutions belong to the second diamond, which is where most teams wrongly start.",
            },
            {
              kind: "predict",
              prompt:
                "Mid-way through Develop, round one shows four of five students fear that sending a request charges them. What does the double diamond say to do?",
              options: [
                "Finish Develop first, and note the fear for a later project",
                "Move straight to Deliver, since the fix is a simple label",
                "Return to Define, since a new fact about the problem emerged",
                "Restart Discover from scratch with a fresh round of research",
              ],
              answer: 2,
              explanation:
                "The diagram looks linear but the model expects loops: a new fact about the problem updates the problem statement. It does not throw away the research already done, so a full restart is overkill.",
            },
            {
              kind: "mcq",
              prompt: "Which sign most reliably marks a design thinking workshop as theater?",
              options: [
                "It includes people from operations and marketing",
                "It ends with many ideas and no problem or decision",
                "It uses sticky notes and whiteboards to sort ideas",
                "It lasts half a day instead of the full two days",
              ],
              answer: 1,
              explanation:
                "The model's value is in its two convergence points, a defined problem and a chosen solution. Sticky notes and mixed teams are harmless; diverging without ever converging is the failure.",
            },
          ],
        },
      ],
    },
  ],
}
