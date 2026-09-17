Save-and-replay survives the sequential story: request completes, retry arrives, stored response comes back. The chapter's next test deletes the word "sequential": mock Postmark with a two-second delay, then submit the same form twice, concurrently:

```rust
let response1 = app.post_publish_newsletter(&newsletter_request_body);
let response2 = app.post_publish_newsletter(&newsletter_request_body);
let (response1, response2) = tokio::join!(response1, response2);

assert_eq!(response1.status(), response2.status());
assert_eq!(response1.text().await.unwrap(), response2.text().await.unwrap());
// the mock verifies the email went out **once**
```

One request gets a 303, the other a 500 whose logs read `duplicate key value violates unique constraint "idempotency_pkey"`. Worse, the mock counted two emails: both requests ran the dispatch loop before either tried to save.

## Why read-then-write breaks

The current handler checks the store, processes, and saves at the end. Both duplicates SELECT, find nothing, conclude they are first, and process: the check and the write are separated by seconds of email dispatch. A `tokio::sync::Mutex` around the handler cannot fix it: the API runs replicated behind a load balancer, the duplicates may land on different machines, and an in-memory lock synchronizes one process. Cross-request synchronization must live somewhere every instance shares, and there is exactly one such place: Postgres.

## Insert first, inside a transaction

The fix moves the INSERT to the start of the handler. The response is unknown there, so a migration drops `NOT NULL` from the three response columns; the row begins as a stub of `(user_id, idempotency_key, created_at)`. `try_processing` opens a transaction and runs:

```sql
INSERT INTO idempotency (user_id, idempotency_key, created_at)
VALUES ($1, $2, now())
ON CONFLICT DO NOTHING
```

`ON CONFLICT` chooses what an INSERT does when it trips a constraint: `DO NOTHING` swallows the violation (visible as `rows_affected() == 0`), `DO UPDATE` would modify the existing row. The handler branches on the count:

```rust
pub enum NextAction {
    StartProcessing(Transaction<'static, Postgres>),
    ReturnSavedResponse(HttpResponse),
}
```

One row inserted: this request owns the operation and carries the still-open transaction forward. Zero rows: someone else got there first; fetch and replay their saved response. `save_response` becomes an UPDATE of the stub through that same transaction, then `commit`.

## Why the loser waits instead of erroring

The book had already chosen waiting over a 409 rejection, since browsers do not retry 409s on their own. The waiting falls out of Postgres' default isolation level, READ COMMITTED: a plain SELECT sees only data committed before it began, but an INSERT, UPDATE, DELETE, or SELECT FOR UPDATE that targets a row an in-flight transaction has written blocks until that transaction commits or rolls back.

Request A inserts the stub and keeps its transaction open while it dispatches emails. Request B's INSERT collides with the uncommitted stub and waits. A commits: B's insert resolves to DO NOTHING, zero rows, and B replays A's response, identical status and body, one email total. A rolls back: B's insert succeeds and B takes over processing as if it had been first. One statement encodes the lock, the dedup, and the failover. The price: both connections stay open while B idles; a footnote recommends fair-usage limits.

## Isolation levels, honestly

Isolation levels are defined by which anomalies a transaction may observe. Dirty read: seeing uncommitted data (Postgres never permits it, even under READ UNCOMMITTED). Non-repeatable read: re-reading a row and finding it changed. Phantom read: re-running a predicate query and finding new rows. READ COMMITTED permits the last two. REPEATABLE READ runs against a stable snapshot (Postgres' implementation excludes phantoms too). SERIALIZABLE promises an outcome equal to some serial ordering, at the price of more aborts.

Stricter is not safer here; it is different. The book proves it with one line, `SET TRANSACTION ISOLATION LEVEL repeatable read`, inside `try_processing`. The waiting request now dies with `could not serialize access due to concurrent update`: under repeatable read (and serializable), a transaction may not modify or lock rows changed by transactions that committed after its snapshot was taken. Wait-then-replay is correct at READ COMMITTED specifically. An isolation level is a design input to verify, not a dial you turn up for reassurance.

## Predict, then verify

Request A inserts the stub and starts dispatching. Request B blocks on its INSERT. A hits a Postmark error, returns a 500, and its uncommitted `Transaction` is dropped. What does B do next?

Answer: dropping an uncommitted sqlx `Transaction` rolls it back, so A's stub evaporates. B's blocked INSERT then succeeds, `rows_affected()` is 1, and B becomes the owner: it runs the full dispatch itself, a second attempt the author never had to click. What it does not fix: subscribers A already emailed receive the issue again, because no transaction covers Postmark. That hole is the next lesson's subject.
