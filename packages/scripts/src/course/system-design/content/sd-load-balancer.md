Two web servers, and clients still connect to one of them by address. The load balancer is the piece that turns a pool of servers into a single thing a client can talk to.

## What changes

The load balancer takes the public IP. Your web servers give theirs up and move to private addresses, reachable from inside your network and not from the internet. The request flow becomes:

1. DNS resolves your domain to the load balancer's public IP, `88.88.88.1`.
2. The client connects there.
3. The load balancer picks a healthy web server and forwards the request over a private address, `10.0.0.1` or `10.0.0.2`.
4. The response goes back the same way.

Two things fall out of that, and both are the reason the component exists.

**Failover.** If server 1 stops answering health checks, the load balancer stops sending it traffic and everything goes to server 2. Users see nothing. You replace server 1 when convenient rather than at 3am.

**Capacity on demand.** If two servers are not enough, you add a third to the pool and the load balancer starts using it. No DNS change, no client change, no waiting for a TTL to expire.

The move to private IPs is worth dwelling on, because it is a security gain that comes free. Your web servers are no longer addressable from the internet, so the only way in is through the load balancer, and the only thing the load balancer forwards is the traffic you configured it to forward. The attack surface shrinks from "every port on every web server" to "one port on one host".

## Health checks are the whole mechanism

The failover story above rests entirely on the load balancer knowing which servers are alive, and that knowledge is a health check: a request to a known path on some interval, with a threshold for how many failures mark a server down.

The failure mode to understand is a health check that is too shallow. If it is `GET /` returning 200 from the web framework, it proves the process is listening. It does not prove the server can reach the database. A server whose database connection pool is exhausted will answer that check perfectly while failing every real request, and the load balancer will keep feeding it traffic.

Go one level deeper and the opposite failure appears. If the health check queries the database, then when the database has a bad minute every server fails its check at once, the load balancer marks the entire pool down, and it has nothing left to route to. A shallow check keeps a broken server in rotation; a deep check takes the whole site down over a dependency blip.

The usual resolution is two checks with different jobs. A shallow liveness check decides whether to restart the process. A deeper readiness check decides whether to send it traffic, and the pool refuses to drain below a floor no matter how many servers fail it, on the theory that a degraded server is better than no server.

## Predict, then verify

You run four web servers behind a load balancer using round robin. One server has a slow memory leak: it still answers health checks, but its responses take 2 seconds instead of 50 ms. What does a user experience?

Answer: roughly one request in four is slow, and the page is worse than that. Round robin distributes by count, not by capacity, so the sick server keeps receiving its full quarter of traffic while it is the only one that cannot handle it. A page loading 20 assets through that balancer will hit the bad server about five times, and since the slow responses do not overlap neatly, the page's total load time is dominated by them. The user does not experience "25% slow", they experience "every page is slow", which is why this is reported as a total outage rather than a partial one. Two changes help: least-connections instead of round robin, which naturally starves a server whose requests are piling up, and a latency-aware health check that ejects a server for being slow rather than only for being unreachable.
