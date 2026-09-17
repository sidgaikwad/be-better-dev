Sending mail is not a request that succeeds or fails. It is a delivery attempt against a server you do not control, which may accept, defer or reject it minutes or days later, and the design has to hold that whole process.

## The path out

1. A client posts the message over HTTP.
2. The web server validates, stores it, and puts it on an outgoing queue.
3. The client is acknowledged. The message is sent, as far as the user is concerned.
4. A sending worker takes it, resolves the recipient domain's MX records, and opens an SMTP connection.
5. The remote server accepts, defers, or rejects it.
6. On accept, mark it delivered. On defer, retry later. On permanent rejection, generate a bounce back to the sender.

Step 3 before step 4 is the notification section's persist-before-promise, and it is not optional here. The remote server might be down for hours, and a user cannot be made to wait.

## Deferral is normal

The part that distinguishes mail from every other delivery problem in this course: a `4xx` SMTP response means try again later, and it is routine rather than exceptional. Greylisting, where a receiver deliberately defers a first attempt from an unknown sender because spammers do not retry, is a widespread anti-spam technique.

So retries are measured in hours and days rather than seconds, with backoff that starts at minutes and widens, typically giving up after several days and bouncing. A retry schedule that gives up after five minutes, which is what you would write for any other integration, discards mail that would have been delivered.

## Reputation is the constraint

Anyone can run a mail server; the difficulty is being accepted by receivers. Receiving servers decide based on your sending IP's reputation, SPF, DKIM and DMARC records, and your complaint rate.

Design consequences that are easy to miss:

- **Sending IPs are a managed resource.** Pools, warmed gradually, with reputation monitored per IP, and separated by traffic type so transactional mail does not share reputation with bulk.
- **Bounces and complaints must be processed, not logged.** A user who marks mail as spam must stop receiving it, and a repeatedly bouncing address must be suppressed. Ignoring these degrades reputation until delivery quietly fails.
- **Delivery failures are asynchronous and late.** A bounce can arrive days after sending, so "sent" is not "delivered" and the system needs both states.

## Receiving

Inbound SMTP from the internet, which the protocols lesson established is a hostile input.

1. Accept the SMTP connection, applying IP reputation and rate limits before reading the message.
2. Run anti-spam and anti-virus.
3. Resolve recipients and write into each recipient's partition.
4. Notify connected clients.

Anti-spam runs before storage, because storing spam to filter later costs petabytes for mail nobody will read.

Step 3 is the fanout from the storage lesson: one inbound message becomes one write per recipient, done asynchronously so the SMTP transaction can be accepted quickly rather than held while a mailing list fans out.

## Predict, then verify

A user sends a message to ten recipients. Nine domains accept it and one defers repeatedly for two days, then permanently rejects. What should the user have seen, and when?

Answer: an immediate acknowledgement that it was sent, then nothing for two days, then a bounce naming the one failed recipient. The design has to model per-recipient delivery state rather than per-message, which is the part that is easy to get wrong: a single status on the message cannot express "delivered to nine, failed for one", so a message that is 90% delivered would be recorded as either delivered or failed, and both are lies. So the outbound record is one row per recipient with its own state and retry schedule, and the message is delivered only when every recipient is resolved. The two-day silence is correct and worth defending: reporting a failure after the first deferral would produce bounces for mail that will be delivered, and greylisting makes a first deferral expected rather than a signal. What the user should get is a bounce that identifies the specific recipient and the reason, since a bounce saying only that delivery failed is the most common and least useful thing a mail system does.
