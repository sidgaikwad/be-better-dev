import type { SectionSeed } from "../../types"

export const pmPrioritization: SectionSeed = {
  slug: "pm-prioritization",
  title: "Prioritization",
  description:
    "Deciding what to build first when everything seems important: strategy before scoring, MoSCoW, RICE, value against effort, cost of delay, and saying no.",
  badgeIcon: "⚖️",
  badgeTitle: "Prioritizer",
  units: [
    {
      slug: "context-first",
      title: "Context first",
      description:
        "Why a list cannot be ranked without a strategy, and how to sort it into what must ship.",
      lessons: [
        {
          slug: "pm-strategy-before-scoring",
          title: "Why a feature list cannot be prioritized alone",
          summary:
            "A feature's priority comes from the product's situation and strategy, so write the goal and the guiding policy before scoring anything.",
          contentFile: "pm-strategy-before-scoring.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "In the video's live exercise, the class marked a food delivery feature list with no context and the result was chaotic. What was missing?",
              options: [
                "A scoring formula that weighted each feature by effort",
                "Enough features on the list to compare against each other",
                "A strategy saying who the app serves and how it differs",
                "Data from users of competing food delivery apps",
              ],
              answer: 2,
              explanation:
                "With no vision, target user or differentiator, people ranked from personal experience. Once the instructor proposed food in under 15 minutes, the same list sorted itself: differentiators became musts and features that fought the promise dropped.",
            },
            {
              kind: "predict",
              prompt:
                "A small online store sells 18 handmade products on one page. A developer proposes building product search because every e-commerce app has it. Before any scoring, what is your call?",
              options: [
                "Skip it: all 18 products fit on one scrolling page",
                "Build it: shoppers expect search on any store they visit",
                "Build it: search is cheap and will be needed eventually",
                "Skip it until a competitor with 18 products adds it",
              ],
              answer: 0,
              explanation:
                "The instructor's point: search is a must at around 5,000 products and adds nothing at 20. A feature's priority is a property of the product's situation, not of the feature.",
            },
            {
              kind: "mcq",
              prompt:
                "Where does the lesson say most disagreements about a prioritization score actually come from?",
              options: [
                "Different people using different scoring formulas",
                "Engineers estimating effort too optimistically",
                "Stakeholders who have not read the scoring sheet",
                "Unstated differences about goal and strategy",
              ],
              answer: 3,
              explanation:
                "Every framework compares value against cost, and value is defined by the goal and strategy. Writing those lines at the top of the sheet lets people argue with the assumption instead of the number.",
            },
          ],
        },
        {
          slug: "pm-moscow",
          title: "Must, should, could, won't",
          summary:
            "MoSCoW works only when Musts are a minimum usable subset under 60% of effort, with Coulds held back as contingency.",
          contentFile: "pm-moscow.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In DSDM's definition of MoSCoW, what does the W stand for?",
              options: [
                "Won't have, ever, for this product",
                "Won't have this time, not never",
                "Wish list items for a future release",
                "Work that is waiting on a dependency",
              ],
              answer: 1,
              explanation:
                "Won't have this time means agreed out of scope for this timeframe, not rejected forever. Reading it as never is why people fight to keep their items out of it.",
            },
            {
              kind: "predict",
              prompt:
                "A 30 engineer-week timebox has 24 engineer-weeks marked Must, 4 Should and 2 Could. Before work starts, what does DSDM's guidance say about this plan?",
              options: [
                "It is fine, because the Musts fit inside total capacity",
                "It is fine, as long as Shoulds are cut first if work slips",
                "It needs more Shoulds so the plan looks balanced",
                "It is over-committed: Musts exceed 60% of the effort",
              ],
              answer: 3,
              explanation:
                "DSDM caps Musts at 60%, here 18 engineer-weeks, with about 20% in Coulds as contingency. With 24 weeks of Musts and only 2 of Coulds, any slip breaks a guarantee.",
            },
            {
              kind: "mcq",
              prompt:
                "A stakeholder insists the parent page is a Must. Today students forward listing screenshots to their parents instead. Using the consortium's test, what is it?",
              options: [
                "A Should, because a clumsy workaround already exists",
                "A Must, because parents often pay for the booking",
                "A Could, because it serves parents rather than students",
                "A Won't, because it was not in the original plan",
              ],
              answer: 0,
              explanation:
                "The test asks what happens if it is not delivered. If there is a workaround, however clumsy, the release still has a point, so it is a Should: expected to ship, not guaranteed.",
            },
          ],
        },
      ],
    },
    {
      slug: "scoring",
      title: "Scoring the list",
      description: "RICE for the team, a two-by-two for the executives, and what each hides.",
      lessons: [
        {
          slug: "pm-rice",
          title: "RICE scoring",
          summary:
            "Reach times impact times confidence over effort, with impact always measured against the goal you are pursuing now.",
          contentFile: "pm-rice.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "A feature reaches 2,000 users a quarter, has high impact (2), medium confidence and takes 4 person-months. What is its RICE score?",
              options: ["1,000", "4,000", "800", "1,600"],
              answer: 2,
              explanation:
                "Medium confidence is 80% on McBride's scale: 2,000 x 2 = 4,000, x 0.8 = 3,200, divided by 4 person-months is 800.",
            },
            {
              kind: "predict",
              prompt:
                "Roost's map pin fix scores 5,200 when the goal is request-to-booking, because wrong pins hurt after booking, not before. The goal changes to fewer cancellations. What happens to its score?",
              options: [
                "Nothing, because reach and effort are unchanged",
                "Impact rises to 2; the score becomes 20,800",
                "Its confidence falls, so the score drops below 5,000",
                "Its reach doubles, because cancellations count twice",
              ],
              answer: 1,
              explanation:
                "Impact is measured against the current goal. Wrong pins cause cancellations, so against that goal impact goes from 0.5 to 2 and the score from 5,200 to 20,800, with no new data at all.",
            },
            {
              kind: "mcq",
              prompt:
                "Availability confirmation scores 5,408 and the pin fix 5,200. What should the team conclude from that gap?",
              options: [
                "They are effectively tied, so discuss both on their merits",
                "Availability wins, because a higher score is a higher priority",
                "The pin fix wins, because its confidence is 100%",
                "Both should be rescored until the gap grows larger",
              ],
              answer: 0,
              explanation:
                "Every input is a guess, and the score multiplies their errors together. A 4% gap is noise, so the top items are discussed, not ranked by the last digit.",
            },
          ],
        },
        {
          slug: "pm-value-vs-effort",
          title: "Value against effort",
          summary:
            "The two-by-two is for agreeing direction with executives; ICE is fast but ambiguous; both hide confidence, order and time.",
          contentFile: "pm-value-vs-effort.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why does the video's instructor use the value against effort matrix with executives but RICE with his team?",
              options: [
                "Executives distrust numerical scores of any kind",
                "The matrix is more accurate for strategic decisions",
                "RICE only works for features under one person-month",
                "RICE is more detail than that meeting needs",
              ],
              answer: 3,
              explanation:
                "The matrix simplifies the discussion for a CPO or CEO, while the calculations stay behind it. It is a communication device, not a more accurate method.",
            },
            {
              kind: "predict",
              prompt:
                "Idea X scores impact 9, confidence 9, ease 1. Idea Y scores 5, 5, 5. One team averages ICE scores and another multiplies them. What happens?",
              options: [
                "Both teams rank X first, because its impact is highest",
                "Both teams rank Y first, because it has no weak factor",
                "Averaging ranks X first; multiplying ranks Y first",
                "The teams tie, since both ideas total 19 or less",
              ],
              answer: 2,
              explanation:
                "Averages give X 6.3 and Y 5.0; products give X 81 and Y 125. One low factor drags a product down far more than an average, so a team must pick one method and state it.",
            },
            {
              kind: "mcq",
              prompt:
                "Owner chat sits just above the value line. Someone moves the line from 5,000 to 5,500. What does that show?",
              options: [
                "Owner chat's value estimate was wrong from the start",
                "Where the lines go is a decision that can move items",
                "The matrix needs a third axis for confidence",
                "Owner chat should be rescored with RICE instead",
              ],
              answer: 1,
              explanation:
                "No estimate changed, yet owner chat went from big bet to money pit. The lines are a choice, and on a slide that choice looks like a fact.",
            },
          ],
        },
      ],
    },
    {
      slug: "time-and-refusal",
      title: "Time and refusal",
      description:
        "What each week of waiting costs, and how to say no so the answer can be checked.",
      lessons: [
        {
          slug: "pm-cost-of-delay",
          title: "Cost of delay",
          summary:
            "Price each week of not shipping, divide by duration, and do the short, costly work first.",
          contentFile: "pm-cost-of-delay.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Job P costs ₹10,000 a week of delay and takes 1 week. Job Q costs ₹30,000 a week and takes 6 weeks. The team does one at a time. Which goes first?",
              options: [
                "P, because its CD3 of 10,000 beats Q's 5,000",
                "Q, because its weekly cost of delay is three times larger",
                "Q, because large jobs should start early to finish on time",
                "Either, because the total delay cost is the same",
              ],
              answer: 0,
              explanation:
                "P first costs 1 x ₹40,000 + 6 x ₹30,000 = ₹220,000; Q first costs 6 x ₹40,000 + 1 x ₹10,000 = ₹250,000. Dividing cost of delay by duration puts the short job first.",
            },
            {
              kind: "mcq",
              prompt:
                "Why is Roost's cost of delay for the same fix much higher in July than in November?",
              options: [
                "Engineers work more slowly during the busy season",
                "Commission per booking is higher in the summer",
                "Fixes take longer to test when traffic is high",
                "Weekly bookings are about 3.5 times higher in July",
              ],
              answer: 3,
              explanation:
                "About 2,000 bookings a week in July against about 560 off-season means the same percentage saved is worth about 3.5 times as much. Cost of delay moves with the calendar.",
            },
            {
              kind: "mcq",
              prompt: "What does SAFe's WSJF give up compared with Reinertsen's cost of delay?",
              options: [
                "The idea of dividing by job size",
                "Any notion of time criticality",
                "Money units, by using relative scores",
                "The ability to rank more than three jobs",
              ],
              answer: 2,
              explanation:
                "WSJF sums relative scores for value, time criticality and risk reduction, which is quick to agree on. The price is that nobody can say what a week of delay actually costs.",
            },
          ],
        },
        {
          slug: "pm-saying-no",
          title: "Saying no",
          summary:
            "A no that names the goal, the evidence, the alternative and what would change your mind, plus how to spot prioritization theater.",
          contentFile: "pm-saying-no.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which part turns a refusal into one the requester can check?",
              options: [
                "Explaining that the team has no capacity this season",
                "Naming the evidence that would change the decision",
                "Promising to add the request to the backlog",
                "Copying the requester's manager on the reply",
              ],
              answer: 1,
              explanation:
                "Stating what would reopen the item, with a number and a date to check it, lets the requester test the decision instead of arguing with it.",
            },
            {
              kind: "predict",
              prompt:
                "A teammate raises a founder's idea from reach 6,000 to 60,000 and confidence 50% to 100% the day after the founder mentions it. The founder wants it regardless. What do you do?",
              options: [
                "Restore the old inputs and ask for an override",
                "Keep the new inputs, since the founder will decide anyway",
                "Delete the idea from the sheet to avoid a conflict",
                "Average the old and new inputs as a compromise",
              ],
              answer: 0,
              explanation:
                "Tuned scores teach the team that scoring is politics. An open override lets the founder own a visible trade-off while the scores stay trustworthy.",
            },
            {
              kind: "mcq",
              prompt:
                "A hostel chain paying for Featured listings asks Roost to hide deposits from its listings. How should the PM answer?",
              options: [
                "Score it with RICE like any other feature request",
                "Say the team has no capacity for it this season",
                "Put it on the not-now list with a review date",
                "Decline plainly, since it breaks the strategy",
              ],
              answer: 3,
              explanation:
                'Hiding charges contradicts "record every charge", so no score can reopen it. Calling it a capacity problem only guarantees the request comes back next season.',
            },
          ],
        },
      ],
    },
  ],
}
