import type { SectionSeed } from "../../types"

export const pmFeaturesAndValue: SectionSeed = {
  slug: "pm-features-and-value",
  title: "Features and value",
  description:
    "Kinds of features and what each is for, the Kano model of what delights and what is merely expected, features that serve the business at the user's expense, and removing what nobody uses.",
  badgeIcon: "🎁",
  badgeTitle: "Features",
  units: [
    {
      slug: "kinds-of-features",
      title: "Kinds of features",
      description: "Naming what a feature is for, and measuring how it moves satisfaction.",
      lessons: [
        {
          slug: "pm-feature-types",
          title: "Core, secondary, differentiating",
          summary:
            "Six feature types, why they are not one axis, and how to check a season's plan so the core holds and one real differentiator ships.",
          contentFile: "pm-feature-types.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Roost's search times out in 8% of sessions at June's peak, and the fix is all back-end work. How should the PM treat it?",
              options: [
                "As a technical item that can wait until the differentiators ship",
                "As a UI item, since students only notice the loading spinner",
                "As a core failure, fixed with technical work, so it goes first",
                "As a secondary item, since students can retry the search later",
              ],
              answer: 2,
              explanation:
                "The technical label says where the work lives; the core label says what it is worth. A core feature failing at the load you expect comes before any differentiator.",
            },
            {
              kind: "predict",
              prompt:
                "A rival app copies a new screen of Roost's within one season. What does this suggest about where Roost should put its differentiator?",
              options: [
                "In something slow and costly to copy, like the verification visit",
                "In more new screens, shipped faster than the rival can copy them",
                "In lower commission, since price is the only lasting difference",
                "Nowhere in particular, since every differentiator gets copied",
              ],
              answer: 0,
              explanation:
                "Differentiation is relative and expires once rivals have it, as Stories did for Snapchat after Instagram copied it. An operations team visiting every property is far harder to copy than a screen.",
            },
            {
              kind: "mcq",
              prompt:
                "Why can Spotify's Discover Weekly carry more than one of the six feature labels?",
              options: [
                "Because the video's six types were never meant to be used together",
                "Because a feature's type changes each time the team redesigns it",
                "Because Spotify classified it differently in each of its markets",
                "Because the types answer different questions: value, work, novelty",
              ],
              answer: 3,
              explanation:
                "Core, secondary and differentiating describe value to the customer; UI and technical describe where the work lives; innovative describes novelty. Discover Weekly was innovative at launch, differentiating, and built on back-end work.",
            },
          ],
        },
        {
          slug: "pm-kano-model",
          title: "The Kano model",
          summary:
            "Kano's paired questions sort features into must-be, one-dimensional, attractive, indifferent and reverse, and the Better and Worse scores say what to fix first.",
          contentFile: "pm-kano-model.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "A student answers 'I like it' if Roost has a feature, and 'I can live with it' if Roost does not. Before checking the table, which category is this?",
              options: ["Must-be", "Attractive", "Reverse", "One-dimensional"],
              answer: 1,
              explanation:
                "Liking its presence while tolerating its absence is the signature of a delighter. Must-be would need 'I dislike it' for the absence, and one-dimensional needs both: like it present, dislike it absent.",
            },
            {
              kind: "mcq",
              prompt:
                "Showing every charge before booking scores Better 0.33 and Worse -0.77. What does that pair tell the team?",
              options: [
                "It is a delighter that students will praise once they notice it",
                "It is indifferent, so the team can safely leave it off the plan",
                "It is a reverse feature for most students and should be removed",
                "It earns little praise when present and heavy blame when missing",
              ],
              answer: 3,
              explanation:
                "A low Better and a strongly negative Worse is a must-be: meeting it only avoids anger. That is why it must hold before any attractive feature gets budget.",
            },
            {
              kind: "mcq",
              prompt:
                "The parent page gets 64 attractive, 58 indifferent and 40 reverse answers from pooled students. What is the most useful next step?",
              options: [
                "Split the answers by segment before deciding how to ship it",
                "Drop it, since the attractive lead over indifferent is small",
                "Ship it on for everyone, since attractive is the top answer",
                "Rerun the survey with more students until one category wins",
              ],
              answer: 0,
              explanation:
                "Pooling segments blurs a feature toward indifferent. The reverse answers likely come from older students and the attractive ones from first-years, so it should ship as a link the student chooses to share.",
            },
          ],
        },
      ],
    },
    {
      slug: "value-and-cost",
      title: "Who a feature serves, and what it costs",
      description: "Business features that stay honest, and taking out the ones nobody uses.",
      lessons: [
        {
          slug: "pm-business-features",
          title: "When a feature serves the business, not the user",
          summary:
            "Business features are necessary; the line is crossed when the gain depends on users not understanding what happened, as with a pre-ticked add-on.",
          contentFile: "pm-business-features.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Which Roost feature serves the business and is still on the right side of the line?",
              options: [
                "Featured listings ranked first with no label on them",
                "A protection plan added to checkout with the box ticked",
                "A charge for a service the listing never mentioned",
                "Featured listings shown with a visible Featured label",
              ],
              answer: 3,
              explanation:
                "Serving the business is fine. The labelled slot passes all three questions: students know it is paid placement, and no default chooses for them.",
            },
            {
              kind: "predict",
              prompt:
                "A pre-ticked ₹299 plan sells 2,800 a month and earns ₹120 each, but 15% of buyers dispute it at ₹1,000 per dispute plus a refund. Before calculating, what happens to the monthly result?",
              options: [
                "It stays well above the opt-in version even after disputes",
                "It turns negative, since handling costs exceed the revenue",
                "It roughly matches the opt-in version once refunds are paid",
                "It depends only on the attach rate, not on the disputes",
              ],
              answer: 1,
              explanation:
                "420 disputes cost ₹420,000 to handle and ₹50,400 in refunds, against ₹336,000 of revenue, leaving minus ₹134,400 a month. Revenue that depends on users not noticing tends to come back as support cost and lost trust.",
            },
            {
              kind: "mcq",
              prompt:
                "Why is a pre-ticked add-on especially damaging for Roost rather than for any marketplace?",
              options: [
                "Roost's owners would refuse to list next to an insurance offer",
                "Insurance partners pay Roost less when the box is pre-ticked",
                "It is a hidden charge from a product whose promise is none",
                "Students cannot pay for add-ons while paying the deposit",
              ],
              answer: 2,
              explanation:
                "Roost's strategy rests on the rent you see being the rent you pay. A default that adds ₹299 is exactly the hidden charge it exists to eliminate, so it spends the differentiator itself.",
            },
          ],
        },
        {
          slug: "pm-feature-bloat",
          title: "Removing features",
          summary:
            "Every feature keeps costing after launch; an adoption and frequency audit finds candidates, and outcomes decide which ones go.",
          contentFile: "pm-feature-bloat.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Make an Offer is used by 2% of students, causes ₹30,000 of disputes a month, and cuts against Roost's listed-rent promise. What should happen to it?",
              options: [
                "Remove it, after a holdout and a notice to the people who used it",
                "Promote it on every listing so that adoption rises above 10%",
                "Leave it in place, since 40 bookings a month follow an offer",
                "Hide the button but keep the code, in case students ask for it",
              ],
              answer: 0,
              explanation:
                "It fails on outcomes and on strategy, and its bookings would mostly happen through chat anyway. Hiding without deleting keeps the maintenance and constraint costs.",
            },
            {
              kind: "mcq",
              prompt: "In Des Traynor's feature audit, what does low adoption tell the PM?",
              options: [
                "That the feature should be removed in the next release",
                "That the feature failed and its team should be moved",
                "Where to look, not yet which of four responses to choose",
                "That users need a tutorial before the feature is judged",
              ],
              answer: 2,
              explanation:
                "A low-adoption feature can be killed, promoted, made more frequent, or improved. Which one depends on what it does for outcomes and whether it fits the strategy.",
            },
            {
              kind: "mcq",
              prompt:
                "Which cost keeps running after a feature's button is hidden but its code stays?",
              options: [
                "The interface weight on the listing page",
                "Maintenance on every nearby change",
                "The support tickets about the button",
                "The onboarding time spent explaining it",
              ],
              answer: 1,
              explanation:
                "Hiding removes the visible costs but not the code: every change nearby must still keep it working. That is why removal means deleting the code, not just the button.",
            },
          ],
        },
      ],
    },
  ],
}
