The web tier is redundant now. The data tier is not: there is one database, and if it dies the site is down with all the load balancers in the world in front of it. Replication is the standard answer.

## Leader and followers

One database accepts writes. It is the leader. Others receive a stream of its changes and serve reads only. They are followers.

The books you will read call these master and slave, and so do many tools and configuration files you will meet in production, so recognize the terms. Current usage is leader and follower, or primary and replica, and that is what this course uses.

Every insert, update and delete goes to the leader. Every read can go to any follower. Since most applications read far more than they write, the pool is lopsided by design: one leader, several followers.

Three things this buys: read throughput, because reads run in parallel across followers instead of queueing on one machine; durability, because the data exists in more than one place, and in more than one building if the followers do; and availability, because a database can go offline and the system keeps serving.

## What happens when one dies

If a follower goes offline, reads shift to the remaining followers, or to the leader if that was the last one. Mild.

If the leader goes offline, a follower is promoted to leader and writes resume against it. Stated that fast, it sounds symmetrical with the web tier. It is not, and the difference is the most important thing in this lesson.

Replication is asynchronous in most deployments. The leader commits a write and answers the client without waiting for followers to catch up. So at the instant the leader dies, the followers are behind it by some amount, usually milliseconds, occasionally much more. Promote one and the writes in that gap are gone. They were acknowledged to users and they no longer exist. Recovering them means reading the dead leader's log, if the dead leader's disk survived, and replaying by hand.

Choosing which follower to promote is its own problem too. Promote a stale one while a fresher one comes back later and you have two servers that both believe they are the leader, with divergent data. That is split brain, and resolving it means discarding one side's writes.

A second consequence shows up long before any failure: a read from a follower can return data older than a write you just made. A user updates their profile, the write goes to the leader, the next page load reads from a follower that has not caught up, and the old name comes back. The user thinks the save failed. This is replication lag, and it is the normal state of the system, not an error condition. The usual fix is to route reads to the leader for a short window after that user writes, which is targeted rather than global: give up the read scaling for one user for a few seconds instead of for everyone always.

Take replication anyway. The alternative is one copy of your data, and no argument about lag competes with that. What you should not do is describe failover as automatic and move on. Say out loud that promotion can lose acknowledged writes, and that a system where that is unacceptable, a payment ledger for instance, needs synchronous replication to at least one follower and has to accept the write latency that costs.

## Predict, then verify

Your app writes to the leader and reads from followers. A user posts a comment, and the redirect back to the thread does not show it. Traffic is light and replication lag is 20 ms. What happened, and does adding followers help?

Answer: the redirect beat the replication. The write committed on the leader, the browser followed the redirect in under a millisecond of server time, and the follower that served the thread had not yet applied the change. Lag being only 20 ms is exactly why this is confusing: the window is tiny, but the redirect lands inside it every time, because it is issued immediately after the write rather than at a random moment. Adding followers makes it slightly worse, since there are more replicas that might be behind and you are no more likely to hit a caught-up one. The fix is to read this user's own writes from the leader for a few seconds after they write, or to pass the leader's log position with the redirect and have the follower wait until it has applied at least that far.
