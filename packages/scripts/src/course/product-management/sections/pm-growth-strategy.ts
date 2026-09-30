import type { SectionSeed } from "../../types"

export const pmGrowthStrategy: SectionSeed = {
  slug: "pm-growth-strategy",
  title: "Growth strategy",
  description:
    "Where the next growth comes from: new markets or new products, which bets to fund across a portfolio, markets with no competition yet, and the S-curve that says when.",
  badgeIcon: "📈",
  badgeTitle: "Growth",
  units: [
    {
      slug: "where-to-grow",
      title: "Where growth comes from",
      description: "Four directions to grow, and how a portfolio decides which ones get the cash.",
      lessons: [
        {
          slug: "pm-ansoff-matrix",
          title: "Four ways to grow",
          summary:
            "Penetration, product and market development, diversification, and why you count what is new before trusting a cell.",
          contentFile: "pm-ansoff-matrix.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Under Ansoff's original definition, where a market is the job the product performs, where does Roost's Chennai launch belong?",
              options: [
                "Diversification, since the city, owners and staff are all new",
                "Close to penetration: the same job for new customers",
                "Product development, since every Chennai listing is new",
                "Market development, since any new city is a new market",
              ],
              answer: 1,
              explanation:
                "Ansoff paired products with missions, and his penetration included new customers for present products. Chennai's first-years need the same verified room before term, so only local pieces are new, which puts its risk near penetration's.",
            },
            {
              kind: "mcq",
              prompt: "What did Ansoff's 1957 article say about the risk of the four strategies?",
              options: [
                "He ranked all four in a table, from safest to riskiest",
                "He said the four carry similar risk when well planned",
                "He said the two developments were riskier than diversifying",
                "He said diversification stands apart, needing new skills",
              ],
              answer: 3,
              explanation:
                "Ansoff said a well-run business pursues the first three together, and that diversification stands apart because it breaks with past skills and facilities. The tidy low-to-high ladder is a later teaching gloss.",
            },
            {
              kind: "mcq",
              prompt:
                "The founder files flats for young professionals under market development. What does counting what is new show?",
              options: [
                "The product changes too, so it sits nearer diversification",
                "It is penetration, since Roost already runs in Bengaluru",
                "It is product development, since the checks are the same",
                "It is plain market development, just as the founder filed it",
              ],
              answer: 0,
              explanation:
                "A leased flat is not a PG room, so the customer, the job and the product all change. By the grid's own rules that is related diversification, which carries more risk than the founder's label suggests.",
            },
          ],
        },
        {
          slug: "pm-bcg-matrix",
          title: "Stars, cash cows, question marks, dogs",
          summary:
            "Relative share and market growth sort business units into four cells, and cash flows from cows to question marks.",
          contentFile: "pm-bcg-matrix.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Jio could be drawn as a star or as a cash cow. What decides which?",
              options: [
                "Whether its revenue or its profit is larger this year",
                "Whether Reliance treats it as a unit or a division",
                "Which market it is measured in: connections or data",
                "Whether its share is compared with all rivals or one",
              ],
              answer: 2,
              explanation:
                "Both axes are measured against a market, so choosing the market chooses the cell. Connections and data grow at different rates against different rivals, and the matrix cannot tell you which definition is right.",
            },
            {
              kind: "predict",
              prompt:
                "A company classified its units in 2020 and still sets budgets by those labels in 2024. Given BCG's own 2014 review, what should you expect?",
              options: [
                "Some labels are stale: units now change cells faster",
                "The labels hold, since units stay in a cell about a decade",
                "Only the pets will have moved, as they are least stable",
                "The labels hold as long as the 10% cutoff is kept",
              ],
              answer: 0,
              explanation:
                "BCG found the average time in a quadrant fell from about four years to under two in most industries. A four-year-old label is probably wrong, so reclassify every year before it sets a budget.",
            },
            {
              kind: "predict",
              prompt:
                "A company splits its growth money in proportion to each unit's revenue. What happens to a small question mark under that rule?",
              options: [
                "It grows fastest, since small units scale easily",
                "It gets its fair share and becomes a star in time",
                "It becomes a cash cow once its market stops growing",
                "It gets too little to win and drifts toward a pet",
              ],
              answer: 3,
              explanation:
                "A question mark needs more cash than its revenue justifies to reach leadership. A proportional share keeps it alive without letting it win, the path Henderson described from question mark to pet.",
            },
          ],
        },
      ],
    },
    {
      slug: "new-space-and-timing",
      title: "New space and timing",
      description:
        "Making competition matter less for a while, and knowing when a curve will bend.",
      lessons: [
        {
          slug: "pm-blue-ocean",
          title: "Blue oceans",
          summary:
            "Kim and Mauborgne's red and blue oceans, the eliminate-reduce-raise-create grid, and why new space fills up.",
          contentFile: "pm-blue-ocean.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Where do Kim and Mauborgne say most blue oceans come from?",
              options: [
                "From technologies that did not exist a decade before",
                "From inside red oceans, by stretching boundaries",
                "From markets with no competitors of any kind",
                "From regulation opening up closed industries",
              ],
              answer: 1,
              explanation:
                "The authors say most blue oceans come from reshaping an existing industry, as Cirque reshaped the circus. The video's description, a market with no competitor at all, goes further than theirs.",
            },
            {
              kind: "predict",
              prompt:
                "A team's grid lists four items under raise and three under create, and nothing under eliminate or reduce. What does it describe?",
              options: [
                "A blue ocean, since it offers more than any rival does",
                "A cheaper product, since new factors replace old ones",
                "A costlier product: nothing pays for the additions",
                "Lower demand, since customers dislike added features",
              ],
              answer: 2,
              explanation:
                "Value innovation raises buyer value while cutting cost, and the cuts come from eliminate and reduce. Cirque paid for its theater by dropping animals and stars; a grid of additions only raises cost.",
            },
            {
              kind: "mcq",
              prompt:
                "Cirque du Soleil had no circus rival for its audience. What did it still compete with for those customers' money?",
              options: [
                "Other circuses that dropped their animal acts",
                "Television networks that filmed its shows",
                "Street performers working the same cities",
                "Theater and other evenings out for adults",
              ],
              answer: 3,
              explanation:
                "Uncontested depends on where you draw the industry's line. Cirque left the circus fight behind but sold to adults choosing between it, theater and any other night out, which is why truly uncontested markets are rare.",
            },
          ],
        },
        {
          slug: "pm-s-curves",
          title: "S-curves and timing",
          summary:
            "Technology and adoption S-curves, jumping to the next curve, and why the bend is invisible from inside.",
          contentFile: "pm-s-curves.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does Foster's technology S-curve plot?",
              options: [
                "Performance against the cumulative effort put in",
                "The share of a population that has adopted, over time",
                "Revenue against the number of customers served",
                "Market share against the growth of the market",
              ],
              answer: 0,
              explanation:
                "Foster's curve shows how much each unit of effort improves a technology, which slows near its limit. The adoption curve, Rogers's, plots the share of people over time and answers a different question.",
            },
            {
              kind: "predict",
              prompt:
                "A metric has doubled every quarter for a year, and a teammate projects two more years of doubling. What does the curve so far tell you?",
              options: [
                "It confirms the projection, since the trend is steady",
                "It shows the bend is near, since fast growth always slows",
                "Nothing yet: an S's early stretch looks exponential too",
                "It proves the market is larger than first estimated",
              ],
              answer: 2,
              explanation:
                "The first part of an S-curve is indistinguishable from exponential growth, so the data cannot show where the bend is. Estimate the limit, such as how many people could ever adopt, instead of extending the line.",
            },
            {
              kind: "predict",
              prompt:
                "An automated check costs ₹25 and finds 75% of the problems a ₹600 visit finds. Where should Roost use it first?",
              options: [
                "Everywhere, replacing visits, since it is 24 times cheaper",
                "As a first pass, and on listings that get no check today",
                "Nowhere, until it finds everything a visit finds",
                "Only in new cities, where no parent expects a visit",
              ],
              answer: 1,
              explanation:
                "Where there is no check today, finding 75% of problems is pure gain, and a first pass saves visits without weakening the promise. Replacing visits would put about 1,200 bookings a year in rooms with unflagged problems.",
            },
          ],
        },
      ],
    },
  ],
}
