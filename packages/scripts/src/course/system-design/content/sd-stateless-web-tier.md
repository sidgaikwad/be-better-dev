The web tier has been described as horizontally scalable for several lessons now, on the condition that servers keep no state. This is the lesson that pays that bill, because the condition is not a detail. It is the difference between adding a server and rebuilding the application.

## What stateful looks like

A stateful server remembers something about a client between requests. The usual culprit is session data: user A signs in, the server records the session in local memory, and every later request from A must reach that same server or authentication fails.

With three servers, each holding some users' sessions, the constraint is that every request from a client must be routed to the same server that has its data. Load balancers can do this, with sticky sessions, and it costs you the following:

- **Balancing stops being balanced.** Traffic follows the sessions, not the capacity. A server that happened to collect heavy users stays hot while another sits idle, and the load balancer cannot help because it is not allowed to move anyone.
- **Adding a server does nothing for existing load.** A new server starts with no sessions, so it only picks up new ones. Relief arrives gradually, over the length of a session, which is the wrong timescale during a traffic spike.
- **Removing a server signs its users out.** Every deploy that replaces instances drops whatever they were holding. Autoscaling down does the same thing.
- **A crash loses data.** Not slows, loses. Those sessions are gone and those users are signed out.

## What stateless looks like

Move the state to a shared store that every web server can read. Session data goes into Redis, a NoSQL store, or a relational table, and the web servers hold nothing between requests.

Now any request can go to any server. The load balancer routes on actual load. Adding a server helps immediately, because the new server can serve anyone. Removing one is invisible, because it was holding nothing that mattered. A crash costs the requests in flight and nothing else.

This is what makes autoscaling possible rather than merely configurable. Scaling on traffic means instances appearing and disappearing constantly, and that is only safe when losing an instance costs nothing.

A NoSQL store is the usual choice for session data, and for once the reason is not preference. Sessions are the exact access pattern a key-value store is built for: get by key, put by key, TTL to expire, no joins, and it needs to scale with the web tier rather than compete with your main database for connections.

## State that is not the session

Sessions are the obvious case. The subtle ones cause the bugs:

- **Uploaded files on local disk.** The server that receives an upload is not the one that serves it back. The file must go to an object store.
- **In-process caches.** Each server builds its own, so they disagree, and invalidating one leaves the rest wrong. This is the argument from the cache tier lesson, made from the other side.
- **Scheduled jobs in the application process.** Every server runs the timer, so the nightly email goes out once per server.
- **In-memory rate limit counters.** Each server counts only what it saw, so a limit of 100 becomes 100 times the server count.

The pattern is the same throughout: anything one server knows and the others do not is a correctness bug waiting for a request to land somewhere else.

## Predict, then verify

You move sessions to Redis and remove sticky sessions. Sign-in works, but users are randomly signed out under load. Redis is healthy and the data is there. What is left?

Answer: something else is still stateful, and the likeliest thing is whatever validates the session rather than whatever stores it. If each server signs its own session cookies with a key generated at startup, then every server has a different key, a cookie signed by server 1 fails validation on server 2, and the user is signed out. Redis is innocent; the session is sitting there, and the request never gets far enough to look it up. "Random under load" is the signature of this whole class of bug, because it means the behavior depends on which server you land on, and load is what spreads you across them. The fix is a signing key from shared configuration rather than from process startup, and the general rule is that removing state means removing all of it, including the state you did not think of as data.
