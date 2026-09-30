import type { SectionSeed } from "../../types"

export const pmVoiceOfCustomer: SectionSeed = {
  slug: "pm-voice-of-customer",
  title: "Voice of the customer",
  description:
    "Where customer feedback lives, how to turn a pile of it into a ranked list of problems, and how to find the real problem under a request.",
  badgeIcon: "📣",
  badgeTitle: "Listener",
  units: [
    {
      slug: "listening",
      title: "Listening at scale",
      description:
        "Where feedback comes from, who each channel lets speak, and how to rank what it says.",
      lessons: [
        {
          slug: "pm-feedback-sources",
          title: "Where feedback lives",
          summary:
            "Feedback channels sort into asked, volunteered and observed, and each one lets a different group of customers speak.",
          contentFile: "pm-feedback-sources.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Which family of feedback channels covers every student, including those who never write in, but cannot tell you why they acted?",
              options: [
                "Asked channels, such as interviews and surveys",
                "Volunteered channels, such as support and reviews",
                "Observed channels, such as product analytics",
                "Owner notes gathered by the operations team",
              ],
              answer: 2,
              explanation:
                "Analytics records what every searcher did, whether or not they chose to speak, but behavior carries no reason. That is why an observed signal is paired with an asked channel that explains it.",
            },
            {
              kind: "predict",
              prompt:
                "Roost's Play Store ratings this month are mostly fives and ones, with very few threes. Before treating them as a measure of how students feel, what should you expect?",
              options: [
                "They over-represent the strongest experiences",
                "They are a fair sample of the students who booked",
                "They under-represent students who had a bad stay",
                "They mostly come from students who never booked",
              ],
              answer: 0,
              explanation:
                "Hu, Pavlou and Zhang traced the J shape of online ratings to self-selection: only buyers review, and people with middling experiences rarely bother. The average of such ratings is a biased estimate of how customers feel.",
            },
            {
              kind: "mcq",
              prompt:
                "41 one-star reviews say photos do not match rooms, but support has only 38 photo complaints in 2,100 messages. The founder wants to hide 300 old-photo listings. What should happen first?",
              options: [
                "Hide the 300 listings until the owners reshoot them",
                "Survey every student about photo quality this week",
                "Ignore the reviews, because support messages barely mention photos",
                "Compare cancellations on old-photo listings with the rest",
              ],
              answer: 3,
              explanation:
                "Reviews are a volunteered channel tilted toward angry writers, so the claim needs checking in behavior that covers every student. If old-photo listings cancel no more often than the rest, the problem is a few named listings, not old photos in general.",
            },
          ],
        },
        {
          slug: "pm-synthesizing-feedback",
          title: "From a pile of feedback to a ranked list",
          summary:
            "Sample, tag, count, segment and weight a month of feedback, because how often something is said is not how much it matters.",
          contentFile: "pm-synthesizing-feedback.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "The video reports that 50% of users mention trouble finding products with search. What does the lesson say to ask before acting on that number?",
              options: [
                "Whether search is a bug or a usability issue",
                "What group the 50% is a share of",
                "How many engineers the search fix will need",
                "Whether the complaints came from power users",
              ],
              answer: 1,
              explanation:
                "Half of the people who wrote in is half of a group the channel chose, not half of all users. To size the problem, find it in behavior across everyone.",
            },
            {
              kind: "predict",
              prompt:
                "Slow photos get 41 mentions and wrong distances get 36. A slow photo is an annoyance; a wrong distance usually costs the student the room. With severity weights of 3, 2 and 1, how do the two rank?",
              options: [
                "Photos first, since they have more mentions",
                "Level, since the two counts are close",
                "Photos first, since slowness affects everyone",
                "Distance first, 108 against 41",
              ],
              answer: 3,
              explanation:
                "Weighted, distance scores 36 × 3 = 108 and photos 41 × 1 = 41. Griffin and Hauser found that frequency of mention is a poor stand-in for importance, which is why raw counts get weighted by severity.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does the lesson have two people tag the same 50 feedback items before anyone trusts the tags?",
              options: [
                "One coder catches only about half of the needs",
                "Two coders finish the sample twice as fast",
                "Tags from one person cannot be counted by type",
                "The video requires two reviewers for each basket",
              ],
              answer: 0,
              explanation:
                "Griffin and Hauser found that a single analyst identified 54% of customer needs on average, and the expert scored at the low end. Comparing two taggers exposes what each one missed.",
            },
          ],
        },
      ],
    },
    {
      slug: "finding-the-problem",
      title: "Finding the real problem",
      description:
        "Turning requests into needs, tracing a complaint to its root cause, and writing the problem down.",
      lessons: [
        {
          slug: "pm-requests-are-solutions",
          title: "Every request is a solution in disguise",
          summary:
            "Customers and colleagues hand you solutions. Three questions about what they were doing recover the need underneath.",
          contentFile: "pm-requests-are-solutions.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "A returning student asks Roost for a filter that shows only PGs with a gym. Following the lesson, what do you ask first?",
              options: [
                "Would you pay more rent for a PG with a gym?",
                "How many of your friends would use a gym filter?",
                "Which gym brands should the filter include?",
                "What were you trying to do when you wanted it?",
              ],
              answer: 3,
              explanation:
                "Asking about the activity behind the request, not the feature, finds the need. The answer might be staying fit on a budget, which a gym filter is only one way to serve.",
            },
            {
              kind: "mcq",
              prompt:
                "By Griffin and Hauser's definition, which of these is a customer need rather than a solution?",
              options: [
                "Show a map view on every listing",
                "Know how long the walk to class takes",
                "Add a sort-by-distance option to search",
                "Put the nearest bus stop on each card",
              ],
              answer: 1,
              explanation:
                "A need describes the benefit wanted, in the customer's words, and names no feature. The other three are ways to deliver that benefit, and each could be the wrong one.",
            },
            {
              kind: "mcq",
              prompt:
                "Some owners already send every student a Google Maps pin on WhatsApp. What does the lesson say this workaround tells you?",
              options: [
                "Owners want Roost to build a chat feature",
                "Owners are trying to move bookings off Roost",
                "Owners have tested a design worth copying",
                "Roost should block contact details in chat",
              ],
              answer: 2,
              explanation:
                "Von Hippel's lead users build their own fixes ahead of the market. A workaround already in use is evidence that the solution a customer describes may be the right one.",
            },
          ],
        },
        {
          slug: "pm-root-cause",
          title: "Finding the root cause",
          summary:
            "List hypotheses across technology, UX, operations and the outside world, eliminate them with data, then ask why down the one left standing.",
          contentFile: "pm-root-cause.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                'Cancellations for "farther than shown" are rising. You check 60 listings and the distance math matches every pin. Which hypothesis does that result reject?',
              options: [
                "The distance calculation is wrong",
                "Owners set their pins in the wrong place",
                "Verification visits never check pins",
                "Students misread the distance label",
              ],
              answer: 0,
              explanation:
                "If the math matches the pin, the calculation is fine and the error sits in the pin itself. Each test should kill or keep one named hypothesis.",
            },
            {
              kind: "mcq",
              prompt:
                'A five-whys chain ends at "owners are careless with pins". What does the lesson say is wrong with stopping there?',
              options: [
                "The chain has not reached five whys yet",
                "Owners will leave if Roost blames them",
                "It stops at a person, not at the form",
                "Carelessness cannot be measured in data",
              ],
              answer: 2,
              explanation:
                "An answer that ends at a person fixes nothing, because the next owner makes the same mistake. Asking why the form let owners keep a wrong pin leads to a fix.",
            },
            {
              kind: "predict",
              prompt:
                "Complaints rise only in Hyderabad. A release shipped to all three cities the week before. What does that pattern suggest about the release?",
              options: [
                "It is the likeliest cause, being the most recent change",
                "It is unlikely the origin, since it reached every city",
                "It should be rolled back before testing anything else",
                "It explains the rise only if Hyderabad updated first",
              ],
              answer: 1,
              explanation:
                "A cause must vary where the effect varies. A change made everywhere cannot, alone, explain a rise in one city, unless it touched something only that city uses.",
            },
          ],
        },
        {
          slug: "pm-problem-statements",
          title: "Writing the problem down",
          summary:
            "Who struggles, with what, in what circumstance, at what cost, and no solution inside. Then a how-might-we question sized to the cycle.",
          contentFile: "pm-problem-statements.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which of these is a problem statement rather than a solution?",
              options: [
                "Owners need an address search in the listing form",
                "First-years cannot trust a listing's distance",
                "Students lack a map view on every listing page",
                "Roost needs a verified-location badge on each listing",
              ],
              answer: 1,
              explanation:
                "The others each name a feature, and a missing map has only one fix: a map. A problem statement names who struggles with what, and leaves room for several fixes.",
            },
            {
              kind: "mcq",
              prompt:
                'Procter & Gamble\'s team asked "How can we make a better green-stripe bar?" and every copy lost to Irish Spring. What was wrong with the question?',
              options: [
                "It was too broad to generate useful ideas",
                "It named the wrong competitor to beat",
                "It ignored what the soap should cost",
                "It had the answer built into it",
              ],
              answer: 3,
              explanation:
                'The question already assumed a green-stripe bar, so every idea was a copy. Basadur\'s "How might we create a more refreshing soap of our own?" opened the space that led to Coast.',
            },
            {
              kind: "predict",
              prompt:
                'A four-week cycle. "How might we help first-years judge the commute?" covers more requests; "How might we make each listing\'s location match the building?" covers the 110 cancellations. Which goes on the cycle?',
              options: [
                "Location, since commute features rely on it",
                "Commute, since it holds the larger opportunity",
                "Commute, since it has more requests behind it",
                "Location, since it needs the least design work",
              ],
              answer: 0,
              explanation:
                "Most commute fixes are computed from the listing's location, which was wrong on 44 of 60 cancelled listings. The narrow question also fits four weeks, has a baseline, and still admits several fixes.",
            },
          ],
        },
      ],
    },
  ],
}
