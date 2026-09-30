import type { SectionSeed } from "../../types"

export const pmProductLifecycle: SectionSeed = {
  slug: "pm-product-lifecycle",
  title: "The product lifecycle",
  description:
    "Introduction, growth, maturity and decline, what a PM does differently in each, how a company's products fit together, and how to retire one well.",
  badgeIcon: "🌱",
  badgeTitle: "Lifecycle",
  units: [
    {
      slug: "the-stages",
      title: "The four stages",
      description: "What a PM does differently from launch to retirement.",
      lessons: [
        {
          slug: "pm-lifecycle-early",
          title: "Introduction and growth",
          summary:
            "Introduction asks whether it works and for whom; growth asks how to scale it. The stage comes from evidence of fit, not from sales.",
          contentFile: "pm-lifecycle-early.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why does the lesson say a product in its introduction stage should spend on awareness before conversion?",
              options: [
                "Conversion rates cannot be measured until the product has a brand",
                "Aware users convert at a higher rate than unaware users do later",
                "Awareness starts low and has far more room to multiply",
                "Investors judge early products mainly by how widely known they are",
              ],
              answer: 2,
              explanation:
                "At 10% awareness, bookings can double three times before awareness reaches 80%, while a 20% conversion rate cannot double three times at all. The lever with the most headroom gets the early money.",
            },
            {
              kind: "predict",
              prompt:
                "A new city beats its first-season booking target by 7%, but only 55% of its owners say they will list again, against 85% in the company's oldest city. Which stage is it in?",
              options: [
                "Still introduction, because fit shows in retention signals, not sales",
                "Growth, because beating the sales target shows the product has taken off",
                "Maturity, because sales have already reached the level the team planned",
                "Decline, because its return rate is well below the established city's",
              ],
              answer: 0,
              explanation:
                "The stage is set by evidence of fit. Sales can be bought with ads; relisting and complaint rates show whether customers will stay, and scaling before they do only amplifies the problem.",
            },
            {
              kind: "mcq",
              prompt: "What correction does the lesson make to the video's New Coke example?",
              options: [
                "New Coke lasted far longer than 79 days before it was withdrawn",
                "New Coke lost the taste tests, and Coca-Cola launched it regardless",
                "New Coke failed in growth, after a successful introduction stage",
                "New Coke reformulated a mature product rather than introducing one",
              ],
              answer: 3,
              explanation:
                "It changed a 99-year-old formula, so it is not an introduction-stage failure. The lesson it teaches still holds: the feedback that matters arrives after launch, and Coca-Cola acted on it within 79 days.",
            },
          ],
        },
        {
          slug: "pm-lifecycle-late",
          title: "Maturity and decline",
          summary:
            "Maturity rewards retention and Levitt's four extension levers; decline offers four end games. The stages name a decision, they do not forecast one.",
          contentFile: "pm-lifecycle-late.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What did the iPhone's numbers show that the lesson reads as maturity?",
              options: [
                "iPhone revenue fell in each of the three years after 2015",
                "Unit sales went flat while revenue rose on higher prices",
                "Apple stopped releasing a new iPhone model every year",
                "Rivals overtook the iPhone in global unit sales",
              ],
              answer: 1,
              explanation:
                "Units peaked at 231.2 million in fiscal 2015 and hovered near 217 million afterwards, while iPhone revenue still grew 18% in 2018. Stable volume in a saturated market is maturity, not failure.",
            },
            {
              kind: "predict",
              prompt:
                "A city's bookings have been flat for two seasons, and its share of a stable market has held at 30%. The founder wants to cut the verification team there. What does the lesson expect to happen?",
              options: [
                "Little change, since flat bookings mean demand is already fixed",
                "Higher margins with no lasting effect on bookings or share",
                "A short dip, then recovery once the market grows again",
                "Falling share, as the cut creates the decline it assumed",
              ],
              answer: 3,
              explanation:
                "Flat bookings with a steady share is maturity. Dhalla and Yuspeh warned that treating a product as declining can make it decline, and cutting the reason customers trust you is exactly how.",
            },
            {
              kind: "mcq",
              prompt: "Why can staying in a declining market be the right choice?",
              options: [
                "Decline hits competitors unequally, so a strong one can win what remains",
                "Declining markets usually recover once the substitute loses its novelty",
                "Exiting early always costs more than staying and running down the product",
                "Regulators require firms to support products until the market has ended",
              ],
              answer: 0,
              explanation:
                "Harrigan and Porter found that decline does not affect all competitors equally. As rivals leave, a well-placed firm can take the remaining demand profitably, which is their leadership strategy.",
            },
          ],
        },
        {
          slug: "pm-sunsetting",
          title: "Retiring a product well",
          summary:
            "Why retiring a product is a PM decision, and a sunset plan whose notice is set by dependence rather than usage.",
          contentFile: "pm-sunsetting.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "What did Google Reader's shutdown cost Google that a usage dashboard would not show?",
              options: [
                "The engineering time needed to export every user's subscriptions",
                "The advertising revenue that Reader had been earning each month",
                "Users' willingness to commit to the next product Google launches",
                "The half a million users who moved over to Feedly within two days",
              ],
              answer: 2,
              explanation:
                "Google gave a date, a reason and an export, so the mechanics were decent. The lasting cost was trust: a reputation for closing products makes people hesitate to adopt the next one.",
            },
            {
              kind: "mcq",
              prompt: "What should set the length of notice before a product is switched off?",
              options: [
                "The share of monthly users who still open the product regularly",
                "How hard it is for customers to leave, given what depends on it",
                "How much engineering time the product consumes every month now",
                "The notice period that rival companies gave when closing their own",
              ],
              answer: 1,
              explanation:
                "Usage says how many people you will upset; dependence says how badly. Atlassian gave about 40 months because companies ran their work on Server, while a small feature with an export can go in months.",
            },
            {
              kind: "predict",
              prompt:
                "In peak season, a teammate proposes switching off a feature that 600 students are midway through using, to free an engineer for a launch. What does the lesson recommend?",
              options: [
                "Freeze it now and switch it off later in the off-season",
                "Switch it off at once, with an email and a data export",
                "Keep investing in it until usage drops of its own accord",
                "Sell the feature to a partner before the season ends",
              ],
              answer: 0,
              explanation:
                "Stopping investment is free and returns most of the engineer's time at once. Switching off is paid for in trust, so it should run on the users' calendar and finish before the next peak, not during this one.",
            },
          ],
        },
      ],
    },
    {
      slug: "product-families",
      title: "Products in a family",
      description: "How a company's products fit together, and when a new variant pays.",
      lessons: [
        {
          slug: "pm-product-mix",
          title: "Width, length, depth, consistency",
          summary:
            "Kotler's four dimensions of a product mix, and why a new line should borrow the company's strengths and spread its risks.",
          contentFile: "pm-product-mix.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In Kotler's terms, what does the length of a product mix measure?",
              options: [
                "The number of product lines that a company sells",
                "The number of versions offered for each product",
                "How closely the lines relate in use, production and sales",
                "The total number of items across all product lines",
              ],
              answer: 3,
              explanation:
                "Mix length totals every line, and dividing it by width gives the average line length. The video uses length for the items inside one line, which Kotler calls that line's length.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does the lesson say high consistency between product lines cuts both ways?",
              options: [
                "Consistent lines are cheaper to build but harder to price well",
                "Consistent lines confuse buyers who cannot tell them apart",
                "Consistent lines share strengths but also share their risks",
                "Consistent lines grow quickly but decline at the same speed",
              ],
              answer: 2,
              explanation:
                "A shared brand, channel and skill set make a consistent line cheap to add. But lines that sell to the same people in the same months fail together, which is Roost's seasonal exposure.",
            },
            {
              kind: "predict",
              prompt:
                "A company earns almost all its revenue in three months of the year. It can add a line earning ₹1 million spread across the year with skills it has, or one earning ₹2 million in the same three months that needs new skills. Which does the lesson pick?",
              options: [
                "The ₹2 million line, since the revenue gap outweighs any risk",
                "The ₹1 million line, since it borrows strengths and spreads risk",
                "Neither line, since a seasonal company should stay focused on one",
                "Both lines, since two new lines spread risk better than one line",
              ],
              answer: 1,
              explanation:
                "The larger figure comes before paying for capabilities the company lacks, and it lands in the same months as the core business. A new line should borrow the company's strengths and spread its risks.",
            },
          ],
        },
        {
          slug: "pm-line-extensions",
          title: "Extensions and modifications",
          summary:
            "Extensions add a choice, modifications replace one. The cannibalization arithmetic decides whether a cheaper variant pays.",
          contentFile: "pm-line-extensions.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What separates a line extension from a product modification?",
              options: [
                "An extension adds a choice; a modification replaces one",
                "An extension changes the price; a modification the features",
                "An extension targets new buyers; a modification old buyers",
                "An extension is a new brand; a modification keeps the brand",
              ],
              answer: 0,
              explanation:
                "Diet Coke sat beside Coca-Cola, so it was an extension; a better camera in next year's phone replaces the old model, so it is a modification. Only an extension raises the cannibalization question.",
            },
            {
              kind: "predict",
              prompt:
                "A cheaper variant earns ₹300 a sale and the original earns ₹900. Before fixed costs, above what cannibalization rate does the variant lose money?",
              options: [
                "Above 67%, the share it would take to match the original",
                "Above 50%, the point where half its buyers are existing ones",
                "Above 300%, since the original earns three times as much",
                "Above 33%, the variant's margin divided by the original's",
              ],
              answer: 3,
              explanation:
                "Each variant sale adds ₹300 and each cannibalized one removes ₹900, so break-even is 300 / 900 = 33%. The thinner the variant's margin relative to the original's, the less cannibalization it survives.",
            },
            {
              kind: "mcq",
              prompt:
                "Customers complain about a flaw in a product's core promise. Why does the lesson reject a paid premium tier that fixes it?",
              options: [
                "Premium tiers always cannibalize more than they earn in revenue",
                "Customers will not pay extra for something they asked to be fixed",
                "It tells everyone else the base product is worse than promised",
                "Fixing only part of the product costs more per unit than all of it",
              ],
              answer: 2,
              explanation:
                "A Verified Plus badge implies ordinary listings are checked less carefully, which weakens the promise Roost sells. When the problem sits in the core, modify the core; extensions are for different needs.",
            },
          ],
        },
      ],
    },
  ],
}
