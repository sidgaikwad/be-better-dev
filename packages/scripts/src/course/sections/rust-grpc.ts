import type { SectionSeed } from "../types"

// Part 4 ecosystem section: gRPC with tonic. Builds on Part 2's streams,
// backpressure, and cancellation lessons and on Part 3's newsletter service,
// whose API and delivery worker share a Postgres table as their contract.
// The project replaces that table with a gRPC service, then argues honestly
// for putting most of it back.

export const rustGrpc: SectionSeed = {
  slug: "rust-grpc",
  title: "Rust with gRPC",
  description: "protobuf, tonic, streaming RPCs, deadlines.",
  badgeIcon: "📡",
  badgeTitle: "gRPC × Rust",
  units: [
    {
      slug: "the-contract",
      title: "The contract",
      description: "A schema file, its wire format, and the build step that makes Rust obey it.",
      lessons: [
        {
          slug: "grpc-protobuf-contract",
          title: "Protobuf: the contract is a file",
          summary: "proto3 syntax, field numbers as wire identity, and the bytes next to JSON.",
          xp: 25,
          contentFile: "grpc-protobuf-contract.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "The protobuf encoding of a message is a quarter the size of its JSON. Where does most of the saving come from?",
              options: [
                "Protobuf gzip-compresses the payload by default",
                "Field names never appear on the wire; a tag byte carrying number and wire type replaces each key, and zero values are omitted entirely",
                "HTTP/2 header compression shrinks the body",
                "Protobuf drops fields the reader does not recognize",
              ],
              answer: 1,
              explanation:
                "Compression and HPACK are separate layers. The representational saving is that identity is a number, not a repeated string key, and absent-or-zero fields cost zero bytes.",
            },
            {
              kind: "predict",
              prompt:
                "You rename `title` to `subject`, keeping `= 2`, and redeploy only the worker. The old API still sends bytes it encoded as `title`. What does the worker see?",
              options: [
                "A decode error: unknown field name",
                "The value arrives intact; names never cross the wire, only field numbers do",
                "An empty string, since the name no longer matches",
                "A Status of INVALID_ARGUMENT",
              ],
              answer: 1,
              explanation:
                "Names live only in source and generated code. Field 2 is the identity on the wire, so a rename is invisible to every deployed binary.",
            },
            {
              kind: "mcq",
              prompt:
                "Why must a deleted field's number be marked `reserved` instead of quietly freed for the next field?",
              options: [
                "protoc reuses freed numbers automatically",
                "Old bytes still carrying that number would decode into the new field silently, with no error anywhere",
                "Reserved numbers make the tag byte smaller",
                "gRPC requires field numbers to stay contiguous",
              ],
              answer: 1,
              explanation:
                "Reuse is the silent-corruption case: the wire format cannot tell old field 4 from new field 4. reserved makes protoc refuse the footgun.",
            },
          ],
        },
        {
          slug: "grpc-tonic-codegen",
          title: "tonic: the contract becomes Rust",
          summary: "build.rs with tonic-build, the generated client and server, tower underneath.",
          contentFile: "grpc-tonic-codegen.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "When and where does the `.proto` file become Rust code?",
              options: [
                "At runtime, via reflection over the schema",
                "At build time: build.rs runs tonic-build, which writes generated code into OUT_DIR, pulled in with include_proto!",
                "On the first RPC, when the channel negotiates the schema",
                "When you run a separate protoc watch process by hand",
              ],
              answer: 1,
              explanation:
                "Cargo runs build.rs before compiling the crate, so the generated structs, client, and server trait exist before your code that uses them is checked.",
            },
            {
              kind: "predict",
              prompt:
                "A teammate changes an rpc's request message in the proto. You git pull and run `cargo build` without editing any Rust. What happens?",
              options: [
                "It builds; unknown fields absorb the difference",
                "It builds, but the first call fails at runtime",
                "Compile error: the regenerated trait no longer matches your impl",
                "build.rs fails because the proto changed",
              ],
              answer: 2,
              explanation:
                "Codegen reruns and the trait's method signature changes under your impl. Contract drift becomes a build failure, which is the whole point of compiling the contract.",
            },
            {
              kind: "mcq",
              prompt: "How does a tonic server relate to the tower ecosystem from the axum port?",
              options: [
                "It replaces tower with its own middleware system",
                "The generated server is itself a tower Service, so Layers compose around it exactly as they do around an axum Router",
                "tower is only used on the client side",
                "It uses tower, but only for connection pooling",
              ],
              answer: 1,
              explanation:
                "tonic rides hyper and tower like axum does, so tracing, timeout, and auth middleware carry over instead of being relearned.",
            },
          ],
        },
      ],
    },
    {
      slug: "calls-in-flight",
      title: "Calls in flight",
      description: "The four RPC shapes, and the concerns every production call carries.",
      lessons: [
        {
          slug: "grpc-rpc-shapes",
          title: "The four shapes of an RPC",
          summary: "Unary to bidirectional, each one a tokio Stream you already know.",
          contentFile: "grpc-rpc-shapes.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "The admin dashboard should show per-issue delivery progress as it happens. Which RPC shape fits?",
              options: [
                "Unary, called in a polling loop",
                "Server-streaming: one request, a stream of progress events back",
                "Client-streaming: the dashboard streams its interest",
                "Bidirectional, so both sides can talk",
              ],
              answer: 1,
              explanation:
                "The answer is a feed, which is exactly what a response-side stream is for. It replaces the poll loop; bidi would add a second direction nobody uses.",
            },
            {
              kind: "predict",
              prompt:
                "A client drops its WatchDelivery response stream mid-feed. The server's spawned producer task calls `tx.send(Ok(event))` again. What does the call return?",
              options: [
                "Ok(()); the runtime buffers events until the client returns",
                "Err(SendError): tonic dropped the ReceiverStream, so the channel has no receiver",
                "It blocks until a new client subscribes",
                "It panics, because the HTTP/2 stream was reset",
              ],
              answer: 1,
              explanation:
                "The client's reset drops the response stream, which drops the mpsc receiver. The closed-channel error is how the producer learns nobody is listening, and its cue to stop.",
            },
            {
              kind: "mcq",
              prompt:
                "In a client-streaming handler, `rows.message().await?` returns `Ok(None)`. What is it telling you?",
              options: [
                "The client finished sending: the stream's end, like Poll::Ready(None) from the streams lesson",
                "No row is ready yet; try again later",
                "The client disconnected abnormally",
                "The message decoded to an empty struct",
              ],
              answer: 0,
              explanation:
                "Ok(None) is end-of-sequence across the network. Not-ready-yet is handled by await suspending, and an abnormal end would surface as Err(Status).",
            },
          ],
        },
        {
          slug: "grpc-production-calls",
          title: "Deadlines, status, and one hot backend",
          summary:
            "Deadline propagation, metadata, the status vocabulary, and the L4 balancer trap.",
          contentFile: "grpc-production-calls.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Three worker replicas sit behind a Kubernetes ClusterIP Service. The API opens one tonic Channel and fires 300 concurrent RPCs. How do they distribute?",
              options: [
                "Roughly 100 per replica",
                "All 300 to one replica: the L4 balancer picked a backend per connection, and every RPC multiplexes over that one connection",
                "Randomly, rebalanced per RPC by kube-proxy",
                "They queue until more connections open",
              ],
              answer: 1,
              explanation:
                "kube-proxy balances connections, and HTTP/2 gives you one. Per-request spreading needs an L7 proxy or client-side balancing like Channel::balance_list.",
            },
            {
              kind: "mcq",
              prompt:
                "Your service received a call with a 5s deadline and has spent 2s. What timeout goes on its outgoing call to the next hop?",
              options: [
                "A fresh 5s; each hop owns its own budget",
                "Roughly the 3s that remain: propagate the remainder, never reset it",
                "None; tonic forwards deadlines automatically",
                "10s, to leave safety margin",
              ],
              answer: 1,
              explanation:
                "A deadline is an absolute instant, re-encoded as remaining time at each hop, and in Rust you do the subtraction yourself. Resetting it means computing answers after the caller has given up.",
            },
            {
              kind: "mcq",
              prompt:
                "A server-streaming call delivers 50 items, then the database dies. What does the client observe?",
              options: [
                "The 50 items are retracted and the call fails atomically",
                "50 Ok items, then Err(Status): grpc-status travels in HTTP/2 trailers, after the body",
                "The connection closes with no error information",
                "An HTTP 500 replaces the whole response",
              ],
              answer: 1,
              explanation:
                "The verdict comes last, in trailers, so a stream can fail partway and error handling must live inside the consuming loop. Hidden trailers are also why browsers need grpc-web.",
            },
          ],
        },
      ],
    },
    {
      slug: "replacing-the-table",
      title: "Replacing the table",
      description: "The delivery hand-off as a gRPC service, judged against the queue it replaces.",
      lessons: [
        {
          slug: "grpc-newsletter-project",
          title: "Project: the hand-off over gRPC",
          summary: "The proto, both ends, and an honest verdict against the queue it replaces.",
          xp: 25,
          contentFile: "grpc-newsletter-project.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "A deploy restarts the worker while 40 accepted-but-unsent jobs sit in its in-memory channel. What happens to them in the gRPC design versus the queue-table design?",
              options: [
                "Both recover: tonic persists accepted requests",
                "gRPC loses all 40 and nothing retries, since the API was already told accepted; the table design resumes from its surviving rows",
                "Both lose them; delivery is best-effort either way",
                "gRPC loses them but the API notices and re-sends automatically",
              ],
              answer: 1,
              explanation:
                "The channel dies with the process and the ack already happened, so no retry fires. The queue's rows sat in Postgres, which was exactly the crash-safety ch11 built.",
            },
            {
              kind: "mcq",
              prompt:
                "What did the old single Postgres transaction guarantee that the gRPC hand-off cannot?",
              options: [
                "That emails send in subscriber order",
                "That storing the issue, enqueueing delivery, and recording idempotency commit together or not at all: no dual-write window",
                "That the worker processes each issue exactly once",
                "That enqueueing is faster than an RPC",
              ],
              answer: 1,
              explanation:
                "Store-then-call and call-then-store both leave a crash window where the two facts disagree. Fixing it means an outbox written in the same transaction, which is a queue table again.",
            },
            {
              kind: "mcq",
              prompt: "Which part of the gRPC experiment is worth keeping for this system?",
              options: [
                "EnqueueIssue, because RPC hand-off is faster than polling",
                "Neither; gRPC has no place in this architecture",
                "WatchDelivery: streaming live progress to the dashboard beats polling a status column, while the durable hand-off stays a queue",
                "Both, with the worker persisting jobs before acking",
              ],
              answer: 2,
              explanation:
                "RPC fits synchronous questions that want live answers; durable, retryable background work wants a queue. The two edges compose, and each keeps the shape it is best at.",
            },
          ],
        },
      ],
    },
  ],
}
