Every property that makes snowflake good also makes it talkative. An id that sorts by time contains a timestamp, and an id anyone can read is an id anyone can reason about. Two consequences are worth designing for before the ids are public.

## Enumeration

If ids are sequential, guessing the next one is trivial. Order 10,001 exists, so try 10,002.

This is only a vulnerability if your authorization is weak, and the uncomfortable truth is that authorization is weak surprisingly often. The failure mode has a name, insecure direct object reference: an endpoint that loads a record by id and forgets to check that the caller owns it. Sequential ids turn that bug from "an attacker needs to know a valid id" into "an attacker counts upward".

Snowflake is better than a plain counter here, because the timestamp and machine bits mean consecutive ids are not consecutive integers. It is not a defense. Two records created in the same millisecond on the same machine differ by 1, and an attacker who obtains any id knows the shape of the space around it.

The real fix is never obscurity. Check authorization on every read. What id design buys is defense in depth, not the defense itself.

## Business intelligence

A timestamped, roughly sequential id tells anyone holding two of them how many you issued in between.

Sign up for a competitor's product on Monday and again on Friday, subtract the ids, and you have their weekly signup rate. This is a real technique, it has been used publicly against companies that used sequential order numbers, and it costs the observer nothing.

Snowflake reduces this too, since the id encodes a machine and a sequence rather than a global count, so subtracting two ids gives you elapsed milliseconds rather than a record count. That is still information, just less valuable: an attacker learns when things happened, not how many.

## Internal and external ids

The general answer is to stop using one identifier for both jobs.

- **Internal id**: snowflake. Sortable, compact, index-friendly, used for primary keys, foreign keys and everything inside your systems.
- **External id**: an opaque random value, a UUID v4 or a random string, stored alongside and used in URLs and API responses.

The external id carries no timestamp, no machine, no ordering, and no information about volume. The internal id keeps every property the index wants. The cost is one extra column and one extra unique index, which is cheap next to either problem above.

Do this for anything user-facing and skip it for everything else. The judgment is about exposure, not importance: an order id in a URL needs an opaque external form, while a foreign key between two internal tables does not need anything but the snowflake.

## When sequential ids are fine

Most data. Rows in a join table, entries in a log, internal records nobody outside your systems can address. Adding an opaque external id to all of them is work and index overhead spent for nothing.

The question to ask per table is whether the id ever appears somewhere an untrusted party can see it. If yes, give it an external form. If no, snowflake alone is the right answer and the simpler one.

## Predict, then verify

Your public API exposes snowflake ids. Someone points out they leak creation time. A colleague proposes encrypting the id with a fixed key before returning it. Does that solve the problem?

Answer: it solves the leak and creates a worse one, which is why it is the tempting wrong answer. Encryption with a fixed key is deterministic, so the same id always encrypts to the same string, which is what you need for it to work as an identifier at all. But a deterministic function preserves structure: encrypt two ids created a second apart and an attacker who can create records and observe their encrypted ids can build a mapping between the two spaces, recovering ordering without ever breaking the cipher. You have also added a key to manage, and a key rotation now invalidates every id you ever published. The straightforward answer is better and cheaper: store a random external id in its own column. It leaks nothing because it encodes nothing, it needs no key, and looking it up is an index hit rather than a decryption. Reach for a random value rather than a reversible transformation whenever the goal is to carry no information.
