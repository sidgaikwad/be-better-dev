import type { SectionSeed } from "../../types"

export const pmLaunching: SectionSeed = {
  slug: "pm-launching",
  title: "Launching",
  description:
    "Getting a release out the door safely: kinds of launch, staged rollouts behind flags, the PM's real job on launch day, planning for success as well as failure, and the review afterwards.",
  badgeIcon: "🎉",
  badgeTitle: "Shipper",
  units: [
    {
      slug: "releasing-in-stages",
      title: "Releasing in stages",
      description:
        "How many people get a release, how loudly you tell them, and how exposure grows safely.",
      lessons: [
        {
          slug: "pm-launch-types",
          title: "Soft, hard, and phased launches",
          summary:
            "Exposure and announcement are two separate dials: grow exposure with evidence, and spend the announcement last.",
          contentFile: "pm-launch-types.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What decides which tier a release gets?",
              options: [
                "Its expected business and market impact",
                "The engineering weeks it took to build",
                "The number of users who can access it",
                "How risky it is to run in production",
              ],
              answer: 0,
              explanation:
                "Tiers size the announcement to the impact, not to the effort. Roost's photo fix took the most engineering time and gets only a release note, because nobody chooses Roost for faster uploads.",
            },
            {
              kind: "predict",
              prompt:
                "A startup plans a hard launch, with press, for a feature nobody outside the team has used yet. What is the main risk?",
              options: [
                "The campaign will cost more than a soft launch would",
                "Competitors will copy the feature within a few weeks",
                "First impressions form on the day it is least tested",
                "Early adopters will feel left out of the beta",
              ],
              answer: 2,
              explanation:
                "A hard launch puts everyone's first impression on the same day, and that day is the one with the least real-world testing behind it. Apple can afford this because its devices are tested for months before the event; an untried feature cannot.",
            },
            {
              kind: "mcq",
              prompt: "Why does the lesson say to spend the announcement last?",
              options: [
                "Press coverage costs less once a product has users",
                "An early announcement gives competitors time to react",
                "Marketing budgets are released only after a beta ends",
                "Exposure can be turned down; an announcement cannot",
              ],
              answer: 3,
              explanation:
                "You can switch a feature off for a city, but you cannot unsay a campaign. The reversible step should grow with evidence, and the irreversible one should wait until the evidence is in.",
            },
          ],
        },
        {
          slug: "pm-staged-rollouts",
          title: "Alpha, beta, and percentage rollouts",
          summary:
            "Release stages, feature flags and percentage ladders limit the blast radius, as long as each step waits for enough events.",
          contentFile: "pm-staged-rollouts.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does a feature flag let a team separate?",
              options: [
                "Writing code from reviewing it",
                "Deploying code from releasing it",
                "Staging servers from production",
                "Frontend work from backend work",
              ],
              answer: 1,
              explanation:
                "The code can sit in production switched off, and the release becomes a runtime decision. That is also what makes a kill switch possible: turning a feature off takes seconds, with no deploy.",
            },
            {
              kind: "predict",
              prompt:
                "At the 1% step of an app with 2,000,000 daily users, the baseline error rate is 0.5% and the halt rule is 1.5x baseline. The cohort shows 240 errors in a day. What happens?",
              options: [
                "Continue, since 240 errors is tiny for 2,000,000 users",
                "Continue to 5%, since one day is too short to judge",
                "Halt, since 240 is 2.4 times the 100 errors expected",
                "Halt, since any error at 1% means the code is broken",
              ],
              answer: 2,
              explanation:
                "1% is 20,000 users, and 0.5% of them is 100 expected errors, so 240 is 2.4x baseline and past the 1.5x rule. Flipping the flag off means 20,000 people saw the bug instead of 2,000,000.",
            },
            {
              kind: "predict",
              prompt:
                "Roost gets about 300 checkout starts a day. Why is a one-day step at 1% close to useless for catching a doubled payment failure rate?",
              options: [
                "Three checkouts a day cannot reveal a change in the rate",
                "Hash-based bucketing breaks below a thousand users",
                "Payment failures cannot be measured behind a flag",
                "One day is too short for a novelty effect to fade",
              ],
              answer: 0,
              explanation:
                "At a 2% baseline, 3 checkouts produce 0.06 expected failures, so a doubling is invisible. Separating 2% from 4% needs roughly 500 checkouts, so a step should end on an event count, not a date.",
            },
          ],
        },
      ],
    },
    {
      slug: "launch-and-after",
      title: "Launch day and after",
      description:
        "What the PM owns when a launch goes out, how to prepare for it working, and how to judge it afterwards.",
      lessons: [
        {
          slug: "pm-launch-role",
          title: "The PM on launch day",
          summary:
            "The PM is the knowledge hub: every team's words must match what the product does, and the go or no-go call is yours.",
          contentFile: "pm-launch-role.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In the course instructor's view, what is the PM's main job during a launch?",
              options: [
                "Running the launch timeline and daily check-ins",
                "Passing product and customer knowledge to each team",
                "Writing and placing the launch marketing campaign",
                "Fixing the last bugs that the beta turned up",
              ],
              answer: 1,
              explanation:
                "By launch day the PM holds the evidence from discovery and the beta, and it is useless unless marketing, support and sales can act on it. Timelines and coordination he assigns to the project manager.",
            },
            {
              kind: "predict",
              prompt:
                'An ad says "instant approval". Soft launch data shows a 4-hour median approval and 18% of applications declined, but "instant" won 30% more clicks. What should the PM do?',
              options: [
                "Approve it, since the copy is marketing's decision",
                "Approve it with a footnote giving the real approval time",
                "Hold the campaign until approval really is instant",
                "Rewrite it with marketing into a claim the product keeps",
              ],
              answer: 3,
              explanation:
                "On 1,500 applications, 270 declined families plus one in four of the 1,230 left waiting makes roughly 580 support conversations from one false word. The PM does not write the ad but owns the facts in it.",
            },
            {
              kind: "mcq",
              prompt:
                "Beyond sharing knowledge, what does the lesson add to the PM's launch responsibilities?",
              options: [
                "The go or no-go call and the definition of success",
                "The run-of-show and the master launch timeline",
                "Hiring temporary support staff for launch week",
                "Final sign-off on every piece of launch copy",
              ],
              answer: 0,
              explanation:
                "Both rest on evidence only the PM holds: the exit criteria from the rollout and the metrics that must be instrumented before launch day. The run-of-show is coordination, which is project management.",
            },
          ],
        },
        {
          slug: "pm-launch-readiness",
          title: "Planning for success",
          summary:
            "Size capacity, support and supply for the case where the launch works, and write the crisis plan before you need it.",
          contentFile: "pm-launch-readiness.md",
          quiz: [
            {
              kind: "mcq",
              prompt: 'What does "planning for success" mean in this lesson?',
              options: [
                "Setting stretch targets so the team aims higher",
                "Preparing capacity for demand above the forecast",
                "Celebrating early wins to keep morale up",
                "Writing the press release before building",
              ],
              answer: 1,
              explanation:
                "Flipkart's first Big Billion Day sold heavily and still broke, because the site and stock were sized for less demand than its own marketing created. A plan built only on the forecast looks fine until the launch works.",
            },
            {
              kind: "predict",
              prompt:
                "Roost's campaign draws twice the forecast traffic and every server holds. What is most likely to make the launch fail anyway?",
              options: [
                "The database running out of disk space",
                "Ad clicks costing more than the budget assumed",
                "Students finding the good rooms already full",
                "Owners raising their rents during the campaign",
              ],
              answer: 2,
              explanation:
                "In a marketplace the inventory is the other side. With 2,000 students wanting beds near top campuses and 1,300 free, the success case fails on supply, which is Roost's version of Flipkart's stock-outs.",
            },
            {
              kind: "predict",
              prompt:
                "Two temporary support agents for the launch fortnight cost ₹30,000, and each booking earns Roost ₹720. The success case leaves 560 tickets unanswered. What do you do?",
              options: [
                "Staff for the forecast, since it is the likeliest case",
                "Staff for the forecast and let replies run slower",
                "Delay the campaign until support is larger for good",
                "Staff for the success case for the launch fortnight",
              ],
              answer: 3,
              explanation:
                "The agents pay for themselves at about 42 saved bookings, and losing one family in ten of 560 is 56. When a shortfall costs more than spare capacity and the season will not come again, buy the capacity.",
            },
          ],
        },
        {
          slug: "pm-post-launch",
          title: "After the launch",
          summary:
            "Judge the launch against the targets and guardrails written before it, read early retention, and keep the retro blameless.",
          contentFile: "pm-post-launch.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why must a launch's targets be written down before launch day?",
              options: [
                "Analytics tools need targets configured in advance",
                "So results are judged against a bar set before the data",
                "Executives approve only launches that carry targets",
                "Targets chosen after launch always come out too low",
              ],
              answer: 1,
              explanation:
                "After launch there is always some number that looks good, and a team choosing its measure then will find it. A bar set in advance is the only one the result can fail.",
            },
            {
              kind: "predict",
              prompt:
                "Day 30: adoption is 27% against a 20% target, bookings are 4% above forecast while a city without the feature is 3% above, and missed second instalments are 5% against a 3% guardrail. Marketing wants to expand. What do you do?",
              options: [
                "Expand, since adoption beat its target by 7 points",
                "Expand, and raise the guardrail to 5% for the new city",
                "Roll back, since the launch added almost no bookings",
                "Hold, fix the missed payments, and review at day 60",
              ],
              answer: 3,
              explanation:
                "Adoption is closer to an output: most of those families would have booked anyway, and the lift over the comparison city is about 1 point. The breached guardrail is the reason to hold and fix rather than expand or give up.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does the lesson reject the idea that retention metrics make little sense during a launch?",
              options: [
                "Acquisition can be bought; early retention cannot",
                "Investors ask mainly about retention after launch",
                "Retention is cheaper to instrument than acquisition",
                "New customers churn at the same rate as old ones",
              ],
              answer: 0,
              explanation:
                "A campaign can buy signups, so acquisition says little about whether the product works. Whether families pay their second and third instalments is the first honest signal, which is why the day 90 review is booked in advance.",
            },
          ],
        },
      ],
    },
  ],
}
