Everything in this section so far went through `kubectl`, but kubectl is only an HTTP client with opinions. The API server speaks JSON over HTTPS, every record you have applied is a typed object, and the first lesson's controllers are just programs watching those objects. kube-rs (the `kube` crate, a CNCF project) gives Rust both halves: a typed client, and the machinery for writing controllers of your own.

```toml
[dependencies]
kube = { version = "1", features = ["runtime", "derive"] }
k8s-openapi = { version = "0.25", features = ["latest"] }
```

`k8s-openapi` provides every built-in object as a generated Rust struct; `kube` provides the client and the controller runtime. Listing the newsletter's pods:

```rust
use k8s_openapi::api::core::v1::Pod;
use kube::{Api, Client, ResourceExt};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let client = Client::try_default().await?;
    let pods: Api<Pod> = Api::default_namespaced(client);
    for pod in pods.list(&Default::default()).await? {
        println!("{}", pod.name_any());
    }
    Ok(())
}
```

`Client::try_default` resolves credentials the way kubectl does: your kubeconfig on a laptop, the mounted service-account token when the binary runs inside a pod. The same program works in both places. And `Pod` is a real struct: `pod.spec`, `pod.status`, autocompleted in your editor, with the API's optionality made explicit as `Option` fields the compiler will not let you skip past. The YAML you have been writing by hand was always this type, serialized.

## Watching, not polling

A controller cannot poll with `list` in a loop; it subscribes:

```rust
use futures::TryStreamExt;
use kube::runtime::{watcher, WatchStreamExt};

let stream = watcher(pods, watcher::Config::default()).applied_objects();
tokio::pin!(stream);
while let Some(pod) = stream.try_next().await? {
    println!("saw {}", pod.name_any());
}
```

This is a `Stream`, consumed exactly like Part 2's streams lessons taught. Underneath, `watcher` wraps the API's watch protocol and handles the ugly parts: on disconnect or restart it re-lists everything, then resumes watching, so consumers see current state rather than a gappy event feed. That is the level-triggered discipline from the first lesson, packaged.

## The shape of a controller

The `runtime` feature's `Controller` turns a watched type plus a function into the same loop the built-in controllers run (sketch; imports and setup trimmed):

```rust
#[derive(CustomResource, Clone, Debug, Deserialize, Serialize, JsonSchema)]
#[kube(group = "example.com", version = "v1", kind = "Newsletter", namespaced)]
struct NewsletterSpec {
    issues_per_week: u32,
}

async fn reconcile(nl: Arc<Newsletter>, ctx: Arc<Ctx>) -> Result<Action, kube::Error> {
    // read nl.spec, observe the world, converge it, idempotently
    Ok(Action::requeue(Duration::from_secs(300)))
}

fn error_policy(_nl: Arc<Newsletter>, _err: &kube::Error, _ctx: Arc<Ctx>) -> Action {
    Action::requeue(Duration::from_secs(5))
}

Controller::new(newsletters, watcher::Config::default())
    .run(reconcile, error_policy, ctx)
    .for_each(|_| std::future::ready(()))
    .await;
```

The `CustomResource` derive generates a `Newsletter` type and the CustomResourceDefinition manifest that teaches the API server to store it: your domain nouns become cluster records. Notice what `reconcile` receives: the object, never "what changed". You recompute the desired world from current state every time, return when to look again, and let `error_policy` schedule retries. Idempotent, level-triggered, crash-tolerant: the controller contract is the first lesson's contract, now enforced by a function signature.

Rust fits this niche unusually well. Controllers run for months, watch thousands of objects, and sit mostly idle; a small no-GC footprint and honest `Option` handling are exactly the right tools. Real systems agree: Linkerd's policy-controller and Stackable's data-platform operators are kube-rs programs.

So when is writing one justified? When converging desired into actual requires domain knowledge no stock controller has: provisioning a database per tenant, orchestrating backup and failover, cleaning up resources in an external system when a record disappears. The newsletter needs none of that; Deployment, Service, and probes already reconcile it. The honest trigger is noticing you have written a cron job wrapping kubectl in bash. That loop wants to be a `reconcile` function.

## Predict, then verify

Your controller crashes and stays down for ten minutes. During the outage, three `Newsletter` objects are edited. It restarts. Did it miss those changes?

Answer: no, and not because anything buffered events for it. On startup the watcher re-lists all `Newsletter` objects and the controller reconciles each one against its current spec; edits made during the outage are simply part of current state. This is why reconcile must be idempotent: the same objects get reconciled again, changed or not, and converging twice must be harmless. An edge-triggered design would owe you a durable event queue and replay; the level-triggered design owes you nothing but a re-list.
