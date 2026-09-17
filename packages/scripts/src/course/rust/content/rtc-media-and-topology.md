Data channels are half of WebRTC. The other half, live audio and video, is where most of the complexity and most of the compute lives. One conceptual pass through it, then the judgment calls: how group calls scale, and when to skip WebRTC entirely.

## Tracks, RTP, SRTP in one pass

A track is a flowing sequence of encoded frames: Opus for audio; VP8, VP9, H.264, or AV1 for video, with the codec agreed during the SDP offer/answer. Encoded frames are chopped into RTP packets, each with a sequence number, a timestamp, and a stream identifier (SSRC), sent over the same ICE-established UDP path as everything else.

RTP inherits UDP's attitude to loss, on purpose. A late video packet is worthless, so instead of TCP-style stalling, media uses feedback over RTCP: NACK asks for a quick resend, PLI asks the sender for a fresh keyframe when decoding has derailed, and congestion feedback drives the encoder's bitrate up and down to fit the path. A jitter buffer at the receiver trades a few dozen milliseconds of delay for smooth playback. Loss shows up as a brief artifact, not a freeze. SRTP encrypts every payload with keys derived from the same DTLS handshake the data channel used.

Where webrtc-rs stands: the crate moves RTP competently, and `TrackLocalStaticSample` will packetize encoded samples you hand it, but it ships no encoders or decoders. Pixels to VP8 is your problem, via GStreamer, ffmpeg, or an encoder crate. This is the thinnest part of the Rust ecosystem relative to Pion, and it is why serious Rust media servers often reach for `str0m` or libwebrtc bindings instead.

## Mesh, SFU, MCU

Now put five people in a call. Topology decides whether it works.

**Mesh**: every peer connects to every peer. No server touches media, maximum privacy, zero infrastructure. But each participant uploads a copy of their video to each other participant: at 2 Mbps video, a 6-person mesh needs 10 Mbps of sustained uplink from every attendee. Residential uplinks die there, and so do laptop fans. Mesh is fine for 2, plausible for 3 or 4, gone by 6.

**SFU** (Selective Forwarding Unit): every peer sends one copy to a server, and the server forwards packets to everyone else without decoding them. Uplink drops to one stream regardless of call size; the server spends bandwidth but almost no CPU, since it routes RTP rather than processing video. Simulcast (the sender uploads a few quality layers) lets the SFU hand each receiver a size it can afford. This is the shape of essentially every real group-call product, and note what an SFU is structurally: a WebRTC peer implemented on a server, which is exactly the niche Pion, str0m, and webrtc-rs exist to fill.

**MCU** (Multipoint Control Unit): the server decodes every stream, composites one mixed picture, re-encodes, and sends each participant a single stream. Clients do minimal work, which suited hardware phones and telephony bridges, but the server pays a decode-and-encode bill per participant and adds latency. Today it survives mostly for recording composites and dial-in gateways.

## When to skip WebRTC

The delivery dashboard from the WebSockets section was server to browser, needed every event, in order, and tolerated 100 ms happily. WebRTC would have added STUN and TURN deployment, signaling, and a connection state machine, and bought nothing: the data was born on the server, so peer-to-peer had nothing to shorten. A WebSocket was the right call.

The honest rule: if clients only ever talk to your server, and reliable ordered delivery at TCP latency is acceptable, use a WebSocket. Reach for WebRTC when the packets should travel browser to browser, when you need real-time media, or when you need the lossy low-latency modes from the data-channel lesson. It is a tool for hard transport problems, not a fancier WebSocket.

## Predict, then verify

Six participants, each sending 2 Mbps video. Work out the uplink each participant needs in a mesh, and then behind an SFU. Where does the SFU pay instead?

Answer: mesh, 5 copies times 2 Mbps, is 10 Mbps up per person; behind an SFU each uploads one 2 Mbps stream. Downlink is 10 Mbps either way (five remote streams), simulcast can shrink it. The SFU pays in server bandwidth, 12 Mbps in and up to 60 Mbps out for this call, which is precisely the bill an operator can provision and a home connection cannot.
