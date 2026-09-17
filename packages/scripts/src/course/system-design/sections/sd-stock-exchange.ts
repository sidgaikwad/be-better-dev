import type { SectionSeed } from "../../types"

export const sdStockExchange: SectionSeed = {
  slug: "sd-stock-exchange",
  title: "Design a stock exchange",
  description:
    "The matching engine and its order book, latency measured in microseconds, determinism, and the sequencer that makes replay possible.",
  badgeIcon: "📊",
  badgeTitle: "Exchange",
  units: [
    {
      slug: "matching",
      title: "Matching",
      description: "The book, and the sequence that makes matching reproducible.",
      lessons: [
        {
          slug: "sd-se-order-book",
          title: "The order book",
          summary:
            "Price then time priority, what the spread is for, and the two indexes over the same orders that make both matching and cancelling constant time.",
          contentFile: "sd-se-order-book.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "How are resting orders prioritized?",
              options: [
                "By arrival time alone, for fairness",
                "By price first, then by arrival time within a price level",
                "By size, so larger orders fill first",
                "By client tier, then price",
              ],
              answer: 1,
              explanation:
                "Price-then-time is what makes the exchange fair: at the same price, whoever arrived first is filled first. It is also why each price level holds a queue rather than a set.",
            },
            {
              kind: "mcq",
              prompt: "Why does the order book keep two indexes over the same orders?",
              options: [
                "For redundancy in case one is corrupted",
                "One by price for matching and one by order id for cancelling, so both are O(1)",
                "To separate buy and sell sides",
                "To support both L2 and L3 market data",
              ],
              answer: 1,
              explanation:
                "Cancel is unlinking a node given a map from order id to node, rather than a search. That is a recurring move for any structure needing two access paths.",
            },
            {
              kind: "predict",
              prompt:
                "Best bid 100.08, best ask 100.10. A buy limit at 100.09 for 500 shares arrives. What happens?",
              options: [
                "It matches against the best ask at 100.10",
                "Nothing matches; it rests as the new best bid, narrowing the spread and changing the visible market",
                "It is rejected as unmarketable",
                "It matches partially at 100.09",
              ],
              answer: 1,
              explanation:
                "The cheapest seller wants 100.10 and this buyer will not pay it. A resting order that never matches is still a market event, which is why market data is the engine's output rather than a separate reporting path. The spread is the price of immediacy.",
            },
          ],
        },
        {
          slug: "sd-se-sequencer",
          title: "Determinism and the sequencer",
          summary:
            "Why the engine may contain no randomness, what sequential ids buy for fairness and recovery, and why everything needing I/O sits outside the engine.",
          contentFile: "sd-se-sequencer.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why must the matching engine be deterministic?",
              options: [
                "To make latency predictable",
                "So a standby reaching the same input sequence reaches the same state, which is what makes failover possible",
                "To satisfy regulatory reporting formats",
                "So market data can be compressed",
              ],
              answer: 1,
              explanation:
                "The state is a pure function of the input sequence. It is the event sourcing rule from the digital wallet section, applied where microseconds matter.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does the order manager, not the matching engine, do risk and wallet checks?",
              options: [
                "They are slower than matching",
                "They need external state and I/O, which would destroy the engine's determinism",
                "They are optional and can be disabled",
                "The engine has no access to user accounts",
              ],
              answer: 1,
              explanation:
                "The engine matches and does nothing else. Everything requiring judgement or I/O happens before or after it, which is a design rule rather than an optimization.",
            },
            {
              kind: "predict",
              prompt:
                "The primary matching engine fails mid-day. How does the standby take over without losing or duplicating a trade?",
              options: [
                "The primary transfers its state before shutting down",
                "It replays the inbound sequence from its last applied id, since identical input through deterministic logic gives identical state",
                "It rebuilds the order book from the market data feed",
                "It restarts the trading day from the opening auction",
              ],
              answer: 1,
              explanation:
                "No state transfer and no reconciliation. The hard parts are elsewhere: the outbound sequence must not gap or duplicate, and exactly one engine must be live, since two would produce conflicting execution streams.",
            },
          ],
        },
      ],
    },
    {
      slug: "microseconds",
      title: "Microseconds",
      description: "Where the architecture stops resembling everything else in this course.",
      lessons: [
        {
          slug: "sd-se-latency",
          title: "Tens of microseconds",
          summary:
            "Why network and disk must be removed rather than optimized, pinned single-threaded polling loops, and what putting everything on one server gives up.",
          contentFile: "sd-se-latency.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why can a conventional distributed design not reach tens of microseconds?",
              options: [
                "The matching algorithm is too slow",
                "A network round trip is about 500 microseconds and disk persistence is milliseconds, so the steps must be removed rather than made faster",
                "Serialization overhead dominates",
                "Single-threaded processing caps throughput",
              ],
              answer: 1,
              explanation:
                "The gap between tens of milliseconds and tens of microseconds is a factor of a thousand. Everything on one server communicating through mmap removes both the network hops and the synchronous disk wait.",
            },
            {
              kind: "mcq",
              prompt: "Why does an application loop poll rather than block?",
              options: [
                "Polling uses less CPU",
                "A blocked thread must be woken by the scheduler, which costs microseconds and, worse, varies",
                "Blocking is unavailable when pinned to a core",
                "Polling allows batching of orders",
              ],
              answer: 1,
              explanation:
                "Polling is wasteful and deliberate: work is picked up the instant it appears, with predictable timing. Pinning a single-threaded loop to a core avoids cache invalidation from migration and context switching.",
            },
            {
              kind: "predict",
              prompt:
                "Putting everything on one server removes the network. What is given up, and how is it recovered?",
              options: [
                "Nothing: one server is sufficient at exchange volumes",
                "Fault tolerance and horizontal scale, recovered by a deterministic hot standby and by partitioning per symbol",
                "Only fault tolerance, recovered by frequent snapshots",
                "Only scale, recovered by a faster server",
              ],
              answer: 1,
              explanation:
                "Determinism appears before performance in the design because it is what makes the standby possible. Scale comes from partitioning by symbol, the one dimension where the data genuinely does not interact: Apple's book on one server, Microsoft's on another, never coordinating.",
            },
          ],
        },
      ],
    },
  ],
}
