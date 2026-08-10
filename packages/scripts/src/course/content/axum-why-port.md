The book ends with a deployed, instrumented, fault-tolerant newsletter service and a test suite that drills it over real HTTP. This section asks for something the book never does: remove actix-web from `Cargo.toml` and rebuild the service on axum. Not because actix failed you. Because right now you cannot say which parts of the last ten sections were actix, which were Rust, and which were architecture. A port measures that.

## Three kinds of knowledge, tangled

Building the service braided three skills together:

- **Framework knowledge.** `web::Data`, `HttpResponse::Ok().finish()`, `ResponseError`, the `App` factory closure, actix-session.
- **Rust knowledge.** Ownership across `.await`, error enums with `thiserror`, newtypes that reject invalid subscriber names at construction.
- **Architecture.** Black-box tests, the confirmation flow, idempotency keys, the background delivery worker.

From inside one framework the three are indistinguishable; everything feels like "how you write web services in Rust". The port is a controlled experiment that pulls them apart. Whatever survives unchanged was never framework knowledge, whichever chapter taught it. Whatever needs rewriting is the framework-shaped residue. You do not have to argue about it: the diff is the measurement.

## Where axum sits

axum is maintained by the tokio project, and it is deliberately small: a router, an extractor system, and little else. Everything other frameworks build in, axum delegates to **tower**, an ecosystem organised around one trait:

```rust
pub trait Service<Request> {
    type Response;
    type Error;
    type Future: Future<Output = Result<Self::Response, Self::Error>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>>;
    fn call(&mut self, req: Request) -> Self::Future;
}
```

After Part 2 you can read this cold: `call` takes a request and returns a future of a response; `poll_ready` is the valve from the backpressure lesson, a service saying "not yet" before you hand it work. Middleware is a `Layer`: a function from one `Service` to a wrapped `Service`. hyper speaks this trait. tonic, the gRPC framework waiting in Part 4, speaks it. `tower-http` ships generic middleware (tracing, timeouts, compression, request ids) that works with all of them.

actix-web predates this convergence and made the other reasonable choice: its own `Service` and `Transform` traits, its own middleware crates. Middleware written for actix runs only in actix. That is self-containment, not a defect, but it scopes the knowledge to one framework, where a tower `Layer` you write once can front your HTTP API today and your gRPC server next quarter.

## The shape of the work

The plan for the rest of the section: map `HttpServer` and `App` onto `Router` and `State`, move `ResponseError`'s job into `IntoResponse`, swap the middleware stack for tower layers, then take an honest inventory of everything that never changed. The book's test suite comes along unmodified as the referee: it speaks HTTP, not actix, so it gets to judge whether the ported service is still the same service.

## Predict, then verify

Before reading any diff: the service's source includes `startup.rs` (server construction), `routes/subscriptions.rs` (the subscribe handler), `domain/subscriber_email.rs` (the validated newtype), and `issue_delivery_worker.rs` (the ch. 11 loop). Rank them from most changed to least changed by the port.

Answer: `startup.rs` changes most; server construction is the densest concentration of framework API in the codebase. `routes/subscriptions.rs` changes at the edges: extractor types in the signature, the return type, while the body logic stays. `issue_delivery_worker.rs` and `domain/subscriber_email.rs` do not change at all; the worker is tokio plus sqlx, and the domain type is pure Rust. That gradient, framework density falling as you approach the domain, is this whole section in miniature.
