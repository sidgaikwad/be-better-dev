import type { SectionSeed } from "../../types"

export const sdNearbyFriends: SectionSeed = {
  slug: "sd-nearby-friends",
  title: "Design nearby friends",
  description:
    "Locations that change every few seconds, a WebSocket per user, and a pub-sub fanout sized by how many friends are actually listening.",
  badgeIcon: "👥",
  badgeTitle: "Nearby",
  units: [
    {
      slug: "routing-locations",
      title: "Routing locations",
      description: "The same domain as the proximity service, and almost none of the same design.",
      lessons: [
        {
          slug: "sd-nf2-moving-data",
          title: "Data that will not sit still",
          summary:
            "334,000 updates per second becoming 14 million forwards, why 30 seconds is chosen from walking speed, and why a geospatial index is the wrong tool here.",
          contentFile: "sd-nf2-moving-data.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is the refresh interval 30 seconds specifically?",
              options: [
                "It is the shortest interval a mobile battery tolerates",
                "At walking speed a person moves about 45 yards, which does not change who is within 5 miles",
                "It matches the WebSocket keepalive",
                "It is the Redis TTL granularity",
              ],
              answer: 1,
              explanation:
                "The interval comes from the physics of the thing being tracked, and doubling it halves the entire load. That is the cheapest lever in the design.",
            },
            {
              kind: "mcq",
              prompt: "Which number defines the problem?",
              options: [
                "334,000 location updates per second",
                "14 million forwards per second, which is 40 times the write rate",
                "100 million daily active users",
                "400 friends per user",
              ],
              answer: 1,
              explanation:
                "The write rate is large and ordinary; the fanout is what the architecture is built around. Each update reaches roughly 40 online nearby friends.",
            },
            {
              kind: "predict",
              prompt: "Would the proximity service's geospatial index work here?",
              options: [
                "Yes, with a shorter rebuild interval",
                "No: the candidate set comes from the friend graph, not geometry, and constant updates would cost more than the queries",
                "Yes, if quadtrees were replaced with geohash",
                "No, because distances must be exact rather than approximate",
              ],
              answer: 1,
              explanation:
                'Proximity service asks "who is near this point" over static data and wants a spatial index. Nearby friends asks "which of these specific people are near me" over data in constant motion and wants a message bus. Distance is a filter applied at the end, not the thing you search by.',
            },
          ],
        },
        {
          slug: "sd-nf2-pubsub",
          title: "A channel per user",
          summary:
            "The update flow end to end, why the distance filter runs on the receiving side, and why the cluster is sized by CPU rather than memory.",
          contentFile: "sd-nf2-pubsub.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is the distance check done by the receiving connection handler?",
              options: [
                "It spreads CPU across more servers",
                "Each handler already holds its own user's location, so the check is local and needs no lookup",
                "The sender does not know the radius setting",
                "Redis cannot filter messages",
              ],
              answer: 1,
              explanation:
                "The sender never needs to know where its friends are. It publishes once and each receiver decides whether the update is relevant to it.",
            },
            {
              kind: "mcq",
              prompt:
                "The cluster needs 2 servers for memory and 140 for CPU. What does that tell you?",
              options: [
                "The memory estimate must be wrong",
                "The cluster is sized by message throughput, and memory is free by comparison",
                "Channels should be consolidated to reduce CPU",
                "Redis is the wrong choice for this workload",
              ],
              answer: 1,
              explanation:
                "200 GB of channels fits in two servers; 14 million pushes per second does not fit in any. The bottleneck is not where intuition points, and doing both calculations is what shows it.",
            },
            {
              kind: "predict",
              prompt:
                "Users subscribe to all 400 friends' channels though only ~100 are active. What does that buy?",
              options: [
                "Faster delivery when a friend comes online",
                "The removal of an entire mechanism: no presence watching, no subscription fanout on connect, no races",
                "Lower CPU usage on the pub/sub servers",
                "Simpler distance calculations",
              ],
              answer: 1,
              explanation:
                "An idle channel costs about 20 bytes per subscriber and no CPU, since Redis does nothing until something is published. Trading memory that is already idle for coordination that would have to be correct is a good trade, and worth naming as deliberate.",
            },
          ],
        },
      ],
    },
    {
      slug: "operating-the-cluster",
      title: "Operating the cluster",
      description: "Stateful connections, stateless messages, and the care both demand.",
      lessons: [
        {
          slug: "sd-nf2-connections",
          title: "Holding the connections",
          summary:
            "What happens on app start, why a TTL replaces presence tracking entirely, draining rather than killing a node, and what a crash really costs.",
          contentFile: "sd-nf2-connections.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "How does the system know a friend is inactive?",
              options: [
                "A presence service tracks connection state",
                "Their location cache entry has expired, so the batched fetch simply does not return them",
                "The pub/sub channel is unsubscribed",
                "A heartbeat timeout marks them offline",
              ],
              answer: 1,
              explanation:
                "The TTL is the mechanism. A user goes offline by their entry expiring, which is state that cleans itself up rather than state someone has to maintain, and there is no separate presence check anywhere in the system.",
            },
            {
              kind: "mcq",
              prompt: "Why drain a WebSocket server rather than removing it?",
              options: [
                "Draining is required by the load balancer protocol",
                "Every connection is a client that must re-run initialization elsewhere, so dropping them all at once is a burst on three other systems",
                "In-flight messages would be lost",
                "The pub/sub subscriptions cannot be transferred",
              ],
              answer: 1,
              explanation:
                "Mark the node draining so it takes no new connections, wait for the existing ones to close, then remove it. Deploys need the same care, which makes them slow, and the slowness is the feature.",
            },
            {
              kind: "predict",
              prompt:
                "A server holding 200,000 connections crashes without draining. What is the real cost?",
              options: [
                "The lost traffic it was serving",
                "The reconnection work: 200,000 friend-list queries, 80 million cache keys fetched and 80 million subscriptions in seconds",
                "Dropped location updates during the outage",
                "Rebalancing the pub/sub hash ring",
              ],
              answer: 1,
              explanation:
                "Reconnection is far more expensive than the connection was, so a crash becomes a load spike on three other systems. Defend with client backoff and jitter, and keep fleet headroom to absorb one node's clients.",
            },
          ],
        },
        {
          slug: "sd-nf2-scaling-pubsub",
          title: "Scaling a stateful cluster",
          summary:
            "Consistent hashing over channels, why the messages are stateless but the servers are not, and why the usual autoscaling instinct is wrong.",
          contentFile: "sd-nf2-scaling-pubsub.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "What state does a pub/sub server hold, given that messages are not persisted?",
              options: [
                "The last message per channel",
                "The subscriber list per channel, which exists nowhere else",
                "The hash ring",
                "Each user's most recent location",
              ],
              answer: 1,
              explanation:
                "If a channel moves, every subscriber must unsubscribe and resubscribe, missing updates until they do. That makes the cluster operationally stateful even though it stores nothing durable.",
            },
            {
              kind: "mcq",
              prompt: "How does a WebSocket handler recover after a pub/sub server is replaced?",
              options: [
                "It waits to be told which channels to resubscribe",
                "It keeps its own subscription list and re-derives placement from the updated ring, resubscribing only what moved",
                "It resubscribes to every channel",
                "The pub/sub cluster replays missed messages",
              ],
              answer: 1,
              explanation:
                "The same property that lets publishers and subscribers agree without coordinating makes recovery a local calculation.",
            },
            {
              kind: "predict",
              prompt:
                "Since resizing is disruptive, a colleague proposes doubling the cluster weekly instead of scaling with traffic. What is wrong?",
              options: [
                "Doubling is too large a step",
                "It makes storms more frequent, when the right conclusion is to resize rarely: provision for peak and leave it alone",
                "Weekly resizes cannot be scheduled at low traffic",
                "Nothing: scheduled resizing is the standard practice",
              ],
              answer: 1,
              explanation:
                "Doubling moves about half of all channels, and doing it weekly schedules the disruption rather than avoiding it. Autoscaling is cheap when a node holds nothing and expensive in proportion to what moves when it leaves.",
            },
          ],
        },
      ],
    },
  ],
}
