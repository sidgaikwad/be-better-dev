import type { SectionSeed } from "../../types"

export const pmMetrics: SectionSeed = {
  slug: "pm-metrics",
  title: "Metrics that matter",
  description:
    "Outputs against outcomes, vanity against actionable, a north star with the inputs that drive it, metric trees and guardrails, and the two classic frameworks, AARRR and HEART.",
  badgeIcon: "📊",
  badgeTitle: "Analyst",
  units: [
    {
      slug: "outcomes",
      title: "Measuring what changed",
      description:
        "Outputs against outcomes, and the test that separates a useful metric from a flattering one.",
      lessons: [
        {
          slug: "pm-outputs-and-outcomes",
          title: "Outputs, outcomes, impact",
          summary:
            "Shipping is an output, a change in behavior is an outcome, a business result is impact, and team goals belong in the middle.",
          contentFile: "pm-outputs-and-outcomes.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "In Josh Seiden's chain, which of these is an outcome of Roost's instalment payments work?",
              options: [
                "Instalment payments are live in all three cities by 1 June",
                "More students who reach the payment step go on to pay",
                "Commission revenue for the year rises by 12 percent",
                "The team closes every instalment ticket in two sprints",
              ],
              answer: 1,
              explanation:
                "An outcome is a change in someone's behavior. Launching and closing tickets are outputs the team controls, and annual commission is impact, the business result that behavior is meant to drive.",
            },
            {
              kind: "predict",
              prompt:
                "A new director starts rewarding product teams for the number of features shipped each quarter. After two quarters, what do you expect?",
              options: [
                "Fewer features, because teams spend longer testing each one",
                "Higher bookings, because more features give students reasons to stay",
                "No change, because good teams ignore how they are measured",
                "More features shipped, and less checking of whether any were used",
              ],
              answer: 3,
              explanation:
                "People optimize what they are rewarded for. Output is fully under the team's control, so it rises, while whether anyone behaves differently is no longer anyone's goal, so it goes unchecked.",
            },
            {
              kind: "mcq",
              prompt:
                'Why does the lesson argue against making "bookings up 10%" the team\'s quarterly goal?',
              options: [
                "The admissions season moves bookings more than any feature can",
                "Bookings are an output, and outputs never belong on a dashboard",
                "Bookings can only be counted once the academic year has ended",
                "Bookings belong to the founder, so a product team has no say",
              ],
              answer: 0,
              explanation:
                "Impact is real but slow, and it has many causes. With the June rush able to move bookings by more than 10% on its own, the goal would reward or punish the team for the calendar rather than for its work.",
            },
          ],
        },
        {
          slug: "pm-good-metrics",
          title: "Vanity, actionable, leading, lagging",
          summary:
            "A metric earns its place if some movement in it would change a decision, which a running total never can.",
          contentFile: "pm-good-metrics.md",
          quiz: [
            {
              kind: "mcq",
              prompt: 'What makes Roost\'s "registered students" total a vanity metric?',
              options: [
                "It is too large a number for investors to believe",
                "It is collected from the app rather than from payments",
                "It can only rise, so no movement in it changes a decision",
                "It counts students rather than properties or owners",
              ],
              answer: 2,
              explanation:
                "A cumulative total cannot fall, so it looks like progress even in a month when every new student had a bad experience. Nothing the team would do differently depends on it.",
            },
            {
              kind: "predict",
              prompt:
                "Downloads rose 39% after an Instagram campaign, and the marketing lead wants to double the budget. Before agreeing, which check tells you the most about the campaign?",
              options: [
                "How often the campaign's students sent booking requests, per student",
                "How many downloads the campaign produced for each rupee it cost",
                "Whether downloads also rose on the days the campaign was paused",
                "How the campaign's download count compares with a competitor's",
              ],
              answer: 0,
              explanation:
                "Downloads count arrivals, not intent. Putting the campaign's students on a per-student basis (2% sent requests, against 5% of other May signups) turns a flattering total into something you can decide with.",
            },
            {
              kind: "mcq",
              prompt:
                "Owner reply rate is Roost's leading indicator for bookings. What would make it stop deserving that label?",
              options: [
                "Operations begins calling slow owners every week",
                "Owners start replying faster during the off-season",
                "The rate is reported weekly rather than monthly",
                "Students start calling owners directly, off the app",
              ],
              answer: 3,
              explanation:
                "Calling a metric leading is a claim that it moves before the lagging result. If bookings start happening through a channel the reply rate cannot see, it no longer predicts them, which is why the link needs rechecking every season.",
            },
          ],
        },
      ],
    },
    {
      slug: "one-metric",
      title: "One metric and its drivers",
      description:
        "A north star chosen for the game the product plays, broken into a tree and fenced with guardrails.",
      lessons: [
        {
          slug: "pm-north-star",
          title: "The north star metric",
          summary:
            "One metric for the value customers get, moved through its inputs, and chosen after you know which game the product plays.",
          contentFile: "pm-north-star.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "According to Amplitude's North Star Playbook, what should a team conclude if it can move its north star directly?",
              options: [
                "It is well chosen, since a movable metric is easiest to manage",
                "It should be reported weekly so that every movement is visible",
                "It should replace the input metrics on every team's dashboard",
                "It is probably a poor choice, since it should be out of reach",
              ],
              answer: 3,
              explanation:
                "The north star is the result the inputs produce. If a team can push it directly, it is probably counting an activity rather than the value those inputs are supposed to create.",
            },
            {
              kind: "predict",
              prompt:
                "A meditation app and a tax-filing app both see average session time double after a redesign, with nothing else changing. Which reading is most likely right?",
              options: [
                "Both products improved, since users chose to stay longer",
                "Probably good for the meditation app, bad for the tax app",
                "Probably bad for the meditation app, good for the tax app",
                "Neither can be judged until next quarter's revenue arrives",
              ],
              answer: 1,
              explanation:
                "The meditation app plays the attention game, where time is the value. The tax app plays the productivity game, where the same extra time means the job got harder.",
            },
            {
              kind: "mcq",
              prompt: "Why does Roost choose happy move-ins over bookings as its north star?",
              options: [
                "Happy move-ins are a larger number, which motivates the team",
                "Bookings are measured by finance, not by the product team",
                "Bookings count a stay in a fake or overpriced PG as a success",
                "Happy move-ins can be moved directly by the verification team",
              ],
              answer: 2,
              explanation:
                "A north star should capture value delivered. A booking that ends in a dispute earned commission but failed the student, which is exactly the problem Roost's early research surfaced.",
            },
          ],
        },
        {
          slug: "pm-metric-trees",
          title: "Metric trees and guardrails",
          summary:
            "Break the north star into drivers that multiply back to it, and fence every push with guardrails priced in the same units.",
          contentFile: "pm-metric-trees.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "In the Bing puzzle, why did Kohavi single out sessions per user rather than queries per session as the sign of value?",
              options: [
                "Bad results raise queries per session; good search brings users back",
                "Sessions per user is easier to log than queries per session",
                "Queries per session is a revenue metric owned by the ads team",
                "Sessions per user moves faster, so experiments can end sooner",
              ],
              answer: 0,
              explanation:
                "When results get worse, people search more within a session, so that factor rises for the wrong reason. Users per month is fixed by the experiment's design, which leaves sessions per user as the factor that reflects value.",
            },
            {
              kind: "predict",
              prompt:
                "Roost's tree is 40,000 searchers x 20% request x 50% accepted x 90% move in x 90% no dispute = 3,240 happy move-ins. A fix lifts acceptance from 50% to 55%. What happens at the top?",
              options: [
                "It rises by 5 percentage points, to 3,402",
                "It rises about 1%, since acceptance is one of five factors",
                "It rises 10 percent, to 3,564",
                "It stays flat until the move-in rate also improves",
              ],
              answer: 2,
              explanation:
                "The factors multiply, so a 10% relative gain in any one of them is a 10% gain at the top: 40,000 x 0.20 x 0.55 x 0.90 x 0.90 = 3,564.",
            },
            {
              kind: "mcq",
              prompt: "What distinguishes a guardrail metric from the target of a piece of work?",
              options: [
                "A guardrail is the north star, and the target is one of its inputs",
                "You aim to hold it steady rather than improve it, and a breach stops the ship",
                "A guardrail is reviewed quarterly, while the target is reviewed weekly",
                "A guardrail is chosen after the test, once the side effects are visible",
              ],
              answer: 1,
              explanation:
                "Guardrails cover what you do not want to degrade, such as uninstalls or crash rate. Set them with thresholds before the work starts, or a strong result on the target will talk everyone out of them.",
            },
          ],
        },
      ],
    },
    {
      slug: "frameworks",
      title: "Two classic frameworks",
      description:
        "AARRR for the customer lifecycle, and HEART for the experience of a product or feature.",
      lessons: [
        {
          slug: "pm-aarrr",
          title: "Pirate metrics",
          summary:
            "Dave McClure's five lifecycle stages, translated for Roost with a number at each, and why the biggest drop is rarely the place to start.",
          contentFile: "pm-aarrr.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does Roost's version of AARRR put revenue before referral?",
              options: [
                "McClure's original order requires revenue before referral",
                "Students pay at booking, and refer friends after living there",
                "Referral is not a real stage for a two-sided marketplace",
                "Revenue is the north star, so it must follow retention",
              ],
              answer: 1,
              explanation:
                "The stages should follow the customer's actual path. McClure's order is a convention: Roost earns its commission at booking, and a recommendation usually comes after a good stay.",
            },
            {
              kind: "predict",
              prompt:
                "In May's cohort, referral loses 85% of bookers, the largest drop of any stage. A new PM proposes spending the quarter on referral. What is the strongest objection?",
              options: [
                "Referral is the last stage, so its changes cannot be measured",
                "Referral gains always cost more than acquisition gains",
                "The drop is too large to fix within a single quarter",
                "Students book yearly, so low referral is its natural shape",
              ],
              answer: 3,
              explanation:
                "A percentage drop describes a stage, not an opportunity. Most bookers have nobody to refer in May, so the 85% loss is mostly the product's rhythm rather than a leak.",
            },
            {
              kind: "mcq",
              prompt:
                "Lifting activation from 30% to 33% and lifting revenue conversion from 40% to 44% each give 2,376 bookings. What should decide between them?",
              options: [
                "Which fix is cheaper and has a known cause",
                "Which stage currently shows the larger drop",
                "Which stage comes earlier in the lifecycle",
                "Which team raised the problem first",
              ],
              answer: 0,
              explanation:
                "Because the stages multiply, equal relative gains produce equal results at the end. The tiebreak is cost and evidence, which is why the diagnosed owner-response problem wins the quarter.",
            },
          ],
        },
        {
          slug: "pm-heart",
          title: "HEART and goals, signals, metrics",
          summary:
            "Google's five user-experience categories and the goals-signals-metrics process that fills them, applied to Roost's search redesign.",
          contentFile: "pm-heart.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why does the HEART paper ask for engagement to be reported per user rather than as a total?",
              options: [
                "Totals are harder to compute from server logs",
                "Per-user numbers are easier to collect by survey",
                "A total can rise from more users with no more use",
                "Totals belong to the PULSE metrics instead",
              ],
              answer: 2,
              explanation:
                "A growing user base inflates any raw count. Dividing by users isolates whether each person is using the product more, which is the question engagement is meant to answer.",
            },
            {
              kind: "predict",
              prompt:
                "After Roost's search redesign, searches per student go from 8 to 10 and the share of searches ending in a shortlist falls from 22% to 18%. Which HEART reading fits?",
              options: [
                "Task success fell: students work harder for the same shortlists",
                "Engagement rose, so the redesign is working as intended",
                "Adoption rose, since students are trying the new search more",
                "Happiness fell, since students clearly dislike the new filters",
              ],
              answer: 0,
              explanation:
                "Shortlists per student went from 1.76 to 1.80, essentially flat, while effort rose 25%. For a product people want to finish using, extra searching is a failing task, not engagement.",
            },
            {
              kind: "mcq",
              prompt:
                "In goals, signals, metrics, why write the goals before worrying about how to measure them?",
              options: [
                "Goals become optional once the metrics are chosen",
                "Signals always come from surveys, which take time to design",
                "Measurement is the analyst's job, not the product manager's",
                "Starting from what is measurable shrinks goals to what is logged",
              ],
              answer: 3,
              explanation:
                "The paper tells teams not to get distracted by measurability at the goal stage. Starting from existing data produces goals shaped by what happens to be logged, not by what the experience should achieve.",
            },
          ],
        },
      ],
    },
  ],
}
