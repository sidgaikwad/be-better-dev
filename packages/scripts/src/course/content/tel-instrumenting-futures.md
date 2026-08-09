Why is holding a span guard in an async function a recipe for disaster? The reason sits in Part 2's state-machine lesson: an `async fn` compiles to a state machine that the executor polls. When a poll hits an `.await` that is not ready, the future returns `Pending` and parks; the worker thread does not wait, it picks up a different task. Later, possibly on a different worker thread, the future is polled again and resumes.

Now recall how span activation works: entering writes the span id into a thread-local on the current thread. Hold an `Entered` guard across an `.await` and both directions go wrong:

- While our future is parked, that worker's thread-local still says "inside `request_span`". Anything else it runs without entering its own span is misattributed to our request.
- When our future resumes on another worker, that thread never entered the span, so our own events fall outside it.

The guard tells the truth about a thread. A future is not pinned to a thread.

## Enter on poll, exit on park

The fix is to mimic the future's real lifecycle: enter the span every time the future is polled, exit it every time the future parks. `tracing` packages that as `Instrument`, an extension trait for futures:

```rust
use tracing::Instrument;

let query_span = tracing::info_span!("Saving new subscriber details in the database");
// No `.enter()`: `.instrument` enters and exits at the right moments.
sqlx::query!(/* .. */)
    .execute(pool.as_ref())
    .instrument(query_span)
    .await
```

Run with `RUST_LOG=trace` and the markers repeat:

```text
TRACE -> Saving new subscriber details in the database
TRACE <- Saving new subscriber details in the database
TRACE -> Saving new subscriber details in the database
TRACE <- Saving new subscriber details in the database
TRACE -- Saving new subscriber details in the database
```

Each `->`/`<-` pair is one poll of the query future. The span turns the executor's private scheduling into observable data: you can count how many polls it took before Postgres answered. This is also why the last lesson insisted exiting is not closing: the unit of work pauses many times and ends once.

## Attach the span to the declaration

Wrapping a whole function in a span is so common that hand-rolling `let span = ...` everywhere becomes noise. The `tracing::instrument` procedural macro moves the ceremony onto the declaration:

```rust
#[tracing::instrument(
    name = "Adding a new subscriber",
    skip(form, pool),
    fields(
        request_id = %Uuid::new_v4(),
        subscriber_email = %form.email,
        subscriber_name = %form.name
    )
)]
pub async fn subscribe(form: web::Form<FormData>, pool: web::Data<PgPool>) -> HttpResponse {
    match insert_subscriber(&pool, &form).await {
        Ok(_) => HttpResponse::Ok().finish(),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}
```

It creates a span at each invocation and records the function's arguments as span fields; `skip` excludes the unhelpful ones, `fields` adds more, `name` overrides the default (the function name). Applied to an `async fn`, it uses `Instrument::instrument` under the hood, so the guard hazard cannot be reintroduced by accident.

The chapter pairs the macro with a refactor: the query moves into its own instrumented function, `insert_subscriber(pool, form)`, which returns `Result<(), sqlx::Error>` and knows nothing about the web framework, while `subscribe` orchestrates and speaks HTTP. A bonus falls out: the error event, logged inside `insert_subscriber`, now lands within the query span instead of outside it. Instrumentation lives on declarations, bodies stay business logic. The book calls this the pit of success: the right thing became the easiest thing.

## Predict, then verify

Suppose you skip both the macro and `.instrument`, and instead hold `let _g = query_span.enter();` across the `.await` on a multi-threaded runtime. The query parks once and resumes on another worker. Where does an event emitted after the resume land?

Answer: outside `query_span`. The resuming worker's thread-local was never set, so the event has no connection to our span; meanwhile the original worker still counts as inside `query_span` until the guard drops, misattributing whatever it runs next unless that work enters a span of its own. `.instrument` fixes both sides by binding the span to the future's polls rather than to any particular thread.
