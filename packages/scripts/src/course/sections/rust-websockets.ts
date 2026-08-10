import type { SectionSeed } from "../types"

// Part 4: WebSockets. The wire first (101 upgrade, frames, masking), then axum
// over tokio-tungstenite with the actor shape from Part 2 in front of every
// socket. The back half is the part that only shows up in production: heartbeats
// because TCP never reports a dead peer, a bounded outbound queue because a
// fan-out has no producer to slow down, and Redis pub/sub because an in-process
// hub is exactly as wide as the process. Closes on the live delivery-progress
// dashboard for the newsletter admin.

export const rustWebsockets: SectionSeed = {
  slug: "rust-websockets",
  title: "Rust with WebSockets",
  description: "The upgrade handshake, frames, backpressure, a live delivery dashboard.",
  badgeIcon: "🔌",
  badgeTitle: "WebSockets × Rust",
  units: [
    {
      slug: "the-wire",
      title: "The wire",
      description: "How one HTTP request becomes a frame stream, and how axum serves one.",
      lessons: [
        {
          slug: "ws-upgrade-and-frames",
          title: "The 101 upgrade, and what a frame is",
          summary:
            "Switching Protocols, what Sec-WebSocket-Key really proves, opcodes, and why clients mask.",
          contentFile: "ws-upgrade-and-frames.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "What does the `Sec-WebSocket-Key` and `Sec-WebSocket-Accept` exchange actually establish?",
              options: [
                "That the client is authenticated and allowed to connect",
                "That the peer genuinely implements WebSocket, since a server ignoring the Upgrade header or a cache replaying a stored response cannot produce the matching hash",
                "A shared secret used to encrypt the frames that follow",
                "Which extensions and compression the two sides will use",
              ],
              answer: 1,
              explanation:
                "The transform is public: append a fixed GUID from RFC 6455, SHA-1, base64. Anyone can compute it, so it authenticates nobody. It only proves the response came from software that speaks the protocol, which is why auth still rides on the handshake's ordinary HTTP cookies.",
            },
            {
              kind: "predict",
              prompt:
                "A client is halfway through sending a fragmented 40 MB binary upload. The server needs to send a Ping right now. What happens?",
              options: [
                "The Ping waits until the last continuation frame arrives",
                "The Ping goes out immediately: control frames are never fragmented and may be injected between the fragments of a data message",
                "The connection errors, because a message is already in progress",
                "The Ping is rewritten as a continuation frame and delivered with the upload",
              ],
              answer: 1,
              explanation:
                "Control frames (close, ping, pong) are capped at 125 bytes, never fragmented, and explicitly allowed between fragments. That guarantee is what makes a heartbeat trustworthy even under a large transfer.",
            },
            {
              kind: "mcq",
              prompt:
                "Every client-to-server frame is XORed with a random 4-byte key that travels in the same header. What is that for?",
              options: [
                "Confidentiality, since the key is only known to the two endpoints",
                "Detecting corruption introduced by intermediate proxies",
                "Making the bytes unpredictable, so attacker-chosen payloads cannot be mistaken for a real HTTP request by a proxy that does not understand WebSocket",
                "Compressing repeated payloads before transmission",
              ],
              answer: 2,
              explanation:
                "A key shipped beside the data encrypts nothing. The threat is cache poisoning: hostile JavaScript emitting bytes shaped like an HTTP request that a naive middlebox parses and caches. Servers do not run attacker-supplied code, so their direction is exempt.",
            },
          ],
        },
        {
          slug: "ws-axum-handler",
          title: "A socket, two halves, one task each",
          summary:
            "WebSocketUpgrade, on_upgrade, splitting sink from stream, and the actor pattern in front of the write half.",
          contentFile: "ws-axum-handler.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "When does the closure passed to `ws.on_upgrade(...)` actually run?",
              options: [
                "Inside the handler, before the response is produced",
                "After the handler returns: hyper writes the 101, stops speaking HTTP on that socket, and hands the raw IO to a task that calls your closure",
                "Once per incoming frame, as a callback",
                "On the blocking thread pool, since frame parsing is CPU-bound",
              ],
              answer: 1,
              explanation:
                "The handler's only job is deciding whether the upgrade may happen, which is why session middleware and an `AdminUser` extractor can refuse it with an ordinary 401. The connection's whole life happens later, on a different task.",
            },
            {
              kind: "predict",
              prompt:
                "The writer task loops on `rx.recv()`. You forget the `select!` that aborts it when the reader half ends, and a dashboard closes its tab after its issue finished delivering. What is the state of the server?",
              options: [
                "Nothing leaks: the writer's next send fails and the task exits",
                "The writer parks on `rx.recv()` forever, the hub keeps its Sender, and that connection's memory is never reclaimed, because nothing is ever published to prove the socket is gone",
                "The runtime reaps tasks whose channels have no active producers",
                "The process panics on the next publish to that connection",
              ],
              answer: 1,
              explanation:
                "A dead socket is only discovered by reading or writing it. A writer with nothing to write never touches the socket, so it never learns, and you leak one task plus one queue per disconnect. This is why the reader half must be able to end the connection.",
            },
            {
              kind: "mcq",
              prompt: "Why call `StreamExt::split` on the `WebSocket` at all?",
              options: [
                "axum requires it before any frame can be sent",
                "It doubles throughput by parsing frames on two cores",
                "A `WebSocket` is one value implementing both `Stream` and `Sink`, so one `&mut` means one task alternating; `split` yields two separately owned halves that can move into different tasks",
                "It converts text frames to binary so the sink can be shared",
              ],
              answer: 2,
              explanation:
                "The alternative is one task running `select!` over both directions, which works but adds a cancel-safety obligation on each branch. Splitting buys independent ownership at the cost of one extra task.",
            },
          ],
        },
      ],
    },
    {
      slug: "connections-under-load",
      title: "Connections under load",
      description: "Heartbeats, slow consumers, and fanning events across instances.",
      lessons: [
        {
          slug: "ws-liveness-heartbeats",
          title: "Liveness: ping, pong, and dead peers",
          summary:
            "Why TCP never reports a dead client, heartbeat timing, and what a pong does not prove.",
          contentFile: "ws-liveness-heartbeats.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "A server holds an ESTABLISHED socket to a laptop that just lost power. The server only reads from it. How does TCP inform the server?",
              options: [
                "Immediately, with an RST from the peer's kernel",
                "Within about 75 seconds, via keepalive probes",
                "It does not: an idle connection sends no packets, so there is nothing to fail, and SO_KEEPALIVE is off by default with a two-hour Linux default anyway",
                "After one round-trip timeout, since the read is already outstanding",
              ],
              answer: 2,
              explanation:
                "An RST requires a live peer kernel, which is exactly what is missing. TCP is not a circuit: with nothing to send, it emits nothing, and a read that is waiting has no deadline of its own.",
            },
            {
              kind: "mcq",
              prompt:
                "A client sends a Ping to your axum WebSocket handler. What must your code do?",
              options: [
                "Match every Ping with an explicit `Message::Pong` reply or the client will disconnect you",
                "Nothing: tungstenite queues the Pong for you, though it only goes out while some task is still polling the socket",
                "Reject it, since browsers may not send control frames",
                "Echo the Ping back unchanged, preserving its payload and opcode",
              ],
              answer: 1,
              explanation:
                "The automatic reply is a convenience with a sharp edge: a wedged task answers nothing. That is a feature, because the heartbeat is meant to test that the task is alive, not merely that the file descriptor is open.",
            },
            {
              kind: "predict",
              prompt:
                "You want to know the admin's dashboard page is still alive and rendering. You send WebSocket Ping frames every 25 seconds and receive Pongs every time. What have you proved?",
              options: [
                "The page is running and rendering, since the Pong came from the tab",
                "Only that the browser process and the network path are alive: the browser's stack answers pings by itself, the JS API cannot send or observe them, so a page whose `onmessage` is throwing pongs perfectly",
                "Nothing, because browsers silently discard server pings",
                "The page is alive, because the `onmessage` handler fires for Ping frames",
              ],
              answer: 1,
              explanation:
                "Ping/pong is a transport-level check answered below your code. To test the page, send an application-level message the JavaScript must reply to, and count those instead.",
            },
          ],
        },
        {
          slug: "ws-backpressure",
          title: "Slow consumers and the queue in front of each socket",
          summary:
            "Bounded outbound queues, drop versus disconnect, coalescing with watch, and where bytes really pile up.",
          xp: 25,
          contentFile: "ws-backpressure.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "The hub uses `broadcast::channel(16)`. One dashboard's task is wedged for ten seconds while the worker publishes forty events. What does that receiver see, and what happened to memory?",
              options: [
                "All forty arrive as a burst once the task resumes; memory grew to hold them",
                "Its next `recv()` returns `Err(RecvError::Lagged(24))` and it resumes at the oldest of the sixteen still in the ring; the channel's memory never changed",
                "The publisher blocked until the receiver caught up, so nothing was lost",
                "The receiver is dropped from the channel and must resubscribe",
              ],
              answer: 1,
              explanation:
                "A broadcast ring overwrites rather than grows, so the twenty-four are gone and the publisher never waited. Sixteen slots allocated at construction is the whole memory story, however many receivers stall.",
            },
            {
              kind: "mcq",
              prompt:
                "During fan-out the publisher uses `tx.send(msg).await` on each connection's bounded queue instead of `try_send`. What does that cost?",
              options: [
                "Nothing: this is the correct backpressure from the Part 2 lesson",
                "The shared publisher waits on the slowest of N sockets, so every fast client's latency is set by the worst one: head-of-line blocking promoted to the whole application",
                "Messages are silently dropped once a queue is full",
                "The slow client is disconnected automatically",
              ],
              answer: 1,
              explanation:
                "Awaiting is right in a pipeline, where slowing the producer is the goal. In a fan-out there is no single producer to slow down, only a shared one whose delay is charged to everybody.",
            },
            {
              kind: "mcq",
              prompt:
                "`sink.send(event).await` returned `Ok`. What does that prove about the browser?",
              options: [
                "It received and rendered the event",
                "It received the bytes but may not have parsed them yet",
                "Nothing: the message is buffered somewhere across tungstenite's 128 KiB write buffer, the kernel send buffer, and the network's in-flight window, so a client that stopped reading can absorb hundreds of kilobytes before any write reports trouble",
                "It acknowledged the frame at the WebSocket layer",
              ],
              answer: 2,
              explanation:
                "WebSocket has no application-level acknowledgement. Three of the four queues between your event and a pixel are invisible and differently sized on every machine, which is why the one you sized yourself has to be the one that enforces the policy.",
            },
          ],
        },
        {
          slug: "ws-scaling-dashboard",
          title: "Across instances: Redis pub/sub and the live dashboard",
          summary:
            "Why an in-process hub stops at the process boundary, fanning events with Redis, and the delivery-progress dashboard end to end.",
          xp: 25,
          contentFile: "ws-scaling-dashboard.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Three API instances. The admin's dashboard is connected to instance A. The task emailing subscriber 18,500 is claimed by a worker in instance C. How many WebSocket frames does instance B write for that event?",
              options: [
                "One, since every instance forwards every event it receives",
                "Zero: B receives the Redis message, finds no local subscribers for that issue, and drops it",
                "Three, one per connected instance",
                "None, because B never receives the message in the first place",
              ],
              answer: 1,
              explanation:
                "The event crosses the network once per instance and becomes a frame only where a socket wants one. With an in-process channel instead, C's progress would never reach A at all, and the admin would watch a motionless bar while fifty thousand emails sent perfectly.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does the pub/sub subscription need its own Redis connection rather than one from the shared pool?",
              options: [
                "Subscriptions are slower and would starve other queries",
                "A connection in subscribe mode cannot run ordinary commands, so redis-rs models it as a distinct PubSub type",
                "Redis serves pub/sub on a different port",
                "Pooled connections are recycled too often to hold a subscription",
              ],
              answer: 1,
              explanation:
                "Subscribe mode changes what the connection is allowed to do, which is why the API hands you a separate type. Note also that the subscription is per instance, not per connected browser.",
            },
            {
              kind: "mcq",
              prompt:
                "Redis pub/sub drops a progress event while an instance reconnects. Why is that acceptable for this dashboard, and what would make it unacceptable?",
              options: [
                "It is never acceptable; the dashboard must switch to Redis Streams",
                "Events carry absolute counts, so the next one supersedes the gap; if they carried deltas like `+1`, one missed event would leave the number permanently and undetectably wrong",
                "It is fine either way, because the browser refetches on every message",
                "Acceptable only because Redis retries the delivery after reconnection",
              ],
              answer: 1,
              explanation:
                "At-most-once is a good trade precisely when a later message makes an earlier one irrelevant. That property is bought by the event design, not by the transport, which is why the liveness lesson insisted on self-contained events.",
            },
          ],
        },
      ],
    },
  ],
}
