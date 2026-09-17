The redirect is one HTTP status code, and the choice between two of them decides how much traffic you serve, what you can measure, and whether you can ever change a link.

## The two options

**301 Moved Permanently.** The browser caches the redirect. Every subsequent visit to that short URL goes straight to the long URL without contacting your servers.

**302 Found**, a temporary redirect. The browser asks your servers every time and follows the answer each time.

## What each one buys

**301 removes your traffic.** A link shared to a million people, each clicking it twice, generates a million requests instead of two million. For popular links the reduction is much larger, since the ratio is the number of repeat clicks per user. This is the strongest argument for 301, and for a service whose read estimate was 11,600 per second, halving or better is a real saving.

**302 keeps you in the loop.** Every click passes through your service, so you can count clicks, record the referrer, the timestamp, the rough location, the device. For a link shortener that is not a nice extra: analytics is usually the product. Nobody pays for short strings; they pay to know what happened to them.

302 also keeps the link editable. With 301, a browser that cached the redirect will go to the old destination indefinitely, and you cannot recall it. If short URLs are permanent and immutable, as the scope said, that is acceptable. The moment someone asks for editable links, or for taking down a link that turned out to point somewhere harmful, 301 makes it impossible for everyone who already clicked.

## Choosing

Take 302 unless server load is the binding constraint. The analytics are usually the business, and the inability to revoke a cached 301 is a real operational and safety problem: a shortened URL pointing at malware cannot be disarmed for anyone whose browser cached it.

Say the tradeoff out loud rather than picking silently. The version that demonstrates you understand it: "302, because click analytics is the product and because a 301 I cannot revoke is a liability. If read load became the binding constraint I would move the hottest links to 301 and accept losing their analytics, rather than switching globally."

That last sentence is worth the space. The choice is per link, not per service, and noticing that is the difference between reciting the tradeoff and using it.

## The second cache

Whichever you choose, browsers are not the only cache. A 302 can still be cached by intermediaries if the headers permit it, so a 302 with a long `Cache-Control` max-age behaves like a 301 for anyone behind that proxy, and your analytics quietly develop holes.

If you want every click, send the 302 with `Cache-Control: no-store`. If you want the load reduction, set a short max-age and accept counting approximately. Both are defensible; what is not defensible is leaving it to whatever your framework does and being surprised by the numbers.

## Predict, then verify

You launch with 301 for the load saving. Six months later, legal asks you to take down a link pointing at a phishing page. You delete the row. Is the link disabled?

Answer: not for anyone who has already clicked it. Their browser cached the permanent redirect and will not ask you again, so deleting the row stops new visitors and does nothing for the people most likely to click again, who are exactly the ones who already followed it. There is no mechanism to recall a 301: you cannot invalidate a cache you do not control. The practical mitigations are all bad. You can rely on the destination being taken down, which is not your call. You can serve 301s with a max-age, which weakens the caching that motivated the choice. What this really shows is that the redirect code is a safety decision as much as a performance one, and any service accepting user-submitted destinations should default to 302 for exactly this reason.
