You own one server. It runs the web app, the database and the cache, all in the same process space, on one box you could point at. Someone in another country types your domain into a browser and a page comes back. Before you can reason about scaling any of this, you need to be able to name every hop between that keystroke and that page.

## The path a request takes

1. The browser needs an IP address, not a name, so it asks the Domain Name System for `api.mysite.com`. DNS is almost always a third-party service you pay for rather than something you run.
2. DNS answers with an address, say `15.125.23.214`.
3. The browser opens a connection to that address and sends an HTTP request.
4. Your web server answers with HTML for a browser, or JSON for a mobile app.

Four steps, and only step three and four are yours. That matters more than it first looks. DNS is the only place in this whole design where you can move traffic without touching a server, which is why it turns up again later as the tool for routing users to a nearby data center.

The two clients want different things from step four. A web application ships HTML and JavaScript, so the server's job is presentation plus business logic. A mobile application already has its presentation layer installed, so it wants data only, and it almost always wants it as JSON:

```json
{
  "id": 12,
  "firstName": "John",
  "lastName": "Smith",
  "address": {
    "streetAddress": "21 2nd Street",
    "city": "New York",
    "state": "NY",
    "postalCode": 10021
  },
  "phoneNumbers": ["212 555-1234", "646 555-4567"]
}
```

Same server, same database, two response shapes. A single server can serve both, and for a long time it should.

## What "one server" actually costs you

The single box is not a naive design. It is the correct design for a system with no traffic, and its advantage is that every failure has exactly one place to look. What it lacks is not performance but redundancy: there is no second copy of anything.

Work out the failure surface. The web app, the database and the cache share one operating system, one disk and one power supply. A full disk takes down all three. A memory leak in the web app gets the database's pages evicted. A kernel panic is a total outage with no degraded mode. There is no configuration of a single server that makes any of this better, because the problem is the count, not the size.

Performance has a similar shape. The web app and the database compete for the same CPU and the same page cache, so a slow query does not just return slowly, it steals cycles from every request in flight. You cannot tune your way out of that either, because the two workloads want opposite things: the web tier wants many short-lived requests, the database wants sustained sequential I/O and a large stable cache.

Both problems point at the same first move, which is to stop sharing. The next lesson splits the box in two.

## Predict, then verify

Your single server is at 60% CPU under normal load. You move the database onto its own identical server and change nothing else. Does the web server's CPU drop to roughly 30%, and does the system now survive a database crash?

Answer: neither follows. The split does not halve CPU, because the web tier's own work did not shrink. It gives the web app a machine it no longer shares, so its share of a full machine is now whatever the web workload alone consumed, which might be 40% or 15% depending on how much of that 60% was the database. You have to measure, not divide. And the system still does not survive a database crash: there is exactly one database, and now it is on a box that can fail independently of the web tier. Splitting tiers buys independent scaling, not availability. Availability needs a second copy of the thing that failed, which is what replication and load balancing add in the next unit.
