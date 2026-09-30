import type { SectionSeed } from "../../types"

export const pmCareer: SectionSeed = {
  slug: "pm-career",
  title: "Becoming a product manager",
  description:
    "Getting into the role and growing in it: the paths in, the ladder, a portfolio case study, and the product sense, estimation, execution and behavioral interviews.",
  badgeIcon: "🎓",
  badgeTitle: "Career",
  units: [
    {
      slug: "getting-in",
      title: "Getting in and moving up",
      description:
        "The routes into product, the rungs above it, and the case study that proves you can do the job.",
      lessons: [
        {
          slug: "pm-paths-into-pm",
          title: "Paths into product",
          summary:
            "Engineering, design, data, consulting, internal transfer and associate PM programs: what each route brings, and what a developer must learn.",
          contentFile: "pm-paths-into-pm.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Of the four risks, which one does a developer moving into product usually judge best on arrival?",
              options: [
                "Value: whether customers want it",
                "Feasibility: whether the team can build it",
                "Viability: whether it works for the business",
                "Usability: whether people can figure it out",
              ],
              answer: 1,
              explanation:
                'A developer can tell on the spot when a small request hides a migration or a new index. The gaps are usually value and viability, which is why the question to unlearn is "can we build it?"',
            },
            {
              kind: "predict",
              prompt:
                "An engineer with four years' experience wants to move into product. Predict which step does most to get her hired as a PM.",
              options: [
                "Finishing a paid PM certificate course before she applies",
                "Applying to associate PM programs at large companies",
                "Rewriting her CV to describe her engineering work as product work",
                "Owning one measurable product problem at her current company",
              ],
              answer: 3,
              explanation:
                "Hiring is a bet on evidence, and an outcome she owned is evidence a hiring manager can check. Associate PM programs mostly take new graduates, and a certificate shows knowledge, not judgment.",
            },
            {
              kind: "mcq",
              prompt: "Which habit most often has to be unlearned by a developer who becomes a PM?",
              options: [
                "Writing the implementation into the ticket",
                "Reading pull requests before they merge",
                "Querying the events table directly",
                "Prototyping a flow before a spec exists",
              ],
              answer: 0,
              explanation:
                "Specifying the implementation takes away the engineers' best contribution, how to build it. Reading code, querying data and prototyping are strengths a developer should keep.",
            },
          ],
        },
        {
          slug: "pm-career-ladder",
          title: "The career ladder",
          summary:
            "Associate PM to chief product officer: what grows at each rung is scope, ambiguity, people and time horizon, not the number of features shipped.",
          contentFile: "pm-career-ladder.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What most separates a senior PM from a PM on the same team?",
              options: [
                "Shipping more features each quarter, on schedule",
                "Managing the other PMs in the product area",
                "Being handed an outcome and finding the problems",
                "Writing longer and more detailed specifications",
              ],
              answer: 2,
              explanation:
                "A PM is usually given the goal and the problem. A senior PM is given the outcome and decides which problems are worth solving, which is why feature count alone does not earn the promotion.",
            },
            {
              kind: "predict",
              prompt:
                "You manage three PMs. One is behind on a key spec, and you could finish it in three days yourself. Predict the long-run cost of doing so.",
              options: [
                "The PM learns that deadlines end with you taking over",
                "The spec will be worse, since you know less of the detail",
                "The engineers will stop trusting the specs from your team",
                "None, because the season deadline justifies the shortcut",
              ],
              answer: 0,
              explanation:
                "At the manager rung your output is the quality of other PMs' decisions. Rescuing the spec fixes one deadline and teaches the team to wait for you, which makes you the bottleneck.",
            },
            {
              kind: "mcq",
              prompt:
                "According to Ravi Mehta's Product Competency Toolkit, which areas decide growth at senior levels?",
              options: [
                "Product execution and quality assurance",
                "Customer insight and fluency with data",
                "Feature specification and product delivery",
                "Product strategy and influencing people",
              ],
              answer: 3,
              explanation:
                "Mehta's point is about weighting: execution decides early careers, while strategy and influence become the path to growth as a PM becomes more senior.",
            },
          ],
        },
        {
          slug: "pm-portfolio-case-study",
          title: "The portfolio case study",
          summary:
            "The video's final roadmap step, given a structure: an outcome in the title, rejected options, numbers with a baseline, and the thing that failed.",
          contentFile: "pm-portfolio-case-study.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which part of a case study shows judgment most directly to an interviewer?",
              options: [
                "The options you considered and why you rejected them",
                "The screenshots of the final shipped design",
                "The list of tools and frameworks you used",
                "A description of the team and its process",
              ],
              answer: 0,
              explanation:
                "Rejected options show that a choice was made and why. Without them the answer reads as obvious, and interviewers probe exactly that gap.",
            },
            {
              kind: "predict",
              prompt:
                "A candidate's case study reports that the redesign \"improved engagement significantly\". Predict the interviewer's likely reaction.",
              options: [
                "Credit for the result, since engagement is the metric that matters",
                "Interest in the design choices behind the redesign",
                "Doubt, because there is no baseline, number or time window",
                "Approval, as long as screenshots back up the claim",
              ],
              answer: 2,
              explanation:
                'A result without a before, an after and a window cannot be checked, so it reads as a claim. "60% to 34% over two months" can be probed, which is what makes it credible.',
            },
            {
              kind: "mcq",
              prompt: "Why write the case study before recording a Loom walkthrough of it?",
              options: [
                "Hiring managers refuse to watch video submissions",
                "Writing forces the argument into order first",
                "Notion pages rank higher in search than videos",
                "A written version is required to publish on Loom",
              ],
              answer: 1,
              explanation:
                "The written version makes you decide the order of problem, evidence and decision. A walkthrough recorded without it tends to wander.",
            },
          ],
        },
      ],
    },
    {
      slug: "the-interview-loop",
      title: "The interview loop",
      description:
        "Product sense, estimation, execution and behavioral rounds, and what each one actually scores.",
      lessons: [
        {
          slug: "pm-product-sense-interview",
          title: "The product sense interview",
          summary:
            '"Design X for Y" questions, run through Lewis Lin\'s CIRCLES, and why the steps where you choose one user and one need carry the score.',
          contentFile: "pm-product-sense-interview.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                'In CIRCLES, what should happen at the step called "cut through prioritization"?',
              options: [
                "Rank every solution by engineering effort",
                "Drop the customers who will not pay for it",
                "Trim the feature list to fit a first release",
                "Choose one customer need and give the reason",
              ],
              answer: 3,
              explanation:
                "The step picks the need the rest of the answer will serve. Solutions come later and are evaluated against that need, not in general.",
            },
            {
              kind: "predict",
              prompt:
                "A candidate says every CIRCLES letter aloud, lists six customer groups and nine needs, and runs out of time before recommending anything. Predict the score.",
              options: [
                "High, since the structure was followed completely",
                "Low, because nothing was chosen or defended",
                "Average, since breadth offsets the missing ending",
                "High, if the needs were written as user stories",
              ],
              answer: 1,
              explanation:
                "Interviewers score choices with reasons: a user, a need, a solution. Reciting the framework without choosing is framework theater and shows none of that.",
            },
            {
              kind: "mcq",
              prompt:
                'Asked to design for "parents", why pick parents in another city paying for a first-year\'s room?',
              options: [
                "They are the largest group, so the answer scales",
                "They are the easiest group to interview quickly",
                "They pay and have the least information",
                "They are the group the interviewer expects",
              ],
              answer: 2,
              explanation:
                "A segment is chosen for the sharpness of its problem. These parents hold the money and cannot see the room, so the trust need is strongest there.",
            },
          ],
        },
        {
          slug: "pm-estimation-interview",
          title: "Estimation and market sizing",
          summary:
            "TAM, SAM and SOM for student housing in Pune, sized bottom-up and top-down with every assumption stated, then checked.",
          contentFile: "pm-estimation-interview.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "A marketplace earns ₹720 a booking in a city with 80,000 bookings a year and ₹13.5 billion of rent. A pitch claims 1% of the market. Predict what 1% of the rent requires.",
              options: [
                "About 1% of the city's bookings, around 800",
                "About a quarter of the city's bookings, around 20,000",
                "About 187,500 bookings, over twice the city's total",
                "About 80,000 bookings, exactly the city's total",
              ],
              answer: 2,
              explanation:
                "1% of ₹13.5 billion is ₹135 million, and ₹135 million / ₹720 is 187,500 bookings. Sizing in rent rather than commission makes a small-sounding share impossible.",
            },
            {
              kind: "mcq",
              prompt:
                "Why do interviewers and investors tend to trust a bottom-up estimate more than a top-down one?",
              options: [
                "Each of its inputs can be checked on its own",
                "It always produces the smaller, safer number",
                "It relies on a published industry report",
                "It avoids assumptions about customer behavior",
              ],
              answer: 0,
              explanation:
                "Bottom-up builds from units you can examine, such as customers, frequency and price. It is still full of assumptions, but each one is visible and can be challenged.",
            },
            {
              kind: "mcq",
              prompt:
                "The bottom-up and top-down estimates agree within 7%. What makes that agreement meaningful?",
              options: [
                "Both use the same count of renters as input",
                "They reach the count of renters by different routes",
                "Both were rounded to numbers easy to multiply",
                "The top-down figure came from a larger base",
              ],
              answer: 1,
              explanation:
                "Two methods that share an input will agree whatever that input is. Agreement is evidence only when the routes are independent, as intake-times-years and enrollment-times-share are.",
            },
          ],
        },
        {
          slug: "pm-execution-behavioral",
          title: "Execution and behavioral interviews",
          summary:
            "Diagnosing a metric drop aloud, choosing a metric with a guardrail, and answering behavioral questions with STAR stories prepared in advance.",
          contentFile: "pm-execution-behavioral.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                'Asked "bookings fell 20% last week, what do you do?", a candidate proposes a user survey first. Predict how the interviewer rates the opening.',
              options: [
                "Well, since asking users is the most direct evidence",
                "Poorly, because it skips the cheap checks and takes weeks",
                "Well, as long as the survey targets recent bookers",
                "Neutrally, since the order of checks is not scored",
              ],
              answer: 1,
              explanation:
                "The expected opening confirms the data, the baseline and recent changes, each answerable in minutes. A survey is slow and may chase a drop that is seasonal or a tracking bug.",
            },
            {
              kind: "mcq",
              prompt:
                "Asked to choose a metric for a new parent page, what should accompany the primary metric?",
              options: [
                "A second metric that moves in the same direction",
                "A weekly target that rises through the season",
                "A survey score from parents who used the page",
                "A guardrail the page must not make worse",
              ],
              answer: 3,
              explanation:
                "A guardrail such as move-in disputes stops the page from winning by rushing families into bad rooms. Leaving it out invites the interviewer's obvious follow-up.",
            },
            {
              kind: "mcq",
              prompt: "In a STAR answer, where should most of the two minutes go?",
              options: [
                "Action and Result, told in the first person",
                "Situation, so the context is fully understood",
                "Task, so your responsibility is clear",
                "Result, told as what the team achieved",
              ],
              answer: 0,
              explanation:
                'Behavioral questions assume past behavior predicts future behavior, so what you did and what came of it is the evidence. "We" hides your part, which is the thing being assessed.',
            },
          ],
        },
      ],
    },
  ],
}
