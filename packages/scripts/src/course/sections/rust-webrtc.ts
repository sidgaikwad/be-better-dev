import type { SectionSeed } from "../types"

// Part 4: WebRTC. Builds on the WebSockets section, whose axum channel becomes
// the signaling server here. Data channels are the load-bearing path (webrtc-rs
// is roughest around media); the section closes on topology judgment and on
// when a plain WebSocket is simply the right answer.

export const rustWebrtc: SectionSeed = {
  slug: "rust-webrtc",
  title: "Rust with WebRTC",
  description: "NAT, ICE, STUN/TURN, SDP; data channels with webrtc-rs.",
  badgeIcon: "📹",
  badgeTitle: "WebRTC × Rust",
  units: [
    {
      slug: "reaching-a-peer",
      title: "Reaching a peer",
      description: "NAT, ICE, STUN, TURN, and SDP: everything that happens before the first byte.",
      lessons: [
        {
          slug: "rtc-why-p2p-is-hard",
          title: "Why peers cannot just dial each other",
          summary: "NAT mappings, symmetric versus cone behavior, and the hole-punching trick.",
          contentFile: "rtc-why-p2p-is-hard.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "The dashboard's browser could always reach your server, yet it cannot reach another browser the same way. What is the decisive difference?",
              options: [
                "Browsers block inbound connections in JavaScript for security",
                "The server has a public, routable address and is listening; each browser sits behind a NAT that drops unsolicited inbound packets",
                "Servers speak TCP while browsers can only speak UDP",
                "Browser private addresses change too often to dial",
              ],
              answer: 1,
              explanation:
                "A NAT forwards only packets matching a mapping row that outbound traffic created, so a machine behind one cannot receive a first packet. The server, publicly addressed and listening, can.",
            },
            {
              kind: "predict",
              prompt:
                "Both peers sit behind endpoint-independent NATs, learn each other's public mappings, and start sending UDP simultaneously. A's first packet reaches B's NAT before B has sent anything. What happens?",
              options: [
                "It is dropped, and the connection permanently fails",
                "It is dropped, but it opened A's own NAT; once B's packets start, traffic flows both ways",
                "It is delivered, since A used B's correct public address",
                "B's NAT queues it until B sends something",
              ],
              answer: 1,
              explanation:
                "Early packets sacrifice themselves creating the mapping rows on their own side. Once both sides have sent, both NATs forward; NATs never queue unsolicited packets.",
            },
            {
              kind: "mcq",
              prompt:
                "What makes a symmetric NAT (address-and-port-dependent mapping) defeat simple hole punching?",
              options: [
                "It blocks all UDP traffic",
                "Its mappings expire faster than a round trip",
                "It allocates a different public port per destination, so the port a third server observed is not the port used toward the peer",
                "It rewrites payloads as well as headers",
              ],
              answer: 2,
              explanation:
                "Punching relies on advertising a mapping that stays valid toward the peer. A symmetric NAT mints a fresh, unguessable port for each new destination, so the advertised one misses.",
            },
          ],
        },
        {
          slug: "rtc-ice-stun-turn",
          title: "ICE, STUN, and TURN: finding a path",
          summary:
            "Candidates, reflexive addresses, relays as the paid fallback, connectivity checks.",
          contentFile: "rtc-ice-stun-turn.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does a STUN Binding request actually get you?",
              options: [
                "An allocated relay port on the server",
                "The public ip:port your NAT assigned, as observed from outside",
                "Encryption keys for the session",
                "The peer's candidate list",
              ],
              answer: 1,
              explanation:
                "STUN is a mirror: it echoes back the source address your request arrived from, which is your server-reflexive candidate. Relaying is TURN's job, keys come from DTLS.",
            },
            {
              kind: "mcq",
              prompt: "Why does TURN require credentials while public STUN servers are free?",
              options: [
                "A relay carries every byte of the session in both directions for its whole duration, so an open one donates unbounded bandwidth; STUN answers a few small packets",
                "TURN listens on privileged ports",
                "STUN is older and was grandfathered in without auth",
                "TURN terminates the encryption and must be trusted with plaintext",
              ],
              answer: 0,
              explanation:
                "The cost difference is bandwidth, which is why deployments mint short-lived HMAC credentials. TURN never sees plaintext; DTLS still runs end to end through it.",
            },
            {
              kind: "predict",
              prompt:
                "Connectivity checks finish: a direct srflx-srflx pair works, and a relay pair through TURN also works. Which carries the data?",
              options: [
                "The relay pair, because TURN is more dependable",
                "The direct srflx pair; relay candidates sort last and win only when nothing direct works",
                "Both pairs, load balanced",
                "Strictly whichever check completed first",
              ],
              answer: 1,
              explanation:
                "ICE priorities exist to keep traffic off the expensive path: host, then reflexive, then relay. TURN is insurance, used only when direct checks all fail.",
            },
          ],
        },
        {
          slug: "rtc-sdp-signaling",
          title: "SDP, offer/answer, and the signaling you build",
          summary:
            "What a session description carries, and the full connect sequence over your WebSocket.",
          contentFile: "rtc-sdp-signaling.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does WebRTC ship no signaling protocol?",
              options: [
                "Signaling proved impossible to standardize",
                "The standard defines what peers exchange and leaves transport to the app, which already has a server, auth, and rooms; any reliable channel works",
                "Browser vendors could not agree on WebSockets",
                "Signaling must itself be peer-to-peer",
              ],
              answer: 1,
              explanation:
                "Descriptions and candidates are specified exactly; delivery is deliberately your job, because it always ends up entangled with your app's auth and rooms anyway.",
            },
            {
              kind: "mcq",
              prompt: "What role does `a=fingerprint` in the SDP play?",
              options: [
                "It names the negotiated codec profile",
                "It pins the peer's DTLS certificate, so the handshake is verified against what was signaled and an on-path attacker cannot substitute keys",
                "It authenticates you to the STUN server",
                "It is a checksum detecting SDP corruption",
              ],
              answer: 1,
              explanation:
                "Trust bootstraps off the signaling exchange: the DTLS handshake must present a certificate hashing to the signaled fingerprint, which shuts out anyone on the media path.",
            },
            {
              kind: "predict",
              prompt:
                "A sends its offer and B replies, but the signaling channel silently drops the answer. What state is the connection in?",
              options: [
                "Connected: exchanged candidates are enough",
                "A holds a local offer with no remote description, so ICE lacks remote credentials and nothing connects until signaling delivers the answer",
                "B is connected to A but not the reverse",
                "Both peers fall back to TURN",
              ],
              answer: 1,
              explanation:
                "Without the answer, A has no ice-pwd to authenticate checks against and no fingerprint to verify. Signaling reliability is your problem, which is why a TCP-backed WebSocket is the default.",
            },
          ],
        },
      ],
    },
    {
      slug: "building-and-judgment",
      title: "Building with webrtc-rs",
      description:
        "Data channels in Rust, media in one honest pass, and when WebRTC is the wrong tool.",
      lessons: [
        {
          slug: "rtc-data-channels",
          title: "Data channels with webrtc-rs",
          summary:
            "The Pion-shaped crate, a headless peer end to end, and reliability knobs TCP lacks.",
          xp: 25,
          contentFile: "rtc-data-channels.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which `RTCDataChannelInit` gives lossy-but-fast, UDP-like semantics?",
              options: [
                "`ordered: Some(true)` with `max_packet_life_time: Some(0)`",
                "`ordered: Some(false)` with `max_retransmits: Some(0)`",
                "`ordered: Some(false)` with a very large `max_retransmits`",
                "The default; data channels are always unreliable",
              ],
              answer: 1,
              explanation:
                "Unordered delivery plus zero retransmits tells SCTP to drop losses and move on: UDP semantics, but still encrypted and congestion controlled. The default contract is reliable and ordered.",
            },
            {
              kind: "mcq",
              prompt: "What is the `webrtc` crate, structurally?",
              options: [
                "A binding to Google's libwebrtc C++ library",
                "A wrapper that drives a headless browser",
                "A pure-Rust port of Go's Pion stack, split into subcrates, with Go-shaped handler APIs",
                "A signaling framework; the transport comes from the browser",
              ],
              answer: 2,
              explanation:
                "The whole stack (ICE, DTLS, SCTP, SRTP) is reimplemented in async Rust with no C dependency, and the Pion heritage shows in the Arc-and-boxed-closure API.",
            },
            {
              kind: "predict",
              prompt:
                "Two transports carry a 60-per-second position feed: a WebSocket, and an unordered data channel with `max_retransmits: 0`. The network drops one packet on each. What does each viewer see?",
              options: [
                "Both feeds freeze until retransmission",
                "The WebSocket feed freezes briefly then bursts forward; the data channel feed skips one update and continues",
                "The data channel feed freezes; the WebSocket skips ahead",
                "Both silently skip the lost update",
              ],
              answer: 1,
              explanation:
                "TCP must deliver in order, so everything behind the lost segment waits: head-of-line blocking. SCTP with zero retransmits abandons the message, and for latest-value-wins data that is the better failure mode.",
            },
          ],
        },
        {
          slug: "rtc-media-and-topology",
          title: "Media, topologies, and when to skip WebRTC",
          summary:
            "Tracks, RTP/SRTP in one pass; mesh versus SFU versus MCU; the case for plain WebSockets.",
          contentFile: "rtc-media-and-topology.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why do group video calls need an SFU rather than a mesh?",
              options: [
                "Browsers cap peer connections at three",
                "Mesh uplink grows with participant count: each sender uploads a copy per receiver, which exhausts typical uplinks around six people",
                "Mesh cannot encrypt more than two streams",
                "NAT traversal fails with more than two peers",
              ],
              answer: 1,
              explanation:
                "Six people at 2 Mbps each means 10 Mbps of sustained upload per attendee in a mesh. An SFU collapses that to one uplink stream and pays the fan-out from a data center instead.",
            },
            {
              kind: "mcq",
              prompt: "What distinguishes an SFU from an MCU?",
              options: [
                "An SFU forwards RTP without decoding it; an MCU decodes, mixes into one stream, and re-encodes, paying CPU and latency for cheap clients",
                "An SFU handles audio only",
                "An MCU is peer-to-peer; an SFU requires a server",
                "An SFU requires TURN; an MCU does not",
              ],
              answer: 0,
              explanation:
                "Forwarding versus mixing is the whole distinction, and it is why SFUs scale: routing packets is nearly free while transcoding every participant is a per-user CPU bill.",
            },
            {
              kind: "predict",
              prompt:
                "Next sprint: a second admin's browser should also receive the delivery-progress events, still produced by the server. Which transport is right?",
              options: [
                "WebRTC data channels, since two browsers are now involved",
                "The existing WebSocket: the data is born on the server, clients talk only to the server, and ordered reliable delivery is fine",
                "A TURN relay between the two browsers",
                "Peer-to-peer SCTP with the server as signaling only",
              ],
              answer: 1,
              explanation:
                "Peer-to-peer shortens nothing when the server is the source; fan-out to more subscribers is exactly what the WebSocket section built. WebRTC earns its complexity only for P2P paths, media, or lossy low-latency modes.",
            },
          ],
        },
      ],
    },
  ],
}
