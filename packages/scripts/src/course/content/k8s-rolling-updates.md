The zero-downtime lesson made the argument: with a 99.99% availability target, deploys cannot cost you requests, so replacement must be gradual and health-gated. A Deployment implements exactly that. Change the image tag, `kubectl apply`, and watch `kubectl rollout status deployment/newsletter`: new pods appear, pass readiness, and only then do old pods die. Whether zero requests drop, though, depends on both sides keeping a bargain. Kubernetes keeps its half with two numbers; your binary keeps the other half with the shutdown code from Part 2.

## The cluster's half: surge and unavailability

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

`maxSurge` is how many pods may exist above the desired count during a rollout; `maxUnavailable` is how far below the desired count of ready pods you tolerate dipping. Both default to 25%. The pairing above says: create one new pod at a time, and never have fewer ready pods than `replicas` demands. The gate that makes this real is the readiness probe: an old pod is terminated only after a new one reports ready. If the new version never becomes ready, the rollout stalls with the old pods still serving, which is a feature. `kubectl rollout undo` walks back the record.

## Your half: dying well

When an old pod's turn comes, two things begin in parallel:

1. the pod is removed from the Service's endpoint list, and every node's routing rules update, asynchronously
2. the kubelet runs the container's `preStop` hook if present, then sends SIGTERM; after `terminationGracePeriodSeconds` (default 30) it sends SIGKILL

Parallel is the load-bearing word. Nothing waits for step 1 to propagate before step 2 delivers SIGTERM, so for a second or two after the signal, requests are still arriving. A process that slams its listener shut on SIGTERM serves connection resets during every deploy: a self-inflicted, invisible, recurring outage. The standard cushion is a short pre-death nap, which spends grace period, not extra time:

```yaml
lifecycle:
  preStop:
    exec:
      command: ["sleep", "5"]
```

(Possible because the Debian slim image from the Docker section still has `sleep`; a scratch image would need another approach. And the exec-form `ENTRYPOINT ["./zero2prod"]` matters here too: shell form would leave SIGTERM stuck in a shell that never forwards it.)

Then the sequence from the graceful shutdown lesson runs unchanged: stop taking new work, drain in-flight work against a deadline, exit. For the book's actix-web server, most of it is stock behavior: it catches SIGTERM, stops accepting, and waits for in-flight requests up to `shutdown_timeout` (default 30 seconds). The one adjustment is budgeting inside the grace period rather than at it:

```rust
HttpServer::new(app)
    .shutdown_timeout(20) // preStop 5s + drain 20s < 30s grace
    .bind(addr)?
    .run()
    .await
```

For the delivery worker, this is the CancellationToken and TaskTracker pattern verbatim: SIGTERM cancels the token, the loop stops claiming jobs between iterations, and `tracker.wait()` runs under a `tokio::time::timeout` shorter than the grace period. The at-least-once queue absorbs whatever the deadline abandons.

Add up the contract: readiness gates traffic onto new pods, endpoint removal plus the nap drains traffic off old ones, SIGTERM starts an orderly drain, and SIGKILL is the backstop you engineered to never matter. Long-lived connections deserve one extra thought: SIGTERM does not close established keep-alive connections, so graceful servers also signal clients (`Connection: close`, or GOAWAY on HTTP/2) as in-flight exchanges finish.

## Predict, then verify

Grace period 30s, no preStop hook, and a delivery worker whose current batch needs 45 seconds to drain. The rollout replaces its pod. What happens at second 30, and what state is the system in afterward?

Answer: SIGKILL, which cannot be caught, blocked, or handled; the remaining 15 seconds of in-flight sends die mid-flight. The system is exactly as ugly as Part 3 predicted: some emails sent but not recorded, so the idempotency store and at-least-once redelivery are what turn the mess back into "each subscriber got it once". The fix is honest arithmetic, not hope: measure worst-case drain, set the in-process deadline below the grace period, and raise `terminationGracePeriodSeconds` if the honest number does not fit.
