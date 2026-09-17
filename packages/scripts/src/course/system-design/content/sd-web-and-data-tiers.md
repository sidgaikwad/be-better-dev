Splitting the web app onto one server and the database onto another is the first structural change almost every system makes. The reason usually given is "so they can be scaled independently", which is true and, stated that way, teaches nothing. Independent of what, and scaled how?

## The two workloads want different machines

A web tier serves many short requests. Each one does a little parsing, a little serialization, some template or JSON work, and then waits on the database. It is CPU-bound in bursts and mostly idle in between, it holds almost nothing in memory between requests, and any one process is interchangeable with any other.

A database does the opposite. It wants a large, stable buffer pool so hot pages never touch disk, fast sequential writes for its log, and it very much cares which machine it is on, because that machine holds the data.

Put a number on it. A web server doing 2,000 requests per second at 5 ms of CPU each needs about 10 CPU-seconds per second, so roughly 10 cores, and maybe 4 GB of memory. A database backing the same traffic might need 4 cores and 64 GB, because what it needs is for the working set to fit in RAM. On one shared box you buy the maximum of both on every axis and waste the difference. Split, you buy each shape once.

The scaling curves differ too. Double the traffic and the web tier needs roughly double the CPU, which is a purchase you can make in units of one server. Double the traffic on the database and you do not need double anything in particular: you might need nothing, if the working set still fits and the disk keeps up, or you might need a fundamentally different design. Web tier growth is arithmetic. Data tier growth is a series of cliffs.

## What the split costs

The two tiers now talk over a network, and that is a real change, not a formality.

A function call became a network round trip. On the same box a query costs whatever the database takes. Across a rack it costs that plus about 0.5 ms. A page that issued 30 queries serially just added 15 ms of pure waiting, which is often more than the queries themselves. Splitting tiers is the moment N+1 query patterns stop being untidy and start being the dominant term in your latency.

Connections became a managed resource. In one process you had one pool against a local socket. Now every web server holds its own pool, and the database sees the sum. Ten web servers with 20 connections each is 200 connections, and most databases start degrading well before they hit their configured limit, because each connection costs memory and scheduling. This is why a connection pooler shows up in front of the database roughly when the third web server does.

There is a new failure mode: the network between them. The database can be perfectly healthy and unreachable. Your code needs a timeout on every query, because without one a network partition turns into every web worker blocked forever, which presents as a total outage caused by a database that never went down.

Take the split anyway. The per-query round trip and the pooling are real costs, but they are bounded and they are fixable with batching and a pooler. Staying on one box is not fixable: it caps you at the largest machine you can buy and keeps one copy of your data.

## Predict, then verify

You split the tiers and latency gets worse, not better: p50 goes from 40 ms to 55 ms. Traffic is unchanged. Did you make a mistake?

Answer: probably not, and the number tells you what to fix. You added a network hop to every query, so a page issuing 30 serial queries picks up roughly 15 ms, which is almost exactly what you measured. Nothing is wrong with the split; what it exposed is that the page was chatty, and chattiness was free when the database was a local socket. The fix is not to undo the split, it is to stop issuing 30 round trips: batch them, join them, or cache the result. Do that and you land below the original 40 ms, because now the database has a whole machine's memory to keep those pages hot. The split converts a hidden design flaw into a visible one, which is a good trade.
