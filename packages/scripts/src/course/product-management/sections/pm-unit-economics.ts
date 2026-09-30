import type { SectionSeed } from "../../types"

export const pmUnitEconomics: SectionSeed = {
  slug: "pm-unit-economics",
  title: "Unit economics",
  description:
    "Whether each customer is worth what it costs to win them: lifetime value done properly, acquisition cost and payback, the ratios investors ask for, and marketplace economics.",
  badgeIcon: "💰",
  badgeTitle: "Economist",
  units: [
    {
      slug: "worth-and-cost",
      title: "What a customer is worth",
      description: "Lifetime value from margin and churn, and what it costs to win the customer.",
      lessons: [
        {
          slug: "pm-lifetime-value",
          title: "Customer lifetime value",
          summary:
            "Lifetime value is margin times the purchases customers actually make: the video's food delivery example redone with churn, and why a Roost student is worth ₹903, not ₹2,880.",
          contentFile: "pm-lifetime-value.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "A meal-kit app's customers order ₹6,000 a month, the app keeps ₹1,500 of it, and 5% of customers stop ordering each month. Predict a customer's lifetime value.",
              options: [
                "₹18,000, a year of margin",
                "₹90,000, five years of margin",
                "₹30,000, margin divided by churn",
                "₹120,000, revenue divided by churn",
              ],
              answer: 2,
              explanation:
                "Expected lifetime is 1 / 0.05 = 20 months, so LTV = ₹1,500 x 20 = ₹30,000. Dividing revenue by churn counts money the app never keeps, and a fixed five years ignores churn altogether.",
            },
            {
              kind: "mcq",
              prompt: "Why does margin divided by monthly churn not fit a Roost student?",
              options: [
                "She books at most yearly, and her degree ends it",
                "Students churn too quickly for the formula to settle",
                "Commission is revenue, so it can never count as margin",
                "The formula only applies to business customers",
              ],
              answer: 0,
              explanation:
                "A student is active around June, silent the rest of the year, and gone when her degree ends, so there is no steady monthly churn to divide by. Counting the bookings a cohort actually makes, times the margin per booking, gives ₹903.",
            },
            {
              kind: "predict",
              prompt:
                "Roost's rooms get better, and year-two rebooking falls from 35% to 25% while the other years hold. Predict what happens to student LTV.",
              options: [
                "It rises, because a happier student is worth more to Roost",
                "It stays at ₹903, because LTV counts only the first booking",
                "It falls to about ₹831, losing ₹720 per missing booking",
                "It falls to about ₹850, losing ₹525 per missing booking",
              ],
              answer: 3,
              explanation:
                "Bookings per student drop from 1.72 to 1.62, and 1.62 x ₹525 = ₹850. Better rooms shrink student LTV; what the better stay is worth shows up in referrals and in owners whose beds stay full.",
            },
          ],
        },
        {
          slug: "pm-cac-and-payback",
          title: "Acquisition cost and payback",
          summary:
            "CAC blended, paid and marginal, payback in months and in bookings, and when buying customers with discounts pays back.",
          contentFile: "pm-cac-and-payback.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Roost's blended CAC is ₹286. The budget doubles, and nearly all the new money goes to Instagram. What does each added student cost?",
              options: [
                "₹286, the blended figure from last season",
                "₹900, the cost of the channel it buys",
                "₹667, the paid CAC across all channels",
                "₹572, since doubling spend doubles the cost",
              ],
              answer: 1,
              explanation:
                "A budget decision is about the marginal customer. Coaching partners are at their ceiling and ambassadors are getting dearer, so new money buys Instagram students at ₹900, whatever the blended average says.",
            },
            {
              kind: "predict",
              prompt:
                "A SaaS product costs $80 a month, has a 75% gross margin, and spends $900 to win each account. Predict its payback period.",
              options: [
                "11.25 months, dividing CAC by the price",
                "12 months, since annual plans set payback",
                "20 months, since churn stretches the margin",
                "15 months, dividing CAC by the margin",
              ],
              answer: 3,
              explanation:
                "Each account earns $80 x 0.75 = $60 of margin a month, so $900 / $60 = 15 months. Dividing by price instead of margin understates payback, and 15 months is past Skok's 12-month guideline.",
            },
            {
              kind: "mcq",
              prompt:
                "Which business best fits the video's case for spending heavily on discounts early?",
              options: [
                "A grocery app people keep using weekly after the offer",
                "A housing app whose students book once a year at most",
                "A cinema pass that pays full price for each ticket used",
                "A wedding planner whose clients book a single event",
              ],
              answer: 0,
              explanation:
                "A discount is a payback bet: it needs frequent purchases, customers who stay once the offer ends, and real margin afterwards. Weekly use gives the discount a habit to lock in; the others lack frequency or margin.",
            },
          ],
        },
      ],
    },
    {
      slug: "ratios-and-marketplaces",
      title: "Ratios and marketplaces",
      description:
        "The ratios investors ask for, and how the numbers change when a platform has two sides.",
      lessons: [
        {
          slug: "pm-ltv-cac-ratio",
          title: "LTV to CAC, and net revenue retention",
          summary:
            "Where the 3 to 1 rule comes from, why a ratio far above it means growth left unbought, and net revenue retention worked from expansion and churn.",
          contentFile: "pm-ltv-cac-ratio.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "A SaaS company's LTV is $1,200, its CAC is $150, and payback takes four months. Predict what a ratio of 8 most likely says.",
              options: [
                "Its product is priced too high for its market",
                "It could profitably spend more to win customers",
                "It should cut marketing to protect the ratio",
                "Its LTV must be overstated, since 8 is implausible",
              ],
              answer: 1,
              explanation:
                "Skok saw the best SaaS businesses reach 7 or 8, and his advice once the lines are cleared is to accelerate. A ratio far above 3 with a fast payback usually means customers it could win at a profit are going to competitors.",
            },
            {
              kind: "mcq",
              prompt:
                "A cohort starts the year at ₹500,000 of MRR. Over the year it expands by ₹60,000, contracts by ₹20,000 and churns ₹90,000. What is its net revenue retention?",
              options: ["78%", "112%", "90%", "102%"],
              answer: 2,
              explanation:
                "(500,000 + 60,000 - 20,000 - 90,000) / 500,000 = 450,000 / 500,000 = 90%. The 78% is gross revenue retention, which leaves out expansion and so can never pass 100%.",
            },
            {
              kind: "mcq",
              prompt: "Why is 3 to 1 a safer bar for LTV:CAC than 1 to 1?",
              options: [
                "Investors require CAC to be repaid three times a year",
                "Customers from paid channels churn three times faster",
                "Skok derived it from the length of a SaaS contract",
                "LTV is margin before overheads, and only a forecast",
              ],
              answer: 3,
              explanation:
                "A ratio of 1 recovers acquisition and nothing else, leaving engineering and management unpaid, and LTV assumes churn stays put. Skok's 3 is an observation from companies that did well; that headroom is why it is a sensible bar.",
            },
          ],
        },
        {
          slug: "pm-marketplace-economics",
          title: "Marketplace economics",
          summary:
            "GMV, take rate, net revenue and contribution per booking, worked for Roost, and why verified supply is the side that sets its pace.",
          contentFile: "pm-marketplace-economics.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which number tells you whether each Roost booking makes money?",
              options: [
                "Contribution: net revenue less per-booking costs",
                "Gross merchandise value: the rent moving through Roost",
                "Take rate: the share of each booking's rent Roost keeps",
                "Net revenue: the commission earned across all bookings",
              ],
              answer: 0,
              explanation:
                "GMV and take rate describe volume and pricing, and net revenue is what Roost earns. Only contribution subtracts the payment, support and verification costs each booking brings: ₹525 of the ₹720.",
            },
            {
              kind: "predict",
              prompt:
                "In Roost's newest city, only 3% of searches end in a booking, and most requests are declined because the beds are already taken. Predict which spend adds the most bookings next season.",
              options: [
                "More Instagram ads to bring in more searching students",
                "More verification visits to add rooms near campus",
                "A ₹300 discount on every student's first booking",
                "A higher take rate to pay for a bigger ad budget",
              ],
              answer: 1,
              explanation:
                "When requests fail because beds are gone, supply is the binding side. More students or cheaper bookings add requests to the same full rooms; verified properties turn requests Roost already gets into bookings.",
            },
            {
              kind: "mcq",
              prompt:
                "A new property costs ₹800 to verify and brings 5 bookings in its first season. With ₹90 of payment fees and ₹90 of support per booking, what does each first-season booking contribute?",
              options: [
                "₹525, the same as an established property's",
                "₹540, since the visit is a one-off cost",
                "₹380, after ₹160 of verification each",
                "-₹80, since ₹800 exceeds one booking's ₹720",
              ],
              answer: 2,
              explanation:
                "₹800 over 5 bookings is ₹160 each, so ₹720 - ₹90 - ₹90 - ₹160 = ₹380. The booking still earns money in its first season, and every later season spreads the visit further.",
            },
          ],
        },
      ],
    },
  ],
}
