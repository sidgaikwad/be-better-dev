import type { SectionSeed } from "../../types"

export const sdScalingJourney: SectionSeed = {
  slug: "sd-scaling-journey",
  title: "From one server to many",
  description:
    "The first splits a growing system makes: a separate data tier, a load balancer in front of the web tier, and replicas behind the database.",
  badgeIcon: "🏗️",
  badgeTitle: "Scaling",
  units: [
    {
      slug: "the-single-box",
      title: "The single box",
      description: "Where every system starts, and the first thing it outgrows.",
      lessons: [
        {
          slug: "sd-request-path",
          title: "The path a request takes",
          summary: "DNS, IP, HTTP, response: name every hop before you try to scale any of them.",
          contentFile: "sd-request-path.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which hop in the request path is normally not run by you?",
              options: [
                "The HTTP request to the web server",
                "DNS resolution of the domain name",
                "The JSON serialization of the response",
                "The database query behind the page",
              ],
              answer: 1,
              explanation:
                "DNS is almost always a paid third-party service. That is worth remembering for a reason beyond trivia: it is the one place you can move traffic without touching a server, which is exactly why geo-routing to a nearby data center is done there.",
            },
            {
              kind: "predict",
              prompt:
                "A single server runs the web app, the database and the cache. The web app develops a memory leak. What is the first thing to degrade?",
              options: [
                "Only the web app, since the database is a separate process",
                "The database, because the leak evicts its cached pages from memory",
                "Nothing, until the leak exhausts memory and the process is killed",
                "The network, because leaked memory increases packet loss",
              ],
              answer: 1,
              explanation:
                "One box means one page cache. Memory the web app takes is memory the database no longer has, so its hot pages start coming from disk and queries slow down well before anything is killed. Sharing a machine means sharing its failure modes.",
            },
            {
              kind: "mcq",
              prompt: "What does splitting the web tier from the data tier buy you directly?",
              options: [
                "Higher availability, since one tier can fail without the other",
                "The ability to size and scale the two workloads separately",
                "Lower latency, since each tier has its own network",
                "Automatic failover between the two servers",
              ],
              answer: 1,
              explanation:
                "It buys independent scaling and nothing more. There is still exactly one database, so a database failure is still a total outage. Availability needs a second copy of the thing that failed, which is what replication adds later in this section.",
            },
          ],
        },
        {
          slug: "sd-web-and-data-tiers",
          title: "Two tiers, scaled separately",
          summary:
            "What independent scaling actually means: different machine shapes, different growth curves, and a network where a function call used to be.",
          contentFile: "sd-web-and-data-tiers.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why do the two tiers want differently shaped machines?",
              options: [
                "The web tier needs memory for its working set; the database needs CPU for joins",
                "The web tier needs CPU in bursts and little memory; the database needs its working set to fit in RAM",
                "They want the same shape, which is why splitting them is mostly about availability",
                "The database needs more network bandwidth than the web tier",
              ],
              answer: 1,
              explanation:
                "A web server holds almost nothing between requests, so it is CPU-bound in bursts. A database's whole performance story is whether hot pages are in the buffer pool. On one shared box you pay for the maximum on every axis and waste the difference.",
            },
            {
              kind: "predict",
              prompt:
                "A page issues 30 queries one after another. You move the database to its own server, roughly 0.5 ms away. What happens to the page's latency?",
              options: [
                "It drops, because the database now has a whole machine",
                "It is unchanged, because 0.5 ms is negligible",
                "It rises by roughly 15 ms, because each query now pays a round trip",
                "It rises by roughly 0.5 ms, because the queries pipeline",
              ],
              answer: 2,
              explanation:
                "Serial queries each pay the round trip, so 30 times 0.5 ms is about 15 ms added. The split did not create the problem, it exposed it: chattiness was free over a local socket. Batch the queries and you end up faster than before, because the database now has a machine's worth of memory.",
            },
            {
              kind: "mcq",
              prompt:
                "Ten web servers each hold a pool of 20 database connections. What is the concern?",
              options: [
                "200 connections, and databases often degrade well before their configured limit",
                "Nothing, since 200 is small for a modern database",
                "The pools will deadlock against each other",
                "Each pool needs its own read replica",
              ],
              answer: 0,
              explanation:
                "The database sees the sum of every pool, and each connection costs it memory and scheduling. This is why a connection pooler tends to appear in front of the database at roughly the third web server, not at some large traffic milestone.",
            },
          ],
        },
        {
          slug: "sd-sql-or-not",
          title: "Relational or not",
          summary:
            "The four NoSQL families, the four conditions that justify leaving relational, and why read volume is not one of them.",
          contentFile: "sd-sql-or-not.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which property do the NoSQL families share that most shapes a design?",
              options: [
                "They are always faster than relational databases",
                "They have no schema",
                "Joins are generally not supported",
                "They cannot be replicated",
              ],
              answer: 2,
              explanation:
                "No joins, and it is deliberate rather than missing. A join needs both sides reachable from one place, which conflicts with spreading data across machines that do not coordinate per query. Losing joins is what you pay, and denormalizing is how you pay it.",
            },
            {
              kind: "mcq",
              prompt: "Which of these is NOT a reason to reach for a non-relational store?",
              options: [
                "The application needs single-digit millisecond latency",
                "The read volume is very high",
                "The data has no relational shape",
                "The data is too large for one machine",
              ],
              answer: 1,
              explanation:
                "Read volume is handled by replicas and caching, both of which a relational database does well. Choosing NoSQL for read volume applies a tool for one problem to a different problem, and gives up query flexibility to solve something you had another answer for.",
            },
            {
              kind: "predict",
              prompt:
                "An early-stage product cannot predict its access patterns yet. Which way does that push the choice?",
              options: [
                "Toward key-value, because it is easier to change later",
                "Toward relational, because a new question is a new query rather than a migration",
                "Neither, since the choice is reversible at any size",
                "Toward document stores, because they have no schema to change",
              ],
              answer: 1,
              explanation:
                "Not knowing the questions is the strongest argument for relational. A key-value store answers exactly what its keys were designed for, so a new question means a migration or a second copy. Early on the questions change weekly, and query flexibility is the thing you will actually use.",
            },
          ],
        },
      ],
    },
    {
      slug: "adding-redundancy",
      title: "Adding redundancy",
      description: "A second copy of everything, and what each one costs.",
      lessons: [
        {
          slug: "sd-vertical-vs-horizontal",
          title: "Scale up against scale out",
          summary:
            "Why the real argument is not the ceiling on a big machine but the fact that one machine has no failover.",
          contentFile: "sd-vertical-vs-horizontal.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What is the limitation of vertical scaling that applies from day one?",
              options: [
                "The hard ceiling on the largest machine available",
                "The cost per unit of CPU rises with instance size",
                "There is no failover: one server down is everything down",
                "Vertical scaling requires downtime to resize",
              ],
              answer: 2,
              explanation:
                "The ceiling only bites at the top. The lack of redundancy bites immediately, and it is why a system on one huge server has exactly the same availability as one on one tiny server.",
            },
            {
              kind: "mcq",
              prompt: "What does horizontal scaling demand of the application?",
              options: [
                "That every server holds an identical copy of the database",
                "That nothing important is remembered in a single server between requests",
                "That the servers are all the same instance size",
                "That requests are routed by consistent hashing",
              ],
              answer: 1,
              explanation:
                "Session data, uploaded files on local disk and in-process caches all break once a second server exists, because the next request may land elsewhere. That constraint is the stateless web tier, and paying it properly is its own lesson.",
            },
            {
              kind: "predict",
              prompt:
                "Two servers, each 99% available, behind a router that skips a dead one. Why is the real availability below the 99.99% the arithmetic gives?",
              options: [
                "Because the arithmetic should multiply rather than add",
                "Because failures are often correlated, and the router itself can fail",
                "Because 99% is a monthly figure and the result would be yearly",
                "It is not below: 99.99% is what you get",
              ],
              answer: 1,
              explanation:
                "0.01 times 0.01 assumes independence. A bad deploy, a poisoned cache entry or an expired certificate takes both servers out within seconds, and that class of failure is a large share of real outages. The router is also a new single point of failure unless it is itself redundant.",
            },
          ],
        },
        {
          slug: "sd-load-balancer",
          title: "The load balancer",
          summary:
            "One public IP in front of a private pool, and why the health check behind it is the entire failover mechanism.",
          contentFile: "sd-load-balancer.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "After a load balancer is added, why do web servers move to private IPs?",
              options: [
                "Private IPs are faster than public ones",
                "The load balancer cannot forward to a public IP",
                "It shrinks the attack surface to one port on one host",
                "Public IPs are a limited resource that must be conserved",
              ],
              answer: 2,
              explanation:
                "The web servers stop being addressable from the internet, so the only way in is the traffic the load balancer is configured to forward. It is a security gain that comes free with a change made for other reasons.",
            },
            {
              kind: "predict",
              prompt:
                "A health check queries the database. The database has a bad thirty seconds. What does the load balancer do?",
              options: [
                "Routes around the database and serves cached responses",
                "Marks every web server unhealthy at once and has nothing left to route to",
                "Keeps traffic flowing, since the servers themselves are up",
                "Promotes a replica to leader",
              ],
              answer: 1,
              explanation:
                "A deep check couples every server's health to a shared dependency, so a dependency blip becomes a total outage. A shallow check has the opposite flaw, keeping a broken server in rotation. The resolution is two checks with different jobs plus a floor the pool refuses to drain below.",
            },
            {
              kind: "mcq",
              prompt:
                "One of four servers answers health checks but responds in 2 seconds instead of 50 ms. Why does round robin make this so bad?",
              options: [
                "Round robin sends all traffic to the slowest server",
                "Round robin distributes by request count, not by capacity, so the sick server keeps its full share",
                "Round robin retries failed requests on the same server",
                "Round robin cannot be combined with health checks",
              ],
              answer: 1,
              explanation:
                "It keeps feeding the one server that cannot cope. A page pulling 20 assets hits it about five times, so the user experiences every page as slow rather than one request in four. Least-connections starves a backing-up server naturally.",
            },
          ],
        },
        {
          slug: "sd-database-replication",
          title: "Replicas behind the database",
          summary:
            "Leader and followers, what promotion really costs, and why replication lag is the normal state rather than an error.",
          contentFile: "sd-database-replication.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is there usually one leader and several followers?",
              options: [
                "Leaders are more expensive to run than followers",
                "Most applications read far more than they write, and only reads spread",
                "A second leader would violate the CAP theorem",
                "Followers cannot be promoted unless they outnumber leaders",
              ],
              answer: 1,
              explanation:
                "Writes all go to the leader, so adding leaders does not help a read-heavy workload. Followers scale the side that actually has volume, which is why the pool is lopsided by design.",
            },
            {
              kind: "predict",
              prompt:
                "Replication is asynchronous. The leader dies and a follower is promoted. What happens to writes the leader acknowledged in its final moments?",
              options: [
                "They are replayed from the follower's own log",
                "They are lost, having been acknowledged to users but never replicated",
                "They are held by the load balancer and retried",
                "Nothing is lost, since promotion waits for the follower to catch up",
              ],
              answer: 1,
              explanation:
                "Asynchronous means the leader answered the client without waiting for followers, so at the moment it died the followers were behind. Those acknowledged writes are gone unless the dead leader's disk survives and someone replays it by hand. A payment ledger cannot accept that and needs synchronous replication to at least one follower.",
            },
            {
              kind: "mcq",
              prompt:
                "A user posts a comment and the redirect back does not show it. Lag is only 20 ms. Why does this happen every time rather than rarely?",
              options: [
                "The redirect is issued immediately after the write, so it lands inside the lag window by construction",
                "20 ms is unusually high for replication lag",
                "The comment was written to a follower instead of the leader",
                "The browser cached the previous version of the page",
              ],
              answer: 0,
              explanation:
                "A random read would almost never fall in a 20 ms window, but this read is not random: it happens immediately after the write. Adding followers makes it marginally worse. The fix is to read a user's own writes from the leader briefly, or to pass the leader's log position and have the follower wait for it.",
            },
          ],
        },
      ],
    },
  ],
}
