The client is built and tested. Before writing the new handlers, the chapter stops for an odd-looking question: how will this roll out? The answer ends up dictating the order of every remaining commit.

## 52 minutes per year

Once real users depend on a service, reliability stops being a feeling and becomes a number, often a contractual one. A Service Level Agreement promising "four nines", 99.99% availability, allows about 52 minutes of downtime per year. Total. Including deploys.

Now look at the naive deployment: version A is running, so switch every A instance off, start version B, route traffic. Between the switch-off and B's first healthy response nobody serves requests. Practice continuous deployment, releasing several times a day, and naive deploys alone torch the budget. "We deploy at 3am on Sundays" stops being an answer; the fix has to be architectural.

## The load balancer is the hinge

Production is not one process. It is several replicas of the application registered as backends behind a load balancer; every incoming request hits the balancer, which picks a healthy backend to serve it. Two properties make this the hinge for everything else:

- Backends are added and removed dynamically. Traffic spike? Register more replicas: horizontal scaling.
- The balancer health-checks its backends. Passively, by watching each backend's status codes and latency; or actively, by requesting an endpoint like `/health_check` on a schedule and evicting any backend that fails for long enough. The trivial endpoint from the sign-up section finally meets its real consumer: a machine deciding whether you receive traffic.

Health checks make a platform self-healing: a wedged replica is detected, removed, and replaced with no human awake. Kill a process and the platform shrugs and starts another.

## Rolling updates

With that infrastructure, zero-downtime deployment becomes a procedure:

1. Three replicas of version A are serving. Spin up one replica of B, routed to by nobody.
2. B passes a few health checks; register it. Four backends now, three A and one B, all serving live production traffic.
3. Switch off one A. Three healthy backends again.
4. Repeat until only B replicas remain.

At every instant there are at least three healthy backends, so users never notice. Digital Ocean's App Platform, the book's host, does exactly this under the hood; blue-green and canary deployments are variations on the same principle: stand the new version up beside the old one and shift traffic only when it proves healthy.

## The constraint that just appeared

Read step 2 again. Three replicas of A and one of B are serving production together. That is not a disaster scenario, it happens on every single deploy: version N and version N+1 always coexist during a rollout. And because cloud-native backends are stateless, delegating all persistence to Postgres, both versions are reading and writing the same database at the same moment. The load balancer's whole premise is that any backend can serve any request, which only holds if state lives outside the application.

So every schema change must remain legible to two adjacent versions of the code simultaneously. That one sentence is why our feature, which needs a new mandatory column and a new table, cannot ship as a single big bang. The next lesson is the choreography that gets it live anyway.

## Predict, then verify

To save money, the book's app runs a single replica. During a rolling update on such a platform, is there a moment with zero healthy backends? And does running one replica exempt you from the "N and N+1 coexist" constraint?

Answer: no downtime, and no exemption. The platform starts the new replica first, gates it behind health checks, registers it, and only then decommissions the old one, so there are transiently two backends, one A and one B, serving together and never zero. Even at minimum scale you get zero-downtime deploys, and even at minimum scale both versions share the database mid-rollout, so every schema rule in the next lesson still applies.
