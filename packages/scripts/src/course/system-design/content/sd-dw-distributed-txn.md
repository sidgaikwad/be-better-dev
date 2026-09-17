Transferring $1 from A to C is two balance updates that must both happen or neither. If A and C live on different shards, that is a distributed transaction, and there is no cheap way to get one.

## Scope

- Balance transfers between wallets on the same platform, nothing else
- 1 million transactions per second
- Transactional guarantees required
- **Reproducibility**: it must be possible to reconstruct any historical balance by replaying from the beginning
- 99.99% availability

The reproducibility requirement is the unusual one, and it is what the second half of the design is about. Reconciliation shows that a discrepancy exists and cannot show how it arose, so the interviewer asks for a system that can answer the second question too.

## Why sharding forces the problem

A million transactions per second is far beyond one node, so balances are partitioned across databases: clients A, B and C on three different nodes.

A transfer touches two accounts on two nodes. Two separate transactions, and if the service restarts between them, one balance moved and the other did not. Money has vanished or been created.

Note what changed relative to the hotel section. There, the answer was to put the two pieces of data in one database so a single transaction covers them. Here you cannot: at a million per second, one database is not an option, so the transaction has to cross machines and the only question is how.

## Two-phase commit

The low-level answer, implemented by the databases themselves through a standard like X/Open XA.

1. The coordinator, the wallet service, performs reads and writes across both databases, which take locks.
2. When ready to commit, it asks every database to **prepare**.
3. If all say yes, it tells them all to **commit**. If any says no, it tells them all to **abort**.

Two problems, and both are serious.

**Performance.** Locks are held across the round trips of both phases, so a transfer holds two accounts for milliseconds rather than microseconds, and at a million per second that does not work.

**The coordinator is a single point of failure.** If it crashes after prepare, participants sit locked, holding their rows, unable to decide whether to commit or abort, until it returns. This is the blocking property the hotel section named, and here it is fatal rather than merely undesirable.

## Try-Confirm/Cancel

The application-level answer, and the structural difference from 2PC is what makes it work.

1. **Try**: ask every database to reserve the resources, as its own committed transaction.
2. **Confirm** if all succeeded, or **Cancel** if any failed, again as separate transactions.

In 2PC both phases are inside one transaction, so locks span them. In TC/C each phase is a complete transaction that commits and releases its locks immediately, so nothing is held between phases.

The price is that reservation and compensation are your application's logic rather than the database's. A Try that reserved must have a Cancel that releases, and that Cancel must be written, tested and made idempotent.

## TC/C against Saga

Both are application-level compensating approaches.

|                               | TC/C         | Saga           |
| ----------------------------- | ------------ | -------------- |
| Compensating action           | Cancel phase | Rollback phase |
| Operation order               | Linear       | Any            |
| Parallel execution            | Yes          | No             |
| Partial inconsistency visible | Yes          | Yes            |

The deciding factor is latency. Saga's steps run in order, so total latency is their sum. TC/C's Try phase runs in parallel across participants, so it is the slowest one.

For a two-account transfer either works. Choose TC/C when there are many participants and latency matters; choose Saga when following microservice convention, which is where the industry has gone.

## Predict, then verify

TC/C's Try phase reserves $1 from A. The Confirm for A succeeds and the Confirm for C fails. What now?

Answer: you cannot cancel, because A is already confirmed and a confirm is not reversible in TC/C, so the only correct path is forward: retry C's Confirm until it succeeds. That is the asymmetry people miss about TC/C. Once every participant has said yes to Try, the transaction is committed in principle, so the Confirm phase must be retried indefinitely rather than compensated, which means Confirm must be idempotent and the coordinator's decision must be durable before any Confirm is sent. If the coordinator crashes after deciding to confirm, it must recover that decision on restart and finish, since a recovered coordinator that re-evaluates and cancels would contradict a confirm already applied. So TC/C's cost is not just writing compensations: it is a durable log of decisions and a recovery process that drives half-finished transactions to completion. That machinery is what the next lesson replaces with something simpler.
