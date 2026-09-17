The web is a directed graph: pages are nodes, links are edges. Crawling is graph traversal, so the traversal order is a design decision rather than an implementation detail.

## Why not depth-first

Depth-first follows one link, then a link from that page, and so on, going as deep as it can before backtracking.

On the web that depth is effectively unbounded. Sites generate links dynamically, calendars link to next month forever, and a path can be thousands of levels deep without ever revisiting a page. A depth-first crawl disappears down one branch and never returns to breadth, so after hours you have crawled one site exhaustively and nothing else.

## Breadth-first, and its two problems

Breadth-first visits everything one hop from the seeds, then everything two hops, and so on. It is implemented with a FIFO queue, and it is what crawlers use.

Plain FIFO has two defects, and the URL frontier exists to fix both.

**It is impolite.** Most links on a page point at the same host. Crawl a Wikipedia page and you get hundreds of Wikipedia URLs, which go into the queue together and come out together. A crawler with a hundred parallel workers then sends a hundred simultaneous requests to one server.

From that server's point of view this is indistinguishable from an attack. You will be rate limited, then blocked, and the operator is right to do it. Politeness is not etiquette, it is the condition for being allowed to continue.

**It ignores priority.** A FIFO queue treats every URL as equally worth fetching. The web does not work that way: a major news site's front page and an abandoned forum post are not equally valuable, and with a finite crawl budget the order matters enormously.

Useful signals for ranking a URL: PageRank, the site's traffic, and how often the page changes. A page that changes hourly and is widely linked deserves frequent recrawls; one that has not changed in three years deserves almost none.

## Both problems, one queue

These pull in opposite directions, which is why the frontier is not just a queue.

Priority says "fetch the most valuable URL next". Politeness says "do not fetch from a host you just fetched from". The most valuable URLs are clustered on the most valuable hosts, so the priority order is close to the worst possible order for politeness.

Satisfying both means two layers: one that decides what is worth fetching, and one that decides when a host may be contacted. That is the front-queue and back-queue design in the next lesson.

## Freshness

BFS also says nothing about revisiting. Pages are added, edited and deleted constantly, and a crawl from last month is stale.

Recrawling everything is impossibly expensive at a billion pages a month. The strategies are the same as priority: recrawl based on observed update history, since a page that has changed on every visit is likely to change again, and recrawl important pages more often. Freshness and priority are the same ranking problem with time added.

## Predict, then verify

A colleague suggests a simple politeness rule: one global delay of 100 ms between requests. Does that work?

Answer: it makes the crawler both impolite and uselessly slow, which is an impressive combination. A single global delay caps you at 10 pages per second against a 400-per-second requirement, so the crawl is 40 times too slow. And it is still impolite, because nothing stops those 10 requests per second all going to the same host, which is exactly what BFS produces after a link-rich page. The delay has to be per host rather than global: each host gets one worker and a delay between its requests, while different hosts proceed fully in parallel. Then a thousand hosts crawled at one request per second each gives 1,000 pages per second while no individual server sees more than one request per second. The general shape is that politeness is a constraint per host and throughput is a property of the aggregate, so any mechanism that conflates them fails at both.
