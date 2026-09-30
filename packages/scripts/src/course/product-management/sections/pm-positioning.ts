import type { SectionSeed } from "../../types"

export const pmPositioning: SectionSeed = {
  slug: "pm-positioning",
  title: "Positioning and messaging",
  description:
    "Deciding what your product is and who it is for before telling anyone: positioning, the statement that captures it, benefits over features, and a brand that keeps the promise.",
  badgeIcon: "📍",
  badgeTitle: "Positioner",
  units: [
    {
      slug: "deciding-the-position",
      title: "Deciding the position",
      description: "What the product is, who it is for, and what customers should compare it to.",
      lessons: [
        {
          slug: "pm-positioning-basics",
          title: "Positioning is context",
          summary:
            "Customers judge a product by the category they file it under, so pick the frame in which your strength is the thing compared.",
          contentFile: "pm-positioning-basics.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "In April Dunford's order, why is the market category chosen last rather than first?",
              options: [
                "Category names are the easiest part to change after launch",
                "Customers ignore the category until after they have bought",
                "It should be the frame where your proven value is obvious",
                "Analysts assign the category, so the team cannot choose it",
              ],
              answer: 2,
              explanation:
                "Each component depends on the one before: alternatives reveal your unique attributes, those define the value, and the value tells you who cares. Pick the category first and you choose it for how big it sounds, not for where your strengths win.",
            },
            {
              kind: "predict",
              prompt:
                "Roost's page frames it as rental listings, and students who leave say 'not enough options'. Without changing the product, Roost reframes as verified housing for students moving to a new city. What changes?",
              options: [
                "Students compare whether rooms are real, where Roost leads",
                "Nothing, since the product and its listings are the same",
                "Students still compare listing counts, just less often",
                "Bookings fall, because the frame drives other students away",
              ],
              answer: 0,
              explanation:
                "The category sets what customers compare. Under rental listings the test is count, which a 300-property app loses; under verified student housing the test is whether the room is real, and Roost is the only one that checked.",
            },
            {
              kind: "mcq",
              prompt:
                "In Dunford's sense, what is most likely the main competitive alternative for a first-year student looking for a PG?",
              options: [
                "Another venture-funded app that also lists hostels",
                "The Featured listings Roost sells to property owners",
                "The parents who pay for the room but never open the app",
                "The first-year WhatsApp group where seniors post rooms",
              ],
              answer: 3,
              explanation:
                "Competitive alternatives are what customers would do if you did not exist, and that is usually a workaround such as a WhatsApp group or a broker. A rival app may be on the list, but it is rarely what most customers use today.",
            },
          ],
        },
        {
          slug: "pm-positioning-statement",
          title: "The positioning statement",
          summary:
            "Geoffrey Moore's fill-in-the-blanks sentence, filled in for Roost and tested against a broker and a real rival.",
          contentFile: "pm-positioning-statement.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What is the swap test for a positioning statement?",
              options: [
                "Swap in a bigger target customer and check it still reads well",
                "Swap in a rival's name; if the claim still holds, it fails",
                "Swap the benefit and the feature and see which reads better",
                "Show it to two segments and keep the version one prefers more",
              ],
              answer: 1,
              explanation:
                "A differentiation clause that is equally true of a competitor is not differentiation. Adjectives like 'innovative' or 'personalized' fail instantly, which is why the statement needs attributes only you have.",
            },
            {
              kind: "predict",
              prompt:
                "Roost's statement says it 'shows only rooms its own team has inspected'. A student is choosing between Roost and Stanza Living, which runs its own managed residences. What happens to that clause?",
              options: [
                "It wins outright, since Stanza does not look at its rooms",
                "It becomes a legal risk, since Stanza could say the same",
                "It stops mattering, since students never compare two firms",
                "It survives the swap, so it is not the difference here",
              ],
              answer: 3,
              explanation:
                "Stanza operates every residence it offers, so the clause is true of Stanza too. Against that alternative the difference is the model, independent PGs at a range of rents versus branded residences, which is why 'unlike' should name the alternative most target customers actually use.",
            },
            {
              kind: "mcq",
              prompt:
                "Why keep Roost's target as first-year students moving to a new city rather than all students in India?",
              options: [
                "It keeps the need, benefit and unlike clauses specific",
                "It stops other students from booking through Roost",
                "Moore's template only allows segments under 10,000 people",
                "Investors reward a narrow target with a higher valuation",
              ],
              answer: 0,
              explanation:
                "The target drives every other blank: a broad target turns the need into 'find accommodation' and the benefit into 'easy', which any portal could claim. The target is who you win first, not a limit on who may sign up.",
            },
          ],
        },
      ],
    },
    {
      slug: "saying-and-keeping-it",
      title: "Saying it and keeping it",
      description:
        "Messages built on outcomes, and a brand that delivers what the position promises.",
      lessons: [
        {
          slug: "pm-benefits-over-features",
          title: "Benefits over features",
          summary:
            "Lead with the outcome the customer gets, keep the feature as its proof, and shape the message for each segment and channel.",
          contentFile: "pm-benefits-over-features.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "In the video's pressure-cooker story, why did the ad-maker reject 'saves time' as the message?",
              options: [
                "Rival cookers were already faster, so the claim was false",
                "Saving time could not be proven in a print advertisement",
                "It named the product's trait, not what the time was for",
                "Buyers in that era did not care how long cooking took",
              ],
              answer: 2,
              explanation:
                "'Saves time' is still the manufacturer's language. The ad-maker climbed one more rung of the so-what ladder, to what the minutes turn into for the person deciding: time with family, or rest.",
            },
            {
              kind: "predict",
              prompt:
                "'Your home away from home' gets twice the clicks of 'Every PG checked in person by our team' for the same spend, but fewer bookings. What best explains it?",
              options: [
                "Benefit messages always convert worse than feature ones",
                "It names no specific pain, so it pulls the wrong people",
                "Students distrust any ad that mentions an operations team",
                "Twice the clicks means the landing page must have broken",
              ],
              answer: 1,
              explanation:
                "A benefit any rival could claim pulls curiosity clicks from people without the problem. The fix is not to retreat to features but to name the specific benefit and use the feature as its proof.",
            },
            {
              kind: "mcq",
              prompt:
                "Apple's first iPod press release led with 1,000 songs in your pocket and gave the 5 GB hard drive further down. What job did the 5 GB figure do?",
              options: [
                "It was the headline benefit for most of the buyers",
                "It was a disclaimer that storage claims legally need",
                "It spoke to a different segment than the headline did",
                "It was the proof that made the benefit believable",
              ],
              answer: 3,
              explanation:
                "The feature did not vanish; it moved underneath the benefit as the reason the claim was true. Lead with the benefit and keep the feature as proof, especially for buyers who will check.",
            },
          ],
        },
        {
          slug: "pm-brand-consistency",
          title: "Positioning informs branding",
          summary:
            "Branding makes a position tangible, and the weakest touchpoint, often one you do not own, decides whether customers believe it.",
          contentFile: "pm-brand-consistency.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In the video's formulation, how do positioning and branding relate?",
              options: [
                "Positioning sets the perception; branding makes it tangible",
                "Branding comes first, and the position is picked to fit the logo",
                "They are two names for one activity owned by the marketing team",
                "Positioning is written for investors, and branding for customers",
              ],
              answer: 0,
              explanation:
                "Positioning informs branding, and branding reinforces positioning. When the store, the box or the support desk contradicts the position, customers believe what they touched, not what the ad said.",
            },
            {
              kind: "predict",
              prompt:
                "Roost's listings are accurate, but 3% of students meet an unlisted charge from the owner at move-in, and support takes 3 days to reply in June. Roost runs a 'Verified means verified' campaign first. What is the likely effect?",
              options: [
                "It fixes the problem by setting clearer owner expectations",
                "Nothing, since the charge comes from owners, not from Roost",
                "It spreads the very promise those students saw broken",
                "Students blame the owners, so Roost's brand is untouched",
              ],
              answer: 2,
              explanation:
                "A campaign amplifies whatever the experience already is. In a marketplace the owner's behavior is part of Roost's brand, so fix the touchpoint first and advertise once the numbers support the claim.",
            },
            {
              kind: "mcq",
              prompt:
                "Which change does the most to make Roost's brand consistent with its positioning?",
              options: [
                "A new logo and color scheme that look more trustworthy",
                "Delisting owners who repeatedly add unlisted charges",
                "A tagline that repeats the word 'verified' more often",
                "Warmer, more emotional copy on every listing page",
              ],
              answer: 1,
              explanation:
                "The weakest touchpoint defines the brand, and for Roost it sits with owners at move-in. Consistency there is an operations and policy decision, not a design one.",
            },
          ],
        },
      ],
    },
  ],
}
