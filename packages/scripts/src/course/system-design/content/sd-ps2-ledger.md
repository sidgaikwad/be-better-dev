The ledger is where the payment system's truth lives. Getting its structure right is what makes every later question, reconciliation, disputes, reporting, answerable.

## Double-entry

The principle: every transaction is recorded in two accounts, one debited and one credited, for the same amount.

```text
Account   Debit   Credit
buyer     $1
seller            $1
```

The sum of all entries is always zero. A cent lost by one account is gained by another, which means money can never appear or disappear, only move.

That property is the whole point, and it is worth stating as an invariant rather than a convention: if the sum of your ledger is not zero, you have a bug, and you can check it continuously. A single-entry system recording "seller balance +$1" has no such check, so a lost update is indistinguishable from a transaction that never happened.

Double-entry also gives traceability. Every movement has both endpoints, so any balance can be derived by summing its entries, and any balance can be explained by listing them.

## Append-only

Ledger entries are never updated or deleted. A correction is a new compensating entry, not an edit.

Refunding a $1 payment does not remove the original entry; it adds a new pair reversing it. The history then shows that the customer paid and was refunded, which is what happened, rather than showing that nothing happened.

This is what makes audit possible, and it is the same principle as the leaderboard's point table: the record is the events, and every balance is derived. Square's engineering writing on immutable double-entry accounting is the standard reference.

## Ledger and wallet are different things

Easy to conflate and worth separating.

The **ledger** is the immutable record of every movement. The **wallet** holds current balances, which is a derived aggregate.

The wallet exists because deriving a balance by summing every historical entry is expensive at read time, and balances are read constantly. It is a materialized view, which means it can diverge from the ledger, and reconciliation has to check them against each other.

That is the third appearance of the same pattern in this part: sorted set over point table, aggregate over raw events, wallet over ledger. In each, the fast thing is derived and the slow thing is true.

## Payment states

Each payment order carries a state, persisted in an append-only table so the history of transitions survives:

```text
created -> pending -> succeeded
                   -> failed
succeeded -> refunded
```

Appending transitions rather than updating a status column means you can answer when a payment entered each state, which is the first question asked in any dispute and is unanswerable from a mutable column.

## Predict, then verify

A payment succeeds at the PSP, you write the ledger entries, and the wallet update fails. What is the state, and how is it repaired?

Answer: the ledger is correct and complete, the money genuinely moved, and the seller's displayed balance is wrong and too low. This is the right way round, and the design should be arranged so it is always this way round rather than the reverse: the ledger is the source of truth, so a failure that leaves the derived view stale is recoverable, while a failure that corrupted the ledger would not be. Repair is rederivation, summing the seller's ledger entries to recompute the balance, which works because double-entry entries are complete and immutable. A reconciliation job should do that comparison continuously rather than waiting for someone to notice, since the symptom is a seller seeing less money than they earned, and they will notice. The ordering rule worth extracting: always write the durable record before the derived view, so that a crash between them leaves something you can rebuild from rather than something you cannot.
