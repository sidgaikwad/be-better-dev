import type { SectionSeed } from "../../types"

export const pmTheRole: SectionSeed = {
  slug: "pm-the-role",
  title: "What a product manager does",
  description:
    "The job in one sentence, the four risks a PM answers for, and how the role bends with the company around it.",
  badgeIcon: "🧭",
  badgeTitle: "Navigator",
  units: [
    {
      slug: "the-job",
      title: "The job",
      description: "Why the role exists, the risks it answers for, and the authority it lacks.",
      lessons: [
        {
          slug: "pm-why-the-role-exists",
          title: "The problem behind the request",
          summary:
            "A PM finds the problem behind a request and owns the why and the what. Meet Roost, the product you will run.",
          contentFile: "pm-why-the-role-exists.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Roost's chat feature shipped on time and the booking rate did not move. What was missing before it was built?",
              options: [
                "Engineering time to build chat properly before the season",
                "A statement of the problem behind the students' request",
                "More support messages proving that students wanted chat",
                "A usability test of the chat screens before it launched",
              ],
              answer: 1,
              explanation:
                "The build was sound and the demand was real. Nobody asked why students wanted to message owners, and the answer, a price and availability they could not trust, pointed to fixes that chat did not deliver.",
            },
            {
              kind: "predict",
              prompt:
                "An owner asks for a way to upload all their room photos at once. It is half a day of engineering work. Using the lesson's rule, what should the PM do?",
              options: [
                "Interview five owners about photos before deciding",
                "Hold it until it can be scored against other requests",
                "Ask the owner to write up the underlying problem first",
                "Ship it, since the change costs less than the digging",
              ],
              answer: 3,
              explanation:
                "The rule matches the depth of the investigation to the cost of the build. Half a day of work is cheaper than the investigation, and a wrong guess is cheap to undo.",
            },
            {
              kind: "mcq",
              prompt: "Which split of ownership does the lesson give the product manager?",
              options: [
                "The why and the what, but not the how",
                "The what and the how, but not the why",
                "The how and the when, but not the why",
                "The why alone, but not the what or how",
              ],
              answer: 0,
              explanation:
                "The PM decides which problem matters, for whom, and what outcome a solution must produce. The screens and the code belong to the designer and engineers, who are better placed to choose them.",
            },
          ],
        },
        {
          slug: "pm-four-risks",
          title: "Value, usability, feasibility, viability",
          summary:
            "Cagan's four ways an idea fails, who owns each, and Roost's instalment payments run through all four.",
          contentFile: "pm-four-risks.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In Cagan's split, which two risks does the product manager own?",
              options: [
                "Usability and feasibility",
                "Value and usability",
                "Value and viability",
                "Feasibility and viability",
              ],
              answer: 2,
              explanation:
                "The designer owns usability and the tech lead owns feasibility. The PM answers for whether customers will choose the product and whether it works for the business, the two risks Cagan says to tackle first.",
            },
            {
              kind: "predict",
              prompt:
                "Roost pays a lender 4% of each ₹27,000 instalment plan and earns ₹720 commission per booking. Instalments prove popular and twice as many bookings use them. What happens to Roost's result on those bookings?",
              options: [
                "The total loss doubles, at ₹360 on each one",
                "It turns positive once volume covers the fee",
                "It breaks even, since new bookings offset the fee",
                "It improves, since more bookings spread the fee",
              ],
              answer: 0,
              explanation:
                "The fee is paid on every booking, not once, so ₹720 minus ₹1,080 loses ₹360 each time and volume multiplies the loss. Only changing who pays the fee makes the feature viable.",
            },
            {
              kind: "mcq",
              prompt:
                "Students asked for instalments. Which of these is a value risk for the feature?",
              options: [
                "Students may not finish a credit check on a phone",
                "Roost may lose ₹360 on every financed booking",
                "Five engineers may not integrate a lender by June",
                "The parents who often pay may not want it",
              ],
              answer: 3,
              explanation:
                "Value asks whether the customer will choose it, and at Roost the person paying is often a parent. The other options are real risks too, but they are usability, viability and feasibility.",
            },
          ],
        },
        {
          slug: "pm-responsibility-without-authority",
          title: "Responsibility without authority",
          summary:
            "Why 'CEO of the product' is right about scope and wrong about power, and what a PM uses instead of authority.",
          contentFile: "pm-responsibility-without-authority.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "What did Cagan keep from the 'CEO of the product' metaphor, and what did he reject?",
              options: [
                "He kept the authority and rejected the breadth",
                "He rejected the whole metaphor as misleading",
                "He kept it only for founders who act as PMs",
                "He kept the breadth and rejected the authority",
              ],
              answer: 3,
              explanation:
                "Like a CEO, a PM has to weigh finance, sales, legal and marketing together. Unlike a CEO, nobody reports to them, so the title buys only a chance to earn the team's respect.",
            },
            {
              kind: "predict",
              prompt:
                "A launch slips because engineering underestimated the work, and the PM tells the founder the delay was engineering's fault. How would Horowitz's memo judge that?",
              options: [
                "Fair, since the PM does not own feasibility",
                "As excuse-making by a PM who owns the result",
                "Fair, provided the PM documented the estimate",
                "As a process failure rather than a PM failure",
              ],
              answer: 1,
              explanation:
                "Horowitz's good PM takes full responsibility and measures themselves by the product's success, while his bad PM has excuses. Owning the result includes owning how a shaky estimate made it into the plan.",
            },
            {
              kind: "mcq",
              prompt: "Which message to the tech lead relies on influence rather than authority?",
              options: [
                "One that asks them to prioritize your feature by Friday",
                "One that mentions the founder's support for your plan",
                "One that shares evidence and proposes deciding together",
                "One that lists the feature's requirements in full detail",
              ],
              answer: 2,
              explanation:
                "Evidence and context give the tech lead something to reason with and leave the how to them. Invoking the founder borrows authority, which works once and costs trust.",
            },
          ],
        },
      ],
    },
    {
      slug: "the-people-around-it",
      title: "The people around it",
      description:
        "Neighboring roles, the trio that decides together, and how the job changes with the company.",
      lessons: [
        {
          slug: "pm-roles-around-pm",
          title: "PM, project manager, product owner, PMM, TPM",
          summary:
            "Where the PM job ends and the project manager, product owner, product marketer and TPM begin.",
          contentFile: "pm-roles-around-pm.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In the 2020 Scrum Guide, what is the product owner?",
              options: [
                "One accountability, held by one person, not a job title",
                "A separate job title that sits alongside the product manager",
                "A committee of stakeholders that orders the backlog",
                "The Scrum Master's deputy for grooming the backlog",
              ],
              answer: 0,
              explanation:
                "Scrum defines three accountabilities, and the product owner's is maximizing the value of the team's work, which includes ordering the backlog. The guide says it is one person, not a committee, and in most product companies the PM holds it.",
            },
            {
              kind: "predict",
              prompt:
                "The founder hires a product owner to write and order tickets while the PM keeps strategy and customers. What is the likely result?",
              options: [
                "Faster delivery, since tickets get written sooner",
                "Better discovery, since the PM gains more free time",
                "Two half-jobs, and questions bouncing between them",
                "No change, since the PM still sets the priorities",
              ],
              answer: 2,
              explanation:
                "One person holds the customer knowledge, the other the feel for the technology, and neither clearly owns the result, which is Cagan's 2011 argument. Split along delivery work instead of through the middle of the what.",
            },
            {
              kind: "mcq",
              prompt: "What does a product marketing manager own that a product manager does not?",
              options: [
                "Deciding which features the team builds next",
                "Positioning, messaging and the launch itself",
                "Running the sprint schedule and release plan",
                "Dependencies across many engineering teams",
              ],
              answer: 1,
              explanation:
                "Cagan splits them cleanly: the PM decides with design and engineering what gets built, and product marketing tells the market about it. The other options belong to the PM, the project manager and the TPM.",
            },
          ],
        },
        {
          slug: "pm-product-trio",
          title: "The product trio",
          summary:
            "Feature teams get roadmaps, empowered teams get problems, and the PM, designer and tech lead decide together.",
          contentFile: "pm-product-trio.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "What separates an empowered product team from a feature team, in Cagan's terms?",
              options: [
                "It has more engineers and a dedicated designer on it",
                "It gets problems and is judged on outcomes, not output",
                "It skips roadmaps and ships whatever users ask for most",
                "It reports to the PM instead of to engineering leads",
              ],
              answer: 1,
              explanation:
                "Both kinds of team are cross-functional. A feature team gets a roadmap and is measured on shipping it, while an empowered team gets a problem and is measured on whether it is solved.",
            },
            {
              kind: "mcq",
              prompt:
                "The trio deadlocks over how the booking screen should work. Who makes the call?",
              options: [
                "The PM, who owns the outcome for the product",
                "The founder, who breaks ties across the team",
                "The tech lead, who must build whatever is chosen",
                "The designer, who owns the usability risk",
              ],
              answer: 3,
              explanation:
                "The lesson's rule follows the four risks: whoever owns the risk in dispute decides. How a screen works is usability, so it is the designer's call, and the PM must not take a tie-breaking vote.",
            },
            {
              kind: "predict",
              prompt:
                "The tech lead spends 4 hours a week in discovery, 2% of a five-engineer team. Over a 12-week season, how does that compare with one wrong three-week build?",
              options: [
                "1.2 engineer-weeks a season, against 15 wasted",
                "Roughly equal, so it comes down to preference",
                "Costlier, because engineer time is the scarcest",
                "Cheaper only if it replaces the written spec",
              ],
              answer: 0,
              explanation:
                "48 hours over the season is about 1.2 engineer-weeks, while three weeks of five engineers is 15. Preventing one wrong build a season repays the time more than ten times.",
            },
          ],
        },
        {
          slug: "pm-kinds-of-pm",
          title: "One title, many jobs",
          summary:
            "Startup generalist, growth, platform and enterprise PMs: one title, different customers and different weeks.",
          contentFile: "pm-kinds-of-pm.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Who is a platform PM's customer?",
              options: [
                "The company's biggest paying enterprise accounts",
                "End users at one stage of the funnel",
                "Other engineering teams inside the company",
                "The founder and the leadership team",
              ],
              answer: 2,
              explanation:
                "Platform PMs serve internal customers, the teams that build on their APIs and infrastructure. Those teams often cannot switch away, so their feedback arrives quietly and late.",
            },
            {
              kind: "predict",
              prompt:
                "Roost grows to three PMs, and the founder wants one PM per city: Pune, Bengaluru and Hyderabad. What is the likely result?",
              options: [
                "Three PMs owning the same flows, fighting for engineers",
                "Faster fixes, since each city gets its own roadmap",
                "Better owner relationships in each of the cities",
                "Clearer metrics, since each city tracks its bookings separately",
              ],
              answer: 0,
              explanation:
                "The cities share one app and one codebase, so city PMs would each own the same search, booking and payments. What differs by city is operations and marketing, so product ownership should follow customers instead.",
            },
            {
              kind: "mcq",
              prompt:
                "A growth PM lifts signups by shortening the form, and fewer of the new users go on to book. Which failure of the growth role is this?",
              options: [
                "Breadth, with too many risks landing on one desk",
                "Quiet feedback from customers who cannot leave",
                "A roadmap pulled toward promises made in deals",
                "Local optimization of one stage of the funnel",
              ],
              answer: 3,
              explanation:
                "A growth PM owns a slice of the funnel, and a slice can improve while the whole gets worse. The check is to watch the step after yours, not only your own rate.",
            },
          ],
        },
      ],
    },
  ],
}
