Save-and-replay sounds like one table and two queries: store a response under `(user_id, idempotency_key)`, fetch it on retry. Then you try to write the column type for "a response" and meet actix-web: `HttpResponse` has no serialization support, and a blob of raw wire bytes would be miserable to re-hydrate. So we decompose. A response is a status code, headers, and a body; the book skips the version by assuming HTTP/1.1.

First, which database? Redis would give `(user_id, key, response)` triplets a time-to-live for free. But the book spoils its own plot: soon we will need to modify idempotency rows and application state inside a single SQL transaction, and Redis cannot join a Postgres transaction. Postgres it is.

## A struct, in SQL

Status codes fit `SMALLINT`. The body is `BYTEA`. Headers are the awkward part: repeated (name, value) pairs where the name is text but the value must be `BYTEA`, because HTTP header values may contain opaque octets. Postgres has no array-of-tuples type. It does have composite types, a named collection of fields, the equivalent of a struct:

```sql
CREATE TYPE header_pair AS (
    name TEXT,
    value BYTEA
);

CREATE TABLE idempotency (
    user_id uuid NOT NULL REFERENCES users(user_id),
    idempotency_key TEXT NOT NULL,
    response_status_code SMALLINT NOT NULL,
    response_headers header_pair[] NOT NULL,
    response_body BYTEA NOT NULL,
    created_at timestamptz NOT NULL,
    PRIMARY KEY(user_id, idempotency_key)
);
```

The composite primary key delivers the per-user scoping from the last lesson, and `created_at` exists so old keys can be evicted someday. A nested `http_response` composite holding all three parts would be tidier; a sqlx bug, itself downstream of a rustc bug, rules out nesting for now.

sqlx needs three nudges to speak `header_pair`. A derive maps the Rust struct to the Postgres type by name:

```rust
#[derive(Debug, sqlx::Type)]
#[sqlx(type_name = "header_pair")]
struct HeaderPairRecord {
    name: String,
    value: Vec<u8>,
}
```

Reads need an explicit annotation, `response_headers as "response_headers: Vec<HeaderPairRecord>"`, because `sqlx::query!` cannot infer custom types. The INSERT needs `query_unchecked!`, surrendering verification the macro cannot perform on custom types, plus an implementation of `PgHasArrayType` returning `_header_pair`, Postgres' implicit name for the array type (the element prefixed with an underscore).

## The MessageBody detour

`save_response` must obtain the body's bytes, and `.body()` returns `&B`, where the full type is `HttpResponse<B = BoxBody>`. The response type has been generic over its body for the entire book, hidden behind a default parameter. The reason is HTTP streaming: with `Transfer-Encoding: chunked`, a server can produce a body chunk by chunk and never hold it all in memory, useful for huge files and large query results. actix-web models this with the `MessageBody` trait, whose `poll_next` yields one chunk at a time. `BoxBody`, the default, is an enum over the strategies: no body, bytes already in memory, or a boxed stream.

actix-web ships `to_bytes`, which polls to completion and buffers everything into one `Bytes`. The first attempt does not compile:

```rust
let body = to_bytes(http_response.body()).await.unwrap();
// error[E0277]: the trait bound `&BoxBody: MessageBody` is not satisfied
```

`BoxBody` implements `MessageBody`; a shared reference to it does not, and the refusal means something. Pulling a chunk mutates the stream, and a pulled chunk cannot be replayed, so draining a body requires owning it. The working pattern is a small ceremony: `.into_parts()` splits the response into head and owned body, `to_bytes(body)` buffers it, and `.set_body(body).map_into_boxed_body()` reassembles a response when you are done. That forces the signature: `save_response` takes `HttpResponse` by value and returns a rebuilt, owned `HttpResponse` on success. Replay is the mirror image: `StatusCode::from_u16`, `HttpResponse::build(status)`, one `append_header((name, value))` per stored pair, then `.body(stored_bytes)`.

One production note: streaming exists so servers never hold large payloads resident, and `to_bytes` trades that away. Free here, since the stored response is a small 303 redirect; for large bodies it is real memory pressure, and a footnote sketches the alternative, streaming the body into the database and back out.

## Predict, then verify

In the final handler, the replay branch does not just return the saved response; it first calls `success_message().send()` to re-emit the flash message. If the entire response was saved, why is that call needed?

Answer: the flash message is not in the stored bytes. `FlashMessage::send` goes through a side channel that the flash-messages middleware converts into a cookie as the response leaves the app, after the handler returns, so the response captured by `save_response` predates that header. A replay that skipped the call would hand back a bare redirect with no confirmation banner: observably different from the first response, which is the one thing idempotency forbids.
