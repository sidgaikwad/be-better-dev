import type { SectionSeed } from "../../types"

export const pmMvpAndExperiments: SectionSeed = {
  slug: "pm-mvp-and-experiments",
  title: "MVPs and cheap experiments",
  description:
    "What a minimum viable product was originally meant to be, the MVPs that involve no code at all, and when a market expects more than minimum.",
  badgeIcon: "🧪",
  badgeTitle: "Experimenter",
  units: [
    {
      slug: "the-experiment",
      title: "The experiment",
      description: "What an MVP is for, and the ways to run one before writing code.",
      lessons: [
        {
          slug: "pm-mvp-meaning",
          title: "What 'minimum viable' actually means",
          summary:
            "An MVP is an experiment with a question and a pass line, sized by what it must learn, not a version one with fewer features.",
          contentFile: "pm-mvp-meaning.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "In Eric Ries's definition, what is the 'minimum' in minimum viable product measured against?",
              options: [
                "The smallest feature set that a paying customer will accept",
                "The shortest time the team can ship something in",
                "The least effort that answers the question being tested",
                "The lowest quality bar early adopters will tolerate",
              ],
              answer: 2,
              explanation:
                "Ries defines the MVP by learning: the most validated learning for the least effort. Size follows from the question, which is why IMVU's six-month MVP still counted as minimum.",
            },
            {
              kind: "predict",
              prompt:
                "Owners' photo uploads fail on slow connections. Logs show the cause is uncompressed images, and compressing them is a four-day fix. The founder wants an MVP first. What should happen?",
              options: [
                "Build it and measure uploads, since the cause and fix are known",
                "Run a fake door first to confirm that owners want faster uploads",
                "Compress photos by hand for 50 owners before writing code",
                "Survey owners on whether faster uploads would matter",
              ],
              answer: 0,
              explanation:
                "Ries says you do not need an MVP when you already know the answer: an obvious problem with an obvious fix. Testing it spends effort to learn nothing, so build it and check that uploads succeed.",
            },
            {
              kind: "mcq",
              prompt: "How did Frank Robinson's 2001 meaning of MVP differ from Eric Ries's?",
              options: [
                "Robinson's had to be built without code; Ries's could use code",
                "Robinson meant a demo for investors; Ries meant one for users",
                "Robinson meant the first paid release; Ries ruled out charging",
                "Robinson's was sized to sell; Ries's was sized to learn",
              ],
              answer: 3,
              explanation:
                "Robinson's MVP was big enough to cause adoption, satisfaction and sales. Ries kept the words and made the purpose learning, and everyday use drifted to a third meaning: version one minus some features.",
            },
          ],
        },
        {
          slug: "pm-mvp-types",
          title: "MVPs without code",
          summary:
            "Explainer videos, price pages, fake doors, concierge and Wizard of Oz tests: what each can prove, and what it cannot.",
          contentFile: "pm-mvp-types.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What did Zappos' 1999 test leave unanswered, by design?",
              options: [
                "Whether people would buy shoes from a website",
                "Whether selling shoes online could make a profit",
                "Whether photos were enough to choose a pair",
                "Whether customers would wait days for shoes to arrive",
              ],
              answer: 1,
              explanation:
                "Swinmurn bought each ordered pair from the store at full price, so the test said nothing about margins. It answered the question that mattered first: would people buy shoes online at all.",
            },
            {
              kind: "predict",
              prompt:
                "A fake door, 'Meal plans near your PG', is shown to 2,400 students and 310 tap it. The riskiest assumption is that students will keep paying every month. What does the result say about that assumption?",
              options: [
                "It confirms it, since a 13% tap rate shows strong interest",
                "It refutes it, since 87% of students did not tap",
                "It shows the meal plan page is easy to use",
                "Little: a tap costs nothing and says nothing of month two",
              ],
              answer: 3,
              explanation:
                "A fake door measures demand in context, a low grade of behavior. The assumption is about repeated payment, which only a test that takes money twice, such as a concierge, can reach.",
            },
            {
              kind: "mcq",
              prompt:
                "Why can a concierge test overstate the value of the software you plan to build?",
              options: [
                "Customers may be paying for the person, not the outcome",
                "Concierge tests use too few customers to measure anything",
                "Customers do not know a person is doing the work behind it",
                "Manual service is slower, so customers judge it too harshly",
              ],
              answer: 0,
              explanation:
                "In a concierge the customer knows a person is serving them, and part of the value can be that person. A Wizard of Oz that looks like the real product separates the two.",
            },
          ],
        },
      ],
    },
    {
      slug: "how-much-to-build",
      title: "How much to build",
      description:
        "How small the first version can be, when it must be more, and what to add after it.",
      lessons: [
        {
          slug: "pm-mvp-scope",
          title: "Cutting to one job",
          summary:
            "Scope the first version to one job for one group, keep the step that makes you different, and do the back office by hand.",
          contentFile: "pm-mvp-scope.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does scoping an MVP to one job let you leave out?",
              options: [
                "Any step of the job that is slow to build",
                "The differentiating step, if it is costly to run",
                "Other jobs and other groups of users",
                "Payment, since early users can be served free",
              ],
              answer: 2,
              explanation:
                "Scope cuts whole jobs and groups. Every step of the one job must still work, even by hand, and the step that makes the product different is the hypothesis, so it stays.",
            },
            {
              kind: "predict",
              prompt:
                "A startup testing a verified-rooms marketplace skips verification visits to launch three weeks sooner. Bookings arrive at about the rate a WhatsApp group produces. What has it learned?",
              options: [
                "That students do not value verified rooms",
                "Little, since it cut the step being tested",
                "That the market is too small to be worth serving",
                "That its listings need better photos and filters",
              ],
              answer: 1,
              explanation:
                "Without verification the product is a listings page, which is what WhatsApp groups already are. The test measured that, so it says nothing about whether students value verified rooms.",
            },
            {
              kind: "predict",
              prompt:
                "Operations handles each booking by hand in 30 minutes, and 40 bookings a week are expected in the season. Automating takes six weeks and would push launch past the season's start. What do you do?",
              options: [
                "Launch by hand, since 20 hours a week is affordable",
                "Wait, since manual payments cannot scale past a season",
                "Wait, since early users judge a product by its back office",
                "Launch without payment and collect it after move-in",
              ],
              answer: 0,
              explanation:
                "40 × 30 minutes is 20 hours a week, half of one person's time, while a missed season costs a year of learning. Automate once volume makes the manual work cost more than the build.",
            },
          ],
        },
        {
          slug: "pm-mvp-vs-mdp",
          title: "When minimum is not enough",
          summary:
            "Where users already have a good option, a rough MVP measures your polish, not your idea. Delta 4 says how big the gap must be.",
          contentFile: "pm-mvp-vs-mdp.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "In Kunal Shah's Delta 4, what happens when a new product beats the old way by less than 4 points?",
              options: [
                "People switch slowly but then never switch back",
                "People brag about it but refuse to pay for it",
                "People forgive its failures while it matures",
                "People switch back easily and forgive nothing",
              ],
              answer: 3,
              explanation:
                "Shah's three effects, irreversibility, tolerance for failure and brag-worthiness, appear only at a delta of 4 or more. Below that, the change is reversible and every failure is a reason to leave.",
            },
            {
              kind: "predict",
              prompt:
                "A startup launches a bare-bones food delivery app in a city where two polished apps dominate. Orders stay low. What does the result most likely show?",
              options: [
                "That people in that city rarely order food online",
                "Little about the idea: rough reads as a downgrade here",
                "That the startup's prices are well above its rivals' prices",
                "That the city's market has room for only one app",
              ],
              answer: 1,
              explanation:
                "Where the alternative already scores high, a rough product scores below it, so nobody tolerates its failures. The launch measured polish, not whether the idea has an edge.",
            },
            {
              kind: "mcq",
              prompt:
                "Why is Signal's stall in 2021 a weak argument for building an MDP instead of an MVP?",
              options: [
                "Signal launched as an MDP and still grew steadily",
                "WhatsApp withdrew its policy before people could leave",
                "Its gap was where people's contacts were, not polish",
                "Signal never tried to attract WhatsApp's users",
              ],
              answer: 2,
              explanation:
                "By the instructor's own account, Signal matched WhatsApp. For the job of messaging the people you talk to, an app they are not on scores low, a network effect that no amount of polish closes.",
            },
          ],
        },
        {
          slug: "pm-mvp-to-mdp",
          title: "From MVP to a product people keep",
          summary:
            "Read adoption, engagement and retention with the right denominators, then fix what breaks the core job before adding requests.",
          contentFile: "pm-mvp-to-mdp.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "An MVP is offered to 640 owners and 160 set it up. A dashboard reports adoption as 13%. What most likely happened?",
              options: [
                "It divided by all 1,200 owners, not the 640 reached",
                "It counted only owners who paid, not all who set up",
                "It measured in month three instead of month one",
                "It left out owners who had set up more than one tenant",
              ],
              answer: 0,
              explanation:
                "160 of 1,200 is 13% and 160 of 640 is 25%. The denominator decides the number, so divide by the people who actually saw the offer and say which one you used.",
            },
            {
              kind: "predict",
              prompt:
                "An MVP's retention, measured as returning users over all users, rises from 40% to 60% in a month when signups fell by half. What does that most likely show?",
              options: [
                "Retention improved, so recent changes are working",
                "New users engaged more deeply than earlier ones",
                "Fewer new users in the mix, not better retention",
                "The product has now reached product-market fit",
              ],
              answer: 2,
              explanation:
                "New users are never returning users, so fewer signups raise the ratio with nobody staying longer. Measure retention within a group that started together.",
            },
            {
              kind: "mcq",
              prompt:
                "Owners who left the rent tool asked for two things: electricity bill splitting, and a fix for reminders that never arrived. Which belongs in the next version?",
              options: [
                "Both, since users who left show what was missing",
                "The reminder fix, since it breaks the core job",
                "Neither, since only users who stayed should decide",
                "Bill splitting, since more of those owners asked",
              ],
              answer: 1,
              explanation:
                "Requests from users who left are not all alike. A failure in the core job is a leak worth fixing; bill splitting is a different job, however real the pain.",
            },
          ],
        },
      ],
    },
  ],
}
