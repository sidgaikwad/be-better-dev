Split this into microservices and one logically atomic operation, reserve a room and decrement inventory, spans two databases. That is where a design that looked settled gets hard again.

## What splitting costs

In a monolith, reserving a room and decrementing inventory are two statements in one transaction. ACID does the work: both happen or neither does, and there is no intermediate state anyone can observe.

Split into an inventory service and a reservation service, each with its own database, and that transaction is gone. Inventory commits its decrement, reservation fails to commit its row, and now a room is held for a booking that does not exist. There is one happy path and many failure paths, each leaving a different inconsistency.

## Two ways to get it back

**Two-phase commit.** A coordinator asks every participant to prepare, and commits only if all agree. It gives you atomicity across nodes and it is a blocking protocol: a participant that fails after preparing holds its locks until it recovers, and everyone waits. That is a real availability cost for a real guarantee.

**Saga.** A sequence of local transactions, each committing on its own and publishing an event that triggers the next. If a later step fails, earlier steps are undone by compensating transactions: decrement inventory, then create the reservation, and if that fails, run an increment to put the inventory back.

Sagas are eventually consistent and non-blocking, which is why they are the common answer in microservice architectures. The cost is that every step needs a compensating action, those actions can themselves fail, and the intermediate states are observable, so a user can briefly see inventory consumed by a reservation that is about to be undone.

## The pragmatic answer

Put reservation and inventory in the same relational database and use one transaction.

That is the recommendation, and it is worth defending rather than apologizing for. The two are one invariant: a reservation exists if and only if inventory was consumed for it. Splitting them across services means rebuilding, in application code with compensating transactions, a guarantee the database already provides for free.

At three reservations per second there is no scaling argument for separating them. The other services, hotel details, rates, guests, can be separate without difficulty, because none of them shares an invariant with reservations.

The general rule worth stating: draw service boundaries so that a transaction never has to cross one. When two pieces of data must change together, they belong in the same store, and a service boundary between them buys organizational independence at the price of a correctness mechanism you now have to build and operate.

## Scaling the reads

Reservations are three per second; page views are far higher. The read path is ordinary:

- Cache hotel and room details in Redis. They change rarely and are read constantly, which is the caching rule from Part 1 exactly.
- Shard by `hotel_id` if the data outgrows one database. Hotels are independent, so queries never span shards, and reservations for one hotel land on one shard where the inventory rows also live.

Sharding by `hotel_id` is worth noting as a case where the natural boundary and the transaction boundary coincide. Nothing about a reservation ever touches two hotels, so the shard key and the transaction stay aligned.

## Predict, then verify

You use a saga: decrement inventory, then create the reservation, compensating with an increment if it fails. The compensating increment itself fails. What is the state, and what do you do?

Answer: inventory is consumed for a reservation that does not exist, so a room is unsellable and nothing in the system knows it. This is the failure sagas are usually described without: the compensation is a distributed operation too, and it can fail for exactly the reasons the original did. You cannot compensate the compensation, since that recursion has no base case. What real implementations do is make compensating transactions idempotent and retry them indefinitely from a durable log of in-flight sagas, so "failed" becomes "not yet succeeded" and the state is eventually repaired. That requires the saga log itself to be durable and monitored, and someone to look when a compensation has been retrying for an hour. This is the concrete cost the previous section was pointing at: a saga is not one mechanism, it is a compensating action per step, a durable log, a retry loop, and an alert, all to replicate what `BEGIN` and `ROLLBACK` did in one database.
