An AP store accepts writes during a partition, so two replicas can accept conflicting writes to the same key. Both are legitimate, neither is newer in any meaningful sense, and something has to decide what the value is. Detecting that situation is what versioning is for.

## How the conflict arises

n1 and n2 both hold `name = "john"`. During a partition, a client writes `"johnSanFrancisco"` to n1 and another writes `"johnNewYork"` to n2. Both succeed. The partition heals.

There are now two values. The original is irrelevant, since both changes were made from it. Between the two, nothing in the data says which should win.

The naive answer, last write wins by timestamp, is worse than it looks. Clocks on different machines disagree by milliseconds at best, so "last" is decided by clock skew rather than by causality, and the loser's write is silently discarded. For a shopping cart that means a customer's item vanishes with no error.

## Vector clocks

A vector clock is a set of `[server, counter]` pairs carried with the value. When a write lands on server Si, increment Si's counter if it exists, otherwise add `[Si, 1]`.

Trace it:

1. A client writes D1 through Sx. The clock is `D1([Sx, 1])`.
2. A client reads D1, updates it, writes D2 through Sx. The clock is `D2([Sx, 2])`.
3. A client reads D2, updates it, writes D3 through Sy. The clock is `D3([Sx, 2], [Sy, 1])`.
4. Concurrently, another client reads D2, updates it, writes D4 through Sz. The clock is `D4([Sx, 2], [Sz, 1])`.
5. A client reading now gets both D3 and D4 and can see they conflict.

The comparison rule:

- X is an **ancestor** of Y, so no conflict, if every counter in X is less than or equal to the corresponding counter in Y. `([s0, 1], [s1, 1])` is an ancestor of `([s0, 1], [s1, 2])`, so the second simply wins.
- X and Y are **siblings**, so a conflict, if each has a counter higher than the other's somewhere. `([s0, 1], [s1, 2])` and `([s0, 2], [s1, 1])` conflict: neither descends from the other.

That is the real contribution. Timestamps guess at ordering; vector clocks record causality, so the store can tell "this write knew about that one" from "these happened independently". It never tells you which value is right, because that is a question about your data rather than about the system.

## The two costs

**Complexity moves to the client.** The store returns siblings and the application decides. Amazon's carts merge by union, since a customer would rather see an item they removed than lose one they added. A counter might sum. A user profile might have to ask the person. Each requires thought, and there is no general answer.

**The clock grows.** Every server that ever handled a write adds a pair. A long-lived key touched by many coordinators accumulates a long vector. The standard mitigation is a length cap that drops the oldest pairs, which can make a descendant look like a sibling and produce a false conflict. Amazon reported never hitting this in production, so it is an acceptable answer for most systems.

## Predict, then verify

Your store returns two siblings for a shopping cart: one with items A and B, one with A and C. Your code takes the one with the later timestamp. What is the bug, and what should it do?

Answer: the bug is that whichever sibling loses, a real item the customer added disappears, and nobody is told. Timestamps are exactly what vector clocks exist to avoid relying on, and here the two writes are concurrent by construction, so the timestamp comparison is decided by clock skew between two machines. Picking either sibling loses either B or C. The correct resolution is the union, giving A, B and C, because for a cart a false addition is recoverable by the customer removing it while a silent deletion is not recoverable at all. That asymmetry is the general principle for merging siblings: choose the resolution whose error the user can correct, and prefer over-inclusion to silent loss. Deletion is what makes this genuinely hard, since a removed item and a never-added item look the same under union, which is why real carts record removals as entries rather than as absences.
