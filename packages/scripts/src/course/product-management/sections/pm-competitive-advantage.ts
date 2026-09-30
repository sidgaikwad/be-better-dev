import type { SectionSeed } from "../../types"

export const pmCompetitiveAdvantage: SectionSeed = {
  slug: "pm-competitive-advantage",
  title: "Competitive advantage",
  description:
    "How a product wins against rivals and keeps winning: generic strategies, core competencies, the five forces that set an industry's profits, and SWOT used honestly.",
  badgeIcon: "🏰",
  badgeTitle: "Moat",
  units: [
    {
      slug: "ways-to-win",
      title: "Ways to win",
      description:
        "Choose the advantage you will pay for, then check whether anything you do is hard to copy.",
      lessons: [
        {
          slug: "pm-generic-strategies",
          title: "Cost, differentiation, or focus",
          summary:
            "Porter's three ways to beat an industry's average, why cost leadership is about cost rather than price, and why chasing all three leaves you stuck in the middle.",
          contentFile: "pm-generic-strategies.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In Porter's sense, what makes a company a cost leader?",
              options: [
                "It charges the lowest price in its industry",
                "It has the industry's lowest cost per customer",
                "It sells mainly to the most price-sensitive segment",
                "It matches every rival's discount within a week",
              ],
              answer: 1,
              explanation:
                "Cost leadership is a cost position, not a price. Low cost lets a company price low and still earn; a low price without low cost, such as free service funded by a parent company, says nothing about the cost position.",
            },
            {
              kind: "predict",
              prompt:
                "Roost charges owners 8% of a ₹9,000 rent and a self-listing rival charges 4%, a gap of ₹360 per booking. An empty bed costs an owner ₹300 a day. When is Roost's higher fee worth paying?",
              options: [
                "Only if the rival's listings get fewer views",
                "Never, since the rival charges half as much per booking",
                "Only if the owner lists on a single app",
                "If a Roost booking fills the bed 1.2 days sooner",
              ],
              answer: 3,
              explanation:
                "₹360 / ₹300 = 1.2 days. Differentiation works when the value the buyer gets exceeds the premium it pays, so the question is how much sooner the bed fills, not which fee is lower.",
            },
            {
              kind: "mcq",
              prompt:
                "Roost pursues differentiation focus: visited rooms for students near campus. Which proposal moves it most directly toward being stuck in the middle?",
              options: [
                "An unvisited listing tier at half the commission",
                "A higher Featured price for large hostels",
                "Two more verifiers hired ahead of the admission season",
                "Visit dates shown on every listing photo",
              ],
              answer: 0,
              explanation:
                "An unvisited tier dilutes the promise that earns Roost its premium, and it competes on cost with self-listing portals that spend almost nothing per listing. The other moves reinforce the differentiation or price it.",
            },
          ],
        },
        {
          slug: "pm-core-competencies",
          title: "What you do that others cannot copy",
          summary:
            "Prahalad and Hamel's three tests, run on Roost's in-person verification: the visits are an activity anyone can buy, but the learning built on them could become a moat.",
          contentFile: "pm-core-competencies.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Prahalad and Hamel's first test asks whether a competence gives access to a wide variety of markets. What does that test rule out?",
              options: [
                "A capability rivals could buy from a vendor",
                "A benefit customers do not notice or value",
                "A strength that serves only one product",
                "A process that competitors copied last year",
              ],
              answer: 2,
              explanation:
                "Breadth is what makes a competence corporate: like roots feeding a whole tree, it supports many products, as Honda's engines fed cars, motorcycles, lawn mowers and generators. A skill that serves one product is a good feature, not a core competence.",
            },
            {
              kind: "predict",
              prompt:
                "A well-funded rival decides to copy Roost's verification. What can it match within one season?",
              options: [
                "The visits themselves, by hiring verifiers",
                "Nothing, since visits are hard to organize at scale",
                "The checklist refined against three seasons of disputes",
                "The trust parents already place in the Roost name",
              ],
              answer: 0,
              explanation:
                "Visiting 1,200 properties costs about ₹720,000, which money buys in a season. What takes seasons to match is the learning that joins visit findings to later disputes, which is why the visits alone fail the imitation test today.",
            },
            {
              kind: "mcq",
              prompt:
                "Why do Prahalad and Hamel warn against outsourcing a core competence to save money?",
              options: [
                "Vendors always raise prices once they are established",
                "Outsourcing contracts cannot include quality targets",
                "Customers stop trusting companies that outsource key work",
                "The skills behind the next product cannot be rented in",
              ],
              answer: 3,
              explanation:
                "The learning happens where the work is done. Chrysler's outsourced engines grew from 252,000 to 382,000 between 1985 and 1987 while Honda kept engines in-house, and a vendor who also serves your rivals turns your advantage into something anyone can buy.",
            },
          ],
        },
      ],
    },
    {
      slug: "reading-the-field",
      title: "Reading the field",
      description:
        "Read an industry's structure, then turn an honest SWOT into strategies you can choose between.",
      lessons: [
        {
          slug: "pm-five-forces",
          title: "The five forces",
          summary:
            "Why industry structure sets profits, and the five forces run on Indian student housing apps, where substitutes and free-switching buyers cap what Roost can charge.",
          contentFile: "pm-five-forces.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "According to Porter, what sets an industry's long-run profitability?",
              options: [
                "The strongest of the five competitive forces",
                "How useful the industry's product is to buyers",
                "The growth rate of the industry's market",
                "The number of direct rivals in the market",
              ],
              answer: 0,
              explanation:
                "The strongest force or forces decide how much of the value an industry creates it gets to keep. Airlines are useful and large, yet earned 5.9% on invested capital from 1992 to 2006, because all five forces are strong.",
            },
            {
              kind: "predict",
              prompt:
                "A rival offers owners 0% commission, but only if they delist from Roost and list with it alone. Which owners are most likely to accept?",
              options: [
                "Small PGs that get most of their bookings from Roost",
                "Owners who pay for Featured listings on Roost",
                "Well-located PGs that fill their beds without help",
                "New owners whose properties were just visited",
              ],
              answer: 2,
              explanation:
                "Exclusivity makes an owner give up Roost's students, which costs little only for PGs that fill anyway. That is where supplier power sits, so those are the few owners worth a special deal; owners who depend on Roost's demand stay.",
            },
            {
              kind: "mcq",
              prompt:
                "In the lesson's analysis, which force most limits what student housing apps can charge?",
              options: [
                "Rivalry among the handful of student housing apps",
                "Substitutes such as brokers and WhatsApp groups",
                "Supplier power of the property owners",
                "The threat of new apps entering each city",
              ],
              answer: 1,
              explanation:
                "Of Pune first-years who searched but did not book, 96% went to brokers, WhatsApp groups, relatives and similar alternatives, and 4% to another app. Substitutes put a ceiling on price, and here they are the strongest force.",
            },
          ],
        },
        {
          slug: "pm-swot",
          title: "SWOT without the theater",
          summary:
            "Internal versus external, evidence on every item, and Weihrich's TOWS pairing that turns four lists into strategies you can choose between.",
          contentFile: "pm-swot.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does Weihrich's TOWS matrix add to a plain SWOT?",
              options: [
                "A fifth box for trends that fit no other box",
                "A score for each factor from one to five",
                "A ranking of competitors by how threatening they are",
                "Pairings of inside and outside factors into moves",
              ],
              answer: 3,
              explanation:
                "Weihrich added no new factors; he matched them. Pairing a strength or weakness with an opportunity or threat (SO, ST, WO, WT) makes each factor point at an action, the step Hill and Westbrook found missing.",
            },
            {
              kind: "mcq",
              prompt:
                "The offsite SWOT has 43 sticky notes and no numbers. What should change first?",
              options: [
                "Add a fifth box for trends so nothing is missed",
                "Keep two or three items per box, each with evidence",
                "Have the founder rank the notes by gut feeling",
                "Merge threats into weaknesses so the grid is simpler",
              ],
              answer: 1,
              explanation:
                "Hill and Westbrook found SWOT lists averaging over 40 factors, never prioritized or checked, and never used afterwards. A short list with evidence can be paired into strategies; a long list of assertions cannot.",
            },
            {
              kind: "predict",
              prompt:
                'At the offsite, someone files "our verification backlog is 300 properties before June" under threats. What goes wrong if it stays there?',
              options: [
                "Nothing, since the grid treats all four boxes alike",
                "It gets counted twice, once for each side of the line",
                "The team treats a fixable problem as outside weather",
                "It forces a WT strategy, which is always defensive",
              ],
              answer: 2,
              explanation:
                "A backlog is internal: Roost controls hiring and scheduling, so it is a weakness to fix. Filed as a threat, it reads like weather the team can only respond to, and its TOWS pairings point at the wrong kind of action.",
            },
          ],
        },
      ],
    },
  ],
}
