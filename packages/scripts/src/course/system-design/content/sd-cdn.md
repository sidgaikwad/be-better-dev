The cache tier moved database work off the database. It did nothing about the 2 MB of images, JavaScript and CSS on every page, which still travel from your servers to a user who might be on another continent. A CDN is a cache for those, placed near the user instead of near the data.

## How it works

A CDN is a network of servers spread across many locations, holding copies of your static files. The URL's domain belongs to the CDN provider, which is how the request reaches them rather than you:

```text
https://mysite.cloudfront.net/logo.jpg
https://mysite.akamai.com/image-manager/img/logo.jpg
```

The flow for a file the CDN has not seen:

1. User A requests `image.png` from the CDN.
2. The CDN has no copy, so it requests the file from your origin, which might be a web server or an object store.
3. The origin returns the file, along with a TTL header saying how long it may be cached.
4. The CDN stores it and returns it to user A.
5. User B requests the same file.
6. The CDN serves it from its own copy, without touching your origin, until the TTL expires.

The same read-through shape as the cache tier, with distance as the thing being saved rather than database work. A user in Los Angeles fetching from a server in San Francisco waits a few milliseconds. The same user fetching from Europe waits 150 ms, and pays it on every file. On a page with 30 assets that is the difference between a page that feels instant and one that does not.

## What it costs

**Money, per byte.** CDNs charge for transfer. That makes the economics of what you put there the opposite of a memory cache: there is no capacity limit forcing you to choose, so the pressure is the bill. An asset requested twice a week costs you CDN egress and saves you almost nothing, so it belongs on the origin. The CDN is for what is requested constantly.

**A third party in your critical path.** If the CDN has an outage, your site's assets are gone, and a page with no CSS is not a degraded page, it is a broken one. The application should be able to detect CDN failure and fall back to loading assets from the origin. Slower, and still a working site.

**The freshness problem, again, but worse.** You have less control here than over your own cache tier. Two ways to replace a file before its TTL runs out:

- Call the provider's invalidation API. Works, and it is slow and often billed per request.
- Version the URL, so the new file is a different object: `image.png?v=2`, or better, a content hash in the filename.

Version the URLs. Invalidation asks a global network to forget something, which is inherently slow and racy. Versioning never asks anyone to forget anything, because the new file has a name nobody has cached. It also makes long TTLs safe: if the URL changes whenever the bytes change, you can cache for a year.

## Predict, then verify

You put a CDN in front of your assets with a one-year TTL, using versioned URLs. You deploy a CSS fix and users still see the broken layout. The CSS file's URL did change. What went wrong?

Answer: the CSS is versioned but the HTML that references it is being cached too. The browser holds an old copy of the page, which points at the old CSS URL, which is correctly cached for a year and correctly served. Every layer is doing exactly what it was told. The rule this points at is that a versioned asset and the document referencing it need opposite caching policies: assets get immutable names and very long TTLs, while HTML gets a short TTL or none at all, because it is the thing that carries the pointers. Getting this backwards produces the most confusing class of deploy bug, where a fix is live, correct, and invisible.
