The basic ring has two problems, and they share a cause: hashing four servers onto a ring gives you four arbitrary points, and four arbitrary points do not divide a circle evenly.

## Problem one: uneven partitions

Servers land wherever their hashes put them, so their arcs differ in size. Two servers that hash near each other leave one with a sliver and the other with whatever precedes it.

This worsens as servers come and go. The previous lesson's ending is the acute case: remove a server and its neighbor inherits the whole arc, so one machine now owns twice what its peers own, and a second failure cascades.

## Problem two: uneven keys

Even with evenly spaced servers, keys might not be evenly spread. Hash functions distribute well on average, and with few partitions "on average" does not help you: most keys can land in one arc, leaving other servers holding nothing.

Both problems are the same statistical fact. Four samples from a uniform distribution are not evenly spaced, and the fewer samples you take, the worse the imbalance.

## Virtual nodes

Take more samples. Instead of placing each server once, place it many times under derived names:

```text
s0_0, s0_1, s0_2, ... s0_199
s1_0, s1_1, s1_2, ... s1_199
```

Each of those hashes to its own position, so 4 servers with 200 virtual nodes each put 800 points on the ring. Every point is a real server wearing a different label, and a key's lookup is unchanged: walk clockwise, find the first virtual node, map it back to its server.

Both problems dissolve. Each server now owns 200 small arcs scattered around the ring rather than one large one, so the total is close to a quarter of the ring by the law of large numbers. And when a server is removed, its 200 arcs go to 200 different successors, which in practice means its load is spread across every remaining server rather than dumped on one.

That second point is the important one and the reason to reach for virtual nodes even if your distribution happens to look fine. Removing a server from a ring with virtual nodes raises everyone's load by a third, which is survivable. Removing one from a ring without them doubles one machine's load, which cascades.

## How many

More virtual nodes means more even distribution and more memory for the ring structure.

Measured: at 100 virtual nodes per server the standard deviation of load is about 10% of the mean, and at 200 it is about 5%. It keeps improving with more, with diminishing returns.

A hundred to a few hundred per server is the usual range. The ring is then a sorted structure with a few thousand entries, which is nothing, and the lookup is a binary search over it.

## Predict, then verify

You run 10 servers with 1 virtual node each, and a colleague proposes 3 servers with 500 virtual nodes each. Which distributes keys more evenly?

Answer: the 3-server configuration, and it is not close. Evenness depends on how many points are on the ring, not how many machines. Ten points split the circle into ten arcs whose sizes vary wildly, so with 10 servers the busiest can easily hold three or four times what the quietest holds. Fifteen hundred points split it into arcs that are individually random but aggregate tightly, so each of the 3 servers ends up within a few percent of a third. The general statement is that virtual node count is the parameter controlling balance, and server count is the parameter controlling capacity and blast radius. They are independent, which is why a small cluster still wants many virtual nodes, and why adding machines to a ring with one node each does not fix an imbalance.
