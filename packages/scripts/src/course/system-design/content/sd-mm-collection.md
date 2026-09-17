Ten million metrics have to travel from the machines producing them to the store. There are two ways to move them and a durable buffer in between, and the choice between the two is a genuine debate rather than a decision with a right answer.

## Pull

The collector scrapes a `/metrics` endpoint on each server on a schedule. Prometheus works this way.

- **Debuggable.** The endpoint is HTTP, so you can open it in a browser and see exactly what the server is reporting, from anywhere. This is worth more in practice than it sounds.
- **A free health check.** A server that does not answer the scrape is a server that is down, so liveness comes from the same mechanism.
- **Authentic by construction.** Targets are listed in configuration, so metrics can only come from machines you meant to monitor.
- **Needs reachability.** The collector must reach every target, which is awkward across data centers, firewalls and NAT.
- **Misses short-lived jobs.** A batch job finishing in seconds may never be scraped. Push gateways patch this, at the cost of the simplicity that motivated pull.

## Push

Each machine sends its metrics to a collector. CloudWatch and Graphite work this way.

- **Works through anything.** The sender initiates, so firewalls and complex topologies are not your problem, and the collector can sit behind a load balancer and autoscale.
- **Handles short-lived jobs**, which push before exiting.
- **Ambiguous failures.** No metrics arriving means the machine is down, or the network is broken, or the agent crashed, and you cannot tell which. Silence is not a signal.
- **Anything can push**, so you need allowlisting or authentication to keep junk out.

## Choosing

There is no winner, and saying so is the correct answer, which is unusual for this course. Both have large production deployments and the properties genuinely trade off.

A large organization ends up supporting both, and serverless is the reason people give: a function you do not own and cannot install an agent on has no endpoint to scrape, so it must push.

If forced to pick for this design: pull, because it is an internal system on a network you control, which removes push's main advantage, and the free health check plus the debuggability are worth real money during an incident. Then add a push gateway for short-lived jobs.

## A queue in the middle

Between collection and storage, put Kafka.

Two reasons, and the second is the important one.

**Buffering.** The write rate is constant and the storage layer may be slow or restarting. The queue absorbs it, and the previous section's argument applies: a delay is a better failure than a loss.

**Multiple consumers.** The storage layer is one consumer. The alerting system is another, and it wants the same data immediately rather than after a round trip through storage. Downsampling jobs are a third. Writing to a log that several things read, rather than to a store that several things query, is the same structure as the location stream in Google Maps.

Partition by metric name or by series id, so all points for one series land in one partition and stay ordered, which is the keying rule from the message queue section applied directly.

## Predict, then verify

Alerting reads from the queue rather than querying the storage layer. Why does that matter for a rule like "alert if CPU exceeds 90% for 5 minutes"?

Answer: because alerting needs the freshest data and storage is the slowest path to it. Reading from the queue, the alerting system sees a data point within milliseconds of collection. Querying storage means waiting for the write path to persist and index it, which adds seconds at best and much longer when the storage layer is struggling, and a monitoring system is most likely to be struggling exactly when something is wrong. That is the dependency worth avoiding: if alerting queries storage, then storage being overloaded suppresses the alerts about it being overloaded, which is the failure mode a monitoring system can least afford. Reading from the queue means alerting keeps working while storage is degraded, and it only needs a short window of recent points in memory to evaluate a five-minute rule, not a database.
