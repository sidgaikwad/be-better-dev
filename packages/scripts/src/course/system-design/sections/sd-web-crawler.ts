import type { SectionSeed } from "../../types"

export const sdWebCrawler: SectionSeed = {
  slug: "sd-web-crawler",
  title: "Design a web crawler",
  description:
    "The frontier, politeness and freshness, trap detection, and how a crawl stays polite to one host while saturating thousands.",
  badgeIcon: "🕷️",
  badgeTitle: "Crawler",
  units: [
    {
      slug: "the-loop",
      title: "The crawl loop",
      description: "Three steps that fit in an afternoon, and why the web makes them hard.",
      lessons: [
        {
          slug: "sd-wc-pipeline",
          title: "The pipeline",
          summary:
            "400 pages per second and 30 PB, the components between a seed and stored content, and the two different membership tests.",
          contentFile: "sd-wc-pipeline.md",
          quiz: [
            {
              kind: "mcq",
              prompt: 'Why are "URL seen?" and "content seen?" both needed?',
              options: [
                "One is a Bloom filter and the other is exact",
                "URL-seen stops queueing a page twice; content-seen catches the same content at different URLs",
                "Content-seen only runs during recrawls",
                "URL-seen operates on the frontier and content-seen on the storage index",
              ],
              answer: 1,
              explanation:
                "About 29% of the web is duplicated, so without content-seen you store the same bytes many times. Both are membership tests over enormous sets, which is what Bloom filters are for.",
            },
            {
              kind: "mcq",
              prompt: "What does 30 PB of five-year storage imply about the storage design?",
              options: [
                "A sharded relational database",
                "Object storage with an index in front, not a database",
                "In-memory storage with disk overflow",
                "A distributed file system per crawl server",
              ],
              answer: 1,
              explanation:
                "1 billion pages at 500 KB is 500 TB a month. That lands in the same place as the YouTube and object storage sections: the pages are blobs and the database holds references.",
            },
            {
              kind: "predict",
              prompt:
                "Why is the content parser a separate component rather than part of the downloader?",
              options: [
                "Parsing needs a different programming language",
                "Parsing is CPU-bound and downloading is IO-bound, so combining them makes the slower one set the pace",
                "The parser must run after storage",
                "It allows parsing to be skipped for cached pages",
              ],
              answer: 1,
              explanation:
                "A thread waiting on a network read uses almost no CPU, so one machine holds thousands of connections. A thread parsing after each fetch spends most of its time not fetching. Separating lets each scale to its own bottleneck and contains a pathological page to one parser.",
            },
          ],
        },
        {
          slug: "sd-wc-bfs-not-dfs",
          title: "Breadth-first, and why a plain queue fails",
          summary:
            "Why depth-first disappears down one branch, and the two defects of FIFO that the frontier exists to fix.",
          contentFile: "sd-wc-bfs-not-dfs.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is depth-first search wrong for the web?",
              options: [
                "It revisits pages more often",
                "Depth is effectively unbounded, so the crawl disappears down one branch and never returns to breadth",
                "It cannot be parallelized",
                "It requires storing the whole graph in memory",
              ],
              answer: 1,
              explanation:
                "Dynamically generated links, calendars linking to next month forever, and paths thousands of levels deep without revisiting. After hours you have crawled one site and nothing else.",
            },
            {
              kind: "mcq",
              prompt: "Why do priority and politeness pull against each other?",
              options: [
                "Priority requires more memory than politeness",
                "The most valuable URLs cluster on the most valuable hosts, so priority order is nearly the worst order for politeness",
                "Politeness delays cannot be applied to prioritized queues",
                "They do not conflict; both are satisfied by one FIFO queue",
              ],
              answer: 1,
              explanation:
                "That conflict is exactly why the frontier is two layers: one deciding what is worth fetching, one deciding when a host may be contacted.",
            },
            {
              kind: "predict",
              prompt:
                "A colleague proposes one global 100 ms delay between requests as the politeness rule. What is wrong?",
              options: [
                "It is too polite, wasting crawl capacity",
                "It caps the crawl at 10 pages per second and is still impolite, since those 10 can all hit one host",
                "It only works if hosts are evenly distributed",
                "Nothing, provided the delay is tuned per crawl",
              ],
              answer: 1,
              explanation:
                "Forty times too slow against 400 per second, and BFS produces exactly the clustering that makes it impolite anyway. Politeness is a per-host constraint and throughput is an aggregate property, so conflating them fails at both.",
            },
          ],
        },
      ],
    },
    {
      slug: "politeness-and-traps",
      title: "Politeness and traps",
      description:
        "The frontier's two layers, the downloader's four optimizations, and the hostile web.",
      lessons: [
        {
          slug: "sd-wc-frontier",
          title: "The URL frontier",
          summary:
            "Back queues that make politeness a property of the topology, front queues that prioritize without starving, and hybrid storage.",
          contentFile: "sd-wc-frontier.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "How do back queues guarantee politeness?",
              options: [
                "Each worker checks a last-fetched timestamp before every request",
                "One queue per host and one worker per queue, so a host is only ever contacted by one worker at a time",
                "The queue router applies a global rate limit",
                "Hosts are crawled in round-robin order",
              ],
              answer: 1,
              explanation:
                "Politeness comes from the topology rather than a check anyone can forget. Throughput comes from having many queues: a thousand hosts in flight at one request per second each is 1,000 pages per second.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does the front-queue selector choose randomly with a bias rather than always taking the highest priority?",
              options: [
                "Random selection is cheaper to compute",
                "Strict priority starves the low queues completely, so their URLs are never crawled",
                "It spreads load across crawl servers",
                "The prioritizer's scores are not precise enough to order strictly",
              ],
              answer: 1,
              explanation:
                "Random-with-bias crawls high priority much more often while low priority still advances. A queue never selected while anything sits above it is a queue that never drains.",
            },
            {
              kind: "predict",
              prompt:
                "1,000 back queues and 1,000 workers, but 90% of discovered URLs come from ten enormous hosts. What happens?",
              options: [
                "The ten queues are sharded automatically across workers",
                "Ten workers are saturated and 990 idle, so the crawl runs at roughly 1% of capacity",
                "The frontier drops the excess URLs",
                "Throughput is unaffected, since the other hosts fill the remaining queues",
              ],
              answer: 1,
              explanation:
                "Perfectly polite and almost entirely stalled, with the frontier filling with URLs that cannot be drained faster. Fixes all stop treating a host as one unit: more workers per large host, sharding a host by subdomain or path, or capping URLs per host.",
            },
          ],
        },
        {
          slug: "sd-wc-downloader",
          title: "The downloader",
          summary:
            "robots.txt as protocol, why DNS is the highest-leverage optimization, partitioning by host, and aggressive timeouts.",
          contentFile: "sd-wc-downloader.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why partition the URL space across crawl servers by host?",
              options: [
                "Hosts are evenly sized, so it balances load",
                "All of a host's URLs land on one server, which already serializes them, so politeness holds without cross-machine coordination",
                "It reduces DNS lookups",
                "It is required by robots.txt",
              ],
              answer: 1,
              explanation:
                "Use consistent hashing for the assignment so adding or losing a crawl server moves a small fraction rather than repartitioning. Hosts are emphatically not evenly sized, which is the previous lesson's problem.",
            },
            {
              kind: "mcq",
              prompt: "Why is an aggressive fetch timeout important?",
              options: [
                "Slow pages are usually low quality",
                "A worker blocked on a non-responding server stops its whole back queue",
                "Long connections exhaust file descriptors",
                "It prevents spider traps",
              ],
              answer: 1,
              explanation:
                "A page not fetched is cheap; a worker blocked for two minutes is not. Same reasoning as the interview wrap-up lesson: a slow dependency is more dangerous than a dead one, because a dead one fails fast.",
            },
            {
              kind: "predict",
              prompt:
                "You add a DNS cache with a 98% hit rate and throughput barely improves. Why?",
              options: [
                "The hit rate is too low to matter",
                "A blocking miss stalls more than the thread that issued it, so the cost is per miss times the threads it blocks",
                "DNS results are being cached at the wrong layer",
                "Throughput is limited by storage, not DNS",
              ],
              answer: 1,
              explanation:
                "At 200 ms per miss and 2% misses, the average cost should be about 4 ms per fetch, which is invisible against a 100 ms fetch. Seeing no gain points at resolver concurrency rather than hit rate. A hit rate says nothing about tail behavior when the miss path serializes.",
            },
          ],
        },
        {
          slug: "sd-wc-traps",
          title: "Duplicates, traps and noise",
          summary:
            "Exact against near-duplicate detection, why spider traps have no general solution, and what keeps a crawl running for weeks.",
          contentFile: "sd-wc-traps.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does exact hashing miss that a similarity hash catches?",
              options: [
                "Pages served over HTTPS",
                "Near-duplicates, where content is the same but a timestamp or ad slot differs",
                "Pages with the same URL but different content",
                "Compressed pages",
              ],
              answer: 1,
              explanation:
                'It is the difference between "the same bytes" and "the same article", and for a search index the second question is the one that matters.',
            },
            {
              kind: "mcq",
              prompt: "Why is manual exclusion an acceptable answer for spider traps?",
              options: [
                "Traps are rare enough to ignore otherwise",
                "Deciding automatically whether a million-URL site is a trap or a large catalogue is genuinely hard, and being wrong automatically costs more",
                "Automated detection is computationally infeasible",
                "Most traps are on a known blacklist",
              ],
              answer: 1,
              explanation:
                "Traps are obvious in aggregate statistics, so a human checks the hosts with absurd page counts. Caps on URL length, depth and pages per host bound the damage from any one trap without identifying it.",
            },
            {
              kind: "predict",
              prompt:
                "A site serves the same page at millions of short, depth-1 URLs differing only by a session parameter. Which defense catches it?",
              options: [
                "The URL length cap",
                "The depth cap",
                '"Content seen?", because every URL returns identical content',
                '"URL seen?", because the paths repeat',
              ],
              answer: 2,
              explanation:
                "The URLs are short, depth 1, and genuinely distinct, so all three URL-shaped defenses miss. Content-seen discards everything after the first fetch, and a per-host page cap bounds the wasted requests. URL-shaped defenses catch URL-shaped traps; you need both kinds plus a cap as backstop.",
            },
          ],
        },
      ],
    },
  ],
}
