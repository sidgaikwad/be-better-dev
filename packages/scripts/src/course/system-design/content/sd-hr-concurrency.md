Two things can go wrong at the moment of booking. The same user submits twice, and two users book the last room at once. They are different problems with different fixes.

## Double submission

A user clicks "Complete my booking" twice. Two identical inserts, two reservations.

**The client-side fix**, disabling the button after the first click, prevents most of it and is not a solution. JavaScript can be disabled, the request can be replayed, the network can retry.

**The real fix is an idempotency key.** Generate a `reservation_id` before showing the confirmation page, return it with the page, and require it on submit:

1. The customer picks dates and room type and clicks continue.
2. The reservation service generates a globally unique `reservation_id` and returns it with the confirmation page.
3. The customer submits, including that id.
4. A second submission carries the same id, and because it is the primary key of the reservation table, the insert violates the unique constraint and fails.

The elegance is that the database enforces it. No coordination, no check-then-insert race, just a constraint that makes the second write impossible. This is the same idempotency argument as the message queue's consumers, and the key is generated before the risky operation rather than after.

## The race on inventory

Harder. One room left, two users:

1. Transaction 2 reads: `total_reserved` 99, `total_inventory` 100. One left, so it proceeds.
2. Transaction 1 reads the same. One left, so it proceeds.
3. Transaction 1 sets `total_reserved` to 100 and commits.
4. Transaction 2, isolated from transaction 1's uncommitted change, still believes it read 99, sets `total_reserved` to 100, and commits.

Two rooms sold, one room exists. The check-then-act pattern, with a gap between the reading and the writing, which is the same shape as the rate limiter's read-check-write race.

Three fixes.

## Pessimistic locking

`SELECT ... FOR UPDATE` locks the rows, so the second transaction waits.

Correct, and it serializes access to the row. It is also the one not to choose here: locks held across a transaction that involves application logic can deadlock when multiple rows are locked in different orders, and a long-lived lock blocks everyone else on that room type. It is the right tool when contention is genuinely heavy and sustained.

## Optimistic locking

Add a `version` column. Read the row and its version, and write back with `WHERE version = :read_version`, incrementing it. If someone else wrote first, the version no longer matches, zero rows update, and you retry.

No database locks at all; the application handles it. Good when conflicts are rare, which describes most reservations most of the time.

The failure mode is high contention: fifty clients read the same version, one succeeds, forty-nine retry, one of those succeeds, and so on. Correct, and a terrible experience, since a user can retry several times before either succeeding or being told the room is gone.

## A database constraint

```sql
CONSTRAINT check_room_count CHECK (total_inventory - total_reserved >= 0)
```

Update unconditionally and let the database reject the write that would break the invariant. Transaction 2 tries to set `total_reserved` to 101 against an inventory of 100, the constraint fails, the transaction rolls back.

Simplest of the three: no version column, no retry loop, no locks, and the invariant is declared in one place where it cannot be forgotten.

Take the constraint, given a reservation rate of three per second. Say what it costs: under heavy contention it produces failures where users saw availability and then could not book, which is frustrating but correct. And it is database-specific, which matters for portability and cannot be version-controlled alongside application code as easily.

## Predict, then verify

A three-night stay touches three `room_type_inventory` rows. Nights one and three have availability, night two does not. What happens with the constraint approach?

Answer: the update on night two fails, the whole transaction rolls back, and nights one and three are released, which is correct and depends entirely on all three updates being in one transaction. Written as three separate statements without a transaction, the guest would be charged for a booking that has two of three nights, which is worse than a clean failure and much harder to detect because each individual write succeeded. The subtlety worth naming is lock ordering: with three rows, two concurrent multi-night bookings that update dates in different orders can deadlock, so updates must be applied in a consistent order, typically ascending by date. That makes deadlock impossible, since every transaction acquires rows in the same sequence. This is the general rule for any multi-row transaction, and it is a one-line fix that is invisible until a production deadlock storm makes someone look for it.
