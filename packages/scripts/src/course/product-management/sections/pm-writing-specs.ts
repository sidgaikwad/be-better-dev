import type { SectionSeed } from "../../types"

export const pmWritingSpecs: SectionSeed = {
  slug: "pm-writing-specs",
  title: "Writing specs",
  description:
    "The documents that turn a decision into shared understanding: the PRD and its hardest sections, requirements with numbers in them, Amazon's press release first, and writing for the person reading.",
  badgeIcon: "📝",
  badgeTitle: "Spec writer",
  units: [
    {
      slug: "the-prd",
      title: "The PRD",
      description:
        "What a requirements document is for, the sections teams skip, and requirements someone else can check.",
      lessons: [
        {
          slug: "pm-prd-anatomy",
          title: "What a PRD is for",
          summary:
            "Why, what, and how you will know: a PRD settles the problem and the measure before the screens.",
          contentFile: "pm-prd-anatomy.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Roost's instalments PRD sets an adoption metric, an outcome metric and a guardrail. What is the guardrail there to catch?",
              options: [
                "Families ignoring the instalment option at checkout",
                "Growth from lending to families who cannot repay",
                "Engineers shipping the feature after the June campaign",
                "Owners opting out because the partner pays them late",
              ],
              answer: 1,
              explanation:
                "Adoption and the outcome can both rise for a bad reason. The guardrail, missed second instalments at most 3%, checks that bookings did not grow by lending to families who then fail to pay.",
            },
            {
              kind: "predict",
              prompt:
                'A PRD\'s only success measure is "Instalments live in Pune by 1 May". The feature ships on 28 April, and 2% of bookings use it. What did the measure tell you about value?',
              options: [
                "That the launch worked, since the date was met early",
                "That adoption was low because the launch came far too early",
                "Nothing, since a date is met whether or not anyone uses it",
                "That the feature failed, since 2% is below any target",
              ],
              answer: 2,
              explanation:
                "A ship date is an output: it scores perfectly even if no family chooses instalments. Only a measure of behavior, such as adoption or request-to-booking, can say whether the feature was worth building.",
            },
            {
              kind: "mcq",
              prompt:
                "In Cagan's 2005 paper on writing a good PRD, when does the writing itself happen?",
              options: [
                "After prototyping and testing the concept with users",
                "First, so the prototype has a written spec to follow",
                "After engineering estimates, so scope matches capacity",
                "At launch, as a record of what was actually built",
              ],
              answer: 0,
              explanation:
                '"Write it down" is step seven of ten, after the prototype has been tested with real users. The PRD records a solution that survived contact with users, which is why detailed requirements written before the test tend to be rewritten by it.',
            },
          ],
        },
        {
          slug: "pm-prd-hard-sections",
          title: "Out of scope, risks, open questions",
          summary:
            "Release criteria, out of scope, risks and open questions: the sections that stop an MVP doubling in size.",
          contentFile: "pm-prd-hard-sections.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which of these is a usable entry in a PRD's risks section?",
              options: [
                "Timeline risk: medium, to be monitored by the team weekly",
                "Partner integration could be harder than engineering expects",
                "Some families may dislike instalments; keep an eye on it",
                "Partner caps at 40 approvals a day; soft launch Pune first",
              ],
              answer: 3,
              explanation:
                "A risk entry names an event that might happen and a mitigation you can act on now. The others name a worry with no event, or an event with no action, so nobody can do anything with them.",
            },
            {
              kind: "predict",
              prompt:
                "Three weeks into a six-week build, the founder asks to add instalments on monthly rent, which the tech lead puts at four more weeks. The June campaign starts in five weeks. What happens if you say yes?",
              options: [
                "Seven weeks of work remain, so June has no instalments",
                "The build slips a week, which the campaign can absorb",
                "Scope grows, but parallel work keeps the June date safe",
                "Nothing changes, because the rent work reuses the same flow",
              ],
              answer: 0,
              explanation:
                "Three weeks left plus four more is seven, two past the campaign. Stating the cost in the founder's terms, no instalments at all in June, is what makes the out-of-scope line hold.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does each out-of-scope line in Roost's PRD carry a moment to revisit it?",
              options: [
                "So engineers can start the excluded work in spare time",
                "So the founder can overrule the list at any review",
                'It turns "no" into "not now", and says what reopens it',
                "It gives marketing a date to announce the later features",
              ],
              answer: 2,
              explanation:
                "An exclusion with a revisit point is MoSCoW's \"won't have this time\": the request is recorded, the people who asked are reassured, and it reopens for new evidence rather than new pressure.",
            },
          ],
        },
        {
          slug: "pm-requirements",
          title: "Functional, non-functional, and edge cases",
          summary:
            "What it must do, how well, and what the happy path forgets, with numbers someone else can check.",
          contentFile: "pm-requirements.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Which of these is a checkable non-functional requirement for Roost's payment page?",
              options: [
                "The payment page should feel fast on most phones people own",
                "Under 2 seconds for 90% of visits, mid-range Android on 4G",
                "The payment page is at least as fast as the leading rival",
                "The payment page loads in 2 seconds on average, all devices",
              ],
              answer: 1,
              explanation:
                'A real target names a percentile and the conditions. An average hides the slow tail, and "feel fast" or "as fast as a rival" cannot be checked by someone who was not in the room.',
            },
            {
              kind: "predict",
              prompt:
                "SMS alone delivers 95% of reminders. Reminded payers miss 2% of payments; payers with no reminder miss 40%. The guardrail is 3% missed. What miss rate should you expect with SMS alone?",
              options: [
                "2.0%, since reminded payers miss 2%",
                "2.1%, a small rise over the reminded rate",
                "5.0%, since one payer in twenty is missed",
                "3.9%, which is over the 3% guardrail",
              ],
              answer: 3,
              explanation:
                "0.95 × 2% + 0.05 × 40% = 1.9% + 2.0% = 3.9%. The 5% who get no reminder produce more missed payments than everyone else combined, which is why 95% delivery is not the strict target it sounds like.",
            },
            {
              kind: "mcq",
              prompt:
                "Where should a non-functional target, such as how many reminders must be delivered, come from?",
              options: [
                "From the consequence it protects, such as a guardrail",
                "From an industry default, such as 99.9% uptime or better",
                "From what the provider's standard plan already offers",
                "From the strictest number engineering can commit to",
              ],
              answer: 0,
              explanation:
                "Each extra nine of reliability costs more than the last, so a round number either wastes effort or falls short. Working back from the 3% guardrail gave the reminders their 99.5% target.",
            },
          ],
        },
      ],
    },
    {
      slug: "writing-to-decide",
      title: "Writing to decide",
      description: "Amazon's press release first, and writing so that the reader can act on it.",
      lessons: [
        {
          slug: "pm-working-backwards",
          title: "The press release comes first",
          summary:
            "Amazon's PR/FAQ: announce the product to its customer before building it, and see what that forces.",
          contentFile: "pm-working-backwards.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In a PR/FAQ, what does the internal FAQ answer?",
              options: [
                "Questions a journalist would ask on launch day",
                "Questions support will hear from customers",
                "Leadership's questions: cost, risk, why now",
                "Questions engineers ask about the technical design",
              ],
              answer: 2,
              explanation:
                "The external FAQ answers customers and the press. The internal one answers leadership, which is where viability lives: for Roost, who pays the lender, how many approvals the partner can handle, and why now.",
            },
            {
              kind: "predict",
              prompt:
                "Students asked for their monthly rent in parts. Half of Roost's 8,000 monthly requests fail at the ₹27,000 due before move-in. Which press release heading should go to review?",
              options: [
                "Students can now pay their monthly rent in parts",
                "Families can now pay the move-in cost in 3 parts",
                "Roost partners with a lender to launch instalments",
                "Roost now offers flexible payment plans to students",
              ],
              answer: 1,
              explanation:
                "Working backwards starts from the moment the problem stops the customer. The ₹27,000 falls before booking, where requests are lost; rent in parts helps only after move-in, and a heading about Roost's partnership speaks to nobody outside the company.",
            },
            {
              kind: "mcq",
              prompt: "Which is a real limit of the PR/FAQ method?",
              options: [
                "It is too long for leadership to read in a meeting",
                "It can only be written once the product is built",
                "It forces decisions before engineers can estimate",
                "It is the team's opinion, not customer evidence",
              ],
              answer: 3,
              explanation:
                "Colleagues finding a press release exciting is not evidence that customers will choose the product, so the PR/FAQ sits beside interviews and prototype tests rather than replacing them.",
            },
          ],
        },
        {
          slug: "pm-writing-for-readers",
          title: "Writing for the person reading",
          summary:
            "Numbers instead of vague words, the same facts in a different order per reader, and memos over slides.",
          contentFile: "pm-writing-for-readers.md",
          quiz: [
            {
              kind: "mcq",
              prompt: 'A PRD says "approval must be fast". Which rewrite removes the ambiguity?',
              options: [
                "The partner decides within 24 hours, weekends included",
                "Approval must be fast and simple for every single family",
                "Approval must be as quick as possible within reason",
                "Approval should feel close to instant for the payer",
              ],
              answer: 0,
              explanation:
                'Replacing an adjective with a number lets someone who was not in the room check it. "Fast" let marketing hear "instant" while the partner meant "same day".',
            },
            {
              kind: "predict",
              prompt:
                "The founder has a 20-minute slot and asks for ten slides on the partner decision, which turns on June needing 75 approvals a day from a partner that has done 40. What do you bring?",
              options: [
                "Ten slides, since the founder asked and time is short",
                "The nine-page PRD, so every detail is on hand",
                "A one-page memo, read silently for the first five minutes",
                "The same one-page memo, emailed the night before as a pre-read",
              ],
              answer: 2,
              explanation:
                "The decision is one relationship, 75 against 40, which a sentence states and a slide flattens into one bullet among many. Reading in the room guarantees it was read; a pre-read sent the night before is skimmed at best.",
            },
            {
              kind: "mcq",
              prompt:
                "What should differ between the engineers' version of a spec and the founder's page?",
              options: [
                "The facts, simplified so the founder gets the gist",
                "The order and depth; the facts stay identical",
                "Nothing, since one document serves every reader",
                "The numbers, rounded to keep leadership reassured",
              ],
              answer: 1,
              explanation:
                "Each reader needs a different starting point and level of detail, but the same facts. If the founder's page says \"the partner can scale\" while the engineers' says 40 a day, the later argument is about who was told what.",
            },
          ],
        },
      ],
    },
  ],
}
