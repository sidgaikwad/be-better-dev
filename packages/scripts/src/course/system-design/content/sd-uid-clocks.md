The snowflake design rests on an assumption nobody states: that the machine's clock only moves forward, at roughly the right rate. Clocks do neither reliably, and the consequences land on the timestamp bits that everything else depends on.

## What goes wrong

**Clock skew.** Two machines' clocks differ by some amount, typically milliseconds, sometimes much more. Ids from machine A and machine B are therefore only approximately ordered relative to each other. Within one machine the ordering is exact; across machines it is exact only to the skew.

This matters when code treats id order as event order. If two ids differ by less than the skew, you cannot conclude anything about which happened first, and a system that resolves a conflict by comparing ids is making the same mistake as the last-write-wins timestamp from the key-value section.

**Clock going backwards.** This is the serious one. NTP corrects a fast clock by stepping it back, and virtual machines pause and resume with a clock that jumps. If the clock moves back past ids you already issued, you will reissue the same timestamp, and with the sequence counter also reset, the same id.

Handling it:

- **Refuse.** If the current millisecond is earlier than the last one used, throw and stop generating until the clock catches up. Correct, and the generator is down for the length of the jump.
- **Wait.** Spin until the clock passes the last timestamp used. Same outcome, expressed as latency instead of an error, and fine for jumps of a few milliseconds.
- **Borrow from the sequence.** Keep issuing under the last timestamp, using the remaining sequence numbers. Works until the 4,096 are exhausted, which buys one millisecond of cover.

Most implementations wait for small jumps and refuse for large ones. Whichever you pick, the rule is the same as before: refusing to generate is an outage you notice, generating a duplicate is corruption you find later.

**NTP slew versus step.** NTP can correct slowly by changing the clock's rate, or immediately by stepping it. Slewing never moves time backwards and is what you want on a machine running an id generator. Configuring `-x` on `ntpd`, or `chrony` with slew limits, prevents the backward step that breaks everything.

## Availability

An id generator is in the path of every insert, which makes it one of the most critical components you own, and this argues for the design more than any other property.

Because snowflake generators do not coordinate, every one is independent. There is no leader, no lease to lose, no shared state. Run one on every application host and a failure takes out one host's ability to make ids and nothing else. Compare the ticket server, where the equivalent failure stops every write in the system.

That is the real reason snowflake wins over a ticket server, and it is worth saying plainly: not that it is faster, but that its failure domain is one machine instead of the whole system.

## Predict, then verify

You run snowflake generators on 20 hosts. NTP steps one host's clock forward by 30 seconds, then back to correct. What are the two problems, in order?

Answer: the forward step comes first and is mostly harmless: that host issues ids with timestamps 30 seconds in the future, so its ids sort ahead of everyone else's for the next 30 seconds and anything reading an id as a creation time is wrong by that much. No duplicates. The step back is the damage, because the host is now at a millisecond it has already issued ids for, and its sequence counter has reset. Every id it produces for the next 30 seconds duplicates one it already handed out. If the generator refuses on backward movement, that host stops generating for 30 seconds, which is an outage on one of twenty hosts and entirely survivable. If it does not check, you get 30 seconds of silent duplicate ids, and you find out when a unique constraint fires or, worse, when one row overwrites another. This is why the backward-clock check is not optional, and why slewing rather than stepping is the configuration to insist on.
