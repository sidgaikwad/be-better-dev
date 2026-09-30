import type { SectionSeed } from "../../types"

export const pmStakeholders: SectionSeed = {
  slug: "pm-stakeholders",
  title: "Stakeholders and influence",
  description:
    "Leading people who do not report to you: mapping stakeholders, deciding who decides, disagreeing and committing, saying no upward, and keeping everyone informed.",
  badgeIcon: "🤝",
  badgeTitle: "Diplomat",
  units: [
    {
      slug: "who-decides",
      title: "Who matters and who decides",
      description:
        "Mapping stakeholders, assigning decision rights, and matching decision speed to reversibility.",
      lessons: [
        {
          slug: "pm-stakeholder-map",
          title: "Mapping stakeholders",
          summary:
            "The power and interest grid: sort people by what this project does to them, and redraw it when the project changes.",
          contentFile: "pm-stakeholder-map.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Roost is changing how Featured listings rank. The support team has no say over pricing but will take every owner's call about it. Where do they sit on the grid, and what do they get?",
              options: [
                "Monitor: check now and then whether they care",
                "Keep satisfied: brief them only on what touches them",
                "Keep informed: tell them what is coming before it lands",
                "Manage closely: include them in the ranking decision",
              ],
              answer: 2,
              explanation:
                "Low power, high interest: support cannot stop the change but lives with its consequences. They need the what and the why before owners start calling, not a vote on the decision.",
            },
            {
              kind: "mcq",
              prompt:
                "Nobody objected to the parent page in its PRD review, yet its launch set off 40 owner calls. What went wrong?",
              options: [
                "The people it hit hardest were never on the map",
                "The PRD left the visit date out of the requirements",
                "The founder approved it without reading the design",
                "Owners had too much notice and organized against it",
              ],
              answer: 0,
              explanation:
                "The review contained people who liked the page. The city lead and the operations lead, who absorbed its consequences, were not asked, so nobody planned re-visits or warned owners.",
            },
            {
              kind: "mcq",
              prompt:
                "Eleven small PG owners in one Bengaluru locality ask to be delisted in the same week. How should the map treat them?",
              options: [
                "As low power, since each owner is small on their own",
                "As high power, since together they are that area's supply",
                "As low interest, since they have chosen to leave anyway",
                "As out of scope, since owners are customers, not colleagues",
              ],
              answer: 1,
              explanation:
                "Power is what a person or group can actually do to the outcome, not a title. A marketplace without supply in a locality has nothing to show the students searching there.",
            },
          ],
        },
        {
          slug: "pm-decision-rights",
          title: "Who decides",
          summary:
            "RACI and DACI: one Approver per decision, and why unclear decision rights cost more time than disagreement.",
          contentFile: "pm-decision-rights.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why do unclear decision rights usually cost more time than open disagreement?",
              options: [
                "Small teams rarely disagree, so disagreement costs little",
                "Unclear rights make people hold their views more strongly",
                "Approvers move slowly whenever contributors disagree",
                "Disagreement ends when someone decides; unclear rights never do",
              ],
              answer: 3,
              explanation:
                "An Approver can hear both sides and close an argument. When nobody knows who decides, the safe move is more data and another meeting, and the loop has no exit.",
            },
            {
              kind: "predict",
              prompt:
                "You are the Driver on the Featured price change. You have gathered the evidence and are confident ₹7,000 is right. What is your next move?",
              options: [
                "Announce ₹7,000, since the Driver owns the decision",
                "Write a recommendation for ₹7,000 and ask the Approver",
                "Hold a vote among contributors and take the majority",
                "Wait until every contributor agrees before going ahead",
              ],
              answer: 1,
              explanation:
                "The Driver gets the decision made; the Approver makes it. Contributors have a voice, not a vote, so neither announcing it yourself nor waiting for consensus fits the roles.",
            },
            {
              kind: "predict",
              prompt:
                "The founder and the Bengaluru city lead each insist on approving a Bengaluru-only discount on Featured. What should the DACI say?",
              options: [
                "Both are Approvers, so neither of them feels overruled",
                "The founder approves everything, to keep prices consistent",
                "Split it: a framework the founder approves, a city price the lead does",
                "Contributors vote on which of the two should approve",
              ],
              answer: 2,
              explanation:
                "Two approvers means either can reopen the decision. When two people each need to own part of it, split it into two decisions, each with exactly one Approver.",
            },
          ],
        },
        {
          slug: "pm-one-way-doors",
          title: "One-way and two-way doors",
          summary:
            "Bezos's Type 1 and Type 2 decisions, the 70% rule, and disagree and commit: match decision speed to reversibility.",
          contentFile: "pm-one-way-doors.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "What did Bezos's 2015 letter say happens when a growing company uses its heavy decision process on reversible decisions?",
              options: [
                "Slowness, risk aversion and too little experimentation",
                "More irreversible mistakes slipping through unnoticed",
                "Decisions made by people who lack enough authority",
                "Teams skipping the written documents before deciding",
              ],
              answer: 0,
              explanation:
                "The cost of treating a two-way door like a one-way door is speed and invention. Most decisions can be undone, so deliberating over them like permanent ones wastes time and discourages trying things.",
            },
            {
              kind: "predict",
              prompt:
                'Roost wants to add "We refund any charge not on this listing" to every parent page. Removing the line would take an engineer an hour. Which kind of door is it?',
              options: [
                "Two-way, since the text can be removed in an hour",
                "One-way in trust, since withdrawing a promise breaks it",
                "Two-way, since only parents ever see the parent page",
                "One-way, since every code change is hard to reverse",
              ],
              answer: 1,
              explanation:
                "Reversible in code is not reversible in trust. Families who read the promise remember it, so taking it back costs far more than the hour of engineering.",
            },
            {
              kind: "mcq",
              prompt: "Which of these is a misuse of disagree and commit?",
              options: [
                "A boss backing a team's choice she argued against",
                "A lead stating objections, then supporting the result",
                "Two teams with different goals escalating early",
                "A manager invoking it before anyone has made a case",
              ],
              answer: 3,
              explanation:
                "Grove's sequence is free discussion, a clear decision, then full support. Invoking commitment before the discussion skips the first step and turns the phrase into a way to silence people.",
            },
          ],
        },
      ],
    },
    {
      slug: "managing-up",
      title: "Managing up",
      description:
        "Answering the founder's ideas with evidence, and keeping every stakeholder informed without surprises.",
      lessons: [
        {
          slug: "pm-no-to-the-ceo",
          title: "When the idea comes from the top",
          summary:
            "Turn a founder's idea into a belief with a price, agree the decision rule before the test, then commit or hold to it.",
          contentFile: "pm-no-to-the-ceo.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "The founder opens a meeting with a new feature idea and wants it before June. What should you do before arguing for or against it?",
              options: [
                "Score it with RICE alongside the rest of the backlog",
                "Ask the founder to present it to the whole team",
                "Name the belief it rests on and price what must be true",
                "Check whether the investors would back the idea",
              ],
              answer: 2,
              explanation:
                "A founder's idea is usually an untested belief. Stating it and working out the bar it must clear turns a contest of opinions into a question a number can answer.",
            },
            {
              kind: "mcq",
              prompt:
                'Why agree the rollout rule, such as "67% request-to-booking", before the test runs?',
              options: [
                "So the result is read against a bar set before anyone knew it",
                "So the test can be stopped early once the result looks good",
                "So the founder loses the right to change his mind afterwards",
                "So the sample grows large enough to reach significance",
              ],
              answer: 0,
              explanation:
                "A rule fixed while nobody knows the answer cannot be bent toward the answer. The later conversation becomes a reading of a number both sides signed, not a contest of rank.",
            },
            {
              kind: "predict",
              prompt:
                "Roost Assured's test lifts request-to-booking to 56%, short of the 67% break-even you both signed. The founder wants it everywhere. Which response fits the lesson?",
              options: [
                "Ship it everywhere, since the founder is the Approver",
                "Refuse outright, since the test missed the agreed bar",
                "Rerun the test in other cities until one of them passes",
                "Show the monthly loss and offer a version that could pass",
              ],
              answer: 3,
              explanation:
                "The rule says this version loses ₹468,000 a month, so hold to it, but the lift shows the belief was partly right. A version that cuts the refund cost keeps the gain; if the founder still overrides, record it and commit.",
            },
          ],
        },
        {
          slug: "pm-updates-and-reviews",
          title: "Updates, reviews, and storytelling",
          summary:
            "The weekly update that leads with the answer, the product review that ends in decisions, and the thirty-second story.",
          contentFile: "pm-updates-and-reviews.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What belongs in the first line of a weekly update?",
              options: [
                "A list of everything the team shipped that week",
                "The answer: where things stand against the goal",
                "Thanks to the people who helped during the week",
                "The week's meetings and who attended each one",
              ],
              answer: 1,
              explanation:
                "Minto's rule is the main point first, then its support. A reader who stops after one line should know whether the goal is on track.",
            },
            {
              kind: "predict",
              prompt:
                'A key metric has slipped for three weeks but might recover, so your status stays "on track" to avoid alarm. It does not recover. What is the lasting cost?',
              options: [
                "None, provided the fix ships before the season starts",
                "The founder trusts the team more for staying calm",
                "The team gains time to fix it without outside pressure",
                "Every later green status is discounted by its readers",
              ],
              answer: 3,
              explanation:
                "This is the watermelon report: green outside, red inside. Once a stakeholder is surprised, they stop believing good news, so bad news belongs first and early.",
            },
            {
              kind: "mcq",
              prompt: "What separates a product review from a weekly update?",
              options: [
                "A review exists to make decisions; an update to inform",
                "A review covers more metrics than an update does",
                "A review is for engineers; an update for executives",
                "A review comes after launch; an update comes before",
              ],
              answer: 0,
              explanation:
                "The review states the decisions needed, names each Approver, and ends with a decision log. The update keeps the rest of the map informed so nobody needs a meeting to know where things stand.",
            },
          ],
        },
      ],
    },
  ],
}
