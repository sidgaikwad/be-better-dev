The matching engine must be deterministic: replay the same sequence of orders and get the same sequence of executions, every time. That requirement is the foundation of both availability and auditability, and the sequencer is what provides it.

## Why determinism

An exchange cannot lose orders or produce different results on recovery. If a matching engine fails and a standby takes over, the standby must reach exactly the state the primary had, which is only possible if the state is a pure function of the input sequence.

So the engine must contain no randomness, no clock reads, no I/O during matching. This is the event sourcing rule from the digital wallet section, applied where microseconds matter.

## The sequencer

The sequencer stamps every inbound order with a sequential id before the matching engine sees it, and stamps every outbound execution likewise. Two instances, inbound and outbound, each with its own sequence.

Strictly sequential numbering, so a gap is detectable. That gives three things:

**Fairness.** The sequence is the official order of arrival, and matching follows it. Two orders arriving microseconds apart have a defined, recorded order, which matters because it decides who gets filled.

**Recovery.** A recovering component knows the last sequence id it processed and requests everything after it, so recovery is a replay from a known point. Same cursor mechanism as the chat system's per-device sync, at a different timescale.

**Exactly-once.** A component that has already processed sequence 5,001 discards a duplicate, because the id makes duplicates identifiable rather than merely suspected.

The sequencer is also a message queue and an event store: it carries orders into the engine, executions back out, and persists both. Conceptually two Kafka streams around the matching engine, and Kafka is not used because its latency is neither low enough nor predictable enough.

## The order manager

Around the engine sits the order manager, which does everything the engine must not:

- Risk checks, such as a daily trade volume limit.
- Wallet checks, verifying funds, which is the previous section's system appearing as a dependency here.
- Trimming the order to the attributes the engine needs, since a smaller message is a faster one.

Then it sends the order to the sequencer. On the other side it receives executions and returns them to clients.

The division is the important part: the engine does matching and nothing else, and everything requiring external state, judgement or I/O happens before or after it. That is what keeps the engine deterministic, and it is a design rule rather than an optimization.

## Market data

Executions leaving the engine are also the market data feed. Levels of detail:

- **L1**: best bid and ask with sizes.
- **L2**: several price levels deep on each side.
- **L3**: individual orders at each level.

Derived from the same execution stream, published to everyone. That the feed is a projection of the engine's output rather than a separate query path is what makes it consistent with what actually happened.

## Predict, then verify

The matching engine runs on a primary with a hot standby. The primary fails mid-day. How does the standby take over without losing or duplicating a trade?

Answer: it replays the inbound sequence from its last applied id, which works precisely because the engine is deterministic and the sequence is complete and gap-detectable. The standby has been consuming the same inbound stream all along, so it is behind by at most a few sequence numbers, and applying those brings it to exactly the state the primary had, since identical input through identical deterministic logic gives identical state. There is no state transfer and no reconciliation, which is the point: a deterministic engine's state is fully described by the input sequence, so it does not need to be copied. The two hard parts are elsewhere. The outbound sequence must not gap or duplicate, so the standby must know which executions were already published and resume after them, which is what the separate outbound sequencer is for. And exactly one engine must be live, because two engines both matching against the same inbound stream would produce two conflicting execution streams, so failover needs a mechanism that makes a split brain impossible rather than merely unlikely.
