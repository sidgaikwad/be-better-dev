The fix is to stop computing a server index and start computing a position. Servers and keys both get positions in the same space, and a key belongs to whichever server is next around.

## The space

Pick a hash function with a large output range. With SHA-1 that range is 0 to 2^160 - 1.

Now join the two ends: treat the largest value as adjacent to zero. The line becomes a ring, and every hash value is a point on it.

That single move is the whole trick, and it is worth seeing why. On a line, "the next server after this key" is undefined for a key past the last server. On a ring there is always a next one, because you wrap around.

## Placing servers and keys

Hash each server by its IP or name, using the same function, and place it at that position on the ring. Four servers means four points.

Hash each key the same way. Note what is absent: no modulo, and no mention of how many servers there are. A key's position depends only on the key, which is precisely the property modulo lacked.

To find a key's server, start at the key's position and walk clockwise until you hit a server. That server owns the key.

Each server therefore owns the arc of the ring that ends at it, running back to the previous server. That arc is its partition.

## Adding a server

Place server 4 on the ring at its hashed position. Keys in the arc between server 3 and the new server 4 now hit server 4 first going clockwise, so they move. Every other key still meets the same server it met before, because nothing else about the ring changed.

Only one arc's worth of keys moves. With 4 servers becoming 5, that is roughly a fifth of the keys instead of the 80% modulo would have moved.

## Removing a server

Remove server 1. Its keys now continue clockwise to the next server, server 2, so server 2 absorbs server 1's arc in addition to its own.

Everything else is untouched: keys on servers 0 and 3 never looked at server 1 and do not care that it is gone. The cache miss storm is confined to the keys that genuinely lost their home.

## What this costs

Lookup is no longer one arithmetic operation. You need the sorted set of server positions and a binary search for the first one clockwise of the key, which is logarithmic in the number of servers rather than constant.

That is a real cost and a small one, because the number of servers is small. Searching a sorted array of a few hundred positions is a handful of comparisons, and it buys you the ability to change the server count without invalidating the world. Take the trade every time.

## Predict, then verify

Four servers on the ring. Server 1 is removed, and its keys move to server 2. What is now true about the load on server 2, and is that a problem?

Answer: server 2 now owns its own arc plus server 1's, so it holds roughly twice the data and serves roughly twice the traffic of servers 0 and 3. Whether it is a problem depends on headroom: if servers ran at 40% utilization, server 2 is now at 80% and the system survives, and if they ran at 60% it is at 120% and server 2 falls over. The second case is the dangerous one, because server 2 falling over sends its whole doubled arc to server 3, which is then at 180%, and you have a cascading failure that started with one machine. This is the fundamental flaw in the basic ring: a failure does not spread its load across the survivors, it dumps all of it on exactly one neighbor. Virtual nodes fix it, and that is the next lesson.
