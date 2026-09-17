The query `SELECT ... WHERE query LIKE 'tw%' ORDER BY frequency LIMIT 5` does two things per request: find the matches, then rank them. A trie with cached results does both at build time, leaving a lookup.

## The structure

A trie is a tree where each node holds a character and the path from the root spells a prefix. The root is the empty string, and each node has up to 26 children for the English lowercase alphabet.

A trie holding `tree`, `try`, `true`, `toy`, `wish`, `win` shares the `t` node between the first four and the `tr` node between the first three. That sharing is why a prefix lookup is a walk rather than a search.

Add frequency to the nodes that terminate a query and you can rank.

## The naive traversal, and why it is too slow

With `p` the prefix length, `c` the number of descendants under it:

1. Walk to the prefix node. `O(p)`
2. Traverse the subtree collecting every valid query below it. `O(c)`
3. Sort those and take the top k. `O(c log c)`

Typing `tr` finds `tree: 10`, `true: 35`, `try: 29`, sorts, returns `true` and `try`.

Step 2 is the problem. For a one-character prefix, `c` is most of the trie, so the most common request is the most expensive one. Under a 100 ms budget at 48,000 requests per second, traversing a subtree of millions of nodes is not available.

## Two optimizations

**Cap the prefix length.** Nobody types a 200-character search. Cap at something like 50, and `O(p)` becomes `O(1)` for practical purposes. A small win, and it also bounds memory per node path.

**Cache the top k at every node.** This is the real one. Each node stores its own top five, precomputed:

```text
node "be" -> [best: 35, bet: 29, bee: 20, be: 15, beer: 10]
```

Now a lookup is: walk to the node, return its list. Both steps are `O(1)`, so the whole query is `O(1)` regardless of how many queries share the prefix.

## What it costs

Memory, and a lot of it. Every node stores five full query strings, so a trie with millions of nodes stores millions of copies of five strings each, and popular queries are duplicated along their entire prefix path: `best` appears at `b`, `be`, `bes` and `best`.

Take the trade. Response time is the requirement, the data is small (0.4 GB a day of new queries), and memory is the cheapest resource in this design. Spending memory to convert a traversal-and-sort into a pointer dereference is exactly the trade a 100 ms budget at 48,000 QPS asks for.

## Storing it

Two options for persistence, since the trie is rebuilt periodically rather than mutated:

- **Document store.** Serialize the whole trie and store the snapshot. Straightforward, and the unit of loading is the whole thing.
- **Key-value store.** Map each prefix to a key and its cached top-k to the value. `be` maps to the list above. This flattens the trie entirely, and lookups become a single key-value get with no tree walk at all.

The key-value form is worth noticing: once every node caches its own answer, the tree structure is only needed for building, not for serving. Serving is a hash lookup on the prefix.

## Predict, then verify

Every node caches its top five. A query's frequency changes so it should now appear in the top five for a prefix. How many nodes must be updated?

Answer: every node along its prefix path, and possibly more. If `beer` becomes popular enough to enter the top five for `be`, it also has to be reconsidered for `b` and `bee` and `beer`, so a single frequency change propagates up the whole path from the terminal node to the root. That is cheap for one query and ruinous if done per search event, because at billions of searches a day you would be rewriting the top of the trie constantly, and the root's top five would be contended by every update in the system. This is the concrete reason the next lesson's data gathering service is a batch job: the cached-top-k trie is fast to read precisely because it is expensive to update, so you rebuild it periodically from aggregated logs rather than maintaining it live. A structure optimized this hard for reads is one you do not write to.
