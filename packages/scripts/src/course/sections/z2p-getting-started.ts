import type { SectionSeed } from "../types"

export const z2pGettingStarted: SectionSeed = {
  slug: "z2p-getting-started",
  title: "Getting started (ch. 1-2)",
  description: "Toolchain, CI, and the newsletter's user stories.",
  badgeIcon: "🚀",
  badgeTitle: "Liftoff",
  units: [
    {
      slug: "the-brief",
      title: "The brief",
      description: "Cloud-native constraints, and the newsletter's user stories.",
      lessons: [
        {
          slug: "gs-cloud-native-constraints",
          title: "What cloud-native forces on you",
          summary:
            "High availability, zero-downtime releases, dynamic workloads, and their architectural fallout.",
          contentFile: "gs-cloud-native-constraints.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Which of these is NOT one of the book's three expectations of a cloud-native application?",
              options: [
                "High availability while running in fault-prone environments",
                "Releasing new versions with zero downtime",
                "Handling dynamic workloads",
                "Guaranteed sub-millisecond response times",
              ],
              answer: 3,
              explanation:
                "The three expectations (paraphrasing Cornelia Davis) are availability, zero-downtime releases, and dynamic workloads. Latency targets are a per-service choice, not part of the definition.",
            },
            {
              kind: "predict",
              prompt:
                "The prototype stores subscribers in a file on local disk, and you run three replicas behind a load balancer. A visitor subscribes. What does the system now know?",
              options: [
                "All three replicas see the subscriber; the balancer syncs their disks",
                "Only the replica that served the POST knows, and even that dies with the next deploy",
                "The POST fails, because cloud instances have read-only filesystems",
                "It works fine as long as sessions are sticky, so the design is sound",
              ],
              answer: 1,
              explanation:
                "Each replica has its own filesystem, so state diverges, and a deploy replaces the container, disk included. Sticky sessions only hide the problem until an instance is replaced. This is why persistence moves to a database.",
            },
            {
              kind: "mcq",
              prompt:
                "You cannot attach a debugger to a production replica. What does the book propose instead?",
              options: [
                "SSH into the machine and read stdout",
                "Instrument the application to emit logs, traces, and metrics",
                "Reproduce every bug locally before touching production",
                "Run a debug build in production",
              ],
              answer: 1,
              explanation:
                "With N replicas behind a balancer you may not even know which instance failed. Observability means inferring internal state from what the app emits; the Telemetry section (ch. 4) builds exactly that.",
            },
          ],
        },
        {
          slug: "gs-user-stories",
          title: "The newsletter and its three user stories",
          summary:
            "Problem-based learning, the scope line, and iterations that always ship a usable slice.",
          contentFile: "gs-user-stories.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Under problem-based learning as the book frames it, what makes a technique worth introducing?",
              options: [
                "It appears next in the language reference",
                "It moves the driving problem closer to solved, which also teaches when to reach for it",
                "It is currently popular in the ecosystem",
                "It is a prerequisite for the certification exam",
              ],
              answer: 1,
              explanation:
                "The problem drives the material: a technique shows up when the newsletter needs it, so you learn the technique and the situation that calls for it together.",
            },
            {
              kind: "mcq",
              prompt: "Which of these is explicitly OUT of scope for the newsletter service?",
              options: [
                "A visitor subscribing to the newsletter",
                "The author sending an issue to all subscribers",
                "Segmenting subscribers into multiple audiences",
                "A subscriber unsubscribing",
              ],
              answer: 2,
              explanation:
                "The three user stories draw the line; segmenting, managing multiple newsletters, and open/click tracking are all named non-goals. Barebone, yet enough for most blog authors.",
            },
            {
              kind: "predict",
              prompt:
                "Each iteration is a fixed time box that ships a small feature. Which corner does the book permit cutting inside an iteration?",
              options: [
                "Tests",
                "Documentation",
                "Feature scope",
                "The production deploy at the end",
              ],
              answer: 2,
              explanation:
                "The book iterates on product features, not engineering quality: every iteration's code is tested, documented, and goes to production. Only the size of the slice shrinks.",
            },
          ],
        },
      ],
    },
    {
      slug: "repo-and-roadmap",
      title: "Repo and roadmap",
      description: "The zero2prod repository, and the checklist the track will complete.",
      lessons: [
        {
          slug: "gs-zero2prod-repo",
          title: "The zero2prod repository",
          summary: "cargo new, then the Part 1 CI checks on from commit zero, and why that order.",
          contentFile: "gs-zero2prod-repo.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why does the book stand up the CI pipeline before the first line of application code?",
              options: [
                "CI providers only initialise correctly on fresh repositories",
                "On an empty project every check passes trivially, the warning count never climbs, and the trunk stays releasable for each iteration's deploy",
                "clippy cannot be enabled once dependencies exist",
                "To keep the first commit as small as possible",
              ],
              answer: 1,
              explanation:
                "Retrofitting means arguing with accumulated warnings; starting at zero keeps the count there. And since every iteration ends in a production deploy, main must be releasable at all times, which the pipeline enforces.",
            },
            {
              kind: "predict",
              prompt:
                "Months in, CI turns red one morning although nobody has pushed since yesterday's green run. Which check is the likely culprit?",
              options: [
                "cargo fmt -- --check",
                "cargo audit",
                "cargo test",
                "cargo clippy -- -D warnings",
              ],
              answer: 1,
              explanation:
                "audit compares Cargo.lock against the RustSec advisory database, which moves without you: a new advisory against an old pinned dependency fails today's run on yesterday's code. The other checks are functions of the repo and toolchain alone.",
            },
            {
              kind: "mcq",
              prompt:
                'The book prints edition = "2021", but cargo new wrote edition = "2024" for you. What must you change?',
              options: [
                "Downgrade to 2021, or the book's code will not compile",
                "Nothing: editions are per-crate switches, and crates on different editions link freely",
                "Pin a 2021-era toolchain with rustup",
                "List both editions in Cargo.toml",
              ],
              answer: 1,
              explanation:
                "From \"Crates, editions, workspaces\": an edition changes surface syntax and defaults for one crate, not the ecosystem's compatibility. The track's code runs on either edition.",
            },
          ],
        },
        {
          slug: "gs-production-ready-map",
          title: "The production-ready checklist",
          summary: "Where the track is heading, each item mapped to the section that builds it.",
          contentFile: "gs-production-ready-map.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which pairing of cloud-native constraint to later section is correct?",
              options: [
                "Zero-downtime releases: zero-downtime migrations in Confirmation emails (ch. 7)",
                "Fault-prone environments: the axum port",
                "Dynamic workloads: Error handling (ch. 8)",
                "Observability: Securing the API (ch. 10)",
              ],
              answer: 0,
              explanation:
                "During a rolling deploy, old and new versions run side by side against one database, so ch. 7 stages schema changes to hold for both. Fault tolerance lands in ch. 11 and observability in ch. 4.",
            },
            {
              kind: "predict",
              prompt:
                "The naive delivery loop crashes at subscriber 5,000 of 10,000, and the author clicks send again. Without further machinery, what happens, and which section fixes it?",
              options: [
                "The first 5,000 receive the issue twice; Fault-tolerant workflows (ch. 11)",
                "Delivery resumes at subscriber 5,001; nothing needs fixing",
                "The email provider deduplicates the messages; nothing needs fixing",
                "The second send is rejected as a duplicate; Securing the API (ch. 10)",
              ],
              answer: 0,
              explanation:
                "The naive loop keeps no record of progress, so a retry re-sends to everyone it already reached. Ch. 11's idempotency keys and background workers are what make retrying safe.",
            },
            {
              kind: "mcq",
              prompt:
                "Ch. 6 makes an invalid subscriber name unrepresentable in the type system. Which Part 1 lesson planted that idea?",
              options: [
                "Enums: one of several shapes",
                "Slices: borrowing a view",
                "Drop: deterministic cleanup",
                "cargo, the front door",
              ],
              answer: 0,
              explanation:
                "That lesson argued for modelling so invalid combinations cannot be constructed at all. Type-driven validation applies it to raw user input: parse once at the boundary into a type that cannot hold garbage.",
            },
          ],
        },
      ],
    },
  ],
}
