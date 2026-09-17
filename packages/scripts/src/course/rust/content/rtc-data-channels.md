The `webrtc` crate is a pure-Rust port of Pion, the Go implementation that powers much of the server-side WebRTC world. Ported means ported faithfully: the whole stack is reimplemented in async Rust as a family of subcrates (`webrtc-ice`, `webrtc-dtls`, `webrtc-sctp`, `webrtc-srtp`, `rtp`, `stun`, `turn`, ...), and the API keeps Pion's Go shape: `Arc` everywhere, and every event handler is a boxed closure returning a boxed future. It is not idiomatic Rust, but it is a complete stack with no C dependency.

```toml
[dependencies]
webrtc = "0.13"   # pre-1.0: expect breaking minor releases
tokio = { version = "1", features = ["full"] }
```

## A headless peer

Construction goes through a builder that wants a media engine and interceptor registry even for data-only use:

```rust
let mut media = MediaEngine::default();
media.register_default_codecs()?;
let mut registry = Registry::new();
registry = register_default_interceptors(registry, &mut media)?;
let api = APIBuilder::new()
    .with_media_engine(media)
    .with_interceptor_registry(registry)
    .build();

let pc = Arc::new(
    api.new_peer_connection(RTCConfiguration {
        ice_servers: vec![RTCIceServer {
            urls: vec!["stun:stun.l.google.com:19302".to_owned()],
            ..Default::default()
        }],
        ..Default::default()
    })
    .await?,
);
```

Create the channel, choosing its reliability contract up front:

```rust
let dc = pc.create_data_channel("telemetry", Some(RTCDataChannelInit {
    ordered: Some(false),
    max_retransmits: Some(0),
    ..Default::default()
})).await?;

dc.on_message(Box::new(|msg: DataChannelMessage| {
    Box::pin(async move { println!("{} bytes", msg.data.len()) })
}));

pc.on_ice_candidate(Box::new(move |c: Option<RTCIceCandidate>| {
    // serialize and push into your WebSocket signaling sink (Candidate message)
    Box::pin(async move { /* ws_tx.send(...) */ })
}));
```

That `Box::new(move |..| Box::pin(async move { ... }))` pattern is on every handler; you will type it a lot. The rest is the previous lesson's sequence verbatim: `create_offer`, `set_local_description`, ship it over the WebSocket, apply the answer with `set_remote_description`, feed trickled candidates to `add_ice_candidate`, and `dc.on_open` fires. On the side that did not create the channel, `pc.on_data_channel` hands it to you. Sending is `dc.send_text(s)` or `dc.send(&bytes)`.

## The knobs WebSockets do not have

A WebSocket gives you exactly one contract: reliable and ordered, because TCP underneath allows nothing else. Data channels run on SCTP inside DTLS over UDP, and SCTP takes instructions:

- `ordered: true`, no limits: WebSocket-like. Default.
- `ordered: false`: messages delivered as they arrive.
- `max_retransmits: 0`: lost messages are simply gone (any small number allows that many retries).
- `max_packet_life_time`: give up on a message after N milliseconds instead of after N retries. Mutually exclusive with `max_retransmits`.

`ordered: false` plus `max_retransmits: 0` is UDP semantics with encryption and congestion control included. That combination eliminates head-of-line blocking: on a WebSocket, one lost TCP segment stalls every message behind it until retransmission, while here a lost position update is skipped and the newer one renders sooner. This is why data channels win for game state, cursor presence, and live telemetry where only the latest value matters, and more generally wherever peer-to-peer topology (no server hop, no egress bill) or tunable reliability beats TCP's one-size-fits-all.

## Where it is rough

Honest notes before you build on this. The docs are thin; the `examples/` directory in the webrtc-rs repo is the real manual. The crate is pre-1.0 and minor versions break APIs. The maintainer pool is far smaller than Pion's, so off-happy-path bugs (renegotiation, less common ciphers, simulcast) can sit longer. Data channels are the well-trodden path; media is rougher, as the next lesson covers. Alternatives exist: `str0m` is a sans-IO Rust WebRTC library built for server use, and LiveKit maintains Rust bindings to libwebrtc when battle-tested media matters more than purity.

## Predict, then verify

A peer streams ticks numbered 1 to 100 over the channel configured above (`ordered: false`, `max_retransmits: 0`), and the network eats tick 42. What does the receiver observe, and what would a WebSocket carrying the same ticks show?

Answer: the receiver sees 41, then 43 onward, possibly slightly out of order, with no stall; 42 never existed as far as SCTP cares. The WebSocket delivers all 100 in order, but everything after 42 waits in kernel buffers until TCP retransmits it, so the "live" feed freezes for a round trip or more and then bursts. Choosing which failure mode you prefer is the whole point of the knobs.
