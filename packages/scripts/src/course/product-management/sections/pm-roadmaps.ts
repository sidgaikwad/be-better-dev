import type { SectionSeed } from "../../types"

export const pmRoadmaps: SectionSeed = {
  slug: "pm-roadmaps",
  title: "Roadmaps",
  description:
    "What a roadmap is for, formats that survive contact with reality, phasing from MVP to later versions, and telling each audience the truth it needs.",
  badgeIcon: "🗺️",
  badgeTitle: "Roadmapper",
  units: [
    {
      slug: "what-a-roadmap-is",
      title: "What a roadmap is",
      description:
        "A roadmap carries direction to people outside the room, so its format decides what they hear.",
      lessons: [
        {
          slug: "pm-roadmap-purpose",
          title: "A roadmap is a communication tool",
          summary:
            "Readers take a dated feature list as a promise, so commit to problems and their order, not to untested solutions.",
          contentFile: "pm-roadmap-purpose.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why did Roost's January roadmap fail, even though dropping owner chat was the right call?",
              options: [
                "The team scored owner chat with the wrong key result",
                "Owner chat should have been built to keep the owners happy",
                "The owners read a dated feature list as a promise the team had not made",
                "The roadmap listed too many features for five engineers",
              ],
              answer: 2,
              explanation:
                "A roadmap means what its reader takes it to mean. The team treated the months as guesses, but a feature with a date beside it reaches outsiders as a commitment, so changing the plan broke a promise.",
            },
            {
              kind: "predict",
              prompt:
                'Sales asks for "Owner chat, July" on a slide for 200 owners, because 25 hostels will buy Featured if chat is coming. Chat scored fourth of five, at 50% confidence. What should the slide show?',
              options: [
                "The problem, faster owner replies, and its place in the order",
                "Owner chat for July, with a footnote that plans may change",
                "Owner chat with no month, so the hostels still expect it",
                "Nothing about owners, since chat is not in this season's plan",
              ],
              answer: 0,
              explanation:
                "The roadmap commits to the problem and its order, which is true today. A feature at 50% confidence may not survive discovery, and a footnote does not stop readers treating a named feature as a promise.",
            },
            {
              kind: "mcq",
              prompt: "When is naming a specific feature on the roadmap the honest choice?",
              options: [
                "When a senior stakeholder has asked for that feature by name",
                "When the feature has the highest score on the priority list",
                "When the team wants engineers to start estimating it early",
                "When the cause of the problem and its fix are already known",
              ],
              answer: 3,
              explanation:
                'Outcome framing exists to handle uncertainty. The map pin bug has a found cause and a known fix, so writing "fix the map pin" says more than a vague outcome and promises nothing untested.',
            },
          ],
        },
        {
          slug: "pm-now-next-later",
          title: "Now, next, later",
          summary:
            "Janna Bastow's three columns trade false dates for a gradient of confidence, with every card tied to an objective.",
          contentFile: "pm-now-next-later.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Roost's five engineers are all placed: three on the parent page, one on the pin fix, one on agreed maintenance. The founder wants availability (two engineers) and instalments (three) added to Now. What happens if you agree?",
              options: [
                "Nothing changes, since Now only shows what matters most",
                "Every item gets fewer people, so all of them finish later",
                "Availability and instalments ship sooner, the rest on time",
                "The team works faster because the goals are more ambitious",
              ],
              answer: 1,
              explanation:
                "Now is a statement about where people are working. Ten engineers' worth of work on five engineers means each item gets about half its people, so even the parent page, nearly done, slips.",
            },
            {
              kind: "mcq",
              prompt: "What do the Now, Next and Later columns measure?",
              options: [
                "The next three quarters, one column each",
                "Priority, with the most valuable work in Now",
                "Effort, with the smallest work placed in Now",
                "Confidence and detail, falling as work moves out",
              ],
              answer: 3,
              explanation:
                "Now is specified and staffed, Next has a clear problem and a solution under test, Later holds fuzzy problems. ProdPad itself warns that reading the columns as quarters brings the dates back.",
            },
            {
              kind: "mcq",
              prompt:
                "In Bastow's format, what lets cards move between columns without breaking a promise?",
              options: [
                "The commitment lives in the objectives each card serves",
                "Cards in Next and Later carry no owner or estimate",
                "The roadmap is shared only with the engineering team",
                "Every card carries a disclaimer that dates may change",
              ],
              answer: 0,
              explanation:
                "Each card is labeled with the objective it serves. The team commits to moving the objective, so swapping or reordering the cards that serve it is expected, not a broken promise.",
            },
          ],
        },
      ],
    },
    {
      slug: "sequencing-and-promising",
      title: "Sequencing and promising",
      description:
        "Phase work by dependency and evidence, and date only what the world and discovery have earned.",
      lessons: [
        {
          slug: "pm-roadmap-phasing",
          title: "MVP, then V1, then V2",
          summary:
            "Start from the priority list, then let dependencies and phase exits decide what ships in which phase.",
          contentFile: "pm-roadmap-phasing.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "The founder wants a guarantee paying any unlisted charge up to ₹3,500 in the MVP, before June. The unlisted-charge rate is 3% today, the target is 1%, and charges are not yet recorded. Where does it belong?",
              options: [
                "In the MVP, since it ranked first on the priority list",
                "Nowhere, since guarantees are discounts the strategy forbids",
                "After the phase that records charges and cuts the rate",
                "In the MVP for Pune only, to limit how much it pays out",
              ],
              answer: 2,
              explanation:
                "Before charges are recorded Roost cannot tell a listed charge from an unlisted one, and at 3% the payout is about three times what it is at 1%. A bet whose cost depends on an earlier phase's result goes after that phase.",
            },
            {
              kind: "mcq",
              prompt:
                "Charge fields on the verification form ranked fifth of six. Why do they go in the first phase?",
              options: [
                "Small items should always ship before large ones",
                "Four of the other pieces cannot work without them",
                "The operations team asked for them before anyone else",
                "Low-ranked items are cheap filler for the first phase",
              ],
              answer: 1,
              explanation:
                "A ranking scores each piece as if it stood alone. Dependencies pull a root forward into the phase of the first piece that needs it, whatever its own score.",
            },
            {
              kind: "mcq",
              prompt: "What should separate short-term phases from long-term ones?",
              options: [
                "Whether the work's value and cost are already known",
                "Whether the work is a small fix or an advanced feature",
                "Whether customers or the business asked for the work",
                "Whether the work touches the backend or only the UI",
              ],
              answer: 0,
              explanation:
                "The video splits by kind of work, but the guarantee is small and still belongs late because its cost depends on what the MVP learns. Known work goes early; bets on earlier results go after them.",
            },
          ],
        },
        {
          slug: "pm-roadmap-dates",
          title: "Dates, promises, and audiences",
          summary:
            "A date belongs on a roadmap when the world sets it and discovery has earned it, and every audience's version tells one truth.",
          contentFile: "pm-roadmap-dates.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                'On 20 March a partner wants "instalments this season" in brochures printing 10 April. Discovery would finish 3 April; a build and Pune pilot would end 29 May. What do you do?',
              options: [
                "Print the line now, since the season is a real deadline",
                "Refuse any mention until the feature is live in Pune",
                'Print "coming soon" now, with no date, to keep it safe',
                "Decide on 3 April and print a date only if discovery passes",
              ],
              answer: 3,
              explanation:
                "The printing deadline leaves a week after discovery ends, so waiting for evidence costs nothing. A real deadline sets when discovery must finish; it does not justify a promise made before it.",
            },
            {
              kind: "mcq",
              prompt: "Which of these is a real date for a Roost roadmap item?",
              options: [
                "The end of the quarter the founder reports to the board",
                "The June to August season that holds 54% of bookings",
                "The date engineers guessed before discovery started",
                "The month a competitor is rumored to launch instalments",
              ],
              answer: 1,
              explanation:
                "A date is real when the world sets it and missing it has a cost you can name. Work that misses the admissions season waits nine months for the next peak; the others are internal or invented dates.",
            },
            {
              kind: "mcq",
              prompt:
                "The PM keeps different roadmap versions for engineers, the founder, partners and customers. What rule keeps them honest?",
              options: [
                "Each version must show the same items at the same detail",
                "Partners and customers should see only shipped work",
                "Every version is cut from one source and adds no promise",
                "Each audience gets the dates it needs for its own plans",
              ],
              answer: 2,
              explanation:
                "A version may leave detail out but never add a promise the source does not hold. Two versions with different dates are two roadmaps, and one of them will be broken in public.",
            },
          ],
        },
      ],
    },
  ],
}
