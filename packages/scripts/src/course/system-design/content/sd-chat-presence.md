The green dot next to a name looks trivial and is the part of a chat system most likely to melt under load. Two things make it hard: connections are unreliable, and status changes fan out.

## Login and logout

The easy cases. On login, after the WebSocket is established, write A's status as online with a `last_active_at` timestamp. On an explicit logout, write offline.

## Disconnection is the hard case

A user walks into a tunnel and the connection drops. Mark them offline, and thirty seconds later they are back, so mark them online. Do that honestly and the indicator flickers constantly for anyone on a train, which is worse than being slightly wrong.

The fix is a heartbeat. The client sends a small event every few seconds. If the server has seen one within a window, the user is online; otherwise offline.

With a 5-second heartbeat and a 30-second window, a user has to be gone for six missed heartbeats before they are marked away. A tunnel does not flip the indicator. A closed laptop is marked offline within half a minute.

The window is the tuning knob, and the tradeoff is direct: shorter means faster detection and more flicker, longer means stable but stale. Neither end is correct, and the right answer is whichever your users notice less, which for presence is almost always stability.

Note what the heartbeat also fixed: the long polling lesson said a server cannot tell a disconnected client from a quiet one. A heartbeat is the answer to that, and it is why presence needs one even though WebSocket connections report closure. A connection can fail without a close frame, so absence of a heartbeat is the reliable signal and connection state is not.

## Fanout

When A's status changes, their contacts have to hear about it.

The straightforward design is publish-subscribe with a channel per friend pair. A's change publishes to channels A-B, A-C and A-D, which B, C and D subscribe to, and the update reaches them over their existing WebSockets.

This is fine for small friend lists and fails the same way everything else does. A group of 100,000 members means one status change generates 100,000 events, and since status changes on every network blip, the event rate is the product of members and instability.

The fix is to stop pushing it. Fetch presence when a user opens a group or refreshes a list, rather than pushing every change to everyone. Presence is worth pushing for the handful of conversations someone is actively looking at, and worth pulling for everything else.

That is the same hybrid as the news feed, arrived at from the same direction: push is correct until fanout gets large, and then the only fix is to not push.

## Predict, then verify

You use a 5-second heartbeat for 50 million daily active users, with maybe 10 million concurrent. What load does presence alone generate, and is it a problem?

Answer: 10 million connections divided by 5 seconds is 2 million heartbeats per second, which is more requests per second than everything else in the system combined, for a green dot. It is not a problem if handled correctly and is easily made into one. Each heartbeat is tiny and needs no durability, so it should update an in-memory or Redis entry with a TTL rather than writing to the key-value store, and a write per heartbeat to persistent storage is 2 million writes per second of data nobody reads. It also should not fan out: a heartbeat confirming someone is still online is not a status change and should notify nobody. The general lesson is that a periodic mechanism multiplies by your user count, so the per-event cost has to be examined at that multiple rather than judged on its own. Lengthening the interval to 30 seconds cuts it sixfold and costs detection latency, which is the honest lever if the volume is genuinely a problem.
