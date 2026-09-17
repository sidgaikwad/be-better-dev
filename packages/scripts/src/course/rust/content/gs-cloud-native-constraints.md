This function is correct Rust. It compiles, it works, and as the foundation of a product it is doomed:

```rust
use std::fs::OpenOptions;
use std::io::Write;

fn subscribe(email: &str) -> std::io::Result<()> {
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open("subscribers.txt")?;
    writeln!(file, "{email}")
}
```

Nothing in Parts 1 and 2 explains what is wrong with it. Part 3 does. From here on the course follows Luca Palmieri's Zero to Production in Rust chapter by chapter, growing one application, an email newsletter API, from an empty repository to a deployed, fault-tolerant service. The book opens by stating its constraints, and they are worth taking slowly, because they explain nearly every architectural decision the next ten sections make.

The book's focus is cloud-native applications, built by a team of four or five engineers with mixed experience. Both halves of that sentence carry weight.

## Three expectations

Paraphrasing Cornelia Davis, the book defines cloud-native applications by what they are expected to do:

- achieve high availability while running in fault-prone environments;
- allow releasing new versions continuously, with zero downtime;
- handle dynamic workloads, such as swings in request volume.

Nothing in that list mentions code. All three reach into the code anyway.

## What each one forces

**High availability in a fault-prone environment forces distribution.** Cloud machines fail as a matter of routine; some companies deliberately rent spot instances the provider may reclaim at any moment, because they can cost up to 90% less. If the service must keep answering while any single machine can vanish, multiple instances of it have to run on multiple machines.

**Dynamic workloads force measurement.** Adding compute only works if you can tell the system is under load, spin up new replicas, and retire them afterwards so you are not paying for an idle fleet. Elastic infrastructure assumes instances appear and disappear at will.

**Replication forces state out of the process.** This is what kills the function above. Run three replicas behind a load balancer and a visitor's POST lands on replica 1 while their next request lands on replica 3; a file written by one is invisible to the others, and the next deploy replaces the container, filesystem included. So persistent state moves into a database, and instances become disposable: any replica can serve any request because nothing worth keeping lives in the process. That is the statelessness deployment guides preach, derived from first principles.

**Distribution forces observability.** You cannot attach a debugger to one of N replicas, and behind a balancer you often cannot even say which replica served the failing request. The replacement is instrumentation: the application emits logs, traces, and metrics so it can be observed from the outside. The book frames this as the craft of operating systems, stress on operating, and gives it a full chapter.

## The team half

The other half of the focus sentence sets the engineering culture. On a team you routinely change code you neither wrote nor reviewed, so one person's total understanding of the system cannot be the safety net. Hence automated tests on every commit of every branch, keeping main healthy: the reasoning behind the pipeline from "CI from day one". Hence also leaning on the type system to make undesirable states hard to represent, a thread that peaks in the type-driven validation section. The book is open about its bias: boring, correct solutions over clever ones, even at some performance cost. Get it running first, optimise later, if needed.

## Predict, then verify

Suppose you ship `subscribe` above anyway. Which of the three expectations does it break in production?

Answer: all three. High availability: the machine holding subscribers.txt is a single point of failure, and losing its disk loses the product. Zero-downtime releases: a deploy replaces the container and its filesystem, so the list is wiped or must be migrated by hand. Dynamic workloads: a second replica cannot be added, because each instance would accumulate its own divergent list. One innocent design choice violates every constraint at once, which is why the book reaches for Postgres in its first real chapter.
