import type { SectionSeed } from "../../types"

export const pmProductsAndModels: SectionSeed = {
  slug: "pm-products-and-models",
  title: "Products and business models",
  description:
    "What counts as a product, why anyone picks it over the alternative, and the handful of ways products turn value into revenue.",
  badgeIcon: "💼",
  badgeTitle: "Business model",
  units: [
    {
      slug: "what-you-sell",
      title: "What you sell",
      description:
        "What counts as a product, and the reason a customer picks it over what they use today.",
      lessons: [
        {
          slug: "pm-what-a-product-is",
          title: "A product is a solved problem",
          summary:
            "The video's definition and four product types, Levitt's total product, and why the part that does the solving is not a cost to cut.",
          contentFile: "pm-what-a-product-is.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What did Bloomberg's hand-squeezing test show about the Juicero press?",
              options: [
                "It was priced far above what buyers would pay for juice",
                "It added almost nothing the packs did not already deliver",
                "It solved a real problem but reached the market too early",
                "It failed because the packs cost too much to make and ship",
              ],
              answer: 1,
              explanation:
                "Squeezed by hand, the packs gave nearly the same juice, so the $699 machine solved no problem the packs had not already solved. Cutting the price to $399 could not fix a missing problem.",
            },
            {
              kind: "predict",
              prompt:
                "Roost is the only app that shows the full monthly cost, electricity included, on every listing. Two rivals copy it, and students start assuming every app does this. In Levitt's rings, what happens to the feature?",
              options: [
                "It stays augmented, because Roost was the first app to offer it",
                "It moves to potential, a feature to plan for the roadmap's later phases",
                "It moves to generic, the basic thing every student comes to Roost for",
                "It becomes expected: its absence costs you, its presence earns nothing",
              ],
              answer: 3,
              explanation:
                "Once buyers assume a feature comes with any product like yours, it has moved into the expected ring. Dropping it now loses bookings, while keeping it no longer sets Roost apart.",
            },
            {
              kind: "mcq",
              prompt: "Why does the lesson call Roost a digital product wrapped around a service?",
              options: [
                "The app is free for students, and owners pay for it instead",
                "Engineers build the app, and operations staff answer support",
                "The value students rely on comes from a person visiting the room",
                "Roost earns a commission per booking rather than a license fee",
              ],
              answer: 2,
              explanation:
                "The app lists rooms, but the problem is solved by the verification visit, which costs staff time for every property. That part scales with people, not servers, and it is the part not to cut for speed.",
            },
          ],
        },
        {
          slug: "pm-value-proposition",
          title: "Why anyone would switch",
          summary:
            "Strategyzer's value proposition canvas run on Roost, and why the proposition has to beat the WhatsApp group and the broker, not a rival app.",
          contentFile: "pm-value-proposition.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Of 300 students who searched Roost but booked elsewhere, 12 chose another app and 195 used a broker or a WhatsApp group. What should Roost's value proposition be written against?",
              options: [
                "The three rival apps on the founder's competition slide",
                "The features rival apps launched during the last season",
                "An average of all five channels, weighted by students",
                "The WhatsApp group and the broker, where most of them went",
              ],
              answer: 3,
              explanation:
                "A value proposition is the reason to pick you over what the customer would otherwise do. For 65% of these students that was a broker or a group, not an app, so that is the comparison Roost has to win.",
            },
            {
              kind: "mcq",
              prompt: "Using Strategyzer's canvas, which side should the team fill in first?",
              options: [
                "The customer profile, from interviews, then the value map",
                "The value map, since the team knows its own product best of all",
                "Both at once, so every pain gets a matching reliever",
                "Whichever side the team has more evidence for today",
              ],
              answer: 0,
              explanation:
                "The profile comes first, ranked from real interviews. A value map drawn first tends to invent pains that its existing features happen to relieve, which produces fit on paper only.",
            },
            {
              kind: "predict",
              prompt:
                "Students who used a broker say the one thing they valued was seeing the room before paying. Which Roost change competes with the broker on that?",
              options: [
                "Cashback equal to the fee a broker usually charges",
                "A video walk-through recorded at the verification visit",
                "More listings in each area than any one broker can show",
                "A lower commission for owners who stop using brokers",
              ],
              answer: 1,
              explanation:
                "Competing with an alternative means beating it on the strength customers name. A walk-through filmed by Roost's own staff shows the room without the trip, which a discount or more listings does not.",
            },
          ],
        },
      ],
    },
    {
      slug: "how-it-pays",
      title: "How it pays",
      description:
        "The ways products turn value into revenue: for people, for companies, and by subscription.",
      lessons: [
        {
          slug: "pm-business-models",
          title: "Capturing the value you create",
          summary:
            "Value creation versus capture, the common models and what each rewards, and Roost's commission and Featured revenue worked from its numbers.",
          contentFile: "pm-business-models.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why does the lesson treat the choice of business model as a product decision?",
              options: [
                "It decides what the roadmap ends up optimizing",
                "The PM usually sets the price of every plan",
                "Investors judge a product mainly by its model",
                "Each model requires a different technology stack",
              ],
              answer: 0,
              explanation:
                "An ad-funded app is pushed toward time spent, a subscription toward retention, a commission toward transactions that finish on the platform. The model quietly sets the goal every feature is judged against.",
            },
            {
              kind: "predict",
              prompt:
                "Roost replaces its 8% commission with a flat ₹2,500 a month per property. Which owners are most likely to leave first?",
              options: [
                "Large hostels that get dozens of bookings a season",
                "Owners who already pay for Featured listings",
                "Small PGs that get a few bookings a year",
                "Owners who joined Roost in its first year",
              ],
              answer: 2,
              explanation:
                "A 6-bed PG with 3 bookings pays ₹2,160 a year in commission and would pay ₹30,000 flat, nearly fourteen times more. A flat fee charges owners whether or not Roost delivers a booking, so those who get the least value leave.",
            },
            {
              kind: "mcq",
              prompt: "Why does Roost charge owners rather than students?",
              options: [
                "Owners are easier to invoice than thousands of students",
                "Owners gain the rent, and students have free alternatives",
                "Charging students would weaken the promise of verification",
                "Owners asked to pay so their listings would rank higher",
              ],
              answer: 1,
              explanation:
                "Charge the side that gets the value and can pay. An owner collects about ₹90,000 of rent from a booking, while a student charged a fee can go back to the WhatsApp group for free.",
            },
          ],
        },
        {
          slug: "pm-b2b-and-b2c",
          title: "Selling to people, selling to companies",
          summary:
            "Who decides, pays, uses and renews in B2C and B2B, the ISV, MSP, SI and VAR roles, and a university deal tested for repeatability.",
          contentFile: "pm-b2b-and-b2c.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "What changes most in how a PM learns when moving from a B2C product to a B2B one?",
              options: [
                "B2B products have fewer features, so there is less to test",
                "B2B buyers answer surveys more honestly than consumers do",
                "Experiments need volume; B2B learns from a few big accounts",
                "B2C users decide on price alone, so research matters less",
              ],
              answer: 2,
              explanation:
                "Roost's 60,000 students a month can support experiments. A B2B product has a handful of accounts, each worth as much as 1,667 bookings, so the PM learns from conversations with them instead.",
            },
            {
              kind: "predict",
              prompt:
                "You are the PM at an ISV. A system integrator that implements your product says your API documentation is hard to follow. No end customer has complained. How urgent is it?",
              options: [
                "High, since integrators shape deals you never see",
                "Low, since integrators are not the paying customers",
                "Low, since the integrator can hire help to read it",
                "Medium, to fix once an end customer complains",
              ],
              answer: 0,
              explanation:
                "Integrators and resellers are an ISV's customers too. If they struggle with your API, deals stall in meetings you never attend, and end customers never tell you why they bought something else.",
            },
            {
              kind: "mcq",
              prompt:
                "A university offers ₹1,200,000 a year for a custom housing portal. What mainly decides whether Roost should build it?",
              options: [
                "Whether the university will sign within one quarter",
                "Whether ₹1,200,000 covers the five engineer-weeks",
                "Whether the dean agrees to drop the approval clause",
                "Whether other colleges would buy the same product",
              ],
              answer: 3,
              explanation:
                "One deal is 3.5% of Roost's yearly commission; ten would be about 35%. A B2B contract is a request, not a spec, so the question is whether the segment wants what this customer is asking for.",
            },
          ],
        },
        {
          slug: "pm-saas-economics",
          title: "Why software went subscription",
          summary:
            "Why subscriptions replaced the box, Adobe's 2013 switch, and one month of MRR split into new, expansion, contraction and churn.",
          contentFile: "pm-saas-economics.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Adobe's revenue fell in fiscal 2013 while its subscriptions grew. Why?",
              options: [
                "Subscribers paid over years what box buyers paid at once",
                "Many customers stopped using its creative software entirely",
                "It cut prices to win users back from rival design tools",
                "Running the apps in the cloud raised its costs sharply",
              ],
              answer: 0,
              explanation:
                "At $49.99 a month, a subscriber takes 52 months to pay what one $2,599 box buyer paid. Revenue dips during the switch even as customers sign up, which is why recurring revenue was the number to watch.",
            },
            {
              kind: "predict",
              prompt:
                "A SaaS product starts the month at ₹500,000 MRR. New: ₹40,000. Expansion: ₹10,000. Contraction: ₹5,000. Churned: ₹30,000. What is the ending MRR, and how did the existing base move?",
              options: [
                "₹5,15,000, and the base grew by ₹15,000",
                "₹5,45,000, and the base fell by ₹25,000",
                "₹5,15,000, and the base fell by ₹25,000",
                "₹5,05,000, and the base fell by ₹35,000",
              ],
              answer: 2,
              explanation:
                "Net new MRR is 40,000 + 10,000 - 5,000 - 30,000 = ₹15,000, so MRR ends at ₹515,000. Leave out new sales and the base moved 10,000 - 5,000 - 30,000 = -₹25,000: new customers hid a shrinking base.",
            },
            {
              kind: "mcq",
              prompt:
                "A customer pays ₹12,000 upfront in September for an annual plan. How much does it add to September's MRR?",
              options: [
                "₹12,000, since the cash arrived that month",
                "₹1,000, the plan's monthly value",
                "Nothing until the plan renews next year",
                "₹12,000 to ARR and nothing to MRR",
              ],
              answer: 1,
              explanation:
                "MRR counts the monthly value of each active subscription, not the cash received. The annual plan counts as ₹12,000 / 12 = ₹1,000 a month, which keeps a month of annual sign-ups from looking like a boom.",
            },
          ],
        },
      ],
    },
  ],
}
