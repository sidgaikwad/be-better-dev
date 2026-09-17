Event sourcing is correct and, written naively, slow. A million transactions per second needs the pattern arranged so it can run in parallel, and the constraint that makes it correct is the one that resists parallelism.

## The bottleneck

Commands are processed in FIFO order by a deterministic state machine. Strict order means one at a time, which means one thread, which means throughput bounded by a single core.

The message queue section met this exactly: global ordering costs you all parallelism. The resolution is the same, and it works better here.

## Partition by account

Ordering only has to hold **per account**, not globally. Whether A's transfer to C happened before or after X's transfer to Y is a question nobody asks, and nothing in the system depends on the answer.

So partition the command queue by account, as the message queue section's keying rule. All commands touching account A go to one partition, ordered, handled by one state machine. Different accounts run in parallel across partitions.

A transfer touches two accounts, so it appears in two partitions. This is where the design has to be careful, and where the earlier lessons combine: the transfer is a distributed transaction across two partitions, resolved with TC/C or Saga, and each partition's local effect is event-sourced within it.

The partitions give parallelism, the distributed transaction gives atomicity across two of them, and event sourcing gives reproducibility within each. Three mechanisms, one for each requirement, which is worth naming explicitly because it looks like three overlapping solutions until you see which requirement each one serves.

## CQRS

Reads and writes now want different shapes.

**Writes** go through the command queue into the event store.

**Reads**, "what is A's balance", must not replay events, so they hit a derived read model updated as events are applied.

Separating them is Command Query Responsibility Segregation, and here it is forced rather than chosen: the write path is an ordered event log and the read path is a key-value lookup, and no single structure serves both.

The consequence is that the read model is eventually consistent with the event store. A transfer is durable the moment its events are appended, and the balance may lag by milliseconds. For a wallet that is usually fine, and it must be a stated decision rather than an accident, because "my transfer completed and my balance is unchanged" is alarming to a user.

## Snapshots

Replaying from the beginning is the property that makes the design valuable and cannot be the normal path, since a year of events takes hours.

Periodic snapshots record the full state at a known event offset. A replay starts from the most recent snapshot and applies only events after it, which turns hours into seconds.

Snapshots are derived, so they are disposable: a corrupt one is deleted and regenerated from events. Keeping the ability to replay from zero is what makes that safe, so the full history is never deleted even once snapshots exist.

## Availability

99.99% is 52 minutes a year. Each partition needs a replica ready to take over, and the failover must preserve ordering, so a replica takes over at a known offset and continues from there rather than reprocessing arbitrarily.

The event log makes this tractable: a replica that knows the last offset it applied can resume exactly, which is the same cursor mechanism as the chat system's per-device sync.

## Predict, then verify

Two concurrent transfers, A to C and C to A, land in partitions for A and C at the same time. Can they deadlock?

Answer: yes, exactly as two multi-row database transactions can, and for the same reason: each holds a reservation the other needs. The A-to-C transfer reserves A and waits to reserve C; the C-to-A transfer reserves C and waits for A; neither proceeds. The fix is the one from the hotel section and it transfers directly: acquire in a consistent global order, so both transfers reserve the lower account id first and then the higher, which makes the cycle impossible. It is worth noticing that this is the second time the same one-line rule has resolved a deadlock in a completely different system, once for date rows in a reservation and once for account partitions in a wallet. The general statement is that any operation acquiring multiple resources must acquire them in a total order that every participant agrees on, and the ordering can be arbitrary as long as it is consistent. Without it, TC/C's Try phase deadlocks under exactly the concurrency the partitioning was introduced to achieve.
