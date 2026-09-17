A chat system has a problem no design so far has had: the server needs to send data to a client that did not ask for it. HTTP is client-initiated, so getting a message from a server to a recipient requires working around that.

## Scope

- One-on-one and group chat, groups up to 100
- 50 million daily active users
- Text only, under 100,000 characters
- Online presence
- Multiple devices per account
- Push notifications
- History kept forever

## The sending side is easy

A client sending a message is an ordinary request. HTTP works, with `keep-alive` so a persistent TCP connection is reused rather than handshaking per message. Facebook's chat used HTTP for sending for years.

## The receiving side

Three techniques, in order of how well they work.

**Polling.** The client asks "anything new?" on an interval. Simple, and the cost is a function of the interval you choose: poll every second per user at 50 million users and you have 50 million requests per second, nearly all answered "no". You are paying full price for an empty answer.

**Long polling.** The client asks and the server holds the request open until a message arrives or a timeout fires. On a response the client immediately asks again.

Better, and three problems remain:

- The sender and recipient may be on different servers. HTTP servers are stateless and load balanced, so the server that receives A's message is probably not the one holding B's open request, and there is no path between them without extra machinery.
- The server cannot tell a disconnected client from a quiet one, since both look like an open socket with nothing on it.
- It is still wasteful. A user who chats rarely still reconnects on every timeout.

**WebSocket.** The client opens an HTTP connection and upgrades it to a persistent bidirectional one. The server can push at any time.

It also passes firewalls, because it runs over ports 80 and 443 like ordinary web traffic, which is a practical reason it won over earlier bidirectional schemes.

## Use it for both directions

HTTP for sending is defensible, but since the WebSocket is already open and bidirectional, there is no reason not to send over it too. One connection, one code path, one set of failure modes on both sides.

The consequence is that chat servers become stateful. A client is bound to a specific server for the life of its connection, which contradicts the stateless web tier lesson and is the price of server-initiated messages. Everything else, signup, login, profile, remains ordinary stateless HTTP.

That split is the high-level design: stateless services behind a load balancer for everything conventional, and a stateful chat service holding connections.

## Connection count is the constraint

With a persistent connection per user, the limit is memory per connection rather than requests per second.

At roughly 10 KB per connection, 1 million concurrent connections is about 10 GB, which fits on one machine. Say that out loud and then reject it, because a single server is a single point of failure for every conversation in the product. It is fine to start there while saying it is a starting point; it is not fine to propose it as the design.

## Predict, then verify

Long polling's first problem was that the sender's server may not be holding the recipient's open request. Does WebSocket fix it?

Answer: no, and this is the most common misreading of the protocol choice. WebSocket makes a server able to push to clients connected to it, and says nothing about clients connected elsewhere. With a hundred chat servers, A is on server 1 and B is on server 57, so server 1 still has no way to reach B directly. What changed is that the problem is now tractable: because connections are persistent and each server knows exactly which users it holds, you can keep a map from user to server and route between servers. Long polling could not do this because the association between user and server lasted only until the next timeout. So the protocol did not solve the routing problem, it made the routing problem stable enough to solve, and the solution is the message queue and service discovery in the next lesson.
