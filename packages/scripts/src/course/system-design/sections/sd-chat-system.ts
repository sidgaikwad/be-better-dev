import type { SectionSeed } from "../../types"

export const sdChatSystem: SectionSeed = {
  slug: "sd-chat-system",
  title: "Design a chat system",
  description:
    "WebSocket against polling, the service discovery that finds your chat server, message ordering, and presence.",
  badgeIcon: "💬",
  badgeTitle: "Chat",
  units: [
    {
      slug: "connections-and-storage",
      title: "Connections and storage",
      description: "Getting a message to someone who did not ask for it, and where it lives.",
      lessons: [
        {
          slug: "sd-chat-protocol",
          title: "Polling, long polling, WebSocket",
          summary:
            "Why the receiving side is the hard one, what WebSocket actually fixes, and the stateful chat server that follows.",
          contentFile: "sd-chat-protocol.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why is a persistent connection per user a memory constraint rather than a throughput one?",
              options: [
                "WebSocket frames are larger than HTTP requests",
                "The limit is roughly 10 KB of state per idle connection, so 1 million connections is about 10 GB",
                "Each connection requires its own thread",
                "Persistent connections prevent request batching",
              ],
              answer: 1,
              explanation:
                "Chat servers are sized by concurrent connections, not requests per second. Worth saying that 1 million fits on one machine, and then rejecting a single server as a single point of failure for every conversation.",
            },
            {
              kind: "mcq",
              prompt: "Why use WebSocket for sending too, rather than HTTP?",
              options: [
                "HTTP cannot carry messages over 100,000 characters",
                "The connection is already open and bidirectional, so one connection means one code path and one set of failure modes",
                "HTTP keep-alive is unreliable on mobile",
                "It avoids the load balancer",
              ],
              answer: 1,
              explanation:
                "HTTP for sending is defensible, and there is no strong reason to run two mechanisms. The consequence is that chat servers become stateful, which is the price of server-initiated messages.",
            },
            {
              kind: "predict",
              prompt:
                "Long polling's problem was that the sender's server may not hold the recipient's connection. Does WebSocket fix that?",
              options: [
                "Yes, because the connection is persistent",
                "No, but it makes the user-to-server association stable enough to route against",
                "Yes, because all clients connect to one server",
                "No, and it cannot be solved without sticky sessions",
              ],
              answer: 1,
              explanation:
                "With a hundred chat servers, A is on 1 and B is on 57, so server 1 still cannot reach B directly. Long polling could not keep a map because the association lasted only until the next timeout. The protocol made the routing problem solvable, not solved.",
            },
          ],
        },
        {
          slug: "sd-chat-storage",
          title: "Storing the history",
          summary:
            "A 1:1 read-to-write ratio that removes the usual cache leverage, why key-value over relational, and what a local message id costs.",
          contentFile: "sd-chat-storage.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is a roughly 1:1 read-to-write ratio significant here?",
              options: [
                "It means writes can be batched",
                "There is no read-heavy skew to exploit, so a cache helps much less than in other designs",
                "It rules out sharding",
                "It means messages can be stored without replication",
              ],
              answer: 1,
              explanation:
                "Most systems in this course lean on a cache because reads outnumber writes 10:1 or more. Here the storage layer has to be genuinely fast at both.",
            },
            {
              kind: "mcq",
              prompt: "Why partition group messages by `channel_id`?",
              options: [
                "Channels are evenly sized",
                "Every query in a group chat is scoped to a channel, so a conversation's messages sit on one partition",
                "It keeps message ids globally unique",
                "It allows channels to be deleted independently",
              ],
              answer: 1,
              explanation:
                "Reading a conversation becomes a single-partition scan. The partition key follows from the access pattern, which is the same rule as the sharding lesson: the key must appear in the queries you actually run.",
            },
            {
              kind: "predict",
              prompt:
                "With per-channel sequence numbers, a user with 200 conversations opens the app after a week. What does sync cost?",
              options: [
                "One query, using the highest id the client has seen",
                "200 queries, one per channel, because a local sequence means nothing across channels",
                "Two queries: one for channels, one for messages",
                "Nothing: the server pushes everything on reconnect",
              ],
              answer: 1,
              explanation:
                "Id 500 in one channel and id 500 in another are unrelated, so the client tracks 200 cursors. The fix is local ids for in-conversation order plus a per-user inbox ordered globally, which is why the message sync queue exists rather than being an implementation detail.",
            },
          ],
        },
      ],
    },
    {
      slug: "delivery-and-presence",
      title: "Delivery and presence",
      description:
        "Routing a message to a stateful server, and the green dot that melts under load.",
      lessons: [
        {
          slug: "sd-chat-message-flow",
          title: "Service discovery and the message flow",
          summary:
            "Choosing a chat server on login, persisting before delivering, per-device cursors, and fanout for small groups only.",
          contentFile: "sd-chat-message-flow.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why does service discovery consider server load when assigning a chat server?",
              options: [
                "To balance CPU across the fleet",
                "Because capacity is measured in connections, so a server near its connection limit must stop taking new ones",
                "To keep conversations on the same server",
                "To avoid rebalancing the key-value store",
              ],
              answer: 1,
              explanation:
                "Geography matters too, since a persistent connection's latency is paid on every message. Both criteria follow from connections being the scarce resource.",
            },
            {
              kind: "mcq",
              prompt: "How does a device know what it missed while offline?",
              options: [
                "The server keeps an undelivered queue per device",
                "Each device tracks the highest message id it has seen and asks for everything above it",
                "The server replays the WebSocket session",
                "Messages are re-sent until acknowledged",
              ],
              answer: 1,
              explanation:
                "Each device syncs independently with no coordination and no server-side per-device state. It works precisely because ids are sortable, which is what the storage lesson insisted on.",
            },
            {
              kind: "predict",
              prompt:
                "A message is persisted, then the recipient's chat server crashes before pushing it. The recipient reconnects elsewhere. Is the message lost?",
              options: [
                "Yes, unless inter-server delivery is acknowledged and retried",
                "No: the cursor sync delivers it, because the push was a latency optimization and not the durability mechanism",
                "Yes, since the message left the sync queue",
                "No, because the sending server retries until delivery",
              ],
              answer: 1,
              explanation:
                "The recovery path is the same code as an ordinary cold-start sync, so it runs constantly rather than only during incidents, which is what makes it trustworthy.",
            },
          ],
        },
        {
          slug: "sd-chat-presence",
          title: "Online presence",
          summary:
            "Why a heartbeat rather than connection state, and why a status change in a large group is the thing that melts.",
          contentFile: "sd-chat-presence.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why use a heartbeat rather than the WebSocket's own connection state?",
              options: [
                "WebSocket does not report closure",
                "A connection can fail without a close frame, so absence of a heartbeat is the reliable signal",
                "Heartbeats are cheaper than maintaining the connection",
                "Connection state is not visible to the presence servers",
              ],
              answer: 1,
              explanation:
                "It also answers long polling's complaint that a server cannot tell a disconnected client from a quiet one. A 5-second heartbeat with a 30-second window means six missed beats before someone is marked away, so a tunnel does not flip the indicator.",
            },
            {
              kind: "mcq",
              prompt: "Why does per-friend-pair pub-sub fail for a 100,000-member group?",
              options: [
                "Pub-sub cannot support that many channels",
                "One status change generates 100,000 events, and status changes on every network blip",
                "Members cannot subscribe to their own channel",
                "The WebSocket frame size is exceeded",
              ],
              answer: 1,
              explanation:
                "The event rate is members times instability. The fix is to stop pushing: fetch presence when someone opens a group or refreshes, and push only for the conversations they are actively looking at. Same hybrid as the news feed.",
            },
            {
              kind: "predict",
              prompt:
                "10 million concurrent users on a 5-second heartbeat generates 2 million heartbeats per second. Is that a problem?",
              options: [
                "Yes, it requires its own sharded cluster",
                "Not if each heartbeat updates an in-memory entry with a TTL and notifies nobody; it becomes one if it writes to durable storage or fans out",
                "No, heartbeats are too small to matter at any volume",
                "Yes, the interval must be at least 60 seconds",
              ],
              answer: 1,
              explanation:
                "That is more requests per second than everything else combined, for a green dot. A periodic mechanism multiplies by user count, so the per-event cost has to be judged at that multiple. A heartbeat confirming someone is still online is not a status change.",
            },
          ],
        },
      ],
    },
  ],
}
