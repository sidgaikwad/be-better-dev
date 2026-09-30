import type { SectionSeed } from "../../types"

export const pmPersonasAndSegments: SectionSeed = {
  slug: "pm-personas-and-segments",
  title: "Segments and personas",
  description:
    "Cutting a market into groups worth serving, picking which to serve first, and turning research into personas a team can actually use.",
  badgeIcon: "👥",
  badgeTitle: "Personas",
  units: [
    {
      slug: "cutting-the-market",
      title: "Cutting the market",
      description: "Which groups behave differently, and which one to win first.",
      lessons: [
        {
          slug: "pm-segmentation",
          title: "Four ways to cut a market",
          summary:
            "Demographic, geographic, psychographic and behavioral cuts, and why the cut by need is the one that predicts who books.",
          contentFile: "pm-segmentation.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Roost's deck split students by gender and city, and every slice booked at 6.3% to 7.1% a month. Why did it change no decision?",
              options: [
                "The groups behaved alike, so no cut pointed anywhere",
                "Signup data on gender and city is too unreliable",
                "Six slices are too few to find a pattern in 60,000",
                "Pie charts hide differences that a table would show",
              ],
              answer: 0,
              explanation:
                "A segmentation earns its keep only when the groups behave differently. When every slice books near the 6.7% average, no slice tells you whom to build for or where to spend.",
            },
            {
              kind: "predict",
              prompt:
                "A values survey finds 'safety-conscious' students book at 7.0% against 6.5% for the rest. Another cut, 'has never visited the city', books at 11.5% against 3.8%. Predict which cut will guide more product decisions.",
              options: [
                "The safety cut, since values drive choices more than history",
                "The visit cut, since its gap is large and has a clear cause",
                "Both equally, since each splits the market into two groups",
                "Neither, since only demographic cuts can be used in ads",
              ],
              answer: 1,
              explanation:
                "A useful cut shows a sharp difference in behavior with a reason you can name. Half a point between values groups changes nothing; a threefold gap tied to being unable to inspect a room points straight at verification.",
            },
            {
              kind: "mcq",
              prompt:
                "Which test do needs-based segments usually fail, and how do teams handle it?",
              options: [
                "They are hard to measure, so teams swap them for surveys",
                "They change every season, so teams re-cut them monthly",
                "They are hard to reach directly, so teams use proxies",
                "They are too small to matter, so teams merge them away",
              ],
              answer: 2,
              explanation:
                "No ad platform targets 'moving to a new city next month'. Teams keep the need as the definition and reach it through proxies: the admission calendar, first-year groups, a home city that differs from the college's.",
            },
          ],
        },
        {
          slug: "pm-choosing-a-segment",
          title: "Picking who to serve first",
          summary:
            "Score segments on pull, fit, reach and cost, choose a targeting strategy, and win one beachhead before reaching for the next.",
          contentFile: "pm-choosing-a-segment.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In the beachhead argument, what role does a segment's size play?",
              options: [
                "It is the first ranking criterion, since revenue scales with it",
                "It matters only for differentiated targeting, not concentrated",
                "It should be ignored, because small segments are easier to win",
                "It is a floor: big enough to fund the next step, not a score",
              ],
              answer: 3,
              explanation:
                "Size has to clear a bar so the win can pay for what comes next. Past that bar, pull and fit decide, because a bigger segment you cannot win is worth less than a smaller one you can.",
            },
            {
              kind: "predict",
              prompt:
                "A four-person team has a product one segment loves (10% book monthly) and two larger segments tolerate (2% each). Predict which targeting strategy gets it furthest this year.",
              options: [
                "Undifferentiated, one message to all three segments at once",
                "Differentiated, a tailored version for each of the three",
                "Concentrated, winning the segment that already loves it",
                "Micro, personalizing the product for each single customer",
              ],
              answer: 2,
              explanation:
                "A small team cannot fund three versions, and one message for everyone blurs what the keen segment values. Concentrating where pull is strongest wins a beachhead whose word of mouth helps with the next segment.",
            },
            {
              kind: "mcq",
              prompt:
                "After winning first-years moving to a new city, which next segment best fits Moore's bowling-pin idea?",
              options: [
                "Young professionals, the largest pool of renters in each city",
                "Those same students a year later, moving within the city",
                "Any segment that happens to book between September and May",
                "Families buying homes, where each sale earns the most",
              ],
              answer: 1,
              explanation:
                "A good next pin shares something the first win carries over: these students already trust Roost, and their parents and the owners are the same. Size or off-season timing alone carries nothing over.",
            },
          ],
        },
      ],
    },
    {
      slug: "people-in-the-segment",
      title: "The people in the segment",
      description: "Personas built from research, and the buyer who is not the user.",
      lessons: [
        {
          slug: "pm-personas",
          title: "Personas built from evidence",
          summary:
            "A persona is a fiction built from research: goals, frustrations and context you can trace, and nothing the team cannot use.",
          contentFile: "pm-personas.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which line most clearly earns a place in Roost's first-year persona?",
              options: [
                "Cannot see a room before paying, so relies on photos",
                "Aged 19, from Nagpur, studying engineering in Pune",
                "Loves K-pop and spends three hours a day on Instagram",
                "Prefers cold coffee and hopes to study abroad later",
              ],
              answer: 0,
              explanation:
                "Every line should help make a product decision. Being unable to inspect a room drives verification, dated photos and full cost on the listing; age, hobbies and drinks change nothing the team builds.",
            },
            {
              kind: "predict",
              prompt:
                "Next May, 10 of 15 interviewed first-years name hidden charges as their top frustration and 3 name mismatched photos. The persona lists photos first. Predict the right move.",
              options: [
                "Keep it as is, so the team's shared language stays stable",
                "Write a second persona for students who care about charges",
                "Wait for a large survey before changing anything in it",
                "Reorder the frustrations with the new counts and date them",
              ],
              answer: 3,
              explanation:
                "A persona summarizes research, so when fresh evidence contradicts a line, the line changes. A second persona would invent a new segment where the evidence shows the same people with a shifted priority.",
            },
            {
              kind: "mcq",
              prompt: "In Cooper's approach, how should a design treat a secondary persona?",
              options: [
                "Give it an equal share of every screen with the primary",
                "Add its needs where they do not break the primary's design",
                "Ignore it until every need of the primary persona is met",
                "Build it a separate product so neither design is compromised",
              ],
              answer: 1,
              explanation:
                "Each interface serves one primary persona. A secondary persona is mostly served by that design and gets additions only where they cost the primary nothing, like Karthik's rent and distance placed below the proof.",
            },
          ],
        },
        {
          slug: "pm-buyer-and-user",
          title: "The buyer is not always the user",
          summary:
            "When a parent pays for a student's room, or a team lead buys the developers' tool, build the product for the user and the purchase for the buyer.",
          contentFile: "pm-buyer-and-user.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Which sign most clearly means a product needs a buyer persona alongside its user persona?",
              options: [
                "The product has several screens for different tasks",
                "Users request more features than the team can build",
                "Someone other than the user decides whether it is bought",
                "The product is sold through an app store with ratings",
              ],
              answer: 2,
              explanation:
                "When the person paying is not the person using, the purchase has its own trigger, fears and criteria. The video treats this as the exception; for any product someone else pays for, it is the normal case.",
            },
            {
              kind: "predict",
              prompt:
                "An analytics tool wins over the VP who signs the contract with a cost-savings dashboard, but analysts find daily queries slower than in their old tool. Predict the next year.",
              options: [
                "It is bought, then cut back or cancelled at renewal",
                "It is never bought, because the analysts block the deal",
                "It spreads, because the VP mandates it across teams",
                "Nothing changes, since only the buyer's view counts",
              ],
              answer: 0,
              explanation:
                "The economic buyer can sign, but the users decide whether the tool gets used. A product the buyer loves and the users avoid is bought once and shrinks or disappears at renewal.",
            },
            {
              kind: "mcq",
              prompt:
                "By the lesson's rule, what belongs on the page a Roost student sends to a paying parent?",
              options: [
                "A weekly attendance report from the PG owner",
                "The student's search history and full shortlist",
                "A separate search so the parent can pick rooms",
                "Who verified the room, when, and every charge",
              ],
              answer: 3,
              explanation:
                "Build the purchase for the buyer: the father's decision criteria are who checked the room, the total cost and the owner's identity. Reports and search history hand the buyer control over the user, which drives students away from the listing.",
            },
          ],
        },
      ],
    },
  ],
}
