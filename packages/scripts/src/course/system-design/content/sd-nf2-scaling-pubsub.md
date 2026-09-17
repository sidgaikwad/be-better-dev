140 pub/sub servers is a cluster, and a cluster of stateful servers is harder to operate than the number suggests.

## Distributing channels

Channels are independent of each other, so they can be spread by hashing the channel name. That is consistent hashing from Part 2, applied to channels instead of data.

A hash ring of active pub/sub servers lives in service discovery. Publishers and subscribers both consult it to find which server holds a given channel:

1. A WebSocket server has a location update to publish for user 2.
2. It hashes `channel_2`, looks up the ring, and finds pub/sub server 1.
3. It publishes there.

Subscribing uses the same lookup. Nothing coordinates; both sides compute the same answer from the same ring.

## Stateless data, stateful server

This cluster has an awkward split worth being precise about.

**The messages are stateless.** A published message goes to current subscribers and is gone. Nothing is persisted, and a message with no subscribers is dropped. Nothing to recover.

**The subscriber lists are state.** Each channel's list of subscribers lives on its server and exists nowhere else. If a channel moves, every subscriber must unsubscribe on the old server and resubscribe on the new one, and until they do they miss updates.

So the cluster behaves like a storage cluster for operational purposes, even though it stores nothing durable. Treat it as stateful, over-provision for daily peak, and do not autoscale it on traffic the way you would a web tier. The instinct to scale a Redis cluster down overnight is wrong here, and knowing why is the distinction: the cost of moving channels exceeds the saving.

## Resizing

Resizing changes the ring, which moves many channels, which triggers mass resubscription:

1. Decide the new ring size and provision servers.
2. Update the ring in service discovery.
3. Watch for the CPU spike in the WebSocket cluster as handlers resubscribe.

```text
old: [p_1, p_2, p_3, p_4]
new: [p_1, p_2, p_3, p_4, p_5, p_6]
```

During the resubscription storm some updates are missed. The requirements said occasional loss is acceptable, which is what makes this survivable, and it is worth pointing at that requirement rather than hoping nobody asks. Resize at the daily traffic minimum.

## Replacing one server

Much safer, and it is the common case because servers fail regularly. Swapping one node moves only that node's channels:

```text
old: [p_1, p_2, p_3, p_4]
new: [p_1_new, p_2, p_3, p_4]
```

Monitoring alerts, an operator replaces the dead node in the ring, WebSocket servers are notified, and each handler checks its channel list against the new ring and resubscribes only what moved.

That last detail is the useful one: a handler keeps its own subscription list and re-derives placement from the ring, so it recomputes locally rather than being told what to do. The same property that let publishers and subscribers agree without coordinating makes recovery a local calculation.

## Friend changes

Adding a friend means subscribing to their channel. The feature registers a callback in the wider app, so when a friendship is created the client tells its connection handler to subscribe. Removal is the reverse.

## Predict, then verify

Resizing causes a resubscription storm and dropped updates, so a colleague proposes doubling the cluster once a week instead of scaling with traffic. What is wrong?

Answer: it makes the storms more frequent rather than fewer, which is the opposite of the goal, and each one is large because doubling moves about half of all channels. The right conclusion from "resizing is disruptive" is to resize rarely, not on a schedule: provision for peak with headroom and leave it alone, accepting that the cluster is over-provisioned most of the day. That is unusual advice, since the normal instinct with 140 servers is to shrink them overnight, and it is right here because the servers hold state that is expensive to move and the traffic pattern is predictable. The reasoning generalizes: autoscaling is cheap when a node holds nothing and expensive in proportion to what moves when it leaves, so the question to ask about any cluster is not how variable the traffic is but what has to be relocated when the membership changes.
