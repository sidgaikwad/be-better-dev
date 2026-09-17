Hole punching from the last lesson had two missing pieces: each peer must learn what the world sees as its address, and there must be a plan B for the NATs where punching cannot work. WebRTC packages both, plus the process of trying every option, under one name: ICE, Interactive Connectivity Establishment.

## STUN: a mirror

STUN is a nearly trivial protocol. The client sends a Binding request to a STUN server on the public internet; the server replies with one interesting field, `XOR-MAPPED-ADDRESS`: the source `ip:port` the request arrived from. That is your NAT mapping, observed from outside.

```
you  -> stun server   Binding request        (from 192.168.1.23:51000)
stun -> you           Binding success
                      XOR-MAPPED-ADDRESS = 203.0.113.7:62044
```

(The address is XOR-encoded only so that meddling NATs do not rewrite it in transit.) The whole exchange is a couple of small UDP packets, which is why free public STUN servers exist; `stun:stun.l.google.com:19302` has been the default in examples for a decade.

## Candidates

ICE calls every address you might be reachable at a candidate, and gathers three kinds:

- **host**: every local interface address (`192.168.1.23:51000`), useful when peers share a LAN
- **srflx** (server reflexive): the public mapping STUN revealed
- **relay**: an address on a TURN server that forwards for you

```
a=candidate:842163049 1 udp 1677729535 203.0.113.7 62044 typ srflx
```

## TURN: the paid fallback

When punching cannot succeed (both NATs symmetric, UDP blocked outright, hostile firewalls), the peers give up on directness. Each can allocate a port on a TURN server, and traffic then flows peer, to relay, to peer.

Note what that costs. STUN touched a few hundred bytes per session; TURN carries every byte of the call, in both directions, for the call's whole duration. Nobody operates an open TURN server, because it is donating bandwidth: real deployments (usually coturn) require credentials, typically short-lived HMAC-signed ones minted by your app server. TURN can also run over TCP and TLS on port 443, which looks enough like HTTPS to pass strict corporate firewalls. Commonly cited figures put the fraction of connections that end up needing a relay around 10 to 20 percent, so you cannot skip deploying it, but you want ICE to prefer anything else.

## Connectivity checks: the punch, formalized

Once both sides have candidate lists (the next lesson covers exchanging them), ICE forms candidate pairs, local times remote, and sorts them by priority: host pairs first, then srflx, relay last. Then it runs connectivity checks: STUN Binding requests again, but now sent directly between the peers over each pair, both directions.

Look at what those checks physically are: simultaneous outbound UDP from both ends toward each other. The checks are the hole punch from lesson one, performed systematically over every plausible path. A check that gets a response both ways marks the pair usable; the controlling side nominates a winner and data starts flowing on it. If a check arrives from an address nobody advertised (the symmetric-NAT surprise from last lesson's exercise), ICE registers it as a peer-reflexive candidate and uses it anyway.

One level deeper: modern stacks do trickle ICE (RFC 8838), shipping each candidate to the peer as it is discovered instead of waiting for gathering to finish, which cuts seconds off setup. And checks do not stop after nomination: keepalives maintain the NAT rows, and if the network changes (laptop leaves wifi), an ICE restart regathers and renegotiates without tearing the session down.

## Predict, then verify

Two colleagues on the same office LAN, behind the same NAT, connect to each other. Their signaling traffic crosses the internet. Which candidate pair carries their data, and how far does that data travel?

Answer: host-host. Both peers gathered their private `192.168.x.x` addresses as host candidates, those addresses are mutually routable inside the office, and host pairs sort first, so the connectivity check on the LAN path succeeds immediately and wins. The data never touches the router's WAN port. This is why ICE bothers gathering host candidates at all: the fastest path is sometimes ten meters long.
