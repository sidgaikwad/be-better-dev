Distributed transactions make a transfer atomic. They do not tell you why a balance is what it is, and auditors ask three questions that a balance column cannot answer:

1. What was the balance at any given time?
2. How do you know the historical and current balances are correct?
3. How do you prove the logic is still correct after a code change?

Event sourcing answers all three.

## Four terms

**Command.** An intention from outside: "transfer $1 from A to C". It may be invalid, since the balance may be insufficient. Commands go into a FIFO queue, typically Kafka, because order matters.

**Event.** The result of validating and fulfilling a command: a past-tense fact. "Transferred $1 from A to C." A command may produce zero, one or many events.

**State.** What events change. Here, a map of account to balance, held in a database.

**State machine.** The thing that validates commands into events and applies events to state.

## The critical distinction

A command may contain randomness or I/O. An event may not.

Validating a command might call a fraud service, read a clock, or generate an identifier. Events are historical facts, so applying one must be deterministic: the same event on the same state always gives the same result.

That single rule makes everything else work. Nondeterminism must happen during validation, when the command becomes an event, and its result baked into the event. An event saying "apply today's exchange rate" is wrong; one saying "applied rate 1.0934" is right.

## How a transfer flows

1. The command `A -> $1 -> C` is read from the queue.
2. The state machine reads A's balance from the database.
3. It validates: does A have at least $1?
4. If yes, it generates two events: `A: -$1` and `C: +$1`.
5. The events are appended to an immutable event store.
6. The events are applied, updating both balances.

Step 5 before step 6 is the ordering, and it is the same as the payment ledger's: the durable record is written before the derived view.

## Reproducibility

This is what the requirement asked for, and it falls out for free.

The event list is immutable and the state machine is deterministic, so replaying every event from the beginning reconstructs the exact state at any point in history. The database holds only the current view; the events hold the truth.

The three auditor questions:

1. **Balance at any time?** Replay to that point.
2. **Are the balances correct?** Recompute from events and compare.
3. **Is the logic correct after a change?** Replay historical events through the new code and check the states match, which is a regression test over your entire production history.

That third is the strongest argument and the one most people miss: it turns every transaction the system ever processed into a test case, which is an unusually good position when changing money-handling code.

## What it costs

The event store grows forever and replaying years of it is slow, so periodic snapshots let a replay start from a known state rather than zero.

Reads change shape too: current balance is a lookup in the derived state rather than in the events, so the read and write models are separate things, which is the separation CQRS names.

And the determinism rule is a permanent constraint on every future change: any developer who adds a clock read or an API call to event application has broken reproducibility, silently, and it will be discovered during an audit.

## Predict, then verify

You replay the entire event history through updated code and the final balances do not match the stored ones. Is the new code wrong?

Answer: not necessarily, and distinguishing the cases is the whole value of the exercise. Three possibilities. The new code has a bug, which is what the check is for. The old code had a bug that has now been fixed, so the replay is right and the stored balances have been quietly wrong, which is exactly the class of problem reproducibility exists to surface. Or the event application was never fully deterministic, because somewhere a developer read a clock or called a service during apply, so replaying at a different time legitimately produces different results. The third is the one to check first, because it invalidates the comparison entirely: if apply is not deterministic, a mismatch tells you nothing about either version of the logic. That is why the determinism rule is stated as absolute rather than as a guideline, and why a replay test run regularly is more valuable than one run at audit time: it detects the day determinism was broken rather than discovering it years later with no way to tell which events are affected.
