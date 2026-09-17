Chat servers are stateful, so a message from A to B has to find the server holding B's connection. That routing problem is what the message flow solves.

## Service discovery

When a client logs in, something has to tell it which chat server to connect to. That is service discovery, usually ZooKeeper or an equivalent.

1. User A logs in.
2. The load balancer routes the request to an API server.
3. The API server authenticates, then asks service discovery for the best chat server for A, using geography and current load.
4. Service discovery returns server 2.
5. A opens a WebSocket to chat server 2.

The criteria matter. Geography because a persistent connection's latency is paid on every message, and load because a chat server's capacity is connections rather than requests, so a server near its connection limit must stop receiving new ones.

## One-on-one

1. A sends a message over its WebSocket to chat server 1.
2. Chat server 1 gets a message id from the id generator.
3. It puts the message on the message sync queue.
4. The message is written to the key-value store.
5. If B is online, the message is routed to chat server 2, where B is connected. If B is offline, a push notification is sent instead.
6. Chat server 2 pushes it to B over B's WebSocket.

Step 4 before step 5 is the part to defend. Persist before delivering, so a delivery failure is recoverable rather than a lost message. It is the same ordering as the notification log in the previous section, and for the same reason.

## Multiple devices

A user's phone and laptop each hold their own WebSocket, possibly to different servers, and both need every message.

Each device tracks `cur_max_message_id`, the highest id it has seen. A message is new to a device if it is addressed to that user and its id exceeds that device's cursor.

The elegance is that each device syncs independently with no coordination and no server-side per-device state. A laptop closed for a week reconnects, sends its cursor, and receives exactly what it missed. This works precisely because ids are sortable, which is what the previous lesson insisted on.

## Small groups

For a group of three, A's message is copied into B's message sync queue and into C's. Each recipient has an inbox, and reads only from it.

This is fanout on write, and the reasoning matches the news feed section. It makes the client simple, since a client checks one inbox rather than querying every channel it belongs to. And at 100 members the duplication is affordable.

It does not generalize. WeChat caps groups at 500 for this reason. Above that, copying every message per member stops being acceptable and you need the pull side of the hybrid: large channels are read on demand rather than fanned out.

Naming the cap and the reason for it is better than presenting fanout as the answer. The scope said 100, so fanout on write is correct here, and it is correct because of the number.

## Predict, then verify

A message is persisted, then chat server 2 crashes before pushing it to B. B reconnects to chat server 5. Does B get the message?

Answer: yes, and the reason is that delivery is not what makes a message durable. The message is in the key-value store with an id, and B's device holds a `cur_max_message_id` from before the message existed. On reconnecting, B's device sends its cursor and receives everything above it, including the message that was in flight when server 2 died. The push was an optimization for latency; the cursor is the correctness mechanism. That distinction is the point of the design: if delivery were the only mechanism, every server crash would lose messages, and the system would need acknowledgements and retries between servers to compensate. Instead the recovery path is the same code as the ordinary cold-start sync, which means it is exercised constantly rather than only during incidents, and a recovery path that runs all the time is one that works.
