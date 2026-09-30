import type { SectionSeed } from "../../types"

export const pmAgileDelivery: SectionSeed = {
  slug: "pm-agile-delivery",
  title: "Agile delivery",
  description:
    "How software teams actually ship: the Agile values, Scrum and Kanban as the two common shapes, Basecamp's Shape Up as an alternative, and the PM's job while the building happens.",
  badgeIcon: "🏃",
  badgeTitle: "Agilist",
  units: [
    {
      slug: "values-and-scrum",
      title: "Values and Scrum",
      description:
        "What the Agile Manifesto asks for, and the framework most teams use to deliver it.",
      lessons: [
        {
          slug: "pm-agile-values",
          title: "What Agile actually says",
          summary:
            "Four values and twelve principles from 2001, none of which mention sprints or standups: the point is working software in users' hands.",
          contentFile: "pm-agile-values.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "The manifesto values working software over exhaustive documentation. What does that mean for a PRD?",
              options: [
                "Agile teams should stop writing PRDs once coding starts",
                "A PRD is only allowed for work longer than one sprint",
                "A PRD is useful, but it must not replace shipping and revising",
                "A PRD should be replaced by user stories in every case",
              ],
              answer: 2,
              explanation:
                "The manifesto says the items on the right still have value; the left ones are valued more. Documents are fine until they become a contract that stands in for delivering and learning.",
            },
            {
              kind: "predict",
              prompt:
                "A team runs two-week sprints and daily standups but releases to users once a quarter. A finished feature has waited six weeks for the next release. Judged by the manifesto's principles, what is the main problem?",
              options: [
                "Finished work is not reaching users, so nothing is being learned",
                "The sprints are too long and should be cut to one week",
                "The standups are missing the business side of the company",
                "The team needs a Scrum Master to enforce the ceremonies",
              ],
              answer: 0,
              explanation:
                "The principles ask for early and continuous delivery and treat working software as the measure of progress. The team has the rituals, but a feature held on a branch teaches nobody anything.",
            },
            {
              kind: "mcq",
              prompt: "Which of these does the Agile Manifesto actually prescribe?",
              options: [
                "Two-week sprints with a planning meeting at the start",
                "Story points and velocity for forecasting releases",
                "A daily standup of 15 minutes for the whole team",
                "None of these; it states values and principles, not practices",
              ],
              answer: 3,
              explanation:
                "Sprints, standups and story points come from specific methods such as Scrum and Extreme Programming. The manifesto says what to value, which is why teams can copy the ceremonies and still miss its point.",
            },
          ],
        },
        {
          slug: "pm-scrum",
          title: "Scrum",
          summary:
            "The 2020 Scrum Guide's three accountabilities, five events and three commitments, and why the Sprint Goal is the one thing you do not trade.",
          contentFile: "pm-scrum.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Mid-sprint, a story needed for the Sprint Goal doubles in size. Two other stories in the sprint are not needed for the goal. The goal is still valid. What does the Scrum Guide point you to?",
              options: [
                "Cancel the sprint and plan a new one around the larger story",
                "Move the two stories out and keep the goal and end date",
                "Extend the sprint by a few days so everything still fits",
                "Keep all the stories and ask the team to work the weekend",
              ],
              answer: 1,
              explanation:
                "Sprint length and goal are fixed; the Sprint Backlog is a forecast that the Developers and Product Owner renegotiate without affecting the goal. Cancelling is only for a goal that has become obsolete.",
            },
            {
              kind: "mcq",
              prompt: "In the 2020 Scrum Guide, who is the Daily Scrum for?",
              options: [
                "The Product Owner, to check progress on the backlog",
                "The Scrum Master, to collect status for stakeholders",
                "The whole company, to keep everyone informed daily",
                "The Developers, to inspect progress toward the Sprint Goal",
              ],
              answer: 3,
              explanation:
                "The guide gives the 15-minute Daily Scrum to the Developers. A PM who runs it as a status meeting, as in the video, turns a planning tool into reporting; being reachable right after it helps more.",
            },
            {
              kind: "mcq",
              prompt:
                "Sprint one builds login and signup, sprint two a dashboard, sprint three analytics. What is weak about this plan in Scrum's terms?",
              options: [
                "Each sprint delivers a component, not progress toward a goal users feel",
                "Two-week sprints are too short for login and signup work",
                "Analytics should always be built first so progress is measured",
                "The plan needs a Scrum Master to approve the order of sprints",
              ],
              answer: 0,
              explanation:
                "Sprint Planning starts with why the sprint is valuable. After sprint one, a user can sign up to an app that does nothing, so the sprint produced activity but no evidence about the product.",
            },
          ],
        },
      ],
    },
    {
      slug: "flow-and-bets",
      title: "Flow and bets",
      description:
        "Two alternatives to sprints: Kanban's limits on work in progress, and Shape Up's fixed-time bets.",
      lessons: [
        {
          slug: "pm-kanban",
          title: "Kanban and flow",
          summary:
            "Visualize the work, limit what is in progress, and use Little's Law to see why starting more makes everything slower.",
          contentFile: "pm-kanban.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "A team has 30 items in progress and finishes 10 a week. It caps work in progress at 10, and throughput stays at 10 a week. What happens to the average cycle time of started items?",
              options: [
                "It stays at 3 weeks, because throughput did not change",
                "It doubles, because fewer items are being worked on at once",
                "It falls from 3 weeks to 1 week",
                "It falls to half a week, because the team focuses harder",
              ],
              answer: 2,
              explanation:
                "Little's Law: cycle time is WIP divided by throughput, so 30 / 10 = 3 weeks becomes 10 / 10 = 1 week. The other 20 wait unstarted in a queue you can still reorder, which is where the PM gets choice back.",
            },
            {
              kind: "mcq",
              prompt:
                "A team uses a Trello board with To do, In progress and Done lists, and nothing else. What does it most need to be doing Kanban?",
              options: [
                "More columns, one for each stage of the workflow",
                "An explicit limit on how many items can be in progress",
                "Due dates on every card so lateness is visible",
                "Two-week sprints to give the board a rhythm",
              ],
              answer: 1,
              explanation:
                "Visualizing is only the first practice. Without a WIP limit and a pull rule, the board is a to-do list with columns, and In progress fills up until everything is slow.",
            },
            {
              kind: "mcq",
              prompt:
                "Bug reports arrive at 12 a week and the team fixes 9. Operations wants every report started the day it arrives. What does that change?",
              options: [
                "Only WIP and cycle time, which keep growing as before",
                "Throughput, which rises because work starts earlier",
                "Nothing, because Little's Law does not apply to bugs",
                "The arrival rate, which falls once owners see progress",
              ],
              answer: 0,
              explanation:
                "Starting sooner does not finish anything sooner. With 3 more arriving than leaving each week, WIP grows by 3 a week and so does waiting time; only more capacity or saying no closes the gap.",
            },
          ],
        },
        {
          slug: "pm-shape-up",
          title: "Shape Up",
          summary:
            "Ryan Singer's method from Basecamp: set an appetite before designing, shape a pitch, bet on six-week cycles, and let the circuit breaker cap the loss.",
          contentFile: "pm-shape-up.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "How does an appetite differ from an estimate in Shape Up?",
              options: [
                "An appetite is an estimate made by senior people instead of engineers",
                "An appetite is the estimate plus a safety margin for surprises",
                "An appetite is set after the design, once the scope is known",
                "An appetite fixes the time first, and the design is shaped to fit it",
              ],
              answer: 3,
              explanation:
                "An estimate starts from a design and produces a number; an appetite starts from a number and produces a design. That is why scope, not time, is what flexes.",
            },
            {
              kind: "predict",
              prompt:
                "Week 5 of a six-week bet. One part is downhill and nearly done; another is still uphill and has not moved in two weeks. The team asks for two more weeks. What does Shape Up say?",
              options: [
                "Grant the extension, since the team knows the work best",
                "Do not extend: ship what is done and reshape the stuck part",
                "Extend by one week only, as a compromise with the team",
                "Cancel the whole bet and discard the finished part as well",
              ],
              answer: 1,
              explanation:
                "The circuit breaker stops projects at the end of the cycle by default. A dot stuck uphill means an unknown shaping missed, so the remaining work is reshaped and must win a new bet.",
            },
            {
              kind: "mcq",
              prompt: "What happens to a pitch the betting table does not choose?",
              options: [
                "It goes to the top of the backlog for the next cycle",
                "It is built in the cool-down by whoever is free",
                "It is let go, and anyone can pitch it again later",
                "It is split into smaller pitches for the next cycle",
              ],
              answer: 2,
              explanation:
                "Shape Up keeps no central backlog. Letting pitches go keeps each betting table a fresh decision instead of a growing queue someone has to groom.",
            },
          ],
        },
      ],
    },
    {
      slug: "while-it-ships",
      title: "While it ships",
      description:
        "The PM's job during the build: answers, trade-offs, and protecting the team's capacity.",
      lessons: [
        {
          slug: "pm-pm-during-delivery",
          title: "The PM while the team builds",
          summary:
            "Answer within hours, decide whether the date or the scope gives, protect time for debt, and never turn velocity into a target.",
          contentFile: "pm-pm-during-delivery.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Five engineers each hit one blocking question a week. In a two-week sprint, roughly how much time is lost if the PM answers the next day rather than within two hours?",
              options: [
                "About 7.5 engineer-days",
                "About 2.5 engineer-days",
                "About 10 hours",
                "About 20 engineer-days",
              ],
              answer: 0,
              explanation:
                "Ten questions waiting a day each is 10 engineer-days; waiting two hours each is 20 hours, about 2.5 days. The difference, 7.5 days, is 15% of a 50-day sprint, spent waiting or guessing.",
            },
            {
              kind: "mcq",
              prompt:
                "The last three sprints finished 21, 26 and 19 points, and 110 points remain. What should the PM tell stakeholders?",
              options: [
                "Exactly 5 sprints, since the average velocity is 22",
                "4 sprints, planning to the best recent sprint",
                "5 to 6 sprints, from the best and worst recent velocity",
                "6 or 7 sprints, to leave a large safety margin",
              ],
              answer: 2,
              explanation:
                "110 / 26 = 4.2 and 110 / 19 = 5.8, so the history supports five or six sprints. A single number claims a precision that three noisy data points do not have.",
            },
            {
              kind: "predict",
              prompt:
                "The founder asks the team to raise velocity from 22 to 28 points a sprint to hit a fixed date. What is the most likely result?",
              options: [
                "The team ships about 27% more work each sprint",
                "Estimates inflate, and points rise faster than real output",
                "Velocity falls as the team resists the new target",
                "Nothing changes, because points are not tied to output",
              ],
              answer: 1,
              explanation:
                "A measure that becomes a target stops measuring. The cheapest way to earn more points is to call a 3 a 5, or to cut testing, so velocity rises while the date is no safer.",
            },
          ],
        },
      ],
    },
  ],
}
