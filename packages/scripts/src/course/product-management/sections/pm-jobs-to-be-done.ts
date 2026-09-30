import type { SectionSeed } from "../../types"

export const pmJobsToBeDone: SectionSeed = {
  slug: "pm-jobs-to-be-done",
  title: "Jobs to be done",
  description:
    "People do not buy products, they hire them to make progress: the theory, the forces that cause and block a switch, and how to write a job down.",
  badgeIcon: "🔧",
  badgeTitle: "Jobs",
  units: [
    {
      slug: "why-people-switch",
      title: "Why people switch",
      description:
        "Jobs as progress in a circumstance, and the forces that start and stop a switch.",
      lessons: [
        {
          slug: "pm-jtbd-hiring",
          title: "Hiring a product for a job",
          summary:
            "Customers hire products to make progress in a circumstance, and the circumstance, not the demographic, defines the job.",
          contentFile: "pm-jtbd-hiring.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In Christensen's definition, what makes two customers share the same job?",
              options: [
                "They share an age bracket, a budget and a home city",
                "They ask for the same features when you interview them",
                "They seek the same progress in the same circumstance",
                "They already buy products from the same category",
              ],
              answer: 2,
              explanation:
                "A job is the progress a person is trying to make in a particular circumstance. The two Roost students share every demographic field and still have different jobs, because one has twelve days and no hostel seat while the other browses at leisure.",
            },
            {
              kind: "predict",
              prompt:
                "The chain in the milkshake story makes its shake thicker so a commuter's shake lasts the whole drive. What happens to the afternoon job?",
              options: [
                "It improves too, since a better shake suits every buyer",
                "It gets worse: parents want a shake children finish fast",
                "Nothing changes, since afternoon buyers order other sizes",
                "It improves, since children prefer a thicker texture",
              ],
              answer: 1,
              explanation:
                "One product was hired for two jobs with opposite requirements. A change that serves the commuter works against the parent, which is why averaging feedback across both jobs had moved sales nowhere.",
            },
            {
              kind: "mcq",
              prompt:
                "A colleague cites the milkshake story as proof that jobs to be done raises sales. What is the accurate reply?",
              options: [
                "It is proven: HBR published the chain's sales figures",
                "It is disproven: the chain later reversed every change",
                "It is proven: Christensen's books report the uplift",
                "It is a parable: no sales data was ever published",
              ],
              answer: 3,
              explanation:
                "Retellings disagree on the numbers, the written accounts never name the chain, and Christensen's sevenfold figure was a spoken claim with no published data. Use the story to explain the idea, not as evidence that the method pays.",
            },
          ],
        },
        {
          slug: "pm-four-forces",
          title: "The four forces of progress",
          summary:
            "Push and pull drive a switch while anxiety and habit block it, so find the force that binds before adding features.",
          contentFile: "pm-four-forces.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In Moesta and Spiek's diagram, which two forces work against a switch?",
              options: [
                "Anxiety about the new and habit of the present",
                "Push of the situation and anxiety about the new",
                "Pull of the new solution and habit of the present",
                "Push of the situation and pull of the new solution",
              ],
              answer: 0,
              explanation:
                "Push and pull drive a switch; anxiety and habit resist it. A team that only works on pull is loading one side of the balance while ignoring what holds the other side down.",
            },
            {
              kind: "predict",
              prompt:
                "A student shortlists a verified room, must move in within two weeks, and closes the app at the deposit screen, saying she has never paid a stranger online. Which change is most likely to win her?",
              options: [
                "More photos and a video tour of the same room",
                "A higher position for the room in search results",
                "Holding her money until she confirms the room",
                "A reminder the next morning with the listing link",
              ],
              answer: 2,
              explanation:
                "Push and pull already brought her to the payment screen, so more pull does little. Her stated blocker is anxiety, and holding the money until check-in removes the exact risk she named.",
            },
            {
              kind: "mcq",
              prompt: "Who should a switch interview be with?",
              options: [
                "Loyal users, about the features they want next",
                "People who recently switched, about that decision",
                "Prospects, about whether they would switch someday",
                "Anyone in the segment, about their general preferences",
              ],
              answer: 1,
              explanation:
                "The switch interview rebuilds a real, recent decision from first thought to first use. People who recently switched, or nearly did, can recount what happened; everyone else can only speculate.",
            },
          ],
        },
      ],
    },
    {
      slug: "putting-jobs-to-work",
      title: "Putting the job to work",
      description:
        "Writing the job down, mapping it step by step, and seeing what it really competes with.",
      lessons: [
        {
          slug: "pm-job-statements",
          title: "Writing a job statement",
          summary:
            "Ulwick's grammar for jobs and measurable outcomes, the opportunity score, and when to reach for each camp of jobs theory.",
          contentFile: "pm-job-statements.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which is a well-formed desired outcome statement in Ulwick's grammar?",
              options: [
                "Add a video tour to every verified listing on Roost",
                "Make finding a hostel near campus easy and stress-free",
                "Students want to trust the rooms that they book online",
                "Minimize the time it takes to confirm a room is real",
              ],
              answer: 3,
              explanation:
                "An outcome statement has a direction, a metric, an object of control and a clarifier, and names no solution. A video tour is a solution, 'easy' measures nothing, and 'want to trust' gives no direction or metric.",
            },
            {
              kind: "predict",
              prompt:
                "Outcome A has importance 8 and satisfaction 3. Outcome B has importance 9 and satisfaction 8. Which has the higher opportunity score?",
              options: [
                "A, scoring 13 against B's 10",
                "B, scoring 17 while A scores 11",
                "B, scoring 9 against A's 8",
                "A, scoring 5 against B's 1",
              ],
              answer: 0,
              explanation:
                "Opportunity is importance plus the unmet gap: 8 + 5 = 13 for A and 9 + 1 = 10 for B. B matters slightly more but is already well served, so A is the better place to invest.",
            },
            {
              kind: "mcq",
              prompt:
                "A young product does not yet know which job it is hired for, or by whom. What should come first?",
              options: [
                "An outcome survey of several hundred customers",
                "An opportunity score for every item on the backlog",
                "A round of switch interviews with recent switchers",
                "A feature comparison against the leading rival apps",
              ],
              answer: 2,
              explanation:
                "Switch interviews find the job and the forces around it with a dozen conversations. Ulwick's survey earns its cost later, once the job is settled and the question is which outcomes to fund.",
            },
          ],
        },
        {
          slug: "pm-job-map",
          title: "Mapping a job step by step",
          summary:
            "The universal job map finds the steps your product never sees, including the step where a failure actually starts.",
          contentFile: "pm-job-map.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which is a valid job map step in Bettencourt and Ulwick's sense?",
              options: [
                "Tap the Book now button on the listing page",
                "Confirm the room matches its description",
                "Enter card details on the payment screen",
                "Send the broker a message on WhatsApp",
              ],
              answer: 1,
              explanation:
                "A valid step states what the customer is trying to accomplish, whatever tool they use. The other three are actions inside a particular solution, the same slip the video's t-shirt steps make with 'enter payment details'.",
            },
            {
              kind: "predict",
              prompt:
                "The video's t-shirt steps run search, details, address, payment and delivery. Which step of the universal job map does that list leave out?",
              options: [
                "Locate, finding shirts that could work",
                "Execute, paying for and placing the order",
                "Confirm, checking the fabric, size and price",
                "Modify, returning a shirt that does not fit",
              ],
              answer: 3,
              explanation:
                "Search maps to Locate, the details step to Confirm, and payment to Execute. Ending at delivery leaves out Modify and Conclude, the steps after the parcel arrives, which a map of a checkout never reaches.",
            },
            {
              kind: "mcq",
              prompt:
                "Families with an unrealistically low budget see empty results and leave. Why does the job map point away from fixing the results page?",
              options: [
                "The failure shows up at Locate but starts at Define",
                "Results pages are an engineering concern, not a job",
                "The Execute step is where the opportunity usually is",
                "Low-budget families are outside Roost's target segment",
              ],
              answer: 0,
              explanation:
                "Failures surface downstream of their cause. The empty page appears at Locate, but the family set its budget at Define without knowing what rooms cost, so helping them define it moves more bookings than filling the page.",
            },
          ],
        },
        {
          slug: "pm-real-competition",
          title: "Your real competition",
          summary:
            "Your competition is whatever customers hire for the job, and the biggest one is usually what they already do.",
          contentFile: "pm-real-competition.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In jobs to be done terms, what counts as a competitor?",
              options: [
                "Any product in the same category with similar features",
                "Any company that targets the same demographic group",
                "Anything hired for the same job, including nothing",
                "Any rival that investors and analysts mention by name",
              ],
              answer: 2,
              explanation:
                "Competition is set by the job, not the category. The milkshake competed with bananas and boredom, and Roost competes with brokers, WhatsApp groups and an aunt's spare room.",
            },
            {
              kind: "predict",
              prompt:
                "A new expense-splitting app for flatmates loses most of the people who try it within a month. Where are most of them likely to go?",
              options: [
                "To the market-leading rival expense app",
                "Back to what they did before, like a group chat",
                "To a newer app with a longer feature list",
                "Nowhere, because the job no longer matters to them",
              ],
              answer: 1,
              explanation:
                "The old way has habit on its side, carries no anxiety, and costs nothing to return to. For most early products the biggest competitor is the status quo, not a rival.",
            },
            {
              kind: "mcq",
              prompt:
                "Why is 'help me have a good first year' a poor job for sizing Roost's competition?",
              options: [
                "It names Roost's own product inside the job statement",
                "It is too narrow to include brokers or relatives' homes",
                "It leaves out the parents who pay for the student's room",
                "So much competes with it that the list becomes useless",
              ],
              answer: 3,
              explanation:
                "A job stated that broadly turns a gym and a phone plan into competitors. Keep it at the level where the customer actually chose among options: this student, this June, a broker, a group, a spare room or Roost.",
            },
          ],
        },
      ],
    },
  ],
}
