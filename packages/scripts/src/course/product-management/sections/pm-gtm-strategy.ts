import type { SectionSeed } from "../../types"

export const pmGtmStrategy: SectionSeed = {
  slug: "pm-gtm-strategy",
  title: "Go-to-market strategy",
  description:
    "The plan that takes a product to its customers: what a go-to-market plan contains, the sales-led and product-led motions, choosing channels, and a full plan worked for one product.",
  badgeIcon: "🚀",
  badgeTitle: "GTM",
  units: [
    {
      slug: "plan-and-motion",
      title: "The plan and the motion",
      description: "What a go-to-market plan contains, and what does the convincing.",
      lessons: [
        {
          slug: "pm-gtm-plan",
          title: "What a go-to-market plan contains",
          summary:
            "The video's twelve components grouped into five questions, and why every one of them has to be derived from a single ideal customer profile.",
          contentFile: "pm-gtm-plan.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "The video illustrates its twelve components with Zoom, Tesla, Netflix, Dropbox and Salesforce. Why does combining those answers fail as a plan?",
              options: [
                "The companies are in different industries, so their numbers do not transfer",
                "The answers were not derived from one customer, so they do not fit together",
                "Twelve components is more than one team can execute in a single launch",
                "Large companies can afford channels that a new product cannot",
              ],
              answer: 1,
              explanation:
                "Each component is a consequence of who the customer is. Answers borrowed from five companies with five different customers contradict each other, however sensible each one looks alone.",
            },
            {
              kind: "predict",
              prompt:
                "Roost swaps its ideal customer profile from first-year students to young professionals moving for a first job. Before rewriting anything, predict how much of the plan must be revisited.",
              options: [
                "Only the messaging, since the product is unchanged",
                "Messaging and channels, but not timing or metrics",
                "Most of it, from the calendar and buyer to the channels",
                "None of it, because the value proposition is the same",
              ],
              answer: 2,
              explanation:
                "The calendar (all year instead of June to August), the buyer (the renter, not a parent), the channels and the message all hang off the ICP. If a new ICP left them untouched, they were never derived from it.",
            },
            {
              kind: "mcq",
              prompt:
                "Which gap in the video's twelve-component list makes every other component impossible to judge?",
              options: [
                "A measurable objective, such as bookings by a date",
                "A section on the brand's visual identity and tone",
                "A feature-by-feature table of every competitor",
                "An estimate of the engineering effort to launch",
              ],
              answer: 0,
              explanation:
                "A channel, a budget or a message is only good or bad relative to a target. The video's own step list starts with defining objectives, but the component list never includes one.",
            },
          ],
        },
        {
          slug: "pm-gtm-motions",
          title: "Sales-led, product-led, marketing-led",
          summary:
            "Three answers to what does the convincing, and the arithmetic of deal size, buyer complexity and time to value that picks one per customer.",
          contentFile: "pm-gtm-motions.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why does Roost send a person to sign each owner but let students book on their own?",
              options: [
                "Owners need more help with apps than students do",
                "Verification is a legal duty that applies only to owners",
                "Students avoid calls, while owners prefer to negotiate",
                "An owner brings about 40 bookings a year; a student brings one",
              ],
              answer: 3,
              explanation:
                "At ₹720 a booking, a ₹2,000 visit is repaid by an owner's third booking, while a human touch per student costs more than the booking earns. The motion follows the value of the customer.",
            },
            {
              kind: "predict",
              prompt:
                "A startup sells audit software to banks for ₹4,000,000 a year. Security, legal and IT must all approve, and setup takes six weeks. A board member wants to replace sales with a free self-serve tier. Predict the result.",
              options: [
                "More paid contracts, since more banks can try it without a call",
                "No change, since the product and price are the same as before",
                "Many signups but few contracts, since no trial user can buy alone",
                "Contracts rise slowly as trial users win over their committees",
              ],
              answer: 2,
              explanation:
                "Product-led needs value in minutes and a user who can decide. Here value takes six weeks and three functions must sign, so the free tier collects signups that never reach value, and a salesperson still has to close.",
            },
            {
              kind: "mcq",
              prompt:
                "In the pilot, called families at the deposit step booked at 22% and uncalled ones at 12%. Which number decides whether a caller pays for themselves?",
              options: [
                "The 22% booking rate among the called families",
                "The 10-point gap between called and uncalled families",
                "The 12% rate, which shows how strong demand already is",
                "The 17% average rate across both groups of families",
              ],
              answer: 1,
              explanation:
                "The 12% would have booked anyway, so only the 10-point lift is caused by the call. Crediting the call with the full 22% makes it look more than twice as productive as it is.",
            },
          ],
        },
      ],
    },
    {
      slug: "channels-and-a-plan",
      title: "Channels and a worked plan",
      description: "Where customers first meet the product, and a full plan for a new city.",
      lessons: [
        {
          slug: "pm-channels",
          title: "Choosing channels",
          summary:
            "Channels start from where the customer already is, get tested against a pass line before the season, and usually narrow to one that dominates.",
          contentFile: "pm-channels.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "What do the video's four hostel-app channels (student communities, creators, SEO guides, coaching partners) have in common?",
              options: [
                "Students are already in each one before hearing of the app",
                "They were the cheapest channels open to a new consumer app",
                "They reach every age group in tier-1 cities at once",
                "They were the channels the marketing team knew how to run",
              ],
              answer: 0,
              explanation:
                "Each is a place the ideal customer already spends time before they need the product. Choosing channels from the customer's path, not from the team's habits, is what makes them worth testing.",
            },
            {
              kind: "predict",
              prompt:
                "Roost wants parents who search 'PG near' plus a college's name to find it. Predict the first piece of work that decides whether this channel can work.",
              options: [
                "A larger budget for search ads on each college's name",
                "A blog post of hostel-hunting tips for each city",
                "A backlink campaign with education news websites",
                "Pages per college and locality, generated from verified listings",
              ],
              answer: 3,
              explanation:
                "Products are built to fit channels, as Balfour puts it. Search needs an indexable page for each query people type, and only the product can generate one per college and locality, so the first step is an engineering ticket.",
            },
            {
              kind: "predict",
              prompt:
                "An ambassador test run in October comes back at ₹3,000 per booking against a ₹400 pass line. What should you conclude?",
              options: [
                "Ambassadors fail the pass line and should be dropped",
                "Nothing yet, since October demand is close to zero",
                "Ambassadors need a bigger budget to reach scale",
                "The pass line should rise to ₹3,000 for new channels",
              ],
              answer: 1,
              explanation:
                "Roost's bookings land between June and August, so an October test measures an empty market rather than the channel. Rerun it in April or May, when students are actually looking.",
            },
          ],
        },
        {
          slug: "pm-gtm-worked",
          title: "A go-to-market plan, worked",
          summary:
            "Roost's Chennai launch with every component computed: market size, verified supply, channels, budget, break-even and the risk that could stop it.",
          contentFile: "pm-gtm-worked.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why is the Chennai plan's first dated milestone 300 verified properties rather than a bookings number?",
              options: [
                "Students cannot install the app until owners are signed",
                "Verification is the cheapest line in the plan's budget",
                "Bookings can never exceed what verified supply can carry",
                "Regulators in a new city require verified supply first",
              ],
              answer: 2,
              explanation:
                "Supply is the scarcer side of Roost's marketplace, so it caps everything downstream: 300 properties at 5 bookings each is what makes 1,500 bookings possible. A leading indicator on supply warns in April, not in August.",
            },
            {
              kind: "predict",
              prompt:
                "In June, Chennai's ambassadors come in at ₹550 a booking instead of the budgeted ₹400. Everything else runs to plan. What happens to the first season's ₹215,000 contribution?",
              options: [
                "It turns negative, since ambassadors are the largest channel",
                "It is unchanged, since the blended cost stays near ₹250",
                "It falls by ₹225,000, the gap across all 1,500 bookings",
                "It falls by ₹90,000 to ₹125,000, so the season still pays",
              ],
              answer: 3,
              explanation:
                "Only the 600 ambassador bookings cost more: 600 x ₹150 = ₹90,000. Because every row is computed, a miss in one channel shows its exact effect instead of a vague sense that the launch is over budget.",
            },
            {
              kind: "mcq",
              prompt:
                "Measured against the Roost plan, what is the main weakness of the video's thermostat plan?",
              options: [
                "Its rows are not linked by numbers, so none can be checked",
                "It names the wrong competitors for a smart thermostat",
                "It sells through retailers instead of selling direct",
                "It treats hardware supply as a risk when it is not one",
              ],
              answer: 0,
              explanation:
                "Every row is filled in, but with no target, no cost per sale and one message for two segments, nothing in it can be shown wrong. Its supply risk is actually its best row.",
            },
          ],
        },
      ],
    },
  ],
}
