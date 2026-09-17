import type { SectionSeed } from "../../types"

export const sdInterviewFramework: SectionSeed = {
  slug: "sd-interview-framework",
  title: "A framework for the interview",
  description:
    "The four steps: scope the problem, propose a high-level design, go deep where it matters, and wrap up.",
  badgeIcon: "🧭",
  badgeTitle: "Framework",
  units: [
    {
      slug: "the-four-steps",
      title: "The four steps",
      description: "Scope, blueprint, deep dive, close.",
      lessons: [
        {
          slug: "sd-step-1-scope",
          title: "Step 1: scope the problem",
          summary:
            "Why answering immediately is the mistake, which questions change the architecture, and what to do when the interviewer hands the question back.",
          contentFile: "sd-step-1-scope.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does answering a vague question immediately read badly?",
              options: [
                "It suggests you have not practiced enough questions",
                "Either you memorized a design, which tests nothing, or you build without knowing the purpose",
                "It leaves no time for the deep dive",
                "Interviewers are required to deduct points for it",
              ],
              answer: 1,
              explanation:
                "The session simulates two colleagues negotiating an ambiguous problem into a solvable one. Asking good questions is the skill being watched, because it is the part of the exercise that most resembles the job.",
            },
            {
              kind: "mcq",
              prompt: "What makes a clarifying question worth asking?",
              options: [
                "It covers a feature the product obviously needs",
                "Its answer would change the architecture",
                "It demonstrates familiarity with the product",
                "It can be answered with a number",
              ],
              answer: 1,
              explanation:
                "A question whose answer does not move the design is time you do not have. Scope, scale, read-to-write ratio and the existing stack all qualify; so does explicitly naming what you are excluding.",
            },
            {
              kind: "predict",
              prompt:
                "You know the scale (10 million DAU) and the features (post and view a feed). What do you still most need to know?",
              options: [
                "The average post size",
                "The maximum follower count of a single account",
                "Whether the client is web or mobile",
                "The retention period for posts",
              ],
              answer: 1,
              explanation:
                "Fanout distribution decides whether the architecture works. A 5,000 maximum means you can write into every follower's feed at post time; 40 million means that same write is 40 million writes and you need a hybrid. After scope and scale, ask what the distribution looks like, because averages hide the case that breaks the design.",
            },
          ],
        },
        {
          slug: "sd-step-2-high-level",
          title: "Step 2: the blueprint",
          summary:
            "Boxes and flows, checking them against your own numbers, and walking one concrete request through to find what the diagram hides.",
          contentFile: "sd-step-2-high-level.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why draw publishing and reading as two separate diagrams?",
              options: [
                "They run on separate infrastructure",
                "Two simple diagrams are legible where one combined diagram is not",
                "The interviewer will only look at one",
                "Reading is always the more important flow",
              ],
              answer: 1,
              explanation:
                "A diagram trying to be both ends up legible as neither. Separating the flows also makes it easier to walk a concrete request through one of them, which is the cheapest way to find gaps.",
            },
            {
              kind: "mcq",
              prompt: "When are API signatures and schemas appropriate at the high-level step?",
              options: [
                "Always, since they make the design concrete",
                "Never, since this step is about components",
                "It depends on the problem's size, and when unsure you ask",
                "Only for data-heavy systems",
              ],
              answer: 2,
              explanation:
                'For "design Google search" they are noise; for a multiplayer poker backend the API is most of the design. Asking which the interviewer wants is a fifteen-second question that can save ten minutes of work in the wrong direction.',
            },
            {
              kind: "predict",
              prompt:
                "After your blueprint, the interviewer asks what happens if the cache goes down. How should you read that?",
              options: [
                "As criticism of a gap you should defend",
                "As an invitation: they are choosing the deep dive",
                "As a request to remove the cache from the design",
                "As a signal that the blueprint is rejected",
              ],
              answer: 1,
              explanation:
                "They have picked the failure mode of a component you drew. The full answer is that the database is provisioned for the cached workload and a cold cache sends it perhaps a hundred times its load, plus what you would do: a cache tier spread across nodes and data centers, and request coalescing. Defensiveness here reads as stubbornness, a named red flag.",
            },
          ],
        },
        {
          slug: "sd-step-3-deep-dive",
          title: "Step 3: the deep dive",
          summary:
            "Picking the component where your own estimate was uncomfortable, and the test for whether a detail is worth the clock.",
          contentFile: "sd-step-3-deep-dive.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What is the test for whether a detail deserves deep-dive time?",
              options: [
                "Whether you know it well",
                "Whether it changes the architecture, the failure behavior, or the cost",
                "Whether it appears in the original question",
                "Whether it can be drawn on the board",
              ],
              answer: 1,
              explanation:
                "Sharding strategy changes all three. A ranking function changes none, and can be a box with one sentence about being pluggable. Getting absorbed in a minor component is a prioritization error, which is much of what the exercise measures.",
            },
            {
              kind: "mcq",
              prompt: "Why is silence expensive during the deep dive?",
              options: [
                "It wastes limited time",
                "Reasoning that cannot be heard cannot be assessed, and a pause reads as being stuck",
                "The interviewer will change the question",
                "It suggests you are memorizing rather than thinking",
              ],
              answer: 1,
              explanation:
                "Narrating the options you reject and why is the cheapest signal available: one sentence can show two approaches, the tradeoff between them, and a decision.",
            },
            {
              kind: "predict",
              prompt:
                "Mid deep dive, you realize your sharding key makes the most common query a scatter-gather. What is the best move?",
              options: [
                "Continue, since changing course wastes time",
                "Say it immediately and name the fix and its cost",
                "Wait to see whether the interviewer raises it",
                "Restart the design with a different key",
              ],
              answer: 1,
              explanation:
                "The interviewer has probably already seen it, so the choice is between showing that you catch your own mistakes and showing that you do not. Naming the problem, the fix and its cost takes ninety seconds, and a design revised under scrutiny is more convincing than one never examined.",
            },
          ],
        },
        {
          slug: "sd-step-4-wrap-up",
          title: "Step 4: wrap up",
          summary:
            "Never claiming the design is finished, and the five things worth covering in the last five minutes.",
          contentFile: "sd-step-4-wrap-up.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why never say the design has no weaknesses?",
              options: [
                "Every design has a fixed number of known weaknesses",
                "A design with none is one nobody examined, so the claim reads as inexperience or unwillingness to look",
                "The interviewer is required to find one",
                "It shortens the session",
              ],
              answer: 1,
              explanation:
                "Naming the real bottleneck, with how confident you are about it, is more useful than any additional component. It is also the question a senior interviewer most wants answered.",
            },
            {
              kind: "mcq",
              prompt: "Why is a slow dependency worth calling out separately from a dead one?",
              options: [
                "Slow dependencies are more common",
                "A dead one fails fast, while a slow one exhausts your connection pool and takes you down with it",
                "Slow dependencies cannot be detected by health checks",
                "They are billed differently",
              ],
              answer: 1,
              explanation:
                "It is the harder failure case and the one candidates skip. It is the same reasoning as the load balancer lesson, where a server that is slow but answering health checks is worse than one that is plainly down.",
            },
            {
              kind: "predict",
              prompt:
                "At the wrap-up you know of a single point of failure in the write path that never came up. Raise it or not?",
              options: [
                "Raise it, with a fix attached",
                "Leave it, since mentioning a flaw at the end is a poor final impression",
                "Leave it unless asked directly",
                "Raise it only if there is time to redesign",
              ],
              answer: 0,
              explanation:
                "There are two cases: they saw it, in which case silence reads as missing or hiding it; or they did not, in which case you have shown you audit your own designs. Stated as a bottleneck with a fix and its cost, it is the wrap-up doing its job.",
            },
          ],
        },
      ],
    },
    {
      slug: "interview-craft",
      title: "Interview craft",
      description:
        "Where the time goes, what else is being assessed, and the behaviors that cost offers.",
      lessons: [
        {
          slug: "sd-interview-craft",
          title: "Time, signals and red flags",
          summary:
            "The 45-minute shape, the four things assessed besides design skill, and why over-engineering is the red flag the books name first.",
          contentFile: "sd-interview-craft.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What is the shape of a well-run 45-minute session?",
              options: [
                "Four roughly equal quarters",
                "A short opening, a medium blueprint, a long deep dive, a short close",
                "A long opening to get the requirements exactly right, then a quick design",
                "A quick design, then the rest of the time on the deep dive",
              ],
              answer: 1,
              explanation:
                "Roughly 3 to 10, 10 to 15, 10 to 25, and 3 to 5 minutes. The two common failures are twenty minutes of clarifying questions with nothing designed, and skipping scope entirely and designing the wrong system well.",
            },
            {
              kind: "mcq",
              prompt: "Why is over-engineering the red flag the books name first?",
              options: [
                "It takes the most interview time",
                "It signals optimizing for design purity over cost, which is a real production failure",
                "It usually indicates memorized answers",
                "It makes the design hard to draw",
              ],
              answer: 1,
              explanation:
                "Kubernetes, a service mesh and CQRS for a thousand users is the classic instance. The strong move is to propose something simple and name the threshold that would make you reach for more.",
            },
            {
              kind: "predict",
              prompt:
                "Thirty minutes in, you realize the design cannot meet the write throughput you estimated. What is the best response?",
              options: [
                "Start over with a design that can",
                "Continue, since there is no time to change course",
                "Name the flaw, locate it, propose the fix and its cost, without rebuilding",
                "Revise the estimate so the design fits",
              ],
              answer: 2,
              explanation:
                "Four sentences showing you can find an answer under time pressure beats a correct design showing you knew one. Rebuilding ends with an unfinished second design and no wrap-up, which is strictly worse.",
            },
          ],
        },
      ],
    },
  ],
}
