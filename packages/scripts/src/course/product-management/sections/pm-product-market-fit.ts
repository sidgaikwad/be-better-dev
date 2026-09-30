import type { SectionSeed } from "../../types"

export const pmProductMarketFit: SectionSeed = {
  slug: "pm-product-market-fit",
  title: "Product-market fit",
  description:
    "What product-market fit is, the survey and the retention curve that measure it, and what to do when you do not have it.",
  badgeIcon: "🎯",
  badgeTitle: "Fit",
  units: [
    {
      slug: "what-fit-is",
      title: "What fit is",
      description: "Andreessen's definition, what it feels like, and why it belongs to a segment.",
      lessons: [
        {
          slug: "pm-pmf-meaning",
          title: "Being in a good market with a product that satisfies it",
          summary:
            "Andreessen's 2007 definition, why he ranked the market first, and why fit is a claim about one segment, not a whole company.",
          contentFile: "pm-pmf-meaning.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "The video's Priya interviews students, owners and wardens before anything is built. By Andreessen's definition, what can those interviews establish?",
              options: [
                "That the product has fit with the students interviewed",
                "That the problem is real, not that a product satisfies it",
                "That the market is good, which is the half that matters most",
                "Nothing useful, since only launch data counts as evidence",
              ],
              answer: 1,
              explanation:
                "Interviews can show that people have the problem and how badly. Fit is a product satisfying a market, which only shows once people can use the product and choose it over what they did before.",
            },
            {
              kind: "predict",
              prompt:
                "42,000 returning students are already monthly active on Roost and book at 4.0 per 100. A campaign aimed at returning students runs all season. What happens to that 4.0?",
              options: [
                "It climbs, because the campaign reminds them the app exists",
                "It doubles, because awareness was holding the segment back",
                "It rises for the season, then settles back a little above 4.0",
                "It barely moves: they already found the app and did not book",
              ],
              answer: 3,
              explanation:
                "These students are inside the app already, so awareness is not what stops them. A gap among people who arrived and did not book is a product question, and a campaign changes who arrives, not what the product does for them.",
            },
            {
              kind: "mcq",
              prompt: "Which statement about fit is most useful in a Roost planning meeting?",
              options: [
                "We have fit with first-year movers in Pune, not yet in Hyderabad",
                "We have fit, because bookings have grown every season since launch",
                "We lack fit, because the blended rate is only 6.7 bookings per 100",
                "We will have fit once monthly active students pass 100,000",
              ],
              answer: 0,
              explanation:
                "Fit belongs to a segment and a market, and each new one has to be earned again. A single yes or no for the whole company hides where to scale and where to fix the product.",
            },
          ],
        },
      ],
    },
    {
      slug: "measuring-fit",
      title: "Measuring fit",
      description: "What users say they would feel, and what they actually keep doing.",
      lessons: [
        {
          slug: "pm-pmf-survey",
          title: "The 40 percent test",
          summary:
            "Sean Ellis's 'very disappointed' question, and how Superhuman raised its score from 22% to 58% by segmenting first and then building for the near-lovers.",
          contentFile: "pm-pmf-survey.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Who should receive Ellis's survey?",
              options: [
                "Every account created since the product first launched",
                "Everyone on the waiting list, before they try the product",
                "People who have recently used the core of the product",
                "Users who have left a review of the product in an app store",
              ],
              answer: 2,
              explanation:
                "The question asks how people would feel losing the product, which only means something from people who have experienced it. Superhuman used 'at least twice in the last two weeks'; for Roost, a recent move-in plays that role.",
            },
            {
              kind: "predict",
              prompt:
                "Superhuman's first score was 22%. Before any product change, what lifted it to about 33%?",
              options: [
                "Scoring only the roles where the lovers clustered",
                "Sending the survey to many more of its users",
                "Dropping the 'somewhat disappointed' answer option",
                "Shipping the mobile app its users had asked for",
              ],
              answer: 0,
              explanation:
                "Founders, managers, executives and business development people were the ones who loved it, and scoring only them raised the number. The later climb to 58% came from building for that segment.",
            },
            {
              kind: "mcq",
              prompt:
                "A team keeps narrowing its segment until the score reads 45% among 42 respondents. What is the biggest remaining risk?",
              options: [
                "The wording differs slightly from Ellis's original question",
                "42 responses are too few to read any direction at all",
                "Somewhat disappointed users were left in the denominator",
                "The segment may now be too small to be a good market",
              ],
              answer: 3,
              explanation:
                "Any score clears 40% if the segment shrinks far enough. Kromer's startup passed with a market too small to build on, and Andreessen's definition needs a good market as well as a satisfying product.",
            },
          ],
        },
        {
          slug: "pm-pmf-retention",
          title: "The curve that flattens",
          summary:
            "A cohort curve that flattens is fit you can see in behavior; one that decays to zero is not, whatever signups or surveys say.",
          contentFile: "pm-pmf-retention.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What makes a cohort retention curve a sign of product-market fit?",
              options: [
                "It starts above 80% in the first month after signup",
                "It falls more slowly than last quarter's cohort did",
                "It beats a published benchmark for the category",
                "It stops falling and holds at a level above zero",
              ],
              answer: 3,
              explanation:
                "Every curve drops early as the curious leave. Fit shows in the tail: once survivors stop leaving, the people who remain have found lasting value.",
            },
            {
              kind: "predict",
              prompt:
                "A cohort keeps 76% of the previous month's active owners every month, and has 16 active at month 6. About how many are active at month 12?",
              options: ["About 12", "About 3", "About 8", "About 14"],
              answer: 1,
              explanation:
                "Six more months at 76% keeps 0.76 to the power 6, about 19%, and 16 x 0.19 is about 3. A survivor rate that stays below 100% decays toward zero; a flattening curve is one whose survivor rate climbs toward 100%.",
            },
            {
              kind: "mcq",
              prompt: "Why is retention harder to fake than signups or survey answers?",
              options: [
                "It is logged automatically, so it contains no errors at all",
                "It runs higher for products that charge a subscription",
                "Each person has to choose the product again every period",
                "Discounts and incentives cannot change how it behaves",
              ],
              answer: 2,
              explanation:
                "A campaign buys one decision and a survey records an opinion. Retention needs repeated choices with nothing paying for them, though an incentive can prop it up for as long as the incentive lasts.",
            },
          ],
        },
      ],
    },
    {
      slug: "without-fit",
      title: "Without fit",
      description: "When to change course, and what to carry into the new one.",
      lessons: [
        {
          slug: "pm-pivots",
          title: "Pivot or persevere",
          summary:
            "Ries's pivot catalog read as what changes and what stays, Instagram and Slack as two very different pivots, and the signals that say tuning has stalled.",
          contentFile: "pm-pivots.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does the lesson advise changing only one hypothesis per pivot?",
              options: [
                "So the next result can be traced to the change",
                "Because Ries's catalog allows one type at a time",
                "Because investors fund one pivot per funding round",
                "So the team can skip the next scheduled review",
              ],
              answer: 0,
              explanation:
                "If segment, need, channel and price all change at once, a good or bad result cannot be traced to any of them, and the pivot teaches nothing. Changing one and keeping the rest makes the next test readable.",
            },
            {
              kind: "predict",
              prompt:
                "After four rounds of changes, a study app's cohorts still decay toward zero and no segment scores above 20% on Ellis's question. Users of one feature, a shared exam calendar, have a curve that flattens at 40%. What is the most promising move?",
              options: [
                "Persevere with a fifth round of changes to the whole app",
                "Keep the whole app but aim it at a new customer segment",
                "Make the exam calendar the product and drop the rest",
                "Shut the company down, since the app has failed to fit",
              ],
              answer: 2,
              explanation:
                "This is Burbn's situation: the whole product fails while one part has users who stay. A zoom-in keeps what retained and drops what did not, so the next version starts with evidence instead of from zero.",
            },
            {
              kind: "mcq",
              prompt:
                "Slack grew out of a chat tool Tiny Speck built for itself while making the game Glitch. What carried over from the game company into Slack?",
              options: [
                "Glitch's players, who became Slack's first customers",
                "The team, and a tool its builders used every day",
                "Glitch's revenue model, applied to workplace chat",
                "The game engine, rebuilt to run a messaging app",
              ],
              answer: 1,
              explanation:
                "The customer and the problem both changed, so by Ries's catalog Slack is closer to a restart than a single pivot. What survived was the team and a tool with proof of daily use by the people who built it.",
            },
          ],
        },
      ],
    },
  ],
}
