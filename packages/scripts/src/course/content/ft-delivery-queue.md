One test still fails. Two subscribers; Postmark answers 200 then 500; the handler returns a 500; the author retries; the mock counts subscriber one's email twice. Why: the error path returned before `save_response`, the dropped `Transaction` rolled back, the idempotency stub vanished, and the retry started from scratch. Transactions protect database state, not Postmark calls: the workflow spans two systems, and transactionality dies at the boundary (two-phase commit exists; it is too complex and rarely supported to help).

An author expects that everyone got the issue, or that nobody did. Ours permits a third state: a 500, but some subscribers received it anyway. **Backward recovery** is semantic rollback via compensating actions: a checkout charged the customer for an item now out of stock, so refund and apologize; both ledger entries remain, but the state the customer cares about is restored. Email has no compensating action: you cannot unsend, and a follow-up asking subscribers to ignore it would be funny once. **Forward recovery** drives the workflow to completion anyway, passively (the caller retries until success; give up midway and the system stays inconsistent) or actively (the system heals itself in the background). The book goes active, and narrows what the endpoint promises: not delivered, but validated, recorded, and to be delivered asynchronously.

## Enqueue in the same transaction

`POST /admin/newsletters` stops sending email. It persists the issue into a new `newsletter_issues` table (id, title, both content bodies, timestamp), then builds the work list:

```sql
CREATE TABLE issue_delivery_queue (
    newsletter_issue_id uuid NOT NULL REFERENCES newsletter_issues (newsletter_issue_id),
    subscriber_email TEXT NOT NULL,
    PRIMARY KEY(newsletter_issue_id, subscriber_email)
);
```

`enqueue_delivery_tasks` fills it with one `INSERT ... SELECT email FROM subscriptions WHERE status = 'confirmed'`. This is why the book strong-armed us toward Postgres: the idempotency stub, the issue row, the task rows, and the saved response all commit in last lesson's single transaction. Either the issue and its complete task list exist, or nothing happened: transactionality recovered, because every piece of state lives in one database.

## Dequeue without collisions

Delivery moves to background workers, at least one per API instance, sharing one table. A naive `SELECT ... LIMIT 1` hands every worker the same row: duplicates again. Two clauses fix it:

```sql
SELECT newsletter_issue_id, subscriber_email
FROM issue_delivery_queue
FOR UPDATE
SKIP LOCKED
LIMIT 1
```

`FOR UPDATE` locks the returned row for the life of the surrounding transaction. `SKIP LOCKED` makes the SELECT ignore rows other transactions hold locked instead of blocking on them. Together they make stock Postgres a concurrency-safe queue: each worker claims an uncontested task. `dequeue_task` opens a transaction and returns it with the claimed pair; after sending, `delete_task` deletes the row and commits. A worker that dies mid-task takes its transaction with it: the lock evaporates and the row becomes claimable again. At-least-once, with delete-on-commit as the dedup.

The error policy is deliberately blunt: an invalid stored email is logged and skipped; a Postmark failure is logged and the task deleted anyway. No retries yet. The loop:

```rust
loop {
    match try_execute_task(&pool, &email_client).await {
        Ok(ExecutionOutcome::EmptyQueue) => {
            tokio::time::sleep(Duration::from_secs(10)).await
        }
        Err(_) => tokio::time::sleep(Duration::from_secs(1)).await,
        Ok(ExecutionOutcome::TaskCompleted) => {}
    }
}
```

Pause on error, pause longer on an empty queue (full-speed polling is an avalanche of pointless SELECTs), rip through a backlog otherwise. You built this shape in the worker-pools lesson with an mpsc channel; the channel became a durable table, `recv` became `SKIP LOCKED`, and the queue now survives restarts.

## One binary, two long-lived tasks

`run_worker_until_stopped` builds its own pool and `EmailClient`, so worker and API resources are tuned independently. `main` runs both:

```rust
let application_task = tokio::spawn(application.run_until_stopped());
let worker_task = tokio::spawn(run_worker_until_stopped(configuration));

tokio::select! {
    o = application_task => report_exit("API", o),
    o = worker_task => report_exit("Background worker", o),
};
```

The spawns matter: `select!` alone polls its branches inside one task, so a branch that stalls the thread starves the other, a pitfall the graceful-shutdown lesson warned about. Spawned, each side is a real task; `select!` watches for either to exit, logs which half died, and lets the process die so the supervisor restarts both.

## Predict, then verify

Two workers call `dequeue_task` at the same instant; the queue holds one task. What does each observe?

Answer: one wins the row lock and takes the task; the other's SELECT skips the locked row, finds nothing, reports `EmptyQueue`, and sleeps ten seconds. Without `SKIP LOCKED`, the loser would block until the winner commits, then find the row deleted, gaining nothing. With a plain SELECT, both would claim the task and the subscriber would get two copies. The three variants are why both clauses are needed.
