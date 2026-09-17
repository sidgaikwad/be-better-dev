Every transfer inside the wallet is zero-sum: one balance falls, another rises, and the total is unchanged. That invariant is the system's strongest correctness check, and it only holds for internal movements. Money entering and leaving breaks it, which is where the wallet meets the outside world.

## Three kinds of movement

**Internal transfer.** A to C. Zero-sum. Entirely within your system and fully atomic once the distributed transaction is solved.

**Top-up.** A user adds money from a card or bank. Money appears in the wallet that did not exist there before, and it must correspond to money that really arrived in your bank account.

**Withdrawal.** A user takes money out to a bank account. Money leaves the wallet and must correspond to money really leaving yours.

The second and third are the payment section's pay-in and pay-out, arriving here as the boundary of an otherwise closed system.

## The invariant, stated properly

The naive version, that the sum of all wallet balances never changes, is false as soon as top-ups exist. The correct version:

```text
sum of all wallet balances = money held in your bank accounts on users' behalf
```

Every top-up increases both sides; every withdrawal decreases both. Internal transfers change neither.

That is the real check, and it is the one regulators care about, because the difference between the two sides is money you are holding that is not attributable to a user, or money users believe they have that you do not hold.

Express it as a **float account** in the ledger: a system account representing funds held externally. A top-up debits the float and credits the user, so it is an internal double-entry transaction, and the sum of every account including the float stays zero. The invariant from the payment section is preserved by treating the outside world as one more account.

## Timing is the problem

Internal transfers are instant. External movements are not, and the mismatch is where the bugs live.

A card top-up authorizes in seconds and settles in days. A bank transfer may take days to arrive and can be reversed after it does. A withdrawal leaves your system immediately and reaches the user later, and can fail after you have already debited them.

So a balance credited on authorization can be credited against money that never arrives, and the standard defenses are:

- **Credit on settlement, not authorization**, for slow instruments. Safe, and it means the user waits, which they will complain about.
- **Credit immediately and bear the risk**, with limits by user history. Good product, and it is lending, which has its own rules.
- **Credit to an unavailable balance** until settlement, so the money is visible and not yet spendable.

The third is what most wallets do, and it is why balances have states rather than being one number: available, pending and held.

## Reversals

The failure that internal-only thinking does not prepare you for: a settled top-up can be reversed days later by a chargeback or a bank recall.

By then the user may have spent it, so the wallet balance goes negative, which a naive design forbids. It has to be representable, because it already happened: the correct model records the reversal as a normal debit and allows the balance to go below zero, then handles the resulting debt as a business problem rather than pretending the event cannot occur.

A system whose schema makes an event impossible does not prevent the event; it prevents you from recording it, which is worse.

## Predict, then verify

You reconcile daily: the sum of wallet balances against your bank balance. They differ by exactly one pending withdrawal. Is that a discrepancy?

Answer: no, it is the expected state, and the useful realization is that the reconciliation must model timing rather than compare two totals. A withdrawal debited from the user at 4pm and settling at the bank the next morning means that overnight the wallet total is lower than the bank balance by that amount, and nothing is wrong. Comparing raw totals produces a mismatch every single day, which trains everyone to ignore the report, and an ignored reconciliation is worse than none because it creates the belief that checking is happening. The correct comparison adds in-flight movements: wallet total plus outbound in flight minus inbound in flight should equal the bank balance. Then a genuine discrepancy is anything that does not fit, and the report is quiet enough that a non-zero result means something. This is the same lesson as the ad click reconciliation gap, arrived at from the other side: there the fix was to alert on deviation from a known baseline, and here it is to compute the baseline exactly so the expected value is zero.
