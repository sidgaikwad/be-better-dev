Chapter 10 left `POST /admin/newsletters` in respectable shape: session-authenticated, driven by an HTML form, tested. The handler fetches every confirmed subscriber and emails them one at a time, abridged from the book:

```rust
let subscribers = get_confirmed_subscribers(&pool).await.map_err(e500)?;
for subscriber in subscribers {
    match subscriber {
        Ok(subscriber) => {
            email_client
                .send_email(&subscriber.email, &title, &html_content, &text_content)
                .await
                .map_err(e500)?; // first Postmark error aborts the loop
        }
        Err(error) => {
            tracing::warn!(error.cause_chain = ?error, "Skipping an invalid stored email");
        }
    }
}
FlashMessage::info("The newsletter issue has been published!").send();
Ok(see_other("/admin/newsletters"))
```

The limitations lesson at the end of the delivery section named the debts; chapter 11 pays them. It starts the way reliability work should start: enumerate exactly what can fail, and price each failure. The stated goal is best-effort delivery: reach every subscriber, minimize duplicates, guarantee neither absolutely.

## Five failure modes, five blast radii

**Invalid input.** Malformed form data never reaches the handler body: the `web::Form` extractor answers `400 Bad Request`. An unauthenticated user is redirected to login. Blast radius: zero emails. Already handled, and harmless to retry.

**Postgres.** `get_confirmed_subscribers` can fail. The book returns a 500 rather than retrying in process: you can only retry a finite number of times before giving up anyway, and the author can decide whether to resubmit. Blast radius: still zero, because the failure precedes the first send.

**The email API.** Postmark errors on subscriber k of N, and `?` aborts with a 500. Now the blast radius depends on k. First subscriber: nothing happened, retry freely. Hundredth: ninety-nine inboxes have the issue and the rest never will, unless the author retries, in which case the first ninety-nine get it twice. Damned if you do, damned if you don't. And nothing can roll this back. The transactions lesson in the confirmation-emails section wrapped a multi-query workflow in one SQL transaction; there is no equivalent across someone else's HTTP API. Each Postmark call is its own unit of work.

**A crash.** Out of memory, or the machine is terminated mid-loop (welcome to the cloud). Same partial state as an API error at some unknown k, except no error-handling code runs at all; the author sees a dead connection in the browser and, naturally, resubmits.

**The author.** Even a healthy run over a large list takes minutes. The author gets impatient and resubmits, the browser gives up with a client-side timeout, or they double-click Submit. Duplicate processing with no server-side fault anywhere.

## The one-bit response

Underneath four of the five sits one asymmetry. The server's true state is "k of N sent", a number that grows as the loop runs. The HTTP response compresses that to a single bit: 303 or 500. The caller cannot recover k from the bit, so their only lever replays the whole workflow from the top, against a freshly fetched subscriber list.

Distributed systems has vocabulary for the caller's two policies. Never retry, and each subscriber receives the issue at most once: no duplicates, but a mid-loop failure leaves permanent holes. Retry until success, and each receives it at least once: the holes eventually fill, but early subscribers collect duplicates. Exactly-once delivery over a network is not on the menu; you choose which anomaly you can live with and engineer to make it rare. The chapter's answer, assembled across this section, is at-least-once plus deduplication, which from where a subscriber sits behaves like exactly-once.

## Predict, then verify

Ten confirmed subscribers. The process crashes right after the seventh send completes. The author resubmits the form, and this run finishes cleanly. How many copies do subscriber 1 and subscriber 10 receive?

Answer: two and one. The retry restarts the loop from the top with a fresh subscriber list, so subscribers 1 through 7 are sent the issue again (two copies each) while 8 through 10 receive their first. One retry filled the holes and minted the duplicates in the same stroke: at-least-once, exactly as defined, and the reason the next lesson makes retries something the server can recognize and neutralize.
