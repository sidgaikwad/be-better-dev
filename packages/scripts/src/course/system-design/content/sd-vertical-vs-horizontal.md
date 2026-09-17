Your web server is saturated. There are exactly two things you can do about it: make the machine bigger, or add another machine. The industry names them scaling up and scaling out, and the choice between them is the first genuine architectural fork in this course.

## Scale up

Vertical scaling means adding CPU, memory or disk to the server you already have. Its advantage is that nothing about your code changes. No shared state to extract, no coordination, no new failure modes. You stop the instance, pick a bigger one, start it. On a cloud provider this is ten minutes of work and it will carry you a surprisingly long way.

Two limits end it.

The first is a hard ceiling. There is a largest machine available, and once you are on it there is no next step. The ceiling is high, and it moves every year, but it exists.

The second limit is the one that matters, and it applies from the very first day rather than at the ceiling: vertical scaling gives you no failover and no redundancy. One server means that when it goes down, everything goes down. Not degraded, not slower. Off. Doubling the RAM does not change that, and neither does the most expensive instance on the menu.

That second point is why the choice is not really about capacity. A system on one large server and a system on one small server have identical availability, which is the availability of one machine.

## Scale out

Horizontal scaling means adding servers to a pool. It has no ceiling worth worrying about, and it gives you redundancy as a side effect: with two servers, one can fail and the system stays up.

The price is that your application has to tolerate having more than one copy of itself running. Anything a server remembers between requests, a session, an uploaded file on local disk, an in-process cache, becomes a correctness problem the moment a second server exists, because the next request may not land on the server that remembers. That constraint has a name, the stateless web tier, and a later lesson is about paying it properly.

Scale out for anything that needs to stay up, which is to say, anything real. Scale up first if you are small and the traffic is low, because the simplicity is genuine and you can spend that time on the product. What you should not do is treat the ceiling as the moment to switch. Switch when you need redundancy, and you need redundancy before you need capacity.

## The gap this leaves

Suppose you take the advice and run two web servers. Users connect to a server by IP address, so which IP do you hand out? If you publish server 1's address, server 2 is receiving nothing and your redundancy is decorative. If you publish both through DNS, clients cache the answer for as long as the TTL says, so a dead server keeps taking traffic for minutes after it dies, and a client that got the dead one stays broken.

A second server does not by itself distribute anything or fail over to anything. It needs something in front that knows which servers are alive and spreads requests across them. That is the load balancer, and it is the next lesson.

## Predict, then verify

Availability of one server is 99%. You move to two servers behind something that routes around a dead one. Is the system now 99.9% available, or better, or worse?

Answer: better than 99.9%, at least on paper. Both servers have to be down at once for the system to be down, and if the failures are independent that is 0.01 times 0.01, which is 0.0001, so 99.99% available. The paper number is where the reasoning starts, not where it ends, because two assumptions in it are usually false. The failures are not independent: a bad deploy, a poisoned cache entry or an expired certificate takes both servers down within seconds of each other, and that class of failure is a large share of real outages. And the router in front is now a component that can fail on its own, so unless it is itself redundant you have moved the single point of failure rather than removed it. The lesson is that redundancy multiplies availability only against uncorrelated failures, and most of your real outages will be correlated ones.
