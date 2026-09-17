Confirming a subscriber used to end the story: update the row, return 200. Then the product grew. Billing wants to start a trial when someone confirms, analytics wants a signup row, a Discord bot wants to post in #growth. The obvious implementation calls each one from the confirmation handler:

```rust
confirm_subscriber(&pool, subscriber_id).await?;
billing.start_trial(subscriber_id).await?;
analytics.record_signup(subscriber_id).await?;
discord.announce_signup(subscriber_id).await?;
```

Look at what this handler now knows: three downstream services, their clients, their failure modes. Every new consumer edits this function. Worse, it imports their availability: if billing deploys a bug and returns 500s for an hour, subscribers cannot confirm, even though the subscription row would have updated fine.

## Commands and events are different sentences

Each of those calls is a command: an imperative addressed to one recipient ("start a trial") whose outcome the sender cares about. Commands are the right tool when the caller needs the answer to proceed; you cannot grant access before the card charge succeeds.

An event is a different sentence: a past-tense fact, published once to the broker from the message queues section, addressed to no one.

```rust
#[derive(Serialize, Deserialize)]
struct SubscriberConfirmed {
    subscriber_id: Uuid,
    confirmed_at: DateTime<Utc>,
}
```

The producer does not know who is listening; consumers subscribe without touching the producer. Adding a fourth consumer is a deployment, not a code review of the confirm handler. The coupling reverses direction: commands couple the sender to each receiver, events couple each receiver to the shape of the fact.

On the wire, both are serialized structs on the same transport; a RabbitMQ topic exchange carries either without caring. The distinction is intent and coupling, not technology.

## Choreography and orchestration

Multi-step flows force a second choice. Take paid signup: confirm the subscriber, start the trial, send a welcome email, post to Discord.

Choreography: nobody owns the flow. Billing listens for `SubscriberConfirmed` and emits `TrialStarted`; the email service listens for `TrialStarted`; and so on. Each service stays simple and independently deployable. The cost is that the workflow exists nowhere: it is emergent from subscriptions scattered across services. Answering "what happens after confirmation, in what order, and what if step three fails" means grepping every consumer. Cycles and orphaned steps hide well.

Orchestration: a conductor owns the flow. One component sends commands, awaits outcomes, and decides what failure means, including compensation: if the welcome email hard-fails, cancel the trial. The flow is explicit, inspectable, and changeable in one file. The cost is a central component that every step couples to, and a standing temptation to stuff business logic into it.

The working rule: a bus of facts wins when consumers are genuinely independent reactions with no ordering between them, and teams want to ship without coordinating. A conductor wins when there is one business process with steps, deadlines, retries, and compensation, and a human who gets paged when it stalls. Real systems mix them: orchestrate inside one bounded workflow, publish events at its edges. The rest of this section builds both directions: getting facts out reliably first, then, in the durable execution lessons, conductors that survive crashes.

## Predict, then verify

The team keeps the command style but wraps each downstream call in `tokio::spawn` so the handler returns 200 immediately. Does this buy the decoupling that events provide?

Answer: no. The handler still names every consumer, so new consumers still edit it, and a spawned task that fails after the response is sent vanishes without a retry or a record; from Part 2 you know a detached task's failure is observed by nobody. Spawning changes latency coupling only. Making "this fact happened, tell the others" survive crashes means writing the fact down first, which is exactly the next lesson.
