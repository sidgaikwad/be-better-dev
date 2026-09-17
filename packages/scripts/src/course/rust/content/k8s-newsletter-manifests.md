The Docker section left the newsletter as an 88MB image in a registry, listening on port 8000, configured by `APP_`-prefixed environment variables. Getting it serving on a cluster takes two records. Here is the first, with the promise that every line will justify itself:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: newsletter
spec:
  replicas: 2
  selector:
    matchLabels:
      app: newsletter
  template:
    metadata:
      labels:
        app: newsletter
    spec:
      containers:
        - name: app
          image: registry.example.com/zero2prod:0.3.1
          ports:
            - containerPort: 8000
          env:
            - name: APP_APPLICATION__BASE_URL
              value: "https://newsletter.example.com"
            - name: APP_DATABASE__PASSWORD
              valueFrom:
                secretKeyRef:
                  name: newsletter-secrets
                  key: db-password
```

`apiVersion` and `kind` identify the record type, since the API server stores many. `metadata.name` is the primary key (within a namespace). `spec.replicas` is the desired count from the previous lesson. `selector` is a join: a Deployment does not own pods by name, it claims whatever pods match these labels, which is why `template.metadata.labels` must match it. `template` is the pod stamped out for each replica. `image` pins a version tag: `:latest` plus a re-push makes "what is running?" unanswerable. `containerPort` is documentation for humans and tooling; it restricts nothing. And `env` is where the hierarchical-config lesson pays off: `APP_APPLICATION__BASE_URL` overrides `application.base_url` through the same `config` crate layering the book built, no Kubernetes-specific code in the binary. The Dockerfile already sets `APP_ENVIRONMENT=production`, so only overrides and secrets live here.

## The Service, and secrets

```yaml
apiVersion: v1
kind: Service
metadata:
  name: newsletter
spec:
  selector:
    app: newsletter
  ports:
    - port: 80
      targetPort: 8000
```

Same join, different consumer: the Service tracks every ready pod matching `app: newsletter` and load-balances across them. It gets a stable virtual IP and a DNS name, `newsletter.default.svc.cluster.local`, that other pods can call while the pods behind it churn. `port` is what callers dial; `targetPort` is where the container listens. External traffic would enter through an Ingress record pointing at this Service; the managed platform in the book did that part invisibly.

The password comes from a Secret:

```bash
kubectl create secret generic newsletter-secrets \
  --from-literal=db-password='<the real password>'
```

Be clear-eyed about what this buys. Secret values are stored base64-encoded, and base64 is encoding, not encryption: anyone allowed to read the Secret object can decode it in their head, almost. The actual protections are access control on the API (who may read secrets) and encryption of the store at rest; teams with sharper requirements sync from an external secret manager. What the Secret does do is keep the password out of the Deployment YAML, and therefore out of git.

## From apply to Running

```bash
kubectl apply -f deployment.yaml -f service.yaml
kubectl get pods
kubectl port-forward service/newsletter 8000:80
curl -i http://127.0.0.1:8000/health_check
```

Between `apply` and `Running` the whole previous lesson happens: ReplicaSet created, pods scheduled, images pulled, containers started. One prerequisite hides in the Docker section: `production.yaml` sets `application.host: 0.0.0.0`. A process bound to `127.0.0.1` is only reachable from inside its own network namespace, so the Service would connect to nothing. That bug produces pods that look perfectly healthy from the outside and refuse every connection.

## Predict, then verify

You add `APP_APPLICATION__PORT: "9000"` to the env list and re-apply, but change nothing else. The pods restart and show `Running`. What does `curl` through the Service do, and what did Kubernetes think of your broken deploy?

Answer: connection refused, or a hang, depending on the proxy path. The app now listens on 9000, but `targetPort: 8000` still points the Service at a port nobody owns; `containerPort: 8000` raised no objection because it is informational. And Kubernetes thought the deploy went fine: the process started and stayed up, which is all "Running" asserts. Nothing yet connects "the container is running" to "the service can serve". That connection is a probe, and it is the next lesson.
