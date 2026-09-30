import type { SectionSeed } from "../../types"

export const pmUserStories: SectionSeed = {
  slug: "pm-user-stories",
  title: "User stories",
  description:
    "The small unit of work a team builds against: the story format, acceptance criteria that end arguments, stories small enough to finish, and maps that show the whole journey.",
  badgeIcon: "📋",
  badgeTitle: "Storyteller",
  units: [
    {
      slug: "writing-a-story",
      title: "Writing a story",
      description: "Who, what and why on a card, and the tests that say when it is done.",
      lessons: [
        {
          slug: "pm-story-format",
          title: "As a, I want, so that",
          summary:
            "Each clause of the Connextra template answers a question the builder would otherwise chase, and the card is a token for a conversation, not a contract.",
          contentFile: "pm-story-format.md",
          quiz: [
            {
              kind: "mcq",
              prompt: 'What is the "so that" clause of a user story for?',
              options: [
                "Recording the business metric the story should move",
                "Telling the team why, so they can choose how to build it",
                "Naming the acceptance test that proves the story is done",
                "Identifying the stakeholder who asked for the story",
              ],
              answer: 1,
              explanation:
                "The benefit is what lets an engineer pick between two ways of building the same capability. Connextra added it because feature requests written by sales and marketing arrived without the who and why.",
            },
            {
              kind: "predict",
              prompt:
                'A PM replaces "As a user, I want a Pay in 3 parts button, so that I can pay in 3 parts" with the parent\'s story: split the ₹27,000 so they can hold the room this week. What is an engineer most likely to treat differently?',
              options: [
                "The number of parts offered at checkout",
                "The color and placement of the button",
                "How quickly the partner's approval must arrive",
                "Which city the feature launches in first",
              ],
              answer: 2,
              explanation:
                'The new benefit says timing is the point: an approval that takes three days loses the room even if the button works. A real "so that" changes design decisions; a circular one changes nothing.',
            },
            {
              kind: "mcq",
              prompt:
                "In Ron Jeffries' card, conversation and confirmation, where does the real requirement live?",
              options: [
                "In the conversation between requester and builders",
                "On the card, written out as fully as possible",
                "In acceptance tests written after the build",
                "In the PRD the story was originally split from",
              ],
              answer: 0,
              explanation:
                "Jeffries calls the card a token representing the requirement. Detail is worked out in conversation and confirmed by acceptance tests, which is why a longer ticket written alone does not replace refinement.",
            },
          ],
        },
        {
          slug: "pm-acceptance-criteria",
          title: "Acceptance criteria",
          summary:
            "Criteria with one reading decide when a story is done; Given, When, Then forces the starting state, the event and the visible outcome onto the page.",
          contentFile: "pm-acceptance-criteria.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                'Why does the video\'s criterion "search results within 100 milliseconds" fall short as written?',
              options: [
                "100 milliseconds is too strict for any search feature",
                "It is a performance target, not an acceptance criterion",
                "It does not say where or for which requests it is measured",
                "QA teams cannot time anything shorter than one second",
              ],
              answer: 2,
              explanation:
                "A server timing and a student's phone on 4G can differ several times over, and an average hides the slow tail. A criterion needs one reading, so it names where it is measured and for what share of requests.",
            },
            {
              kind: "predict",
              prompt:
                "Roost's budget filter passes its only criterion: rooms with rent at or under the budget. At the demo, operations shows rooms whose compulsory charges push them over budget. What should happen to the story?",
              options: [
                "Reopen it and add the missing criterion now",
                "Mark it done and write a new story for the gap",
                "Keep it open until QA retests every scenario",
                "Mark it done and log the gap as a defect",
              ],
              answer: 1,
              explanation:
                "The code does what was agreed, so it is neither unfinished nor a defect. Rewriting criteria at the demo teaches the team that criteria do not settle anything; the gap becomes new, high-priority work.",
            },
            {
              kind: "mcq",
              prompt:
                "Which line belongs in one story's acceptance criteria rather than in the team's definition of done?",
              options: [
                "Code is reviewed by a second engineer",
                "All unit tests pass in the build pipeline",
                "The change ships behind a feature flag",
                "Rooms not opted in do not offer instalments",
              ],
              answer: 3,
              explanation:
                "Criteria describe behavior specific to this story that a user or tester can see. Checks that apply to every story, like review and passing tests, belong in the shared definition of done.",
            },
          ],
        },
      ],
    },
    {
      slug: "sizing-and-slicing",
      title: "Sizing and slicing",
      description:
        "Cutting epics into stories a team can finish, and mapping them so a release covers the whole journey.",
      lessons: [
        {
          slug: "pm-splitting-stories",
          title: "Stories small enough to finish",
          summary:
            "INVEST says what a good story is; vertical splits by workflow, rule, data and happy path turn a five-week epic into slices a tester can try.",
          contentFile: "pm-splitting-stories.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why does splitting an epic into database, API and screen stories fail INVEST?",
              options: [
                "No piece is valuable or testable on its own",
                "The pieces are too small to estimate usefully",
                "It needs more engineers than one sprint holds",
                "Layers then have to be built in parallel",
              ],
              answer: 0,
              explanation:
                "Wake's layer cake: a horizontal slice gives the user none of the cake, and the screen story cannot be tested until the API ships, so it fails Independent too. A vertical slice goes through every layer.",
            },
            {
              kind: "predict",
              prompt:
                "Five engineers on two-week sprints have about 50 engineer-days. Using the guide that six to ten stories should fit in a sprint, which story should be split before it is taken in?",
              options: [
                "A 3-day story for SMS reminders",
                "A 5-day story for the happy path",
                "A 2-day story for the decline flow",
                "A 12-day story for every failure path",
              ],
              answer: 3,
              explanation:
                "Six to ten stories in 50 days means at most about 5 to 8 days each. Twelve days of failure paths splits naturally by business rule: decline, failed payment, date change.",
            },
            {
              kind: "mcq",
              prompt: "Which of these is a task rather than a story?",
              options: [
                "Payer sees the three-part schedule and applies",
                "Owner opts in to instalments from the owner app",
                "Write the client for the partner's approval API",
                "Declined payer is offered full payment and a hold",
              ],
              answer: 2,
              explanation:
                "A client library is something no user can try, so it is work inside a story, not a story. The other three each change what a payer or owner can do.",
            },
          ],
        },
        {
          slug: "pm-story-mapping",
          title: "Story mapping",
          summary:
            "Patton's map lays activities across and stories down, so a release is a slice through the whole journey and a missing step shows as an empty column.",
          contentFile: "pm-story-mapping.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What is the walking skeleton on a story map?",
              options: [
                "The row of activities along the backbone, before stories",
                "The first slice, thin in every activity and empty in none",
                "The highest-scoring stories taken from the flat backlog",
                "The technical architecture that every story depends on",
              ],
              answer: 1,
              explanation:
                "It is the smallest version that works end to end. Some cells may be manual, like operations opting owners in by phone, but no activity is left out.",
            },
            {
              kind: "predict",
              prompt:
                "The top nine instalment stories by RICE all sit under payer activities; the story that pays owners ranks 14th. If the team releases the top nine, how many instalment bookings complete?",
              options: [
                "None, since no owner is ever paid",
                "About as many as the forecast said",
                "Somewhat fewer, as owners opt out",
                "Only those where the payer is a parent",
              ],
              answer: 0,
              explanation:
                "Every payer story depends on the owner being paid, so without that story their real reach is zero. Scoring stories one at a time cannot see the dependency; the map shows it as an empty column.",
            },
            {
              kind: "mcq",
              prompt: "When does the lesson say a story map is not worth building?",
              options: [
                "When the team already has a ranked backlog",
                "When the feature spans both marketplace sides",
                "When some steps will be done by hand at first",
                "When the change is one screen with no journey",
              ],
              answer: 3,
              explanation:
                "A map earns its place by showing a journey and what each release covers of it. A one-screen change has no journey to lay out, and a ranked backlog is exactly what a map is meant to complement.",
            },
          ],
        },
      ],
    },
  ],
}
