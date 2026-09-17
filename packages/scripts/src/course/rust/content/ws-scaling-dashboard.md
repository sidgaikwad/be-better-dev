It works on your laptop. Deploy two instances behind a load balancer and half the dashboards go quiet: the bar sits at zero while the issue delivers perfectly.

The reason is structural. The admin's socket is held by instance A. The delivery task for subscriber 18,500 was claimed by a worker in instance C, because the `FOR UPDATE SKIP LOCKED` queue from the fault-tolerance section hands each row to whichever worker asks first. C publishes progress into C's in-process hub, which holds no dashboards. An in-process fan-out is exactly as wide as the process, and no amount of local correctness fixes that. Sticky sessions are the tempting non-answer: a single issue's tasks are spread across every instance by design, so there is no instance to pin to.

## Publish out of process

Redis has been in the stack since the sessions lesson. Add one channel per issue:

```rust
// worker side, after delete_task commits
let payload = serde_json::to_string(&ProgressEvent { issue_id, sent, total })?;
redis.publish::<_, _, ()>(format!("delivery:progress:{issue_id}"), payload).await?;
```

```rust
// once per instance, at startup, on its own connection
let mut pubsub = client.get_async_pubsub().await?;
pubsub.psubscribe("delivery:progress:*").await?;
let mut stream = pubsub.on_message();

while let Some(msg) = stream.next().await {
    let event: ProgressEvent = serde_json::from_slice(msg.get_payload_bytes())?;
    hub.publish(event.issue_id, event);        // the local fan-out from the last two lessons
}
```

Two structural notes. A connection in subscribe mode cannot run ordinary commands, so redis-rs models it as a separate type rather than something you borrow from the pool: `client.get_async_pubsub()` in current versions, `get_async_connection().await?.into_pubsub()` in older code. And the subscription is per instance, not per connection. Ten instances serving five hundred dashboards is ten Redis subscribers, not five thousand: Redis fans out to instances, each instance to its own sockets, and the per-connection queue with its drop policy stays where the last lesson put it.

Redis pub/sub is at-most-once, with no persistence and no replay, so an event published while an instance reconnects is gone. That is the trade the NATS lesson named, right here for the same reason: events carry absolute counts, so the next supersedes the gap. If you needed replay, Redis Streams gives you ids and a pending list, at the cost of trimming and claim logic you run yourself.

Slow consumers reappear one layer up, already decided for you. Redis ships `client-output-buffer-limit pubsub 32mb 8mb 60`: a subscriber whose output buffer passes 32 MB, or stays above 8 MB for 60 seconds, is disconnected. That is the drop-versus-disconnect choice you just made, made for you with a different default. Every hop in a push pipeline has a slow-consumer policy; on the hops you did not write, learn it before production tells you.

## The dashboard, end to end

The route sits beside every other admin route and inherits its session middleware, so the browser's cookie rides along on the handshake and `AdminUser` rejects strangers with a 401 before any upgrade. Cookie auth is what actually works from a page, because the `WebSocket` constructor cannot set headers. A bearer token needs the ticket pattern: POST for a short-lived single-use ticket, pass it in the query string, redeem it in the handler.

```js
const ws = new WebSocket(`wss://${location.host}/admin/newsletters/${id}/progress/ws`)

ws.onmessage = (e) => {
  const { sent, total } = JSON.parse(e.data)
  bar.style.width = `${(100 * sent) / total}%`
  label.textContent = `${sent.toLocaleString()} of ${total.toLocaleString()} sent`
}
ws.onclose = () => scheduleReconnect() // backoff with jitter, then re-fetch the snapshot
```

Use `wss://`, not only because a page served over HTTPS may not open a plain `ws://`, but because an encrypted tunnel is opaque to the middleboxes the masking lesson described, so connections survive far more networks.

## One level deeper: what a deploy does now

Per connection you hold a tungstenite stream, two tasks, a 32-slot queue, and a timer: low tens of kilobytes, so tens of thousands of connections per instance is unremarkable, and the first ceiling is usually file descriptors (`ulimit -n`, still 1024 by default in many images).

What changes is the shape of a restart. With HTTP, draining an instance costs in-flight requests measured in milliseconds. With WebSockets, every connection on that instance dies at once and every one reconnects inside your backoff window. Wire the graceful-shutdown lesson's `CancellationToken` through to the hub so each connection sends `Message::Close` with code 1012, Service Restart, and make certain the client's backoff carries jitter. Otherwise a routine deploy is a thundering herd you built yourself.

## Predict, then verify

Three API instances. The admin's dashboard is connected to instance A. The task that emails subscriber 18,500 is claimed by a worker in instance C. How many WebSocket frames does instance B write for that event, and what breaks if the worker publishes to an in-process channel instead?

Answer: zero. B receives the Redis message like everyone else, looks up that issue in its local hub, finds no subscribers, and drops it. That is the design working: the event crosses the network once per instance and becomes a frame only where a socket wants one. With an in-process channel, C's progress reaches only dashboards connected to C, so the admin on A watches a motionless bar while fifty thousand emails send flawlessly. The failure is invisible on a laptop, where there is one instance, and appears the day you scale to two.
