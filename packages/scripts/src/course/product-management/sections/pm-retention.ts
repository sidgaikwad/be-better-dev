import type { SectionSeed } from "../../types"

export const pmRetention: SectionSeed = {
  slug: "pm-retention",
  title: "Retention and engagement",
  description:
    "Whether people come back: cohort curves, activation and the aha moment, stickiness ratios, and the arithmetic of churn.",
  badgeIcon: "🔁",
  badgeTitle: "Retainer",
  units: [
    {
      slug: "who-comes-back",
      title: "Who comes back",
      description: "Reading retention cohort by cohort, and the early action that predicts it.",
      lessons: [
        {
          slug: "pm-cohort-retention",
          title: "Reading a cohort retention table",
          summary:
            "Build a cohort table, read it by row and by column, and see why one pooled retention number hides whether the product is improving.",
          contentFile: "pm-cohort-retention.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Which comparison tells you whether the product is getting better for new users?",
              options: [
                "The pooled retention of everyone who joined this year",
                "Cohorts compared at the same age, down one column",
                "This month's active users against last month's",
                "The newest cohort's D1 against the oldest one's D30",
              ],
              answer: 1,
              explanation:
                "Every cell in a column had the same time to decay, so a change down the column is a change in the product or its users. Pooled figures and month-over-month actives mix cohorts of different ages and sizes.",
            },
            {
              kind: "predict",
              prompt:
                "Roost pools every new owner since February into one D30 figure: 370 owners at about 34%. A new cohort of 125 owners arrives with a D30 of 52%. Predict the pooled figure.",
              options: [
                "About 52%, since the newest cohort reflects the product",
                "About 43%, halfway between the old and new rates",
                "About 39%, since the older cohorts outweigh the new one",
                "About 34%, since one cohort cannot move a pooled rate",
              ],
              answer: 2,
              explanation:
                "(127 + 65) / 495 = 38.8%. An 18-point gain in the new cohort shows up as 4.5 points because the 370 older owners dominate the pool, which is why a blended number lags real change.",
            },
            {
              kind: "mcq",
              prompt:
                "Why must a retention chart say whether its numbers are bounded or unbounded?",
              options: [
                "Unbounded counts later days too, so it never reads lower",
                "Bounded retention only works for products people use daily",
                "Unbounded retention leaves out anyone active on day one",
                "Bounded retention needs monthly cohorts instead of weekly",
              ],
              answer: 0,
              explanation:
                "A user active on day 9 but not on day 7 counts toward unbounded D7 and not bounded D7. Put one of each on a chart and the gap between them looks like a trend.",
            },
          ],
        },
        {
          slug: "pm-activation",
          title: "Activation and the aha moment",
          summary:
            "Activation is the early action that predicts lasting value. Find it in the data, then test whether it causes anything.",
          contentFile: "pm-activation.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Scheduling a visit predicts a Roost booking better than messaging an owner does. Why is messaging still the better activation event?",
              options: [
                "Its lift is large enough to prove it causes bookings",
                "More students do it than shortlist rooms in week one",
                "Owners prefer written inquiries to visits in season",
                "It comes early enough for onboarding to influence it",
              ],
              answer: 3,
              explanation:
                "A visit sits one step before the booking, so it mostly restates the outcome and leaves onboarding nothing to act on. Messaging comes early, covers most eventual bookers, and the product can make it easier.",
            },
            {
              kind: "predict",
              prompt:
                "A 30-day test on 20,000 new students doubles the share who message an owner. Bookings in the test group do not move. What does that most likely show?",
              options: [
                "Messaging was a sign of intent more than a cause",
                "Bookings lag, so the test should run another month",
                "Messaging drives bookings only above a higher count",
                "The activation event should move to scheduling a visit",
              ],
              answer: 0,
              explanation:
                "If messaging caused booking, pushing more students to message would have pulled bookings up with it. When the proxy moves and the outcome does not, the original correlation was mostly selection: serious students both message and book.",
            },
            {
              kind: "mcq",
              prompt:
                "Why should a team treat a magic number like 7 friends in 10 days as a hypothesis?",
              options: [
                "Facebook's users are too different from any other product's",
                "A ten-day window is too short to observe real retention",
                "It came from users who stayed, not from a controlled test",
                "Round numbers are easier to game than precise thresholds",
              ],
              answer: 2,
              explanation:
                "The number describes users who already retained, and engaged people both add friends and stay. Only a randomized test of pushing the number shows whether it causes retention.",
            },
          ],
        },
      ],
    },
    {
      slug: "frequency-and-loss",
      title: "How often, and who leaves",
      description:
        "Stickiness measured at the product's own frequency, and churn worked as arithmetic.",
      lessons: [
        {
          slug: "pm-stickiness",
          title: "DAU, MAU, and the power user curve",
          summary:
            "DAU/MAU and the power user curve, and why a product used once a year should measure stickiness at its own frequency.",
          contentFile: "pm-stickiness.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Roost's DAU/MAU is 7.5% in June. What does that say about a typical monthly active student?",
              options: [
                "They opened Roost on about 7 or 8 days that month",
                "They were active on about 2 days that month",
                "About 7.5% of them booked a room that month",
                "About 7.5% of their phone time went to Roost",
              ],
              answer: 1,
              explanation:
                "The ratio times the days in the month is the average number of active days: 0.075 x 30 = 2.25. For a need that recurs once a year, two days of searching in the peak month is healthy.",
            },
            {
              kind: "predict",
              prompt:
                "A year on, Roost's June DAU/MAU falls from 7.5% to 6%, while median days from first search to booking fall from 9 to 6 and the booking rate rises. What is the right reading?",
              options: [
                "Stickiness is slipping, so a retention squad should fix it",
                "The drop is noise, since June traffic swings every year",
                "Students are bored and returning less between searches",
                "Students find rooms faster, so fewer active days is good",
              ],
              answer: 3,
              explanation:
                "For a job that ends, fewer days in the app with more bookings means the search got better. Roost should report time to book and booking rate, not a daily ratio built for daily needs.",
            },
            {
              kind: "mcq",
              prompt:
                "On Roost's June histogram, students active 10 or more days book less often than students active 4 to 9 days. What is the most likely reading?",
              options: [
                "The heaviest users are stuck in a search that is failing",
                "Power users are Roost's healthiest segment to grow",
                "The histogram should be redrawn as a weekly L7 chart",
                "Frequent visitors are mostly owners checking listings",
              ],
              answer: 0,
              explanation:
                "In a search product, many days of visits often means nothing fits the student's budget or campus. Pushing students rightward on this chart would grow the stuck group, so the goal is fewer days to a booking.",
            },
          ],
        },
        {
          slug: "pm-churn-math",
          title: "The arithmetic of churn",
          summary:
            "Monthly churn compounded into a year, customer versus revenue churn, and how many new customers a leaky bucket needs to stand still.",
          contentFile: "pm-churn-math.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "A product loses 4% of its customers each month. About what share of a cohort is gone after a year?",
              options: ["About 48%", "About 39%", "About 33%", "About 44%"],
              answer: 1,
              explanation:
                "0.96^12 = 0.613, so 61% stay and 39% leave. Multiplying 4% by 12 gives 48% because it keeps charging churn on customers who already left.",
            },
            {
              kind: "predict",
              prompt:
                "A subscription has 200 customers, loses 5% of them each month and signs 8 new ones a month. Predict where the base heads.",
              options: [
                "It grows slowly toward about 240",
                "It holds steady at about 200",
                "It shrinks toward about 160",
                "It shrinks steadily toward zero",
              ],
              answer: 2,
              explanation:
                "It loses 200 x 5% = 10 a month and adds 8, so it shrinks until losses equal additions: 8 / 0.05 = 160. The base settles at acquisition divided by churn, not at zero.",
            },
            {
              kind: "mcq",
              prompt:
                "Featured's customer churn is 3% this month, but its revenue churn is 6%. What happened?",
              options: [
                "Small owners left at twice the rate of large ones",
                "Some owners paused Featured for the off-season",
                "New owners joined at a cheaper introductory price",
                "The owners who left paid more than average",
              ],
              answer: 3,
              explanation:
                "Revenue churn runs above customer churn when the departing customers are worth more than the typical one, here large hostels. Downgrades push it up too, which is why both numbers belong on the report.",
            },
          ],
        },
      ],
    },
  ],
}
