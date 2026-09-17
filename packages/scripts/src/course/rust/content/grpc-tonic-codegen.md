A `.proto` file both teams merely promise to follow is the shared table with nicer syntax. tonic, the Rust gRPC implementation, turns the promise into a build step: the contract is compiled into Rust before your crate builds, so code that disagrees with the contract does not compile at all.

## Three crates and a build script

```toml
[dependencies]
tonic = "0.12"
prost = "0.13"
tokio = { version = "1", features = ["macros", "rt-multi-thread"] }
tokio-stream = "0.1"

[build-dependencies]
tonic-build = "0.12"
```

`prost` is the protobuf runtime (encoding, decoding, the message derive); `tonic-build` is the code generator. It runs from a build script:

```rust
// build.rs
fn main() -> Result<(), Box<dyn std::error::Error>> {
    tonic_build::compile_protos("proto/newsletter.proto")?;
    Ok(())
}
```

Cargo runs `build.rs` before compiling your crate. `tonic-build` drives `protoc`, which must be installed (`brew install protobuf`, `apt install protobuf-compiler`, or point the `PROTOC` env var at a binary), and writes `newsletter.rs` into `OUT_DIR`. Version note: tonic 0.12 and 0.13 pair with prost 0.13 as shown; the 0.14 line moved prost support into `tonic-prost` and `tonic-prost-build` with the same `compile_protos` entry point, so take both versions from the same row of tonic's compatibility table.

## The generated halves

You pull the generated module in by package name, not file name:

```rust
pub mod newsletter {
    tonic::include_proto!("newsletter");
}
```

Inside are the message structs (with `prost::Message`, `Clone`, `PartialEq`, and `Default` derived), a client, and a server trait. The server half is where the contract bites:

```rust
use newsletter::delivery_server::{Delivery, DeliveryServer};
use newsletter::{EnqueueReply, NewsletterIssue};
use tonic::{Request, Response, Status};

pub struct DeliveryService;

#[tonic::async_trait]
impl Delivery for DeliveryService {
    async fn enqueue_issue(
        &self,
        request: Request<NewsletterIssue>,
    ) -> Result<Response<EnqueueReply>, Status> {
        let issue = request.into_inner();
        if issue.title.is_empty() {
            return Err(Status::invalid_argument("title must not be empty"));
        }
        Ok(Response::new(EnqueueReply { accepted: true }))
    }
}
```

`Request<T>` wraps your message with metadata and extensions; `into_inner` unwraps to the plain struct. Serving and calling are symmetric:

```rust
tonic::transport::Server::builder()
    .add_service(DeliveryServer::new(DeliveryService))
    .serve("0.0.0.0:50051".parse()?)
    .await?;

let mut client = DeliveryClient::connect("http://worker:50051").await?;
let reply = client.enqueue_issue(issue).await?.into_inner();
```

## Tower again

From the axum port section you know that axum's `Router` is a tower `Service` and its middleware are `Layer`s. `DeliveryServer<T>` is also a tower `Service`, running on hyper and HTTP/2 underneath, and `Server::builder().layer(...)` composes middleware the same way: tracing, timeouts, concurrency limits, auth interceptors. tonic is not a new web ecosystem; it is the one you already operate, speaking a different dialect.

## One level deeper: what a call is

On the wire, `enqueue_issue` is an HTTP/2 POST to `/newsletter.Delivery/EnqueueIssue` with content-type `application/grpc`. The body is a 5-byte frame prefix (one compression flag byte, then a 4-byte big-endian length) followed by the message bytes from the last lesson; the response is framed the same way, with the verdict delivered in HTTP/2 trailers (that detail matters in the deadlines lesson). The generated client and server are, at bottom, prost codecs plugged into that framing. No reflection, no runtime schema registry: everything was decided at build time.

## Predict, then verify

A teammate edits the proto: `EnqueueIssue` now takes a new `EnqueueIssueRequest` message instead of `NewsletterIssue`, and `EnqueueReply.accepted` is renamed to `queued`. You `git pull` and run `cargo build` without opening a single Rust file. What happens, and when?

Answer: `build.rs` reruns, the generated trait's method signature changes, and your `impl Delivery` no longer matches it: the compiler reports the mismatched method and the missing `accepted` field before any binary exists. The shared-table version of this exact drift, a renamed column, would have shipped cleanly and failed in the worker at runtime. The failure did not shrink; it moved left, from production to `cargo build`, which is the whole argument for compiling your contracts.
