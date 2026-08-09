In the going-live section a managed platform took the zero2prod image and quietly did several jobs: restarted the container when it crashed, health-checked it, rolled new versions out gradually, routed traffic to whatever was healthy. Kubernetes is that machinery with the covers off. The surprise is what sits at the center: not an orchestrator issuing commands, but a database of records and a crowd of small loops trying to make the records true.

## Apply is a write, not a command

```bash
kubectl apply -f deployment.yaml
```

Nothing executes your YAML. The file is deserialized into a typed API object, sent to the API server over HTTPS, validated, and stored (in etcd, the cluster's backing store). Then the command returns. At that moment no container has started anywhere. You have inserted a record stating a desire: two replicas of this pod template should exist.

Making it true is other programs' work. A controller is a loop that runs three steps forever: read the desired state, observe the actual state, do one small thing to narrow the gap. For our record the chain looks like this:

- the Deployment controller sees a Deployment with no matching ReplicaSet and creates one (another record)
- the ReplicaSet controller sees "2 desired, 0 exist" and creates two Pod records
- the scheduler sees Pods with no node assigned and picks nodes for them
- the kubelet on each chosen node sees a Pod assigned to it and finally starts containers

No step knows about the others. Each loop is small, dumb, and restartable, which is exactly why the whole system tolerates its own components crashing.

## Four objects, four problems

None of the objects you will write is decoration. Each exists because a specific problem forced it:

- **Pod**: the unit that runs. One or more containers sharing one IP and optionally volumes. Pods are mortal: when one dies it is not repaired, it is replaced, with a new name and a new IP.
- **Deployment**: "keep N replicas of this template running, and when the template changes, replace old pods with new ones gradually." It answers both scale and rollout.
- **Service**: pods having ephemeral IPs would make them impossible to call. A Service is a stable virtual IP and DNS name that load-balances across whichever pods currently match its label selector.
- **Ingress**: Services are reachable inside the cluster; Ingress routes external HTTP to them by host and path, and terminates TLS. (It too is implemented by a controller; the newer Gateway API generalizes the same idea.)

This is the antidote to YAML worship. YAML is just the serialization of typed API objects; every line is a field with a reason, and `kubectl explain deployment.spec.strategy` will document any of them. If you cannot say which problem a line solves, you are pasting, not configuring.

## Level-triggered, and why that is the whole trick

Controllers do not react to a stream of events they must never miss. They are level-triggered: each cycle they look at the current state of the world and reconcile it, so a controller that crashes and restarts simply re-reads everything and continues. Missed events are irrelevant because no decision depends on them.

The price is a familiar contract: reconciliation runs repeatedly against the same state, so it must be idempotent, converging rather than accumulating. That is the same discipline the idempotency lessons built for email delivery, applied to infrastructure. It is also why a 3 a.m. node failure needs no human: the records still say "two replicas", the observed count says one, and the loops close the gap.

## Predict, then verify

A Deployment declares `replicas: 2`. You run `kubectl delete pod newsletter-7d4b9-x2k1` on one of its pods. What does `kubectl get pods` show ten seconds later, and what would you do to genuinely end up with one pod?

Answer: two pods again, one of them seconds old with a new name and IP. Your delete changed actual state, not desired state; the ReplicaSet controller observed one where two were desired and created a replacement. Deleting pods is arguing with a loop that does not tire. To truly run one replica you change the record: `kubectl scale deployment newsletter --replicas=1`, or better, edit the YAML and re-apply, so the file in git stays the source of truth. You never do things to a cluster; you tell it what should be true.
