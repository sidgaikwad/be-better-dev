import type { SectionSeed } from "../types"

export const rustKubernetes: SectionSeed = {
  slug: "rust-kubernetes",
  title: "Rust with Kubernetes",
  description: "Deploying the newsletter: probes, config, rolling updates, kube-rs.",
  badgeIcon: "☸️",
  badgeTitle: "Kubernetes × Rust",
  units: [
    {
      slug: "the-model",
      title: "The model",
      description: "A database of desired state, and small loops that make it true.",
      lessons: [
        {
          slug: "k8s-desired-state",
          title: "Desired state and reconciliation",
          summary: "kubectl apply writes a record; controllers converge the world toward it.",
          contentFile: "k8s-desired-state.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "What has happened at the moment `kubectl apply -f deployment.yaml` returns successfully?",
              options: [
                "Containers are running on the selected nodes",
                "A validated record was stored by the API server; no container need exist yet",
                "The kubelet has pulled the image and is starting containers",
                "The scheduler has assigned every pod to a node",
              ],
              answer: 1,
              explanation:
                "Apply is a database write, not a command. Convergence happens afterwards, through the controller chain: Deployment to ReplicaSet to Pods to scheduler to kubelet, each loop acting on records the previous one wrote.",
            },
            {
              kind: "predict",
              prompt:
                "The ReplicaSet controller is down for five minutes. During that window a node dies, taking one of the newsletter's two pods. What happens when the controller restarts?",
              options: [
                "Nothing: the deletion event was missed, so the gap is invisible",
                "It replays a durable event log to find what it missed",
                "It re-observes current state, sees one pod where two are desired, and creates a replacement",
                "The pod was already replaced: pods restart themselves",
              ],
              answer: 2,
              explanation:
                "Controllers are level-triggered: each cycle compares desired against observed state, so missed events are irrelevant. That is exactly why the system tolerates its own components crashing.",
            },
            {
              kind: "mcq",
              prompt:
                "Pods are replaced, not repaired, and every replacement gets a new IP. Which object exists to solve the problem that creates?",
              options: ["Deployment", "Ingress", "Pod", "Service"],
              answer: 3,
              explanation:
                "A Service is a stable virtual IP and DNS name that load-balances across whatever ready pods currently match its label selector, so callers never track individual pod IPs. Deployments answer scale and rollout; Ingress answers external HTTP routing.",
            },
          ],
        },
        {
          slug: "k8s-newsletter-manifests",
          title: "The newsletter, in two records",
          summary:
            "A minimal Deployment and Service, every line justified; config and secrets as env.",
          contentFile: "k8s-newsletter-manifests.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "In the newsletter Deployment, what is the actual job of `spec.selector.matchLabels`?",
              options: [
                "It names the pods so kubectl can display them",
                "It is the join key: the Deployment claims whatever pods match these labels, so it must equal the template's labels",
                "It restricts which nodes the pods may run on",
                "It tells the Service which port to forward to",
              ],
              answer: 1,
              explanation:
                "Ownership is by label match, not by name, which is also how the Service finds the same pods. A selector that fails to match the template's labels is rejected because the Deployment could never claim what it creates.",
            },
            {
              kind: "predict",
              prompt:
                "You update the db-password value in the Secret and apply it. The pods keep running. Does the newsletter process see the new password?",
              options: [
                "Yes: env vars from secretKeyRef update live",
                "Yes, after the config crate re-reads its sources",
                "No: env vars are fixed at container start, so pods must be restarted (for example with kubectl rollout restart)",
                "No: Secrets are immutable and cannot be updated",
              ],
              answer: 2,
              explanation:
                "A process's environment is set at exec time; nothing can rewrite it afterwards. Secrets mounted as files do update in place, but env-injected values need a restart, so a password rotation implies a rollout.",
            },
            {
              kind: "mcq",
              prompt:
                "Kubernetes stores Secret values base64-encoded. What protection does that provide?",
              options: [
                "None: base64 is encoding, not encryption; real protection is API access control and encryption at rest",
                "Strong protection: base64 requires the cluster key to reverse",
                "It protects values in transit but not at rest",
                "It prevents secrets from appearing in kubectl output",
              ],
              answer: 0,
              explanation:
                "Base64 exists so arbitrary bytes survive JSON, and anyone permitted to read the Secret can decode it trivially. The Secret's practical win is keeping credentials out of the Deployment YAML and out of git, while RBAC and at-rest encryption do the guarding.",
            },
          ],
        },
      ],
    },
    {
      slug: "staying-up",
      title: "Staying up",
      description: "Probes that gate the right consequence, and rollouts that drop nothing.",
      lessons: [
        {
          slug: "k8s-probes",
          title: "Probes: three questions, three consequences",
          summary:
            "Liveness restarts, readiness routes, startup waits; /health_check meets the kubelet.",
          contentFile: "k8s-probes.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "A pod's readiness probe starts failing while its liveness probe keeps passing. What does Kubernetes do?",
              options: [
                "Restarts the container with backoff",
                "Removes the pod from Service endpoints and leaves the process running; traffic returns when the probe passes",
                "Deletes the pod and schedules a replacement",
                "Marks the node unhealthy",
              ],
              answer: 1,
              explanation:
                "Readiness gates routing, not life: an unready pod is throttled, not killed, and recovers by passing again. Only liveness failures trigger restarts, which is why the two must ask different questions.",
            },
            {
              kind: "predict",
              prompt:
                "A team wires `/health_check` to run `SELECT 1` and uses it as the liveness probe on all replicas. Postgres goes down for two minutes. Predict the fleet's behavior.",
              options: [
                "Pods serve 500s on database paths until Postgres returns, then recover instantly",
                "Every replica is killed around the same time, crash-loops through growing backoff, then reconnects in one stampede after Postgres recovers",
                "Only one replica restarts: Kubernetes staggers liveness failures",
                "Kubernetes pauses the probes when it detects the shared dependency",
              ],
              answer: 1,
              explanation:
                "Restarts cannot fix Postgres, so every restart fails again into CrashLoopBackOff, and recovery arrives as a synchronized cold-start against a database that just came back. A liveness probe may test only what a restart can fix, so dependencies are never allowed in it.",
            },
            {
              kind: "mcq",
              prompt: "What does a startupProbe actually do while it has not yet succeeded?",
              options: [
                "Blocks the Service from being created",
                "Sends SIGTERM if boot exceeds terminationGracePeriodSeconds",
                "Suspends liveness and readiness checks, granting a boot budget of failureThreshold times periodSeconds",
                "Delays image pull until the node has spare CPU",
              ],
              answer: 2,
              explanation:
                "It gates patience: slow boots (say, running sqlx migrations on start) are given their own budget so steady-state probes can stay strict. Once it succeeds it never runs again for that container.",
            },
          ],
        },
        {
          slug: "k8s-rolling-updates",
          title: "Rolling updates: zero-downtime, kept honest",
          summary:
            "maxSurge and maxUnavailable, SIGTERM to SIGKILL, and Part 2's shutdown paying rent.",
          contentFile: "k8s-rolling-updates.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "With `replicas: 2, maxSurge: 1, maxUnavailable: 0`, what does the rollout guarantee, and what makes the guarantee real?",
              options: [
                "Both pods are replaced simultaneously for speed",
                "Ready pods never dip below two: an old pod dies only after a new one passes its readiness probe",
                "Old pods get SIGKILL immediately once new pods are scheduled",
                "The rollout completes within terminationGracePeriodSeconds",
              ],
              answer: 1,
              explanation:
                "maxUnavailable: 0 forbids dipping below the desired ready count, and readiness is the gate that proves the replacement can serve. A new version that never becomes ready stalls the rollout with old pods still serving, which is the safety property working.",
            },
            {
              kind: "mcq",
              prompt:
                "Why do requests keep arriving for a second or two after a terminating pod receives SIGTERM?",
              options: [
                "Kubernetes retries in-flight requests against dying pods",
                "Endpoint removal and SIGTERM start in parallel, and routing updates propagate asynchronously across nodes",
                "The kubelet delivers SIGTERM before marking the pod Terminating",
                "keep-alive connections force the Service to keep routing new requests",
              ],
              answer: 1,
              explanation:
                "Nothing orders traffic removal before the signal, so a process that slams its listener on SIGTERM resets real requests on every deploy. Keep serving while draining, and buy propagation time with a short preStop sleep.",
            },
            {
              kind: "predict",
              prompt:
                "Grace period 30s. The delivery worker's shutdown drains for up to 45s. A rollout terminates its pod mid-batch. What happens at second 30?",
              options: [
                "Kubernetes extends the grace period because work is in flight",
                "SIGTERM is re-sent and the worker gets another 30 seconds",
                "SIGKILL: uncatchable, the remaining in-flight sends die; redelivery plus the idempotency store make the outcome correct anyway",
                "The rollout rolls back automatically",
              ],
              answer: 2,
              explanation:
                "SIGKILL cannot be handled, so the last 15 seconds of work simply vanishes mid-flight, exactly the crash Part 3's at-least-once design absorbs. The engineering fix is arithmetic: in-process drain deadline below the grace period, or a grace period raised to fit the measured worst case.",
            },
          ],
        },
      ],
    },
    {
      slug: "runtime-and-api",
      title: "The runtime and the API",
      description:
        "Cgroup limits meet the tokio scheduler; then the cluster becomes a typed Rust client.",
      lessons: [
        {
          slug: "k8s-resources-tokio",
          title: "Resources: requests, limits, and tokio",
          summary:
            "Scheduling versus enforcement, OOMKilled, and why CPU throttling is cruel to cooperative schedulers.",
          contentFile: "k8s-resources-tokio.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "What is the actual difference between `resources.requests` and `resources.limits`?",
              options: [
                "Requests are a soft limit; limits are the same value with alerting",
                "Requests reserve capacity for scheduling and set contention shares; limits are kernel-enforced ceilings via cgroups",
                "Requests apply to CPU, limits apply to memory",
                "Requests are per pod, limits are per node",
              ],
              answer: 1,
              explanation:
                "They are two unrelated mechanisms: the scheduler bin-packs on requests and never enforces them, while limits become cgroup settings the kernel enforces, as a hard wall for memory and a CFS time quota for CPU.",
            },
            {
              kind: "predict",
              prompt:
                "A leak (say, an unbounded channel) pushes the newsletter past its 128Mi memory limit. What do you observe?",
              options: [
                "The node starts swapping and every pod on it slows down",
                "The process is OOM-killed: status OOMKilled, exit code 137, restarted with backoff; the node is unaffected",
                "Kubernetes migrates the pod to a node with more memory",
                "Allocations start failing and the allocator returns errors the program can handle",
              ],
              answer: 1,
              explanation:
                "Memory is incompressible, so the limit is a wall patrolled by the kernel's OOM killer, and 137 is 128 plus signal 9. The blast radius stays inside the cgroup, which is precisely what the limit buys: a labeled corpse instead of a degraded node.",
            },
            {
              kind: "mcq",
              prompt:
                "Under a 500m CPU limit, why does a multi-worker tokio runtime see ~100ms latency spikes rather than a proportional slowdown?",
              options: [
                "tokio adds scheduling overhead when CPU is scarce",
                "The kernel deprioritizes async workloads under CFS",
                "Eight workers can drain the 50ms-per-100ms quota in a few milliseconds, then every thread in the cgroup freezes until the period resets",
                "The limit forces tokio into a single-threaded runtime",
              ],
              answer: 2,
              explanation:
                "The quota is summed across all threads and enforced per period, so exhaustion freezes the whole runtime, accept loop and probe handler included, a preemption invisible to a cooperative scheduler. Hence the mitigations: match worker count to quota, or skip CPU limits and keep honest requests.",
            },
          ],
        },
        {
          slug: "k8s-kube-rs",
          title: "kube-rs: the cluster as a typed API",
          summary:
            "The typed client, watch streams, the shape of a controller, and when an operator is justified.",
          xp: 25,
          contentFile: "k8s-kube-rs.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "How does `kube::Client::try_default()` authenticate?",
              options: [
                "It requires a token passed as an argument",
                "Like kubectl: kubeconfig on a workstation, the mounted service-account token when running inside a pod, so one binary works in both places",
                "It only works inside the cluster",
                "It connects anonymously and relies on RBAC defaults",
              ],
              answer: 1,
              explanation:
                "Configuration inference is the point: the same program runs on a laptop against kubeconfig and in a Deployment against the in-cluster service account. Everything after authentication is typed structs from k8s-openapi rather than YAML.",
            },
            {
              kind: "predict",
              prompt:
                "A kube-rs controller is down for ten minutes while three Newsletter objects are edited. It restarts. How does it handle the edits it never saw?",
              options: [
                "It misses them until the objects are edited again",
                "It replays events from a durable log kube-rs maintains",
                "Its watcher re-lists all objects on startup and reconciles each against current state; missed events are irrelevant",
                "The API server holds events for disconnected watchers indefinitely",
              ],
              answer: 2,
              explanation:
                "reconcile receives an object, never an event, and recomputes convergence from current state, so a re-list after downtime covers everything. That is also why reconcile must be idempotent: unchanged objects get reconciled again, and converging twice must be harmless.",
            },
            {
              kind: "mcq",
              prompt: "Which situation actually justifies writing an operator?",
              options: [
                "Deploying a stateless web service with config and secrets",
                "Restarting pods when they crash",
                "Converging state that needs domain knowledge no stock controller has, like provisioning a database per tenant or orchestrating backup and failover",
                "Scaling replicas up under CPU load",
              ],
              answer: 2,
              explanation:
                "Deployments, Services, probes, and autoscalers already reconcile the ordinary cases; the newsletter itself needs no operator. The telltale trigger is a cron job wrapping kubectl in bash: that loop is a reconcile function waiting to be typed.",
            },
          ],
        },
      ],
    },
  ],
}
