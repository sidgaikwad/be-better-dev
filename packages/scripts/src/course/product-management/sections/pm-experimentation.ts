import type { SectionSeed } from "../../types"

export const pmExperimentation: SectionSeed = {
  slug: "pm-experimentation",
  title: "Experimentation",
  description:
    "Establishing cause instead of guessing: how an A/B test works, how many users it needs, the mistakes that invalidate one, and why most ideas fail when tested.",
  badgeIcon: "🧫",
  badgeTitle: "Tester",
  units: [
    {
      slug: "designing-a-test",
      title: "Designing a test",
      description: "Randomization, the metric that decides, and how many users a test needs.",
      lessons: [
        {
          slug: "pm-ab-tests",
          title: "How an A/B test works",
          summary:
            "The video's add-to-cart hypothesis as a real test: random assignment, a test plan with one deciding metric, and what a p-value does and does not say.",
          contentFile: "pm-ab-tests.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Roost moves its request button on 20 May, and booking requests in June are 60% higher than in May. What does this tell you about the button?",
              options: [
                "It caused most of the rise, since it shipped just before",
                "Nothing yet, since the season raises requests on its own",
                "It caused about half the rise, and the season the rest",
                "It hurt, since June normally rises by more than 60%",
              ],
              answer: 1,
              explanation:
                "A before-and-after comparison mixes the change with the season, marketing and everything else that moved. Only running both versions at the same time, on randomly assigned students, separates the button's effect.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does Roost's test plan randomize by student account rather than by visit?",
              options: [
                "So the test reaches significance with fewer students",
                "So students cannot tell that a test is running at all",
                "So each student sees one version and the groups stay apart",
                "So the p-value can be computed separately for each visit",
              ],
              answer: 2,
              explanation:
                "Assigned per visit, a returning student would see both pages and carry the experience of one into the other. Assigning the student keeps control and treatment as two distinct groups.",
            },
            {
              kind: "mcq",
              prompt:
                "Treatment's request rate is 21.0% against control's 20.0%, with p = 0.013. What does the p-value mean?",
              options: [
                "There is a 98.7% chance that the moved button really works",
                "The moved button raised booking requests by 1.3 points",
                "The result is large enough to be worth shipping on its own",
                "With no real effect, a gap this big shows up 1.3% of the time",
              ],
              answer: 3,
              explanation:
                "A p-value is the chance of a gap at least this large if the change did nothing. It is not the probability the change works, and it says nothing about the effect's size or its value.",
            },
          ],
        },
        {
          slug: "pm-sample-size",
          title: "How many users a test needs",
          summary:
            "n = 16 x variance / delta squared per variant, worked for a conversion rate, and why Roost cannot detect a 2% change in bookings.",
          contentFile: "pm-sample-size.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "A test is sized to detect a 10% lift in bookings. The PM decides to detect a 5% lift instead, with the same power and threshold. How many users does it need?",
              options: [
                "Four times as many, since delta is squared",
                "Twice as many, since the effect is half the size",
                "The same number, since power stays at 80%",
                "Half as many, since a smaller change is easier",
              ],
              answer: 0,
              explanation:
                "Sample size goes with 1 / delta squared, so halving the detectable effect multiplies the users by four. At Roost that turns 0.7 months of searchers into 2.9.",
            },
            {
              kind: "mcq",
              prompt:
                "A shop's test gets 5.0% against 5.6% with 10,000 users per arm, p = 0.058, where the rule of thumb asked for about 21,000. What is the right conclusion?",
              options: [
                "The button has no effect and the idea should be dropped",
                "The button works, since 0.058 is close enough to 0.05",
                "The lift is real but too small to be worth shipping",
                "The test was too small to settle the question either way",
              ],
              answer: 3,
              explanation:
                "With under half the users it needed, the test had about a 47% chance of detecting a true 12% lift. Not significant from an underpowered test is an absence of evidence, not evidence of no effect.",
            },
            {
              kind: "predict",
              prompt:
                "Roost changes the screen a student sees after sending a booking request. Which OEC gets a trustworthy answer fastest?",
              options: [
                "Bookings per searcher, across all 40,000 searchers",
                "Searches per student, since searches are most frequent",
                "Bookings per requester, among the 8,000 requesters",
                "Bookings this month, compared with the same month last year",
              ],
              answer: 2,
              explanation:
                "Only requesters can see the change, and half of them book, so a 10% lift is a delta of 0.05 on a variance of 0.25: 1,600 per variant, about 12 days. Counting all searchers dilutes the effect with students the change never touched.",
            },
          ],
        },
      ],
    },
    {
      slug: "reading-results",
      title: "Reading results honestly",
      description:
        "The mistakes that make a test lie, and what the base rate of failure means for a roadmap.",
      lessons: [
        {
          slug: "pm-test-pitfalls",
          title: "Peeking, novelty, and mismatched samples",
          summary:
            "Why stopping at the first good p-value, novelty and primacy, a lopsided split, and a pile of metrics each make a correct calculation wrong.",
          contentFile: "pm-test-pitfalls.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "A 50/50 test ends with 25,600 students in control and 24,400 in treatment. Treatment's OEC is up with p = 0.01. What do you do?",
              options: [
                "Ship it, since a 2.4% gap in users is too small to matter",
                "Distrust it: chi-squared is 28.8, a sample ratio mismatch",
                "Ship it, since the OEC is significant whatever the split",
                "Trust control's numbers and rerun only the treatment arm",
              ],
              answer: 1,
              explanation:
                "Expected 25,000 each, so chi-squared = 600^2 / 25,000 x 2 = 28.8, with p far below Microsoft's 0.0005 threshold. Something treated the arms differently, so no metric from this run can be trusted until the cause is found.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does checking a test daily and stopping at the first p below 0.05 raise the false-positive rate?",
              options: [
                "Each look gives noise another chance to cross the line",
                "Early users differ from later ones, which biases the rate",
                "The dashboard computes the p-value wrongly before the end",
                "Daily checks change how the users in each arm behave",
              ],
              answer: 0,
              explanation:
                "The p-value assumes one look at a sample size fixed in advance. Stopping at whichever look happens to cross 0.05 turned a nominal 5% into 26.1% in Evan Miller's example.",
            },
            {
              kind: "predict",
              prompt:
                "A redesigned listing page leads by 14% in week one, 7% in week two and 3% in week three. What is the most likely explanation?",
              options: [
                "Primacy: returning students slowing down on the new layout",
                "A sample ratio mismatch that grows as the weeks go on",
                "Seasonality, since the two arms saw different weeks",
                "Novelty: curiosity clicks that fade as the page gets familiar",
              ],
              answer: 3,
              explanation:
                "Novelty flatters the treatment early and fades, which is why tests run for several whole weeks. Primacy works the other way, favoring control, and both arms run in the same weeks by design.",
            },
          ],
        },
        {
          slug: "pm-most-ideas-fail",
          title: "Most ideas fail",
          summary:
            "About a third of tested ideas win at Microsoft and fewer at Bing and Google, so test to refuse the losers, score confidence honestly, and commit to outcomes.",
          contentFile: "pm-most-ideas-fail.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Nine features ship untested. A third help bookings by 2%, a third do nothing, a third hurt by 2%. What does the roadmap net?",
              options: [
                "About 0%, as the losers cancel the winners",
                "About +6%, from the three features that help",
                "About +18%, a 2% gain for every feature",
                "About -6%, since the losers are harder to undo",
              ],
              answer: 0,
              explanation:
                "Three winners at +2% and three losers at -2% cancel, so nine features of work return nothing. Testing pays mainly by refusing to ship the negative third.",
            },
            {
              kind: "mcq",
              prompt:
                "Your team's last 12 tested ideas produced 4 winners. What RICE confidence should a new idea with no evidence get?",
              options: [
                "100%, because its champion knows the users well",
                "80%, the usual score for a sound, well-argued idea",
                "50%, the scale's floor, until evidence raises it",
                "0%, since no test has been run on it so far",
              ],
              answer: 2,
              explanation:
                "A one-in-three record makes 80% fiction. Score untested ideas at the floor and let a prior test, a fake door or repeated interview evidence earn a higher score.",
            },
            {
              kind: "mcq",
              prompt: "What is the most useful lesson from the Bing ad headline test?",
              options: [
                "Revenue ideas should outrank user-experience ideas",
                "Prioritizers could not tell the best idea from the rest",
                "Too-good-to-be-true alerts are usually real results",
                "Ideas that take little effort make the largest gains",
              ],
              answer: 1,
              explanation:
                "An idea worth over $100 million a year sat ranked low for six months among hundreds of others. When a test is cheap, running it beats arguing about the idea's score.",
            },
          ],
        },
      ],
    },
  ],
}
