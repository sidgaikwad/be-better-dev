The admin dashboard from Part 3 grows a button: draft subject lines for this issue. A good model needs twenty seconds to write five options, and twenty seconds behind a spinner feels broken. The fix is the same everywhere: providers stream the response as it is generated, and they nearly all stream it the same way, server-sent events over an ordinary HTTP response.

## The wire format

SSE is a text protocol: a stream of events separated by blank lines, each event a handful of `field: value` lines. An LLM completion stream in the common OpenAI-compatible shape looks like this on the wire:

```
data: {"choices":[{"delta":{"content":"Ship"}}]}

data: {"choices":[{"delta":{"content":" faster"}}]}

data: [DONE]
```

Each `data:` line carries a JSON fragment holding a few characters of new text, the delta. Some providers add an `event:` line naming each event's type; the parser just gains one more field. There is no magic here: it is chunked HTTP with a framing convention old enough to predate WebSockets.

## Parsing it with reqwest

reqwest exposes a response body as a byte stream (the `stream` feature). The one honest difficulty: chunks arrive at TCP boundaries, not event boundaries. One chunk may hold three events; an event may split across two chunks, occasionally in the middle of a multi-byte character. So you buffer and split on the blank line:

```rust
let resp = client.post(url).bearer_auth(key).json(&req)
    .send().await?
    .error_for_status()?;

let mut body = resp.bytes_stream();
let mut buf = String::new();

while let Some(chunk) = body.next().await {
    buf.push_str(std::str::from_utf8(&chunk?)?); // production code buffers bytes: a chunk can split a UTF-8 char
    while let Some(i) = buf.find("\n\n") {
        let event: String = buf.drain(..i + 2).collect();
        let Some(data) = event.strip_prefix("data: ") else { continue };
        if data.trim() == "[DONE]" { return Ok(()); }
        let delta: Delta = serde_json::from_str(data.trim())?;
        // hand delta.text to whoever is listening
    }
}
```

The `eventsource-stream` crate does this framing correctly, split characters included, and `reqwest-eventsource` adds reconnection on top. Write the loop once to understand it, then use the crate.

## Forwarding it, with backpressure for free

The dashboard talks to your API, not to the provider, so the relay endpoint turns that loop into a `Stream` and hands it to axum:

```rust
let stream = async_stream::stream! {
    // the parsing loop from above, but each delta becomes:
    yield Ok::<_, Infallible>(Event::default().data(delta.text));
};
Sse::new(stream).keep_alive(KeepAlive::default())
```

Backpressure needs no code, and Part 2 explains why: streams are pull-based. axum polls your stream only when the client's socket can accept more; while you are not polled, you stop reading the provider's body; the provider's TCP send window fills. A slow phone on hotel wifi slows the whole pipeline to its own pace, and nothing buffers without bound. It is the bounded queue argument again, enforced by TCP instead of a channel.

## Expensive calls change the discipline

Chapter 7 set the rules for outbound HTTP: one reused `Client`, timeouts always. An LLM call keeps the rules and changes the numbers. A single total timeout is now wrong, because a legitimate response may stream for a minute. Keep `connect_timeout` small, then bound the silence between chunks instead: `read_timeout` on the client (reqwest 0.12) or `tokio::time::timeout` around each `next()`.

Retries change more, because a retry re-runs a metered generation. Before the first token reaches your caller, retrying a 429 or 5xx with jittered backoff, honoring `Retry-After`, is safe and standard. After you have forwarded tokens, it is not: generation is not idempotent, so a retry produces a different answer, and you cannot un-send the half you already streamed. Fail visibly and let the human ask again.

## Predict, then verify

The admin starts a draft, reads the first two suggestions, and closes the tab. What happens to the provider call your relay is holding open?

Answer: the disconnect makes axum drop your SSE stream, which drops the relay future mid-await, which drops the reqwest response and closes the connection. Cancellation propagates by drop, exactly as in Part 2's cancellation lesson, and a well-behaved provider notices the closed socket and stops generating, which stops the meter. The relay does no work, and spends no money, for a reader who left.
