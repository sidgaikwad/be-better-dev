You have 4 cache servers and you spread keys across them the obvious way:

```text
serverIndex = hash(key) % 4
```

`hash(key0) % 4` is 1, so key0 lives on server 1. Even distribution, one arithmetic operation, nothing to maintain. This works perfectly as long as the number 4 never changes.

## What happens when it changes

Server 1 goes offline. The pool is now 3, so the function becomes `hash(key) % 3`. The hashes did not change, but the remainders did, for nearly every key.

Take a key whose hash is 100. Under mod 4 it was on server 0. Under mod 3 it is on server 1. A key hashing to 101 moves from server 1 to server 2. Work through a table of keys and you find that the keys staying put are only those where the two remainders happen to coincide, and that is a small minority.

So losing one server out of four does not invalidate a quarter of your cache. It invalidates most of it.

## Why this is worse than it sounds

Every client is now asking the wrong server for its data. Those servers do not have it, so every request is a miss, and every miss goes to the database.

This is the cold cache scenario from the caching section, except triggered by losing one machine rather than by restarting the whole tier. A database sized for 1% of read traffic suddenly receives most of it, and it falls over. A single cache node failing takes down your database, which is exactly the opposite of what redundancy was supposed to do.

The same problem appears when you add capacity. Going from 4 servers to 5 relocates roughly 80% of keys, so the act of scaling up produces an outage.

## What you actually want

State the requirement precisely, because the precision is what points at the answer: when the server count changes by one, only the keys that must move should move.

If server 1 holds a quarter of the keys and it disappears, then a quarter of the keys have lost their home and have to go somewhere. That is unavoidable. The other three quarters have a perfectly good home and should stay in it. Modulo moves them anyway, and that is the whole defect.

The formal version, which is the wording you will meet in the literature: adding or removing a slot should remap on the order of `k/n` keys, where `k` is the number of keys and `n` the number of slots. Traditional hashing remaps nearly all of them.

## Predict, then verify

Sharding a database, not a cache, by `hash(user_id) % 4`. You add a fifth shard. Why is this worse than the cache case, not better?

Answer: because a cache miss is recoverable and a misplaced row is not. When a cache key lands on the wrong server, that server answers "I do not have it", you go to the database, and the system is slow but correct. When a database shard is computed wrong, the shard answers "no such user", and that is indistinguishable from the user not existing. You do not get a slow correct answer, you get a wrong one: users appear deleted, writes create duplicates on the new shard, and both copies are live. So the same 80% remapping that is a performance incident for a cache is a data correctness incident for a shard, and it cannot be fixed by waiting. The migration has to move the data before the mapping changes, which means running both mappings against live traffic, which is exactly the situation consistent hashing exists to avoid.
