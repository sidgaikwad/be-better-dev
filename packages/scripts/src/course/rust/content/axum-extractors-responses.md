Here is `subscribe` before and after, signatures only:

```rust
// actix
pub async fn subscribe(
    form: web::Form<FormData>,
    pool: web::Data<PgPool>,
    email_client: web::Data<EmailClient>,
    base_url: web::Data<ApplicationBaseUrl>,
) -> Result<HttpResponse, SubscribeError>
```

```rust
// axum
pub async fn subscribe(
    State(pool): State<PgPool>,
    State(email_client): State<EmailClient>,
    State(base_url): State<ApplicationBaseUrl>,
    Form(form): Form<FormData>,
) -> Result<StatusCode, SubscribeError>
```

`FormData` and its serde derive are untouched, and so is everything the signature feeds: `form.try_into()?` still runs the domain validation from the type-driven section. Two things changed. The extractors destructure right in the argument list, so `.get_ref()` and `.0` disappear from the body. And `Form` moved to the end of the list. That second change is not style.

## The body rule

axum sorts extractors into two families. Implementors of `FromRequestParts` read request metadata: method, URI, headers, extensions. `State`, `Path`, `Query`, and `HeaderMap` live here; they are cheap, repeatable, and may appear in any number and any order. Implementors of `FromRequest` consume the whole request, body included: `Form`, `Json`, `Bytes`, `String`. The body is a stream arriving off a socket, readable exactly once, so a handler gets at most one of these and it must be the final argument.

actix lives with the same physical constraint but polices it per request, at runtime. axum states it in the trait system: put `Form` first and the function quietly stops implementing the `Handler` trait, which surfaces as a wall of trait-bound errors at the `.route(...)` call, nowhere near the real mistake. `#[axum::debug_handler]` exists for exactly this; it turns the wall into a one-line diagnosis.

`confirm` shows the metadata family:

```rust
pub async fn confirm(Query(parameters): Query<Parameters>) -> StatusCode
```

Path parameters work the same way, with one recent move to know about: axum 0.7 wrote route templates as `/subscriptions/:token`, and axum 0.8 (January 2025) changed the syntax to `/subscriptions/{token}`. The old colon form is rejected when the router is built, so a tutorial disagreeing with your compiler is usually a version skew, not a bug.

## When extraction fails

In actix, a `Form` that failed to deserialize answered 400. axum is choosier: a wrong `Content-Type` is 415 Unsupported Media Type, and a well-typed body that serde cannot deserialize, say a missing `email` field, is 422 Unprocessable Entity. Our own validation, the empty-name and malformed-email checks behind `TryInto`, still answers whatever our error type decides: 400, unchanged, because that code is ours. Domain rejections port untouched; framework rejections carry the framework's opinion. File that distinction away: the test suite will have something to say about it shortly.

## Responses

actix handlers built `HttpResponse` values; axum handlers return any type implementing `IntoResponse`, and the mapping is close to search-and-replace:

- `HttpResponse::Ok().finish()` becomes `StatusCode::OK`
- the admin dashboard's page becomes `Html(page)`
- the `see_other` helper the book hand-wrote becomes `Redirect::to("/admin/dashboard")`, which answers 303 See Other, the exact status the book chose: the browser follows with a GET, so refreshing the landing page repeats a harmless GET instead of the POST
- tuples compose the rest: `(StatusCode::OK, [(header::CONTENT_TYPE, "text/html")], page)`

`Result<T, E>` is a response whenever both sides are. Making the `E` side hold up its end is the next lesson.

## Predict, then verify

A client sends `POST /subscriptions` with `Content-Type: application/json` and the perfectly valid body `{"name":"le guin","email":"ursula@example.com"}`. The handler uses `Form<FormData>`. What status comes back?

Answer: 415, and the handler body never runs. `Form` checks the declared content type before touching a byte, so the data being deserializable never enters into it: the client spoke the wrong dialect. A 422 would have meant "right dialect, could not build your shape from it"; a 400 from this route means our own validation read the values and refused them. Three failure modes, three statuses, each naming exactly which layer was disappointed.
