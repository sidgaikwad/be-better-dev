Everything so far lives in one building. That building has one set of power feeds, one set of network links, and one regional weather system. It is also a long way from half your users, who pay the round trip on every request.

## Two data centers

Run the stack in two regions, say US-East and US-West, and split traffic between them. The routing happens at the only layer that can move traffic without touching a server: DNS.

geoDNS resolves your domain to a different IP depending on where the query came from. A user in Boston gets US-East, a user in Portland gets US-West, and each one talks to the nearer stack. That cuts the network component of latency roughly in half for the far half of your users.

When a data center fails, you point all traffic at the healthy one. The mechanism is the same: change what DNS answers, and users follow.

## The three problems this creates

**Traffic redirection.** geoDNS gets users to the right place, but DNS answers are cached by resolvers for the length of the TTL. During a failover, users holding a cached answer keep trying the dead data center until it expires. A short TTL shortens the outage and multiplies DNS query volume, and a long one does the reverse. Systems that need fast failover use a short TTL and accept the query load, typically 60 seconds or less.

**Data synchronization.** This is the hard one. If US-West has its own database and its own cache, then a user whose data was written in US-East and who fails over to US-West finds their data missing. The usual answer is to replicate across data centers, which means the replication lag from the earlier lesson now includes a cross-country round trip of roughly 60 to 150 ms rather than a fraction of a millisecond. Every consistency problem you had gets multiplied by that number.

**Test and deployment.** Two data centers means two of everything to keep identical. A config that landed in one region and not the other produces a bug that reproduces for half your users and not the other half, which is among the most expensive kinds to diagnose. This is an automation problem, and it is why multi-region and deployment tooling tend to arrive together.

## What it is worth

Be honest about the ordering. Multi-region is expensive: double the infrastructure, cross-region replication lag, and a deployment problem that gets qualitatively harder. It buys survival of an entire region failing, and lower latency for distant users.

Most systems should do it after they have exhausted the cheap availability work, which is redundancy within one region. Two availability zones in one region share nothing but the region, cost a fraction of a second data center, and cover the failures that actually happen: a rack, a switch, a power feed. A whole region failing is rarer than a bad deploy, and a bad deploy propagates to both data centers in seconds.

The exception is latency. If half your users are on another continent, the second data center is not an availability project at all, it is a performance one, and the case for it stands on its own.

## Predict, then verify

You run active-active in two regions with asynchronous cross-region replication. US-East fails and traffic moves to US-West. A user who updated their address 30 seconds before the failure checks it. What do they see?

Answer: possibly the old address, and they can then update it in US-West and create a worse problem. Cross-region replication lag is tens to hundreds of milliseconds at best and can be seconds under load, so a write from 30 seconds ago has probably arrived. The danger is the writes from the last few seconds, which have not. When US-East comes back with writes that were never replicated, and US-West now holds conflicting newer writes for the same rows, you have divergence that no automatic rule resolves correctly. This is why active-active across regions demands that you decide up front what owns a given record, usually by pinning each user to a home region, so that conflicting concurrent writes to one row cannot happen in the first place.
