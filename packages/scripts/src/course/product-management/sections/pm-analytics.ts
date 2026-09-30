import type { SectionSeed } from "../../types"

export const pmAnalytics: SectionSeed = {
  slug: "pm-analytics",
  title: "Product analytics",
  description:
    "Reading product data without fooling yourself: funnels, instrumentation, segmentation and its traps, and a method for diagnosing a metric that suddenly moved.",
  badgeIcon: "🔬",
  badgeTitle: "Detective",
  units: [
    {
      slug: "measuring-the-path",
      title: "Measuring the path",
      description: "Where users leave, and the event data that lets you see it.",
      lessons: [
        {
          slug: "pm-funnels",
          title: "Funnels and drop-off",
          summary:
            "Step conversion shows where people leave, overall conversion shows whether it matters, and watching users shows why.",
          contentFile: "pm-funnels.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "A funnel loses 50% of users from step one to step two, then 70% from step two to step three. What share of step-one users reach step three?",
              options: ["35%", "20%", "15%", "30%"],
              answer: 2,
              explanation:
                "Convert each drop-off into the share who continue before multiplying: 0.5 x 0.3 = 0.15. A 70% drop means 30% carry on, and overall conversion is the product of the step rates.",
            },
            {
              kind: "predict",
              prompt:
                "Roost's median student takes 9 days from first search to booking. An analyst builds the search-to-booking funnel with a one-day conversion window. What will the funnel show?",
              options: [
                "A conversion rate far below the true one, pointing at a leak that is not there",
                "About the true conversion rate, since the window only affects slow steps",
                "A higher conversion rate, since only the most eager students are counted",
                "The same rate as a 30-day window, but with fewer students at step one",
              ],
              answer: 0,
              explanation:
                "A student counts as converted only if they finish inside the window, so most bookings, which arrive days later, are dropped. The window must fit how long the journey really takes, or the funnel invents a problem.",
            },
            {
              kind: "mcq",
              prompt:
                "Roost's funnel shows 4,800 students a month opening the request form and leaving without sending it. What is the best next step?",
              options: [
                "Redesign the form now, since the funnel has already found the problem",
                "Ignore it, because the larger loss is at the listing page before it",
                "Switch the funnel to count events, which will show the true loss",
                "Watch recordings of those students and call a few who left",
              ],
              answer: 3,
              explanation:
                "The funnel locates the drop but cannot say why it happens. Recordings and calls find the reason, such as a field students cannot fill in yet, which is what a designer needs before changing anything.",
            },
          ],
        },
        {
          slug: "pm-instrumentation",
          title: "Instrumenting a product",
          summary:
            "Events, properties and identity, a tracking plan agreed before code ships, and which tool answers which question.",
          contentFile: "pm-instrumentation.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Roost's iOS app records Request Sent when the button is tapped; Android records it when the server stores the request. Students often retry on weak wifi. What happens to the reported request rate?",
              options: [
                "It is accurate, since the two platforms average each other out",
                "It is inflated, because retried taps on iOS count as extra requests",
                "It is deflated, because the server rejects duplicate requests",
                "It is unaffected, since retries happen before the event fires",
              ],
              answer: 1,
              explanation:
                "Firing on tap counts every attempt, including ones that failed and were retried, so the dashboard shows more requests than owners received. Events that mean commitment belong on the server, where they happen once.",
            },
            {
              kind: "mcq",
              prompt: "Which event follows the naming practice the lesson recommends?",
              options: [
                "`Request Sent - pg_1107`, so each listing gets its own event",
                "`requestSent` on iOS and `Request Sent` on Android",
                "`Send Request`, naming the action the user is about to take",
                "`Request Sent`, with the listing ID passed as a property",
              ],
              answer: 3,
              explanation:
                "Segment's convention is an object and a past-tense action, with anything variable in properties. Putting an ID in the name creates a new event per listing, and two spellings split one event's history.",
            },
            {
              kind: "mcq",
              prompt:
                "A student browses Roost logged out on a phone, then logs in on a laptop, and the tool never links the two. What does that do to the funnel?",
              options: [
                "It counts one student as several, inflating searchers and deflating conversion",
                "It drops the student from the funnel entirely until they book",
                "It inflates conversion, since the laptop visit counts as a second booking",
                "Nothing, because the funnel counts events rather than people",
              ],
              answer: 0,
              explanation:
                "Unmerged anonymous and logged-in IDs look like separate people at the top of the funnel, while the booking belongs to only one of them. Roost's tool reported 52,000 searchers and 7.7% conversion before merging, against 40,000 and 10% after.",
            },
          ],
        },
      ],
    },
    {
      slug: "reading-the-data",
      title: "Reading the data",
      description: "Cutting numbers into segments, and diagnosing a metric that suddenly moved.",
      lessons: [
        {
          slug: "pm-segmenting-data",
          title: "Cutting the data",
          summary:
            "Segments show where a change happened, Simpson's paradox shows how a mix shift can reverse a trend, and neither proves a cause.",
          contentFile: "pm-segmenting-data.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "After a search redesign, the app's request rate rises from 24% to 25% and mobile web's from 8% to 9%. Mobile web traffic more than doubles. What happens to the overall request rate?",
              options: [
                "It must rise, since both platforms improved",
                "It stays near 20%, since the two gains offset",
                "It rises by exactly one point, like each platform",
                "It can fall, since more traffic is now low-converting",
              ],
              answer: 3,
              explanation:
                "The overall rate is a weighted average, and the weights moved toward the platform that converts at about a third of the app's rate. That is Simpson's paradox: every segment improves while the total falls.",
            },
            {
              kind: "mcq",
              prompt:
                "Drop-offs rise on days with more than 1,000 users. What is the right conclusion?",
              options: [
                "The servers cannot handle the load, so scale them up",
                "It is a pattern with more than one possible cause to check",
                "Busy days bring low-intent visitors, so the drop is harmless",
                "The pattern is noise unless it holds for a full quarter",
              ],
              answer: 1,
              explanation:
                "Slow servers under load and campaign days full of casual visitors both produce the same segment. A direct check, such as page load times on those days, decides between them; the segment alone cannot.",
            },
            {
              kind: "predict",
              prompt:
                "Cut 24 ways, one segment of 150 students converts at 14% against a usual 20%, about 1.8 standard errors low. What should the team do?",
              options: [
                "Start a bug hunt now, since the gap is six points",
                "Drop the segment from reporting, since it is too small",
                "Recheck the segment on next week's fresh data first",
                "Average it with its neighbors to smooth out the noise",
              ],
              answer: 2,
              explanation:
                "A gap that size happens about 7% of the time by chance, so across 24 segments one or two will look this odd with nothing wrong. A segment picked because it looked strange must be confirmed on data that was not used to find it.",
            },
          ],
        },
        {
          slug: "pm-metric-drop",
          title: "When a metric suddenly drops",
          summary:
            "Confirm the data, compare with the right baseline, check what changed inside and out, segment to localize, then test one hypothesis.",
          contentFile: "pm-metric-drop.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Roost's bookings fall from 2,000 in the last week of August to 1,100 in the first week of September. Last year the same two weeks went from 1,600 to 1,040. How big is the real problem?",
              options: [
                "About 200 bookings, since the season explains the rest",
                "About 900 bookings, the full week-on-week fall",
                "None, since every September falls by about this much",
                "About 560 bookings, the difference between the two years",
              ],
              answer: 0,
              explanation:
                "Last year's ratio, 1,040 / 1,600 = 0.65, predicts 1,300 bookings this week. Actual is 1,100, so 200 are missing and the other 700 of the fall are the calendar. The right baseline for a seasonal business is the same period last year.",
            },
            {
              kind: "mcq",
              prompt: "Why does the method check whether the data is real before anything else?",
              options: [
                "Because engineers need time to prepare the release log",
                "Because segmenting only works on data older than a week",
                "Because it is cheap and can end the investigation at once",
                "Because the CEO will ask for the ledger figure first",
              ],
              answer: 2,
              explanation:
                "A broken or renamed event looks exactly like a collapse, and comparing with the payments ledger takes minutes. Checks are ordered so the cheap ones that can close the case run before the expensive ones.",
            },
            {
              kind: "mcq",
              prompt:
                "Roost ships 4.2.1 to fix the payment page. What result confirms the payment page was the cause?",
              options: [
                "Total bookings climb back over the following week",
                "The 4.2.1 segment returns to 50% and nothing else moves",
                "Support messages about failed payments stop arriving",
                "Android bookings overtake iOS and web bookings again",
              ],
              answer: 1,
              explanation:
                "Total bookings move for many reasons, including the season. A fix confirms the hypothesis when it restores the broken segment and leaves the healthy segments where they were.",
            },
          ],
        },
      ],
    },
  ],
}
