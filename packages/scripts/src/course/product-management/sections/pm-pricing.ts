import type { SectionSeed } from "../../types"

export const pmPricing: SectionSeed = {
  slug: "pm-pricing",
  title: "Pricing",
  description:
    "Setting a price from value rather than cost: willingness to pay and how to measure it, tiers and the psychology around them, and pricing across a product's life.",
  badgeIcon: "🏷️",
  badgeTitle: "Pricer",
  units: [
    {
      slug: "setting-the-number",
      title: "Setting the number",
      description: "Where a price comes from, and how to find out what customers will pay.",
      lessons: [
        {
          slug: "pm-pricing-approaches",
          title: "Cost-plus, competitor, and value-based pricing",
          summary:
            "One Roost product priced three ways, and why the customer's gain against their next-best alternative sets the ceiling, not your cost.",
          contentFile: "pm-pricing-approaches.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is cost-plus pricing better treated as a floor than as a price?",
              options: [
                "It shows where sales stop losing money, not what a buyer would pay",
                "It always lands above what competitors charge for the same product",
                "It leaves out fixed costs, so the markup usually ends up set too low",
                "It only works for physical goods, where unit costs are easy to count",
              ],
              answer: 0,
              explanation:
                "Cost tells you the price below which each sale loses money. Above that line it is silent about the customer, which is how Featured at ₹900 would hand owners ₹17,100 of an ₹18,000 gain.",
            },
            {
              kind: "predict",
              prompt:
                "A rival's top slot costs ₹2,000 and fills a bed 10 days sooner. Roost's Featured fills one 12 days sooner. The typical owner has 5 vacant beds at ₹300 a bed per day. What is the most that owner should pay for Featured?",
              options: ["₹18,000", "₹5,000", "₹3,000", "₹2,000"],
              answer: 1,
              explanation:
                "EVC is the reference value, the rival's ₹2,000, plus the differentiation value: 2 extra days x 5 beds x ₹300 = ₹3,000. Above ₹5,000 the rival is the better deal, so a rival that nearly matches your outcome squeezes your price hard.",
            },
            {
              kind: "mcq",
              prompt: "Why should Roost cap the number of Featured slots in each locality?",
              options: [
                "The operations team cannot verify more than a few properties per area",
                "Owners in one locality would otherwise coordinate their rent levels",
                "Featured is worth something only while it stands out from the rest",
                "The search screen can only render three highlighted cards at once",
              ],
              answer: 2,
              explanation:
                "A featured owner's faster fill comes partly from the neighbors' bookings. If half a locality is featured, nobody stands out and the 12 days shrinks toward zero, so the cap is part of what the owner is paying for.",
            },
          ],
        },
        {
          slug: "pm-willingness-to-pay",
          title: "Measuring willingness to pay",
          summary:
            "Ask about price before you build, then run the Van Westendorp survey to find the range owners will accept, and know what it cannot tell you.",
          contentFile: "pm-willingness-to-pay.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Owners gain about ₹18,000 a month from Featured, and Roost prices it at ₹900 because that covers cost plus a markup. Which of Monetizing Innovation's failure types is this?",
              options: ["Feature shock", "Hidden gem", "Undead", "Minivation"],
              answer: 3,
              explanation:
                "Minivation is the right product priced too low. The product works and people want it, but the price was set from the inside out, so most of the value it creates goes uncaptured.",
            },
            {
              kind: "predict",
              prompt:
                "A survey puts owners' acceptable range for Featured at ₹2,700 to ₹4,400, yet pilot owners gained ₹18,000 each. What does the gap most likely mean?",
              options: [
                "Owners have not yet seen the gain, so their perception lags behind it",
                "The pilot overstated the gain, so the ₹18,000 figure should be dropped",
                "The survey was too small, so its range should be set aside for now",
                "Owners are understating their budgets to push the eventual price down",
              ],
              answer: 0,
              explanation:
                "The survey records belief before experience. The fix is product work that makes the gain visible, such as showing each owner their days to fill, then measuring again with owners who have seen it.",
            },
            {
              kind: "mcq",
              prompt: "Which question can the Van Westendorp price sensitivity meter not answer?",
              options: [
                "Which range of prices most respondents find acceptable",
                "At what price respondents start doubting the quality",
                "How many customers will actually buy at each price",
                "Where equal shares call the price too cheap and too expensive",
              ],
              answer: 2,
              explanation:
                "It measures stated perception, so it gives a range and a balance point but no demand curve. Finding how many will buy, and so the revenue at each price, takes a test with real payments.",
            },
          ],
        },
      ],
    },
    {
      slug: "shaping-the-offer",
      title: "Shaping the offer",
      description:
        "Tiers, the psychology around them, and how price changes over a product's life.",
      lessons: [
        {
          slug: "pm-pricing-tiers",
          title: "Tiers, anchors, and decoys",
          summary:
            "Good, better, best tiers built from what drives willingness to pay, what anchors and decoys really do, and the fences that stop customers sliding down.",
          contentFile: "pm-pricing-tiers.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "In a good-better-best lineup, where does the leader feature, the one people pay for, belong?",
              options: [
                "Only in the top tier, so that buyers are forced to upgrade",
                "In every tier, at a different strength in each one",
                "Only in the middle tier, since that is the one you want sold",
                "In the entry tier, with every filler kept for the top tier",
              ],
              answer: 1,
              explanation:
                "Every tier needs a reason to buy it. For Featured that reason is placement, so Boost gets a highlighted card, Featured a top-three slot and Pro the top slot.",
            },
            {
              kind: "predict",
              prompt:
                "Roost adds a ₹9,000 tier that is Featured Pro minus the photo shoot, purely as a decoy. Owners compare tiers on a page with photos, descriptions and reviews, not a few numbers. What does the research suggest?",
              options: [
                "It will reliably push owners to Pro, as it did in the Economist test",
                "Owners will pick the decoy most often, since it costs the same as Pro",
                "It will cut Featured's share but leave the Pro tier's share unchanged",
                "Its effect may be weak or reversed, as the comparison is not simple",
              ],
              answer: 3,
              explanation:
                "Frederick, Lee and Baskin found the attraction effect often vanishes or reverses with realistic descriptions. A tier that exists only as bait is fragile; a top tier some owners genuinely want anchors just as well.",
            },
            {
              kind: "mcq",
              prompt: "What makes Boost's 10-bed limit an effective fence?",
              options: [
                "It tracks what drives willingness to pay and is hard to fake",
                "It is enforced automatically at checkout for every single owner",
                "It is shown in large type on the pricing page next to each tier",
                "It applies only during the June to August peak booking season",
              ],
              answer: 0,
              explanation:
                "Vacant beds drive what Featured is worth, and the operations team counts beds on every verification visit. A fence on something the customer can change cheaply just teaches customers to change it.",
            },
          ],
        },
        {
          slug: "pm-pricing-over-time",
          title: "Skimming, penetration, and free",
          summary:
            "When to start high and step down, when to start low, how free trials and reverse trials work, and what Netflix's India mobile plan shows about reference prices.",
          contentFile: "pm-pricing-over-time.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "When does penetration pricing pay off?",
              options: [
                "When early buyers value the product far more than later buyers do",
                "When the product is worth more the fewer customers who have it",
                "When being big makes the product more valuable or cheaper to run",
                "When rivals cannot copy the product for several years after launch",
              ],
              answer: 2,
              explanation:
                "Low prices buy share, and share only pays back if it makes the product better or cheaper, as network effects and scale do. That is why Roost prices the student side for penetration but not Featured.",
            },
            {
              kind: "predict",
              prompt:
                "A reverse trial gives each new owner 30 days of Featured from the day they sign up. Most new owners sign up in November and December. What do you expect?",
              options: [
                "High conversion, because owners get the whole product for free",
                "Low conversion, because the trial shows owners very few students",
                "High conversion, because owners fear losing their featured slot",
                "No change, because trial timing does not affect whether people pay",
              ],
              answer: 1,
              explanation:
                "A trial converts by showing value, and Featured's value arrives with the June to August demand. Timing every trial for mid-May to mid-June lets owners see enquiries arrive while most of the season is still ahead to pay for.",
            },
            {
              kind: "mcq",
              prompt: "How does a reverse trial differ from an ordinary free trial?",
              options: [
                "It asks for a card up front and charges when the trial period ends",
                "It starts people on the free tier and offers the paid tier later",
                "It is only offered to customers who have paid for the product before",
                "People who do not pay drop to a free tier instead of losing access",
              ],
              answer: 3,
              explanation:
                "Everyone starts on the paid tier, and those who do not pay stay on as free users. That keeps a trial's urgency while holding on to the people who might convert later.",
            },
          ],
        },
      ],
    },
  ],
}
