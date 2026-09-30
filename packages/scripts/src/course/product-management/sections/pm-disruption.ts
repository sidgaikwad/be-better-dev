import type { SectionSeed } from "../../types"

export const pmDisruption: SectionSeed = {
  slug: "pm-disruption",
  title: "Disruptive innovation",
  description:
    "Christensen's theory of how cheap, simple upstarts displace leaders, the ways the word is misused, why incumbents see it coming and lose anyway, and how new products spread.",
  badgeIcon: "⚡",
  badgeTitle: "Disruptor",
  units: [
    {
      slug: "the-theory",
      title: "The theory, used properly",
      description: "What Christensen meant by disruption, and how to tell it from a strong rival.",
      lessons: [
        {
          slug: "pm-disruption-theory",
          title: "How disruption actually works",
          summary:
            "Sustaining versus disruptive innovation, the two footholds, and why overshoot lets a worse product win.",
          contentFile: "pm-disruption-theory.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What makes an innovation disruptive in Christensen's sense?",
              options: [
                "It uses newer technology than anything the incumbents sell",
                "It starts out worse, in a market incumbents choose to skip",
                "It grows faster than incumbents by winning their best customers",
                "It changes customer habits so much that the old market disappears",
              ],
              answer: 1,
              explanation:
                "Disruption starts with overserved customers or nonconsumers, on a product the mainstream finds inferior. New technology and fast growth are neither necessary nor sufficient.",
            },
            {
              kind: "predict",
              prompt:
                "Mainstream customers need 100 units of performance, and the need grows 10% a year. An entrant supplies 50 units, improving 21% a year. Roughly when is the entrant good enough for the mainstream?",
              options: [
                "In about 3 years",
                "In about 5 years",
                "In about 7 years",
                "Never, since the need keeps growing",
              ],
              answer: 2,
              explanation:
                "Solve 50 × 1.21^t = 100 × 1.10^t: the ratio 1.21 / 1.10 is 1.1, so 1.1^t = 2 and t = 0.693 / 0.095, about 7.3 years. A growing need only delays the crossing while the entrant improves faster.",
            },
            {
              kind: "predict",
              prompt:
                "A rival lists ₹4,000 rooms that Roost skips; each such property earns Roost a third as much per verification visit as an average room. Absent a deliberate choice, what does the theory predict Roost's managers will do?",
              options: [
                "Cede the cheap rooms and keep moving toward richer bookings",
                "Cut commission everywhere to hold every price segment at once",
                "Buy the rival quickly, before it reaches Roost's core market",
                "Copy the rival's photo checks for every listing right away",
              ],
              answer: 0,
              explanation:
                "Good resource allocation funds the higher-margin core and treats the low end as not worth defending. That sound decision, repeated each year, is what leaves room for the entrant to improve.",
            },
          ],
        },
        {
          slug: "pm-disruption-misused",
          title: "What disruption is not",
          summary:
            "Sorting the video's 'disruptive' examples by the theory's own test, and what the critics got right.",
          contentFile: "pm-disruption-misused.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "A ride service launches in a city with plentiful, regulated taxis, aimed at people who already take taxis, and riders rate it better than a taxi. By the theory's test, what is it?",
              options: [
                "A low-end disruption of the taxi business",
                "A new-market disruption of the taxi business",
                "Disruptive, because it is growing so quickly",
                "A sustaining innovation relative to taxis",
              ],
              answer: 3,
              explanation:
                "It starts in the mainstream with a better product, the reverse of a low-end or new-market foothold. This is the 2015 HBR article's case for calling Uber sustaining, however fast it grew.",
            },
            {
              kind: "mcq",
              prompt: "Why does it matter whether a rival is labeled disruptive or sustaining?",
              options: [
                "The label picks the response: fight head-on, or build a separate business",
                "Only disruptive rivals need a response; sustaining ones fade on their own",
                "Investors value disruptive firms higher, so the label mostly shifts funding",
                "Sustaining rivals are startups, while disruptive ones are incumbents",
              ],
              answer: 0,
              explanation:
                "Incumbents usually win a head-on fight for their core customers, so a sustaining attack is met in the core. A disruptive one cannot be matched without accepting lower margins, which is why it needs a different structure.",
            },
            {
              kind: "mcq",
              prompt:
                "What did King and Baatartogtokh find when they asked experts about the 77 cases Christensen and Raynor had cited?",
              options: [
                "Most cases fit the theory once experts had the full facts",
                "The theory had predicted the winner in about half the cases",
                "Only 7 cases showed all four elements the theory requires",
                "The cases fit, but the incumbents survived in most of them",
              ],
              answer: 2,
              explanation:
                "Only 7 of 77, about 9%, showed incumbents on a sustaining path, overshooting, able to respond, and foundering anyway. The mechanism is real, but its range is much narrower than its fame.",
            },
          ],
        },
      ],
    },
    {
      slug: "incumbents-and-adoption",
      title: "Incumbents and adoption",
      description: "Why leaders lose to what they can see coming, and how a new product spreads.",
      lessons: [
        {
          slug: "pm-innovators-dilemma",
          title: "Why good companies lose",
          summary:
            "Why rational budgeting starves the disruptive business, and why a separate unit is the usual answer.",
          contentFile: "pm-innovators-dilemma.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Kodak led US digital camera sales in 2005 and still filed for bankruptcy in 2012. What is the lesson's explanation?",
              options: [
                "Its engineers never got a working digital camera built in time",
                "Its managers ignored digital until rivals owned the whole market",
                "Digital sold well but could not earn what film had earned",
                "Regulators slowed its move from chemical film into electronics",
              ],
              answer: 2,
              explanation:
                "Kodak did not miss digital; film paid on every roll, and a digital camera sold once. That is the dilemma: the new business was real but could never match the old one's economics.",
            },
            {
              kind: "predict",
              prompt:
                "A new product would add 7% of next year's growth target; a core improvement would add 40%. Both estimates are fair. If the new product must win its budget in the same RICE ranking every quarter, what happens?",
              options: [
                "It wins eventually, because its growth rate is higher",
                "It loses every round, even if it is the market's future",
                "It wins once the team corrects its estimates for bias",
                "It loses only until leadership notices the rival's growth",
              ],
              answer: 1,
              explanation:
                "Small new markets always lose to the core on this year's numbers, and the same arithmetic repeats each quarter. That is why the disruptive business needs its own budget and measures.",
            },
            {
              kind: "mcq",
              prompt:
                "What does an ambidextrous organization, in O'Reilly and Tushman's sense, look like?",
              options: [
                "Every team splits its working week between core work and new ideas",
                "A 20% time policy that lets engineers choose side projects",
                "An innovation lab that hands finished ideas to core teams",
                "Separate units with their own processes, joined at the top",
              ],
              answer: 3,
              explanation:
                "The new business gets its own structure, processes and culture, and meets the core only in senior leadership. Side-project time produces ideas, but it does not protect a budget from the core's planning.",
            },
          ],
        },
        {
          slug: "pm-crossing-the-chasm",
          title: "How new products spread",
          summary:
            "Rogers' adopter categories, Moore's chasm, and why a pilot with enthusiasts overstates the mainstream.",
          contentFile: "pm-crossing-the-chasm.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Where do Rogers' adopter percentages, 2.5, 13.5, 34, 34 and 16, come from?",
              options: [
                "Bands of standard deviations on a normal curve of adoption time",
                "Counts of adopters in Ryan and Gross's Iowa hybrid corn study",
                "An average of the adoption data in hundreds of diffusion studies",
                "Moore's surveys of business technology buyers in the 1980s",
              ],
              answer: 0,
              explanation:
                "The categories are defined by distance from the mean adoption time, so the percentages follow from the normal curve by construction. A real product's adopters can be skewed, so measure your own.",
            },
            {
              kind: "predict",
              prompt:
                "A feature piloted with 500 users recruited from a startup meetup reaches 50% adoption. Your records show 10% of your 20,000 users join betas. What is the best-supported plan?",
              options: [
                "Plan for about 10,000 users, the pilot's rate",
                "Plan for about 1,600, the pilot's rate on Rogers' 16%",
                "Plan for about 2,000, every user who joins betas",
                "Plan for about 1,000, then test a random sample",
              ],
              answer: 3,
              explanation:
                "The pilot measured enthusiasts, and your own data says 2,000 users behave like them; 50% of 2,000 is 1,000. For everyone else there is no evidence yet, so test ordinary users before spending on them.",
            },
            {
              kind: "mcq",
              prompt: "What does Moore's chasm add to Rogers' adoption curve?",
              options: [
                "That laggards never adopt, however mature the product gets",
                "That early adopters make poor references for pragmatists",
                "That innovators are 2.5% of any market across industries",
                "That adoption follows an S-curve, not a straight line",
              ],
              answer: 1,
              explanation:
                "Rogers drew one smooth curve; Moore argued that visionaries and pragmatists buy for different reasons, so the first group's enthusiasm does not carry the second. The chasm sits between them.",
            },
          ],
        },
      ],
    },
  ],
}
