Now that the data tier is its own machine, you have to say what runs on it. The honest default is a relational database, and the interesting question is what would have to be true for you to pick something else.

## The two families

Relational databases (MySQL, PostgreSQL, Oracle) store rows in tables with a declared schema, and let you join across tables in the query rather than in your application. They have been in production for over forty years, which is not an appeal to age: it means the failure modes are documented, the operational tooling exists, and the person you hire next has already run one.

Non-relational databases, usually called NoSQL, come in four shapes worth knowing by name:

- **Key-value stores** (Redis, DynamoDB): get and put by key. No queries you did not plan for.
- **Document stores** (MongoDB, CouchDB): a key maps to a nested document you can index inside.
- **Column stores** (Cassandra, HBase): rows are wide and sparse, and the physical layout favors reading a few columns across very many rows.
- **Graph stores** (Neo4j): the edges are the data, and traversal is the primary operation.

The property they share, and the one that actually shapes designs, is that joins are generally not supported. That is not an oversight. A join requires the two sides to be reachable from one place, and the whole point of these systems is that data is spread across machines that do not coordinate on every query.

## When to leave relational

Four conditions justify it, and you want at least one to be sharply true rather than all four to be vaguely true:

- **The application needs very low latency.** Single-digit milliseconds at the 99th percentile, every time, is a key-value store's promise, not a relational database's.
- **The data is unstructured, or has no relational shape.** If nothing joins to anything, you are paying for a join engine you never call.
- **You only serialize and deserialize.** The access pattern is get a blob by id, put a blob by id.
- **The data is genuinely enormous.** Past the point where one machine cannot hold it, you are going to shard, and some NoSQL systems do that for you rather than making it your problem.

Notice what is not on that list: "we have a lot of traffic". Traffic is handled by replicas and caching, both of which a relational database does well. Reaching for NoSQL because of read volume is solving a problem you have with a tool for a different problem.

Pick relational unless one of those four applies. The reason is that you do not know your access patterns yet. A relational schema lets you answer a question you did not anticipate with a query you write that afternoon. A key-value store answers exactly the questions its keys were designed for, and a new question means a migration or a second copy of the data. Early on, the questions change weekly. Trading query flexibility for latency you do not yet need is trading the thing you will use for the thing you might.

The real systems in this course mostly end up with both. A relational database for the entities that have relationships and need transactions, plus a key-value store for sessions, counters and caches. That is not indecision, it is matching the store to the access pattern, and it becomes the normal shape by the end of Part 1.

## Predict, then verify

You are designing a URL shortener. Reads are 10,000 per second, writes 100 per second, the entire access pattern is "given a short code, return the long URL", and you expect 365 million rows a year. Relational or key-value?

Answer: key-value, and this is the rare case where the answer is not close. Three of the four conditions hold at once: the access pattern is exactly get-by-key, there is nothing to join a short code to, and the row count is heading somewhere a single machine will not hold comfortably. The read-to-write ratio of 100:1 is the shape key-value stores are built around. What makes it decisive is that the question will not change: nobody is going to ask you to find all URLs created on a Tuesday by users in Berlin, and if they do, that is an analytics job against a copy, not a query against the serving path. The flexibility you give up is flexibility you provably do not need, which is the only time giving it up is free.
