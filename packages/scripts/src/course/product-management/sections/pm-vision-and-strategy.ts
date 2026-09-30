import type { SectionSeed } from "../../types"

export const pmVisionAndStrategy: SectionSeed = {
  slug: "pm-vision-and-strategy",
  title: "Vision and strategy",
  description:
    "The difference between a vision, a strategy, a goal and a plan, what a real strategy contains, and how it cascades into goals a team can act on.",
  badgeIcon: "🔭",
  badgeTitle: "Strategist",
  units: [
    {
      slug: "where-and-how",
      title: "Where and how",
      description:
        "A vision that says where you are going, and a strategy that says how you get past what stands in the way.",
      lessons: [
        {
          slug: "pm-product-vision",
          title: "A vision worth following",
          summary:
            "The future you are trying to create, a few years out, and why a vision that rules nothing out is decoration.",
          contentFile: "pm-product-vision.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which of these is a product vision, rather than a goal, a tagline or fluff?",
              options: [
                "India's largest student housing platform, 20,000 bookings a month by 2030",
                "Verified rooms, every charge listed, booked from your phone in minutes",
                "Every student can move into a room never seen and find it as promised",
                "Use technology to delight students and parents across every Indian city",
              ],
              answer: 2,
              explanation:
                "A vision describes the customer's changed world a few years out, and it rules things out. The first is a goal about the company's size, the second a tagline for today's product, and the fourth permits anything.",
            },
            {
              kind: "predict",
              prompt:
                "A partner offers ₹1,000,000 a month for a feature that serves students after they move in, needing two of five engineers through the booking season. Roost's vision is about moving into a room as promised. What should the vision lead you to do?",
              options: [
                "Decline it, or openly rewrite the vision to include that business",
                "Take it, since the revenue funds the vision's work in later years",
                "Take it, but staff it with one engineer so trust work keeps four",
                "Defer it until a scoring framework ranks it against trust features",
              ],
              answer: 0,
              explanation:
                "A vision is a filter: a request that serves a different job is declined, or the vision is changed in the open. Drifting into it one deal at a time leaves a vision that no longer decides anything.",
            },
            {
              kind: "mcq",
              prompt:
                "In the video's ten-part vision document, which parts should you expect to rewrite most often?",
              options: [
                "Vision statement, target users and problem statement",
                "Introduction, unique value proposition and strategic fit",
                "Problem statement, market landscape and vision statement",
                "Goals, key features and the roadmap overview",
              ],
              answer: 3,
              explanation:
                "Goals, features and the roadmap depend on what the team learned this quarter, so they go stale within months. The vision, users and problem should hold for years, which is why they belong at the front of the document.",
            },
          ],
        },
        {
          slug: "pm-strategy-kernel",
          title: "Diagnosis, guiding policy, coherent action",
          summary:
            "Rumelt's kernel: name the obstacle, choose an approach to it, and take actions that reinforce each other.",
          contentFile: "pm-strategy-kernel.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In Rumelt's kernel, what does the guiding policy do?",
              options: [
                "It lists every action the team will take this year, in order",
                "It sets an approach to the obstacle that rules out many actions",
                "It states the measurable target the strategy must reach this year",
                "It describes the future the company wants to create for customers",
              ],
              answer: 1,
              explanation:
                "A guiding policy works like a guardrail: \"make Roost's visit stand in for the family's\" rules out cashback and unverified listings without naming them. Actions come after it, targets are goals, and the future is the vision.",
            },
            {
              kind: "predict",
              prompt:
                "In another city, few searches come up empty, but most booking requests fall through and exit surveys cite parents who want the room seen first. The founder doubles the listings. What do you predict happens to bookings?",
              options: [
                "They roughly double, since students now have twice as much choice",
                "They rise sharply, because more choice builds more trust",
                "They fall, because more listings confuse students",
                "They barely move, since the losses happen after students choose",
              ],
              answer: 3,
              explanation:
                "More supply helps only where searches find nothing. When students already find rooms and then fail to book, the obstacle is downstream, so extra listings feed a step that was not losing anyone.",
            },
            {
              kind: "mcq",
              prompt:
                "What makes Roost's five strategic actions coherent rather than a plain to-do list?",
              options: [
                "One visit produces the photos, the charges and the parent report",
                "Each action was proposed by a different team and approved by the founder",
                "All five can be shipped within a single season's capacity",
                "Each action is independent, so any one can be dropped safely",
              ],
              answer: 0,
              explanation:
                "Coherent actions reinforce each other: the visit feeds the charge list and the parent page, and verified reviews check the visit in turn. Items that can be dropped independently make a to-do list, not a strategy.",
            },
          ],
        },
        {
          slug: "pm-bad-strategy",
          title: "How to spot a bad strategy",
          summary:
            "Fluff, no diagnosis, goals dressed as strategy, and wish lists: Rumelt's four hallmarks, and a rewrite.",
          contentFile: "pm-bad-strategy.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                'A food app\'s strategy reads: "Our strategy is to be a customer-obsessed, tech-first food ecosystem." Which hallmark of bad strategy is this?',
              options: [
                "Failure to face the challenge",
                "Mistaking goals for strategy",
                "Fluff",
                "Bad strategic objectives",
              ],
              answer: 2,
              explanation:
                "Fluff restates the obvious in buzzwords that sound like insight. Every food app claims to care about customers and use technology, so the sentence commits the company to nothing.",
            },
            {
              kind: "predict",
              prompt:
                "A strategy has nine priorities, agreed after every department added one. Before you read them, what do you expect the document to rule out?",
              options: [
                "The riskiest of the nine, which finance will cut later",
                "Almost nothing, since each priority keeps a team on board",
                "Everything outside the nine, which makes it a tight strategy",
                "Whatever the lowest-ranked priority competes with",
              ],
              answer: 1,
              explanation:
                "A list built by consensus is Rumelt's \"dog's dinner\": each item was added so nobody lost, which is why it rules nothing out. Asking what the strategy tells you not to do exposes it at once.",
            },
            {
              kind: "mcq",
              prompt:
                'What is wrong with "10 cities and 20,000 bookings a month by 2028" as a strategy?',
              options: [
                "The number is too ambitious for a team of Roost's size",
                "It should be stated as a share of the market rather than a count",
                "A two-year horizon is too short for any strategy",
                "It names a target but no obstacle and no source of leverage",
              ],
              answer: 3,
              explanation:
                "This is Chad Logan's 20/20 plan again: a goal says where you want to end up, while a strategy explains how you will get past what is in the way. The number can stay, as a test of whether the kernel is enough.",
            },
          ],
        },
      ],
    },
    {
      slug: "strategy-to-work",
      title: "From strategy to work",
      description:
        "How a strategy becomes goals, a roadmap and a sprint, and how you tell whether it is working.",
      lessons: [
        {
          slug: "pm-strategy-cascade",
          title: "From vision to roadmap",
          summary:
            "Vision, strategy, goals, roadmap, backlog: what each layer answers, and how to trace a sprint back to the strategy.",
          contentFile: "pm-strategy-cascade.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "A finished ticket traces to no goal, no roadmap item and no strategic action. What should the PM do with it?",
              options: [
                "Name it as maintenance, a missed opportunity to raise, or waste",
                "Ship it anyway, since work that is already finished should not be wasted",
                "Cut it, since untraced work always conflicts with the strategy",
                "Add a new key result so that the ticket traces to something",
              ],
              answer: 0,
              explanation:
                "Untraced work is not automatically wrong, but it has to be decided in the open. Shipping it quietly lets the backlog set strategy, and inventing a key result to cover it does the same with paperwork.",
            },
            {
              kind: "predict",
              prompt:
                "The roadmap shipped on schedule all season, yet request-to-booking stayed at 50%. Where should the control loop look first?",
              options: [
                "At the backlog, to find the tickets that were estimated too optimistically",
                "At the team's velocity, since shipping faster would fix it",
                "At the diagnosis, since the plan ran and the result never came",
                "At the vision statement, since it must have been too ambitious",
              ],
              answer: 2,
              explanation:
                "When execution went as planned and the goal still missed, the evidence points at the belief the plan rested on. Control has to be able to travel up to the strategy, not only correct the next sprint.",
            },
            {
              kind: "mcq",
              prompt:
                'What is missing from the video\'s example, "grow market share 20% over three years through product innovation and partnerships"?',
              options: [
                "A time frame within which the target is due",
                "A diagnosis of what stands in the way",
                "A target that someone could actually measure",
                "Any statement of the means it will use",
              ],
              answer: 1,
              explanation:
                "It has a number, a deadline and two nouns for means, but no obstacle. Without one, the control stage can check only the number, not whether innovation or partnerships address anything.",
            },
          ],
        },
        {
          slug: "pm-okrs",
          title: "Objectives and key results",
          summary:
            "Objectives, key results that measure results rather than tasks, and a committed 1.0 against an aspirational 0.7.",
          contentFile: "pm-okrs.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                'A team\'s key results: "ship the onboarding redesign" (done), "run 20 user interviews" (done), and "activation from 30% to 40%" (reached 31%). The average is 0.7. What does that score hide?',
              options: [
                "Nothing, since 0.7 is exactly the target for aspirational OKRs",
                "That the team set the targets for its two tasks too low",
                "That committed OKRs should have scored 1.0",
                "That the one real result barely moved, masked by tasks",
              ],
              answer: 3,
              explanation:
                "Tasks score 1.0 on delivery whatever they achieve, so they pad the average. Activation moved one point of ten, a 0.1, and that is the number that says whether the season worked.",
            },
            {
              kind: "mcq",
              prompt:
                'Roost commits to "every live listing verified within the last 12 months" and ends the season at 90%. How should the team read that?',
              options: [
                "As a good score, since about 0.7 is the usual target for OKRs",
                "As a miss needing an explanation, since it is committed",
                "As a stretch result worth celebrating in the review",
                "As a sign the key result was too timid to begin with",
              ],
              answer: 1,
              explanation:
                "A committed OKR is expected at 1.0 because the team agreed to move resources to deliver it. The 0.7 norm belongs to aspirational OKRs; applying it here lets a promise the strategy depends on slip.",
            },
            {
              kind: "mcq",
              prompt: "Which of these is a key result rather than a task?",
              options: [
                "Median days from booking request to payment: 5 to 2",
                "Launch the parent page in all three cities by 15 May",
                "Run a verification drive across every Pune locality",
                "Hire two more verifiers for the Bengaluru team",
              ],
              answer: 0,
              explanation:
                "A key result measures a change in what people do, so it can miss even when every task ships. The other three are activities that score 1.0 on completion whatever they achieve.",
            },
          ],
        },
      ],
    },
  ],
}
