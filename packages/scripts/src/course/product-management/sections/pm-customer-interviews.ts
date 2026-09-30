import type { SectionSeed } from "../../types"

export const pmCustomerInterviews: SectionSeed = {
  slug: "pm-customer-interviews",
  title: "Customer interviews",
  description:
    "Why asking people about your idea gets you polite lies, what to ask instead, and how to make talking to customers a weekly habit rather than a phase.",
  badgeIcon: "🎙️",
  badgeTitle: "Interviewer",
  units: [
    {
      slug: "asking-well",
      title: "Asking without being lied to",
      description:
        "Why opinions about your idea mislead, and how to get stories, facts and commitments instead.",
      lessons: [
        {
          slug: "pm-why-people-lie",
          title: "Why 'would you use this?' fails",
          summary:
            "People answer questions about your idea with polite fiction. The Mom Test asks about their past instead, and counts commitments, not compliments.",
          contentFile: "pm-why-people-lie.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which of these interview questions passes the Mom Test?",
              options: [
                "Would you pay ₹199 for a live video tour of a hostel?",
                "How did you find the room you live in now?",
                "How important is safety when you choose a hostel?",
                "What features would make you trust a listing?",
              ],
              answer: 1,
              explanation:
                "It asks about a specific past event in the student's own life, so the answer is a fact she knows, not a forecast or an opinion of your idea. The others ask for a prediction, a generic rating, or a feature wish list.",
            },
            {
              kind: "predict",
              prompt:
                "A student says: 'I would definitely use that. I always check reviews before booking.' What is the most useful next move?",
              options: [
                "Record it as strong demand, since she said 'definitely'",
                "Ask her to rate the idea from 1 to 10 to measure it",
                "Ask which reviews she read for the room she has now",
                "Pitch the review feature in more detail to test interest",
              ],
              answer: 2,
              explanation:
                "Both halves are fluff: a future promise and a generic claim. Anchoring to a specific past event tests whether the habit is real, while a rating or a longer pitch only produces more opinion.",
            },
            {
              kind: "mcq",
              prompt:
                "In Fitzpatrick's terms, which of these is real evidence that someone wants a solution?",
              options: [
                "They say it is the best idea they have heard this year",
                "They list five features they would want it to have",
                "They promise to tell all their friends once it launches",
                "They pay a ₹199 deposit to book a tour for Saturday",
              ],
              answer: 3,
              explanation:
                "Commitment means giving something up now: time, reputation or money. Praise, wish lists and promises about future behavior cost nothing, so they say nothing about what the person will do.",
            },
          ],
        },
        {
          slug: "pm-interview-questions",
          title: "Questions about the past",
          summary:
            "'Tell me about the last time you...' plus probes for cost, frequency, workarounds and money spent, with a bad-versus-good question bank for Roost.",
          contentFile: "pm-interview-questions.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why is 'Tell me about the last time you looked for a room' better than 'What is your biggest headache when looking for a hostel?'",
              options: [
                "It produces a story with dates, costs and steps to probe",
                "It is shorter, so students answer it more quickly",
                "It avoids naming a problem, so it cannot bias the answer",
                "It lets the student list every problem in order of importance",
              ],
              answer: 0,
              explanation:
                "A generic question gets the student's theory of themselves: a list of worries with no weights. A specific past story has a sequence, other people and real costs, and each of those can be probed.",
            },
            {
              kind: "predict",
              prompt:
                "In 10 interviews, 9 students call safety their top worry, but none describes a safety incident. Four describe paying a broker ₹2,000 last season because they could not tell which listings were still available. Which problem has stronger evidence?",
              options: [
                "Safety, because nine of the ten students raised it as a worry",
                "Both equally, since each came up in several interviews",
                "Availability, because four already paid for a workaround",
                "Neither, until a survey of 500 students confirms one",
              ],
              answer: 2,
              explanation:
                "Money already spent on a workaround is the strongest signal an interview produces. Nine mentions of a worry with no event behind them measure how easy it is to recall, not what it costs.",
            },
            {
              kind: "mcq",
              prompt: "Which follow-up keeps a student inside her story without leading her?",
              options: [
                "What happened after the owner asked for the ₹4,000?",
                "Wasn't it frustrating when the owner raised the price?",
                "Why do you think owners hide charges from students?",
                "Would a price breakdown on the listing have helped you?",
              ],
              answer: 0,
              explanation:
                "A neutral prompt that moves time forward keeps the story going. The others suggest a feeling, invite a theory made up on the spot, or pitch a solution and ask for a prediction.",
            },
          ],
        },
        {
          slug: "pm-running-interviews",
          title: "Running and recording an interview",
          summary:
            "Recruit people who acted recently, run a loose script with two roles, never pitch, write a snapshot the same day, and count patterns per segment.",
          contentFile: "pm-running-interviews.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Who should Roost recruit first for interviews about the booking experience?",
              options: [
                "Friends and classmates of the team, who will be candid",
                "Students who sent a booking request in the last 30 days",
                "Any college student in the three cities, picked at random",
                "Students who said in a survey they might move next year",
              ],
              answer: 1,
              explanation:
                "Recent behavior gives fresh, specific stories, and the students who gave up often explain the most. Friends are the mothers of the Mom Test, and people who might act someday can only offer predictions.",
            },
            {
              kind: "predict",
              prompt:
                "Midway through an interview, a student asks what you are building, and the PM describes the verification report in detail. What happens to the rest of the interview?",
              options: [
                "It improves, since the student can now give focused feedback",
                "Nothing changes, as long as the note-taker marks the moment",
                "It becomes a usability test, which is just as useful",
                "It turns into compliments and predictions about the idea",
              ],
              answer: 3,
              explanation:
                "Once the idea is on the table, the student reacts to it, and reactions to an idea are compliments and forecasts. Offer to show it at the end, after the story has been captured.",
            },
            {
              kind: "mcq",
              prompt:
                "Griffin and Hauser estimated that 20 to 30 interviews surface 90 to 95% of needs in a relatively homogeneous segment. What does that imply for Roost?",
              options: [
                "30 interviews in total will cover students, owners and parents",
                "Fewer than 20 interviews can never show a pattern",
                "Each segment needs its own set of interviews",
                "After 30 interviews, discovery is done for the year",
              ],
              answer: 2,
              explanation:
                "The finding held within one fairly uniform group. Students, owners and paying parents have different problems, so a pattern in one segment says little about another.",
            },
          ],
        },
      ],
    },
    {
      slug: "discovery-as-habit",
      title: "Discovery as a habit",
      description:
        "Talking to customers every week, organizing what you hear into a tree, and testing the riskiest assumption before building.",
      lessons: [
        {
          slug: "pm-continuous-discovery",
          title: "Continuous discovery",
          summary:
            "Torres's weekly habit: the trio talks to customers every week, with recruiting automated, because decisions happen weekly and research phases go stale.",
          contentFile: "pm-continuous-discovery.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "A research team interviews customers every week and sends the trio a summary deck. Which part of Torres's definition does this miss?",
              options: [
                "Weekly touchpoints with customers",
                "Small research activities",
                "In pursuit of a desired outcome",
                "By the team building the product",
              ],
              answer: 3,
              explanation:
                "The cadence is right, but the people who hear the stories are not the ones deciding what to build, and nuance does not survive the handoff. Torres puts the trio itself in the conversation.",
            },
            {
              kind: "predict",
              prompt:
                "In October, Roost's intercept after booking requests stops producing volunteers, because few students are searching. What is the best adjustment?",
              options: [
                "Pause discovery until June, when searching picks up again",
                "Interview recent movers about month one, and more owners",
                "Raise the voucher from ₹300 to ₹3,000 to attract searchers",
                "Replace the interviews with an off-season survey of users",
              ],
              answer: 1,
              explanation:
                "Students who just moved in have fresh stories about their first month, and owners are there all year. Pausing breaks the habit, and a survey collects opinions instead of stories.",
            },
            {
              kind: "mcq",
              prompt: "Why does discovery run as a one-off research phase go stale?",
              options: [
                "New questions arise, and the report cannot answer them",
                "Customers answer less honestly when an outside agency asks",
                "Research reports are usually too short to be useful",
                "A single study costs more than a year of weekly interviews",
              ],
              answer: 0,
              explanation:
                "Each solution raises assumptions nobody asked about when the study ran, and the market keeps moving. A fixed report answers the questions of its own month, while the team decides things every week.",
            },
          ],
        },
        {
          slug: "pm-opportunity-solution-tree",
          title: "The opportunity solution tree",
          summary:
            "Outcome, opportunities, solutions, assumption tests: a tree that makes every idea name the customer problem it serves, built for Roost's bookings goal.",
          contentFile: "pm-opportunity-solution-tree.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "On an opportunity solution tree, where does 'Add a map view to search' belong?",
              options: [
                "At the root, as the outcome",
                "As an opportunity under the outcome",
                "As a solution under an opportunity",
                "As an assumption test under a solution",
              ],
              answer: 2,
              explanation:
                "A map view is something Roost would build, so it is a solution. It belongs under the customer problem it would address, and an interview has to reveal that problem first.",
            },
            {
              kind: "mcq",
              prompt:
                "Hidden charges produced Roost's most vivid interview stories, yet the target outcome is the share of booking requests that end in a booking. Why is hidden charges not the target opportunity?",
              options: [
                "Stories about money are less reliable than stories about safety",
                "Torres advises against the opportunity with the most stories",
                "Hidden charges are a solution rather than an opportunity",
                "The students who told those stories had booked anyway",
              ],
              answer: 3,
              explanation:
                "An opportunity is chosen for the outcome it moves. The charge hurt after booking, on move-in day, so it mainly serves a different outcome, fewer disputes, rather than more requests ending in a booking.",
            },
            {
              kind: "predict",
              prompt:
                "Instalments came up in 3 of 14 student stories and would take six weeks. 'My parents won't pay until someone has seen the room' came up in 9 of 14, with three candidate solutions of three weeks or less. What should the season's plan hold?",
              options: [
                "Instalments, since the founder backs it as the one big bet",
                "All four solutions, split across the five engineers",
                "The parents opportunity, testing its three solutions",
                "Nothing yet, until 30 more interviews settle it",
              ],
              answer: 2,
              explanation:
                "Choose the opportunity first, on evidence: 9 stories against 3, at half the cost. Instalments stays on the tree under its own opportunity, visible rather than rejected.",
            },
          ],
        },
        {
          slug: "pm-assumption-testing",
          title: "Testing the riskiest assumption first",
          summary:
            "List what must be true, map it by importance and evidence, and run the smallest test that could prove the riskiest assumption wrong.",
          contentFile: "pm-assumption-testing.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In Bland's assumptions mapping, which assumptions should be tested first?",
              options: [
                "Important, with no evidence yet",
                "Important, with strong evidence already",
                "Unimportant, with no evidence yet",
                "Unimportant, but cheap to test",
              ],
              answer: 0,
              explanation:
                "An important assumption would sink the idea if false, and no evidence means you do not yet know whether it is. Testing what you already know, or what does not matter, spends time without reducing risk.",
            },
            {
              kind: "mcq",
              prompt:
                "Which of these is an ethical assumption, in Torres's sense, for Roost's parent report?",
              options: [
                "Parents can read the report on a phone",
                "Report photos show no other residents",
                "Reports add little cost to the visit",
                "The link opens in WhatsApp without an account",
              ],
              answer: 1,
              explanation:
                "Ethical assumptions are about potential harm, including privacy and trust, here the privacy of other residents. The other three are usability, viability and feasibility assumptions.",
            },
            {
              kind: "predict",
              prompt:
                "The parent-report test runs on 40 requests against a 50% baseline (20 bookings). The pass line was 28 and the fail line 22. It gets 23 bookings. What do you do?",
              options: [
                "Ship the report page, since 23 beats the baseline of 20",
                "Kill the idea, since 23 is well short of the pass line",
                "Lower the pass line to 23, since the result was close",
                "Extend the test to 80 requests before deciding",
              ],
              answer: 3,
              explanation:
                "23 sits between the lines, where chance alone could explain the gap from 20. The plan written in advance says extend; moving a line after the result turns the test into one that always succeeds.",
            },
          ],
        },
      ],
    },
  ],
}
