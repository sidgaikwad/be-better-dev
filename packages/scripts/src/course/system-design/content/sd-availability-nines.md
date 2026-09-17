Availability is the fraction of time a system is operational, written as a percentage, and quoted in nines. The reason it is quoted that way rather than as a percentage you read normally is that the interesting part is how many nines follow the decimal point, and each one costs about ten times more than the last.

## The table

| Availability         | Downtime per day | Downtime per year |
| -------------------- | ---------------- | ----------------- |
| 99% (two nines)      | 14.4 minutes     | 3.65 days         |
| 99.9% (three nines)  | 1.44 minutes     | 8.77 hours        |
| 99.99% (four nines)  | 8.64 seconds     | 52.6 minutes      |
| 99.999% (five nines) | 0.86 seconds     | 5.26 minutes      |
| 99.9999% (six nines) | 86 milliseconds  | 31.6 seconds      |

The arithmetic is direct: a year is about 525,600 minutes, so 0.01% of a year is 52.56 minutes. You can rebuild any row of this table from that, which is better than memorizing it.

Read the year column and the cost becomes obvious. At three nines you can afford one unlucky afternoon. At four nines your entire yearly budget is 52 minutes, which is one bad deploy and its rollback. At five nines, 5 minutes a year, a human cannot be involved in recovery at all: a person being paged, reading a dashboard and deciding what to do spends the annual budget on one incident. Five nines is not a harder version of four nines, it is a different engineering discipline in which all recovery is automatic.

## SLAs

A service level agreement is a formal promise from a provider to a customer about uptime, usually with money attached when it is missed. The major cloud providers set theirs at 99.9% or above for most services.

Two things to notice about the ones you depend on.

**Your availability is capped by the product of your dependencies.** A service on top of a database at 99.9%, an object store at 99.9% and a queue at 99.9% has a ceiling of `0.999³`, which is about 99.7%, before any of your own code fails. Dependencies multiply, and the direction is always down. Every dependency you add spends availability, which is a real argument for having fewer of them.

**The escape from that multiplication is to not require every dependency for every request.** If the object store being down degrades the page rather than breaking it, then it is not a factor in the product any more. This is what "graceful degradation" buys: it removes a term from the multiplication. A feature that fails soft is worth more to your availability number than one more nine on any single component.

## Be honest about what you promise

In a design discussion, quoting a target is fine. Quoting five nines for a system whose deploy process involves a human is not, because you have just promised something the process makes impossible.

The useful version of this conversation names what the number requires: automatic failover with no human in the loop, no single points of failure anywhere in the path, deploys that roll back automatically on a health signal, and enough redundancy that losing a region is not an incident. If the design does not have those, the honest number is three nines, and saying so is a better signal than claiming five.

## Predict, then verify

Your service depends on a database at 99.99%, a cache at 99.9%, and a third-party payment API at 99.5%. What is your ceiling, and what is the highest-leverage fix?

Answer: multiply them: `0.9999 × 0.999 × 0.995` is about 0.9939, so roughly 99.4%, which is about 53 hours of downtime a year before your own code contributes anything. The highest-leverage fix is not to make anything more reliable, it is to stop requiring the payment API on every request. It is the worst term by an order of magnitude, and it is the one you cannot improve because it is not yours. Queue payment attempts and process them asynchronously, and the payment API is no longer in the availability path at all: the multiplication drops to `0.9999 × 0.999`, about 99.89%, roughly 9 hours a year. Removing a dependency from the request path is nearly always worth more than hardening one, and it is the move an interviewer is looking for.
