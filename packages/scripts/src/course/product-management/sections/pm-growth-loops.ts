import type { SectionSeed } from "../../types"

export const pmGrowthLoops: SectionSeed = {
  slug: "pm-growth-loops",
  title: "Growth loops",
  description:
    "Growth that feeds itself: loops against funnels, referrals and virality with the arithmetic, network effects, and product-led growth.",
  badgeIcon: "🌀",
  badgeTitle: "Grower",
  units: [
    {
      slug: "loops-and-virality",
      title: "Loops and virality",
      description:
        "Growth that reinvests its own output, and the arithmetic of users bringing users.",
      lessons: [
        {
          slug: "pm-loops-vs-funnels",
          title: "Loops, not funnels",
          summary:
            "A funnel spends its input once; a loop turns its output into the next cycle's input, so a change to one step compounds.",
          contentFile: "pm-loops-vs-funnels.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In the Reforge framing, what separates a growth loop from a funnel?",
              options: [
                "A loop tracks more steps between signup and payment",
                "A loop uses only channels that cost nothing to run",
                "A loop's output is reinvested as its next cycle's input",
                "A loop is owned by product, a funnel by marketing",
              ],
              answer: 2,
              explanation:
                "A funnel needs fresh input bought from outside every cycle, while a loop feeds what it produces back in, which is why it compounds. Paid loops exist too, so cost is not the distinction.",
            },
            {
              kind: "predict",
              prompt:
                "Roost's review loop: 20% of bookings leave a review, each review brings 30 search visits, and 4% of visits book. The team can double exactly one of these. Which choice raises the loop's yield most?",
              options: [
                "Any of them doubles the yield, so pick the cheapest to move",
                "The review rate, because it comes first in the loop",
                "The 4% booking rate, because it is the smallest number",
                "The visits per review, because 30 is the largest number",
              ],
              answer: 0,
              explanation:
                "The yield is the product of the steps, so doubling any one of them doubles the whole. The choice then turns on cost and control, and Roost controls its review request far more than a search engine's rankings.",
            },
            {
              kind: "mcq",
              prompt: "Why can Roost's review loop not replace this season's ad budget?",
              options: [
                "Reviews convert worse than ads on a per-visit basis",
                "Search engines do not index pages that carry reviews",
                "Paid loops always produce more bookings than content loops",
                "Students book once a year, so the loop turns about once a year",
              ],
              answer: 3,
              explanation:
                "A loop's cycle time is set by how often the product is naturally used. A review written in September mostly pays off the following summer, so the loop shrinks what next season needs rather than filling this one.",
            },
          ],
        },
        {
          slug: "pm-virality",
          title: "Referrals and the viral coefficient",
          summary:
            "K is invitations per user times conversion per invitation: below 1 it multiplies every channel you pay for, above 1 it grows on its own until the network saturates.",
          contentFile: "pm-virality.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Each new user sends 5 invitations and 10% of them sign up. You buy 2,000 users with ads. How many users do you end up with in total?",
              options: ["3,000", "4,000", "2,500", "10,000"],
              answer: 1,
              explanation:
                "K = 5 x 0.10 = 0.5, and the multiplier is 1 / (1 - 0.5) = 2, so 2,000 bought users become 4,000. The 3,000 answer counts only the first generation of invitees and forgets that they invite too.",
            },
            {
              kind: "predict",
              prompt:
                "Two products both have K = 1.2 and start with 1,000 users. One has a 3-day cycle time, the other a 30-day cycle time. What do you expect after 60 days?",
              options: [
                "About the same size, since their K is identical",
                "The 30-day product ahead, since invitees had longer to decide",
                "Neither growing, since K above 1 decays within a month",
                "The 3-day product far ahead, after 20 cycles to the other's 2",
              ],
              answer: 3,
              explanation:
                "K sets growth per cycle, but cycle time sets how many cycles fit in a month. Ten times shorter cycles means ten times as many compounding steps in the same calendar time.",
            },
            {
              kind: "mcq",
              prompt:
                "Why did Dropbox's storage reward suit it better than a cash reward would have?",
              options: [
                "It cost little at the margin and drew users deeper into the product",
                "It was larger than any cash reward a rival could afford to match",
                "It rewarded only the inviter, which kept the program's cost low",
                "It was paid only after the invited friend upgraded to a paid plan",
              ],
              answer: 0,
              explanation:
                "Extra storage was cheap for Dropbox to give and led users to store more files, which made leaving harder. A cash reward, like the one Roost's marketing lead proposed, is a pure acquisition cost with none of that effect.",
            },
          ],
        },
      ],
    },
    {
      slug: "growth-built-in",
      title: "Growth built into the product",
      description: "Networks that get better with every user, and a product that sells itself.",
      lessons: [
        {
          slug: "pm-network-effects",
          title: "Network effects",
          summary:
            "Direct, two-sided and data network effects, why Roost's are local to a campus, and how to beat the cold start by concentrating supply until one market works.",
          contentFile: "pm-network-effects.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which of these is a network effect rather than virality?",
              options: [
                "Each Roost student sends two invitations after booking",
                "Every Hotmail email advertises the service to its reader",
                "Each new owner near a campus gives its students more choice",
                "Referred students get ₹250 off their first month's rent",
              ],
              answer: 2,
              explanation:
                "Virality brings users in; a network effect makes the product better for existing users as more join. Another owner near a campus raises the chance that every student searching there finds a match.",
            },
            {
              kind: "predict",
              prompt:
                "Roost has 400 verified properties in Pune and opens in Chennai. How much does the Pune network help a student searching for a room in Chennai?",
              options: [
                "A great deal, since 400 listings signal a trusted brand",
                "Almost none, since the network effect is local to a campus",
                "Some, since Pune owners can list their rooms in Chennai too",
                "It depends mostly on how many students Roost has in Pune",
              ],
              answer: 1,
              explanation:
                "A Chennai student benefits from rooms near their own campus, and Pune listings are not rooms they can rent. The brand may help a little with signups, but the Chennai market still starts cold.",
            },
            {
              kind: "predict",
              prompt:
                "Campus A has 30 verified listings and converts 9% of its 2,000 searchers. Campus B has 12 and converts 3% of its 2,000. Past 30 listings conversion barely rises. Where should 18 new verifications go?",
              options: [
                "Campus A, since it already works and converts best",
                "Split them evenly, 9 to each campus, to hedge",
                "Neither; spend the visits on student ads instead",
                "Campus B, lifting it from 3% to 9% conversion",
              ],
              answer: 3,
              explanation:
                "Taking Campus B from 12 listings to 30 moves it from 60 bookings to 180. Campus A is already on the flat part of the curve, where 18 more listings mostly compete with the ones it has.",
            },
          ],
        },
        {
          slug: "pm-product-led-growth",
          title: "Product-led growth",
          summary:
            "When the product itself acquires, converts and expands customers: where the paywall goes, how to spot a product-qualified lead, and what free-to-paid rates to expect.",
          contentFile: "pm-product-led-growth.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Where does a product-led company's usage limit work best?",
              options: [
                "On a value metric that grows as the customer succeeds",
                "On the core action a user needs before seeing any value",
                "On features that only a few users have ever asked for",
                "On the number of teammates an account may invite",
              ],
              answer: 0,
              explanation:
                "A limit on something that grows with success, like Slack's message history, bites only once the customer depends on the product. Gating the core action or invitations blocks the value and the spread that the loop runs on.",
            },
            {
              kind: "predict",
              prompt:
                "A freemium tool converts 5% of free users to paid. The team proposes dropping the free tier for a card-required trial, because those convert at 75%. What must they check before believing it wins?",
              options: [
                "Whether card processing fees will eat the added revenue",
                "Whether 75% is measured monthly or over a whole year",
                "Whether as many people will start a trial as signed up free",
                "Whether their free users are spread across many countries",
              ],
              answer: 2,
              explanation:
                "Card-required trials convert a high share of a much smaller group of starters, and the free users who never paid may have been inviting colleagues. Compare paying customers and loop inputs, not the two percentages.",
            },
            {
              kind: "mcq",
              prompt: "What makes a user a product-qualified lead?",
              options: [
                "They downloaded a guide and attended a webinar",
                "They hit usage triggers that preceded past purchases",
                "They work at a company above a set employee count",
                "They asked the sales team for a paid-plan demo",
              ],
              answer: 1,
              explanation:
                "Tunguz defined a PQL by what the user did in the product, such as uploading 10 receipts and inviting a friend. The triggers should come from data on which behaviors actually preceded paying, and be revised as that changes.",
            },
          ],
        },
      ],
    },
  ],
}
