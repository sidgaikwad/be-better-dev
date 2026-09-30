import type { SectionSeed } from "../../types"

export const pmCompetitiveAnalysis: SectionSeed = {
  slug: "pm-competitive-analysis",
  title: "Competitive analysis",
  description:
    "Finding every competitor, including the ones that are not software, mapping where each stands, watching their moves, and deciding when to respond.",
  badgeIcon: "🔍",
  badgeTitle: "Scout",
  units: [
    {
      slug: "the-field",
      title: "Who you compete with",
      description: "Finding every alternative customers use, and mapping how buyers see them.",
      lessons: [
        {
          slug: "pm-finding-competitors",
          title: "Direct, indirect, and the spreadsheet",
          summary:
            "Competitors come in three kinds, and the ones that matter most are rarely rival apps: build the sheet from where customers actually go.",
          contentFile: "pm-finding-competitors.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which of these is an indirect competitor for Roost, in the lesson's terms?",
              options: [
                "A student-housing app that also verifies its listings",
                "The notice board outside the college gate",
                "A rental portal that plans to start verifying rooms",
                "A managed residence operator with its own buildings",
              ],
              answer: 1,
              explanation:
                "Indirect means a different means to the same job: the notice board helps a student find a room without being a housing product at all. The app and the operator are direct, and a portal that has not started verifying is a future competitor.",
            },
            {
              kind: "predict",
              prompt:
                "Roost is scanning for future competitors. Which of these companies is closest to competing with it next season?",
              options: [
                "A food delivery app that many Pune students use every day",
                "A coaching institute whose students join Pune colleges every year",
                "A rental portal with many Pune owners and a field sales team",
                "A furniture rental startup that delivers to student flats",
              ],
              answer: 2,
              explanation:
                "It already holds two of the three pieces the job needs, the supply and a team that visits properties, so it is one decision away from verifying rooms for students. The others hold one piece at most.",
            },
            {
              kind: "mcq",
              prompt:
                "Why can a survey of where lost customers went never reveal a future competitor?",
              options: [
                "Nobody can have left for a company that does not compete yet",
                "Samples of a thousand students are too small to catch rare answers",
                "Students rarely remember which apps they tried before booking",
                "Future competitors show up in owner surveys, not student ones",
              ],
              answer: 0,
              explanation:
                "The survey counts past choices, so it only sees alternatives that already exist. Future competitors have to be found by asking who already holds part of what the job needs.",
            },
          ],
        },
        {
          slug: "pm-positioning-maps",
          title: "Mapping the field",
          summary:
            "Take the axes and the positions from buyers, then ask why any empty space is empty before moving into it.",
          contentFile: "pm-positioning-maps.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "What separates a perceptual map from the competitor slide in most pitch decks?",
              options: [
                "It names four quadrants such as leaders and niche players",
                "It plots every rival the team can find, not just the big ones",
                "It uses market share as one of its two axes",
                "Customers choose the axes and rate each alternative",
              ],
              answer: 3,
              explanation:
                "Both the axes and the positions come from buyers' own ratings. A deck slide usually has axes the team chose, which is why the team always lands in the top right.",
            },
            {
              kind: "predict",
              prompt:
                "A team plots rivals on 'number of amenities' and 'monthly rent'. Every alternative falls close to one diagonal line. What does that pattern most likely mean?",
              options: [
                "The market is crowded, and a new entrant has room off the line",
                "The two axes measure almost the same thing, cost",
                "Customers weigh amenities more heavily than they weigh rent",
                "The corners are empty because no rival has noticed them yet",
              ],
              answer: 1,
              explanation:
                "Amenities are what rent pays for, so the axes are correlated and the map shows one dimension twice. The empty corners are empty because the economics rule them out, not because anyone overlooked them.",
            },
            {
              kind: "mcq",
              prompt:
                "Roost's comparison table gives 'verified listings' a tick for Roost and for a rental portal. What is the main problem?",
              options: [
                "Rivals may dispute a table that names them",
                "Buyers skim past tables longer than ten rows",
                "A tick hides how differently the two verify",
                "The table goes out of date with each release",
              ],
              answer: 2,
              explanation:
                "A visit with dated photos and an owner uploading an ID earn the same tick, so the table erases the one difference that matters. Its author also chose the rows, which is why such tables flatter whoever wrote them.",
            },
          ],
        },
      ],
    },
    {
      slug: "moves-and-shifts",
      title: "Moves and shifts",
      description: "Reading what competitors do, and changing course when the market really moves.",
      lessons: [
        {
          slug: "pm-watching-competitors",
          title: "Watching competitors without copying them",
          summary:
            "Read rivals' moves for intent and their reviews for demand, spend watching effort where customers go, and copy only table stakes.",
          contentFile: "pm-watching-competitors.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "A rival posts six job ads for property verifiers in Pune. What does this most reliably tell Roost?",
              options: [
                "Its verification will soon be better than Roost's",
                "Students have started asking the rival to verify rooms",
                "It plans to spend on verification in Pune soon",
                "Roost's owners are about to move to the rival",
              ],
              answer: 2,
              explanation:
                "Job postings show where a company intends to spend in the coming months. They say nothing about quality, customer demand or owner behavior, which need their own evidence.",
            },
            {
              kind: "predict",
              prompt:
                "A rival ships roommate matching to wide press coverage, and the founder wants Roost to match it within a month. What is the strongest reason to wait?",
              options: [
                "The launch shows the rival's bet, not students' demand",
                "Roommate matching is hard to build well in a single month",
                "Owners may refuse to share details about current tenants",
                "Press coverage of a launch usually fades within a few weeks",
              ],
              answer: 0,
              explanation:
                "Launches are public and usage is not, so a launch reveals intent, not demand. Check reviews and your own customers for whether students choose rooms on it before spending a month copying it.",
            },
            {
              kind: "mcq",
              prompt: "When does copying a competitor's feature make sense?",
              options: [
                "When the rival is growing faster than you are",
                "When engineers can ship it in under a week",
                "When investors ask about it in a board meeting",
                "When customers now expect it of every option",
              ],
              answer: 3,
              explanation:
                "Once a feature is table stakes, lacking it costs you customers, so copy the outcome cheaply. Anything short of that buys parity at best, a release late, on the rival's strategy.",
            },
          ],
        },
        {
          slug: "pm-adapting-strategy",
          title: "When the market moves",
          summary:
            "Adapting usually means re-weighting existing bets: confirm the shift against a comparison group, test the response small, and say what changed.",
          contentFile: "pm-adapting-strategy.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Swiggy had run Instamart since 2020 when 10-minute delivery arrived in 2021. What does its response suggest adapting usually involves?",
              options: [
                "Re-weighting a bet the company already has",
                "Launching a new product within weeks of a rival",
                "Matching the rival's promise to the exact minute",
                "Waiting until the rival's model is proven to work",
              ],
              answer: 0,
              explanation:
                "Swiggy committed $700 million and a 15-minute goal to a service it already ran, rather than starting from scratch. Most adapting moves resources between existing bets as customers' expectations change.",
            },
            {
              kind: "mcq",
              prompt:
                "Firestone saw radial tires coming and invested nearly $400 million in them. Why does Sull still count it as a case of inertia?",
              options: [
                "It waited years after Ford's announcement to act",
                "It refused to make radial tires in the United States",
                "It copied Michelin's design instead of its own",
                "It ran radials with its old processes and beliefs",
              ],
              answer: 3,
              explanation:
                "Active inertia is not doing nothing; it is doing the new thing the old way. Firestone kept its old processes and relationships and assumed ever-growing demand, though radials last twice as long.",
            },
            {
              kind: "predict",
              prompt:
                "Roost's Hyderabad bookings fell 12% this season, and a rival app launched there in May. Before re-planning anything, which evidence best separates signal from noise?",
              options: [
                "Whether the rival's app store rating is above Roost's",
                "Whether the drop is sharper where the rival lists rooms",
                "Whether the founder believes the rival is a real threat",
                "Whether the drop is larger than the rival's own bookings",
              ],
              answer: 1,
              explanation:
                "Comparing neighborhoods where the rival operates with those where it does not rules out citywide causes, as the other colleges did in the lesson. Ratings, beliefs and the rival's totals say nothing about why Roost's bookings fell.",
            },
          ],
        },
      ],
    },
  ],
}
