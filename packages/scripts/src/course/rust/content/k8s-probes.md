The zero-downtime lesson ended with a machine requesting `/health_check` on a schedule and deciding whether you receive traffic. Kubernetes has that machine, the kubelet on each node, and it asks not one question but three. Confusing them is the most common way teams turn a small incident into a large one, because each probe gates a different consequence.

- **livenessProbe** asks: is this process beyond saving? Failure means the kubelet kills the container and starts a fresh one. It gates restarts.
- **readinessProbe** asks: should this pod receive traffic right now? Failure removes the pod from every Service's endpoint list; the process is left alone, and passing again restores traffic. It gates routing.
- **startupProbe** asks: is it still booting? Until it succeeds, liveness and readiness are suspended, with a budget of `failureThreshold` times `periodSeconds`. It gates patience.

Wired to the endpoint the book built in its very first chapter:

```yaml
containers:
  - name: app
    livenessProbe:
      httpGet:
        path: /health_check
        port: 8000
      periodSeconds: 10
      timeoutSeconds: 2
      failureThreshold: 3
    readinessProbe:
      httpGet:
        path: /health_check
        port: 8000
      periodSeconds: 5
      failureThreshold: 2
```

`/health_check` returns `200 OK` and touches nothing else, which makes it a nearly perfect liveness check: a response proves the process is up, actix-web is accepting connections, and the event loop is turning. Note `timeoutSeconds: 2`; the default is one second, and a briefly slow but healthy process should not be executed for lateness. Probes come from the kubelet on the pod's own node, straight to the pod IP, not through the Service.

## The self-inflicted crash loop

The tempting "improvement" is a deep health check: have the handler run `SELECT 1` so it fails when Postgres is unreachable. Put that behind a liveness probe and trace the consequences. Postgres goes down for two minutes. Within about thirty seconds, every replica has failed three checks; the kubelet kills all of them. Restarting does not fix Postgres, so the replacements fail too, and each container enters CrashLoopBackOff, a restart delay that doubles up to five minutes. When Postgres returns, your pods are sitting out backoff timers, then all cold-start and open connection pools at the same instant: a thundering restart against a database that just recovered. A dependency outage became a self-inflicted platform outage.

The rule: a liveness probe may test only what a restart can fix. Deadlock, a wedged runtime, a leaked-away event loop: yes. A dependency: never.

Readiness is the defensible place for dependency awareness, since unready pods are throttled, not killed. But it has its own fleet-wide failure: if every replica's readiness checks the same shared database, they all go unready together, the Service's endpoint list empties, and callers get connection refused for everything, including endpoints that never touch the database. Serving 500s from the affected paths is often strictly better than serving nothing. Reserve readiness for conditions that are per-pod (still warming up, local queue saturated), and let handlers own their own dependency errors, as the error-handling chapters designed.

Startup probes matter less for Rust than for heavier runtimes; the newsletter binary is accepting connections in milliseconds. It earns its place if boot does real work, for example running sqlx migrations on start, where a generous `failureThreshold: 30, periodSeconds: 2` buys a minute of patience without loosening steady-state probes.

## Predict, then verify

Two teams run the newsletter. Team A's `/health_check` pings Postgres and backs the liveness probe. Team B's returns 200 unconditionally and backs both probes. Postgres drops for 90 seconds. Compare the two fleets five minutes later.

Answer: Team B's pods never restarted; subscribe requests returned 500 while inserts failed, `/health_check` kept passing, and service was fully normal the moment Postgres returned. Team A's pods were all killed around the same time, crash-looped through growing backoff, then reconnected in one synchronized stampede; their outage outlived the database's by minutes. The difference is not probe tuning, it is what question each probe was allowed to answer: B restarted only what restarts can fix, and that was nothing.
