Email is older than the web, and its protocols still run underneath every modern client. Designing a mail service means working inside constraints set in the 1980s, which is unusual for this course and worth understanding before proposing anything.

## Scope

- 1 billion users
- Send and receive, fetch all mail, filter by read and unread
- Search by subject, sender and body
- Anti-spam and anti-virus
- HTTP between client and server, not IMAP or POP
- Attachments allowed

Non-functional, in order: reliability, since losing email is not acceptable; availability; scalability; and extensibility, because the legacy protocols are limited enough that a custom one is likely.

## The estimate

```text
users             = 1 billion
sent per user/day = 10
send QPS          = 10^9 × 10 / 10^5 = 100,000

received/day      = 40 per user
metadata per mail = ~50 KB
```

100,000 sends per second is substantial, and the storage is the real number: a billion users receiving 40 emails a day at 50 KB of metadata is 2 PB a day of metadata alone, before attachments.

Email is a storage system that happens to deliver messages, which is the framing to carry into the design.

## The protocols

**SMTP** moves mail from one server to another. It is still the protocol by which your service talks to every other mail service on earth, and you cannot opt out of it: interoperating with the rest of email is the product.

**POP** downloads mail to a client and deletes it from the server. That made sense when storage was expensive and people had one computer. It is why old mail vanishes when someone configures POP by accident.

**IMAP** leaves mail on the server and syncs state, so several devices see the same mailbox. Closer to what people expect now, and still limited: it has no good story for search across a large mailbox, for threading, or for the features a modern client wants.

## Why HTTP between client and server

The requirement specifies HTTP rather than IMAP for client-server communication, and the reason is extensibility.

IMAP and POP define a fixed set of operations. Anything outside that set, conversation threading, server-side search with relevance, labels rather than folders, spam feedback, cannot be expressed, so every provider that wanted them built a proprietary protocol over HTTP. Gmail's web client does not speak IMAP to Gmail.

The constraint that does not go away: you still speak SMTP to the outside world. So the architecture has a modern HTTP API facing your own clients, and SMTP at the boundary facing every other mail server, with the two meeting in the middle.

That split is the shape of the system, and it is worth drawing early. It also explains why anti-spam sits where it does: it must run on the SMTP ingress, because that is where mail from strangers arrives.

## Attachments

Up to 25 MB, and they do not belong in the metadata store.

Attachments go to object storage, referenced by the email metadata. Same split as YouTube's videos and Drive's blocks: large immutable blobs in an object store, small structured records in a database.

The deduplication opportunity is real and large here: a 20 MB attachment sent to 50 colleagues is one blob and 50 references, not 50 copies. That is the Drive lesson applied, with the same caveat about what cross-user deduplication can leak.

## Predict, then verify

Your service must accept SMTP from any server on the internet. What does that imply about the ingress path?

Answer: it is an unauthenticated, publicly reachable endpoint that anyone in the world can send arbitrary data to, which is a profile no other system in this course has. Every other design authenticates callers or serves its own clients; here the whole point is accepting connections from strangers, and the majority of what arrives is spam, with a meaningful share carrying malware. Three consequences follow immediately. Anti-spam and anti-virus are not features bolted on later but a mandatory filter in the ingress path, since accepting mail means accepting attacks. Rate limiting by sending IP and domain is required, because a single source can otherwise flood you, and reputation systems exist precisely because the sender cannot be authenticated. And the ingress must be isolated from the rest of the system, so that a malformed message which crashes a parser takes out one ingress node rather than the mail store. The general point is that SMTP makes this a system whose primary input is hostile by default, and designing the ingress as though it were a normal API is the mistake.
