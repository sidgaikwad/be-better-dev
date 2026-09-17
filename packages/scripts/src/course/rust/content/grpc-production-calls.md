A local function call either returns or fails. A remote call has a third state: nothing yet, from a peer that may be slow, overloaded, or gone. The email client lesson handled this with a reqwest timeout, one client's private setting. gRPC promotes the idea into the protocol, then surrounds it with the rest of what production calls need: metadata, a status vocabulary, and one famous load-balancing trap.

## Deadlines travel

```rust
let mut request = Request::new(issue);
request.set_timeout(Duration::from_secs(5)); // sent as the grpc-timeout header
let reply = client.enqueue_issue(request).await;
```

Two things happen. The client enforces the deadline locally, failing the call with `DEADLINE_EXCEEDED` at five seconds, timeout-as-race from Part 2. And the budget is transmitted, as the `grpc-timeout` header, so the server can stop doing work nobody will collect: tonic's server reads it and drops the handler's future when the budget runs out, which cancels it exactly as the cancellation lesson described.

The discipline that does not come for free is propagation. A deadline is an absolute instant; `grpc-timeout` re-encodes whatever remains at each hop. If the API gives the worker 5 seconds and the worker burns 2 before calling the email provider, the outgoing call should carry roughly 3, not a fresh 5. tonic will not do this for you, because Rust has no ambient request context: read the remaining budget from the incoming request and set it on outgoing ones. Subtract, never reset.

## Metadata and the status vocabulary

Metadata is gRPC's header layer: lowercase ASCII keys carrying request ids and auth tokens, with `-bin` suffixed keys for binary values (base64 on the wire). Interceptors, tonic's per-request hook, read and write it, filling the role the axum port section gave to tower middleware.

Errors use a fixed vocabulary of seventeen codes, not HTTP's zoo, and about eight do the real work: `INVALID_ARGUMENT`, `NOT_FOUND`, `ALREADY_EXISTS`, `FAILED_PRECONDITION`, `RESOURCE_EXHAUSTED`, `UNAVAILABLE`, `DEADLINE_EXCEEDED`, `INTERNAL`. The axis that matters is retryability: `UNAVAILABLE` means transient, try again (with the idempotency discipline from the fault-tolerance section, since a retry may duplicate work); `INVALID_ARGUMENT` means your request is wrong and retrying is spam. One wire detail has outsized consequences: `grpc-status` arrives in HTTP/2 trailers, after the body. A streaming call can therefore fail after delivering half its answer, so client loops must handle errors inside the loop. It is also why browsers, whose fetch API hides trailers, need the grpc-web translation layer.

## The balancer that balances nothing

You deploy three worker replicas behind a Kubernetes ClusterIP Service, point one channel at it, and watch one pod run hot while two sit idle. Nothing is misconfigured; the layers are doing exactly what they say. A tonic `Channel` opens one TCP connection and multiplexes every RPC over it as HTTP/2 streams (last lesson). An L4 balancer, which is what kube-proxy and an AWS NLB are, picks a backend per connection. One connection, one pick, every RPC to one pod. HTTP/1.1 services dodged this by accident: their connection pools opened many connections and scattered them. HTTP/2's efficiency removed the accident.

The fixes move the balancing decision to where requests are visible: an L7 proxy (Envoy, linkerd) that terminates HTTP/2 and balances per-stream, or client-side balancing, where the client knows every backend and spreads calls itself, `Channel::balance_list(endpoints)` in tonic, fed by DNS discovery such as a headless Service. Some fleets also cap server-side connection age, forcing periodic reconnects so L4 picks again.

## Predict, then verify

The API calls the worker with a 5-second deadline. The worker, ignoring propagation, calls the email provider with its own fresh 10-second timeout, and the provider hangs. Describe the failure from each side's point of view.

Answer: at t=5 the API gets `DEADLINE_EXCEEDED` and moves on, perhaps scheduling a retry. The worker keeps waiting until t=10, holding a task, a connection, and its slot of the concurrency budget, computing an answer whose audience already left. Under load, that gap is how one slow dependency exhausts resources a hop upstream of anyone watching it. Shrinking budgets at every hop is the entire content of deadline propagation, and it is a convention you enforce, not a feature you enable.
