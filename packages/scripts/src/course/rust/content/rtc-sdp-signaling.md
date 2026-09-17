Here is an excerpt of a real WebRTC offer:

```
v=0
o=- 4611731400430051336 2 IN IP4 127.0.0.1
m=application 9 UDP/DTLS/SCTP webrtc-datachannel
a=ice-ufrag:EsAw
a=ice-pwd:P2uYro0UCOQ4zxjKXaWCBui1
a=fingerprint:sha-256 A5:F2:0E:...:9B
a=setup:actpass
a=sctp-port:5000
```

This blob is half of a connection, and WebRTC gives you no way to deliver it.

## SDP and offer/answer

The format is SDP, Session Description Protocol. Each `m=` line opens a section for one media stream or, here, `application ... webrtc-datachannel`, a data channel over SCTP. The attributes carry everything the previous lessons set up: `ice-ufrag` and `ice-pwd` are the credentials that authenticate connectivity checks, `a=fingerprint` is the hash of this peer's DTLS certificate (the encryption anchor: the peer must present a certificate matching it, so nobody on the network path can substitute their own), and `a=candidate` lines carry ICE candidates when they are not trickled separately.

The exchange follows the offer/answer model: the offer lists everything the sender can do (codecs, channels, directions), the answer picks the compatible subset, and after one round trip both sides hold an agreed session description. In practice you treat SDP as opaque: `create_offer` produces it, `set_remote_description` consumes it, and your job is only to ferry the string faithfully. Parsing SDP by hand is a rite of passage nobody recommends.

## Signaling is your job

The WebRTC standard specifies what peers must exchange (descriptions and candidates) and says nothing about how. This is deliberate. Every application already has a server, an auth story, and a notion of who may talk to whom; a mandated transport would fit none of them. Any reliable ordered channel works. Email would work, slowly.

In practice signaling is almost always a WebSocket, which means the previous section already built most of your signaling server. What is left is a message envelope and routing by room:

```rust
#[derive(Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum Signal {
    Join { room: String },
    Offer { sdp: String },
    Answer { sdp: String },
    Candidate { candidate: String, sdp_mid: Option<String>, sdp_mline_index: Option<u16> },
}
```

The server never inspects `sdp`; it forwards each message to the other member of the room. All the trust decisions (who may join which room) are ordinary web auth, which is exactly why WebRTC left this to you.

## The full sequence

1. A creates a peer connection and a data channel, calls `create_offer`, then `set_local_description(offer)`. Setting the local description is what starts ICE gathering.
2. A sends the offer over the WebSocket.
3. B receives it: `set_remote_description(offer)`, `create_answer`, `set_local_description(answer)`, sends the answer back.
4. A applies `set_remote_description(answer)`.
5. Both sides trickle candidates through the WebSocket as gathering finds them; each applies the peer's with `add_ice_candidate`.
6. Connectivity checks run (last lesson), a pair is nominated.
7. Over the winning pair: DTLS handshake, verified against the fingerprints from step 2 and 3.
8. The SCTP association opens inside DTLS, and the data channel's `on_open` fires.

From step 8 on, the signaling server is idle. Application data flows peer to peer and never touches it.

One level deeper: the descriptions move a small state machine (`stable`, `have-local-offer`, back to `stable`), and both sides offering simultaneously (glare) wedges it; real apps assign one peer the polite role, which rolls back its own offer on collision. Renegotiation (adding a track later) is the same offer/answer dance on the live connection.

## Predict, then verify

Two peers complete step 8, the data channel is open, and then the signaling server crashes. Does the peer-to-peer session drop?

Answer: no. Signaling carries setup, not data; the established flow continues peer to peer, untouched. What you lose is the ability to change anything: no renegotiation, no ICE restart after a network change, no new participants. Production clients reconnect signaling in the background for exactly that reason, but the bytes in flight never noticed the outage.
