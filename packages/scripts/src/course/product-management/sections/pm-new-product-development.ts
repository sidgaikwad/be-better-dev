import type { SectionSeed } from "../../types"

export const pmNewProductDevelopment: SectionSeed = {
  slug: "pm-new-product-development",
  title: "New product development",
  description:
    "The classic stage-by-stage path from idea to commercialization, with the idea generation, screening, concept testing and business analysis that decide what enters it.",
  badgeIcon: "🏭",
  badgeTitle: "Pipeline",
  units: [
    {
      slug: "the-process",
      title: "The process",
      description: "The stages a new product passes through, and the gates that stop most ideas.",
      lessons: [
        {
          slug: "pm-npd-stages",
          title: "Eight stages from idea to launch",
          summary:
            "Kotler's eight stages, Cooper's gates that decide what stops, and which stages software compresses without skipping.",
          contentFile: "pm-npd-stages.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In Cooper's Stage-Gate system, what is a gate?",
              options: [
                "A milestone confirming that the stage's planned work is complete",
                "A decision where resource owners choose go, kill, hold or recycle",
                "A review where the team demos its progress to interested stakeholders",
                "A checklist of documents each stage must produce before moving on",
              ],
              answer: 1,
              explanation:
                "A gate is a decision against written criteria, taken by the people who control the money, and kill is one of its outcomes. A gate that only confirms work is finished has become a status meeting.",
            },
            {
              kind: "predict",
              prompt:
                "A software team plans a new product that needs six engineers for ten weeks. It says the launch will double as its test market, so it will skip the concept test and the business case. What is the flaw?",
              options: [
                "A software launch cannot work as a test market, so it tests nothing",
                "Concept tests only matter for physical products made in factories",
                "The business case belongs after launch, once real data exists",
                "The skipped stages are the cheap ones that could stop the costly build",
              ],
              answer: 3,
              explanation:
                "Software does make test marketing cheap, through betas and small rollouts. It does not make the build cheap: sixty engineer-weeks are spent before the launch teaches anything, while a concept test and a business case take days.",
            },
            {
              kind: "mcq",
              prompt:
                "Stevens and Burley found roughly 3,000 raw ideas behind each commercial success. What does that imply for how the stages are run?",
              options: [
                "Most ideas should die early, while each one still costs very little",
                "Teams should generate fewer ideas so that each gets more attention",
                "Every idea deserves a prototype, since screening cannot predict success",
                "The launch deserves the most care, since that is where products fail",
              ],
              answer: 0,
              explanation:
                "If almost every idea will die, the process has to kill them while they are cheap. That is why Stage-Gate raises spending stage by stage and puts the cheap decisions first.",
            },
          ],
        },
      ],
    },
    {
      slug: "ideas-in-and-out",
      title: "Ideas in, ideas out",
      description:
        "Filling the pipeline with ideas on purpose, then screening it down to the few worth testing.",
      lessons: [
        {
          slug: "pm-idea-generation",
          title: "Generating ideas on purpose",
          summary:
            "Where ideas come from, the video's mind maps, SCAMPER and workshops, and why people should write alone before the group talks.",
          contentFile: "pm-idea-generation.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why do people who write ideas alone and then pool them usually out-produce a brainstorming group of the same size?",
              options: [
                "Groups criticize ideas more harshly, even when told not to criticize",
                "Individuals try harder when their names are attached to their ideas",
                "Only one person talks at a time, and ideas fade while others wait",
                "Groups settle on the leader's first idea and then stop generating",
              ],
              answer: 2,
              explanation:
                "Diehl and Stroebe traced most of the loss to production blocking: waiting for your turn to speak. Writing alone first removes the wait, which is why silent writing beats an open discussion.",
            },
            {
              kind: "predict",
              prompt:
                "A team runs SCAMPER on its booking flow and gets seven ideas in ten minutes, five of them clearly bad. The designer says the technique failed. What do you tell her?",
              options: [
                "It worked: the prompts exist to push ideas in unfamiliar directions",
                "It failed: SCAMPER should only produce ideas that pass a screen",
                "It failed: the team should have scored each idea as it came up",
                "It worked, but only the two good ideas should be written down",
              ],
              answer: 0,
              explanation:
                "At the generation stage, bad ideas are the price of new directions, and odd ideas often combine into good ones. Judging during generation, or discarding ideas before the screen, kills the odd ones first.",
            },
            {
              kind: "mcq",
              prompt:
                "What is the main reason to put Roost's operations team in an ideation workshop?",
              options: [
                "They can estimate how long each idea would take to build",
                "They represent the owners, who are Roost's paying customers",
                "They will run any new service, so they should approve it early",
                "They see evidence at the door that no other team ever sees",
              ],
              answer: 3,
              explanation:
                "A workshop's mix matters more than its method because each function has seen different evidence. Operations' visit notes hold what owners and students say in person, which no dashboard shows.",
            },
          ],
        },
        {
          slug: "pm-idea-screening",
          title: "Screening ideas",
          summary:
            "Knock-out criteria, a weighted scoring matrix and the Pugh matrix, and why the founder's idea has to go through the same table.",
          contentFile: "pm-idea-screening.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What separates Cooper's must-meet criteria from his should-meet criteria?",
              options: [
                "Must-meets are set by executives; should-meets are set by the team",
                "Must-meets apply at the final gate; should-meets apply at the first",
                "Must-meets are weighted twice as heavily as should-meets in the total",
                "Must-meets are yes-or-no knock-outs; should-meets are scored",
              ],
              answer: 3,
              explanation:
                "A single no on a must-meet, such as strategic fit, kills an idea whatever its other merits. Only ideas that pass every knock-out are scored and ranked on the should-meets.",
            },
            {
              kind: "predict",
              prompt:
                "Two ideas score 3.45 and 3.30 on a weighted matrix where one point on the top criterion moves a score by 0.35. The team wants to test only the higher one. What should happen?",
              options: [
                "Test the 3.45 idea, since the matrix exists to settle close calls",
                "Treat them as tied and let a cheap test of each one decide",
                "Add criteria until the gap between the two ideas grows wider",
                "Merge the two ideas into one concept that combines both",
              ],
              answer: 1,
              explanation:
                "A gap of 0.15 is smaller than one disagreement on one score, so the ranking is noise. Scores are opinions with decimals; evidence from concept tests breaks the tie, not the second decimal place.",
            },
            {
              kind: "mcq",
              prompt: "How did Stuart Pugh intend his concept selection matrix to be used?",
              options: [
                "Pick the winner by summing each concept's pluses and minuses",
                "Weight each criterion so the most important one decides",
                "Rerun it, fixing the leader's weaknesses by borrowing from others",
                "Compare every idea in the pipeline against company strategy",
              ],
              answer: 2,
              explanation:
                "Pugh meant it as controlled convergence: the sums point to a strong concept, the team attacks its minuses with ideas from the others, and the matrix is rerun with a new datum. Summing once and stopping throws that away.",
            },
          ],
        },
      ],
    },
    {
      slug: "before-the-build",
      title: "Before the build",
      description:
        "Testing a concept with the people who would pay, and checking that it makes money.",
      lessons: [
        {
          slug: "pm-concept-testing",
          title: "Testing a concept before building it",
          summary:
            "Concept statements, purchase-intent surveys, and why what people say they will buy is a ceiling, not a forecast.",
          contentFile: "pm-concept-testing.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "In the video's fitness app test, 75% of respondents preferred the AI trainer to gamified tracking. What does that establish?",
              options: [
                "Which of the two concepts people favored when shown them together",
                "That three in four target users will download the AI trainer",
                "That the AI trainer will earn more revenue than gamified tracking",
                "That the AI trainer solves a problem people will pay to solve",
              ],
              answer: 0,
              explanation:
                "A preference between two concepts is relative: if neither is something people would use, one still wins. It says nothing about adoption or payment, which need their own measure.",
            },
            {
              kind: "predict",
              prompt:
                "In a survey about a new paid tool, 12% of owners said 'definitely would buy', and a two-week offer at the real price then sold to 5%. A survey for a different owner tool finds 20% 'definitely'. What is a reasonable first forecast?",
              options: [
                "About 20%, since only 'definitely' answers are counted",
                "About 12%, the rate the first survey's top box showed",
                "About 8%, applying the first test's ratio of 5 to 12",
                "About 5%, since the earlier test already measured demand",
              ],
              answer: 2,
              explanation:
                "The first test sold to 5% where 12% said 'definitely', a ratio of about 0.42, and 20% x 0.42 is about 8%. The survey sets the ceiling; a ratio learned from behavior turns it into a forecast.",
            },
            {
              kind: "mcq",
              prompt:
                "According to Morwitz, Steckel and Gupta (2007), when do stated purchase intentions track real purchases most closely?",
              options: [
                "For new products, since respondents have no habits to bias them",
                "For existing, specific products bought within a short horizon",
                "For whole product categories asked about over a long horizon",
                "For any product, as long as the survey sample is large enough",
              ],
              answer: 1,
              explanation:
                "Intentions track purchases better for existing products, specific products and short horizons. A new service described in a survey is the weak case on all three, so its stated intent needs a behavior check.",
            },
          ],
        },
        {
          slug: "pm-business-analysis",
          title: "Does it make money",
          summary:
            "Break-even units worked in full on the video's fitness tracker, the sensitivity that finds which assumption flips the answer, and why units are not months.",
          contentFile: "pm-business-analysis.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "A product has ₹40,000,000 of fixed costs, earns ₹2,500 net per unit, and costs ₹1,700 per unit to make and ship. What is break-even?",
              options: ["16,000 units", "50,000 units", "23,529 units", "9,524 units"],
              answer: 1,
              explanation:
                "Break-even divides fixed costs by contribution, the ₹800 each unit leaves after its own costs: ₹40,000,000 / ₹800 = 50,000. Dividing by the price ignores that every sale carries a cost of its own.",
            },
            {
              kind: "predict",
              prompt:
                "The tracker breaks even at 50,000 units against a 100,000 forecast. Which of these is most likely to turn its first year into a loss?",
              options: [
                "A 30% shortfall in unit sales, price unchanged",
                "A 12.5% cut in price, sales on forecast",
                "A 20% rise in component costs, sales on forecast",
                "A price war that lowers price and volume at once",
              ],
              answer: 3,
              explanation:
                "Each single change leaves a profit, but a price war moves two assumptions together: ₹3,500 and 70,000 units earn ₹57,750,000 against ₹60,000,000 of fixed costs. Sensitivity analysis has to combine the assumptions that move together.",
            },
            {
              kind: "mcq",
              prompt:
                "The instructor says the tracker should break even in about six months. Why is that weaker than the break-even units figure?",
              options: [
                "It assumes even monthly sales, while launches sell in bursts",
                "It ignores that break-even units change from month to month",
                "It uses the retail price rather than the price the company gets",
                "It treats launch marketing as a variable cost instead of fixed",
              ],
              answer: 0,
              explanation:
                "Six months is 50,000 divided by an even 8,333 a month. Real sales come in bursts and fixed costs are spent before launch, so the date depends on the sales curve, which the business case should draw month by month.",
            },
          ],
        },
      ],
    },
  ],
}
