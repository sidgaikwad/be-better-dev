The delivery dashboard from the WebSockets section worked because your server is easy to reach: it has a public IP address, it listens on a known port, and any browser can open a connection to it. Now invert the arrangement. Make two browsers talk directly to each other, with no server carrying the bytes. Immediately there is nothing to dial: neither browser has a public address, and neither is listening for inbound connections.

## NAT: one public address, many machines

Your laptop's address is something like `192.168.1.23`, a private address meaningful only on your LAN. When a packet leaves for the internet, your router rewrites the source: `192.168.1.23:51000` becomes `203.0.113.7:62044`, the router's public address plus a port it just allocated. It records the rewrite in a mapping table:

```
private              public              remote
192.168.1.23:51000   203.0.113.7:62044   142.250.65.78:443
```

A reply addressed to `203.0.113.7:62044` matches the row and is forwarded back to the laptop. This is Network Address Translation, and it is why the IPv4 internet still functions: one public address serves the whole household, office, or (with carrier-grade NAT) a chunk of an ISP's customers, stacked two translations deep.

The table is also the problem. An inbound packet that matches no row is dropped. From the outside, your laptop does not exist until it speaks first. Put both peers behind NATs and you have two machines that can each only reply, and nobody can go first. That is the whole reason WebRTC's connection machinery exists.

## Not all NATs map alike

RFC 4787 classifies NATs by how they allocate that public port. With **endpoint-independent mapping** (the old "full cone" family), `192.168.1.23:51000` gets `62044` once and keeps it for every destination. With **address-and-port-dependent mapping** (the old "symmetric" NAT), the router allocates a fresh public port for every distinct destination: `62044` toward one server, `62051` toward another. Filtering rules vary independently: some NATs accept inbound from anyone once a row exists, some only from addresses you have already sent to.

The distinction decides whether the trick below works.

## Hole punching

Suppose both peers somehow learn each other's current public `ip:port` through a mutual friend (the next lesson covers how). Then both start sending UDP packets to each other at the same time.

A's first packet toward B does double duty: it probably dies at B's NAT (no row yet), but it creates a row in A's own NAT that says "expect traffic from B's address." B's packets do the same in mirror image. Within a round trip, both rows exist and packets flow in both directions. Each side punched a hole in its own wall from the inside.

This works when the mapping each peer advertised is the mapping its NAT will actually use toward the peer, which is exactly the endpoint-independent property. A symmetric NAT breaks it: the port the mutual friend observed was allocated for traffic to the friend, and traffic toward the peer gets a different, unguessable port. When both sides are symmetric, punching fails and the only remaining option is to relay through a server, which lesson two prices out.

One level deeper: NAT rows are leases, not permanent. Idle UDP mappings commonly expire in under a minute, so long-lived peer-to-peer sessions send periodic keepalives just to keep their own holes open. And everything above described UDP. TCP hole punching is dramatically harder (both stacks run SYN state machines that reject unexpected packets), which is why essentially all WebRTC traffic rides on UDP.

## Predict, then verify

Peer A sits behind an endpoint-independent NAT. Peer B sits behind a symmetric NAT. Both learn each other's public address from a third server and start firing UDP packets at each other. Does a connection ever form?

Answer: often, yes, but only in one direction of discovery. A's packets toward B's advertised port miss, because B's NAT allocated that port for the third server, not for A. But B's packets toward A travel from some fresh public port, and if A's NAT filtering is permissive, they arrive. A then reads the true source port off the incoming packet and replies to that, and both rows exist. WebRTC's connectivity checks are built to notice exactly this. Two symmetric NATs, though, and no amount of cleverness helps: you relay.
