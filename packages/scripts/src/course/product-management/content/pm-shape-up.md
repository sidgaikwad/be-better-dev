Roost's team estimated "report a hidden charge" at two weeks. Seven weeks later it is still open. Every review added a case nobody had drawn: refunds through the payment partner, a way for owners to dispute the claim, photo uploads as evidence. Each was reasonable, and the estimate had been made for a design that kept growing.

## Appetite before design

Ryan Singer, then head of product strategy at Basecamp, described a different way to work in "Shape Up", a free book published in 2019. The company, called 37signals again since 2022, still described working in six-week cycles in 2024. The core inversion: an estimate starts with a design and produces a number, while an **appetite** starts with a number and produces a design. You decide first how much time the problem is worth, then shape a solution that fits. Time is fixed; scope flexes.

Appetites come in two sizes: a small batch of one or two weeks, or a big batch of a full six weeks, each worked by a designer and one or two programmers.

## Shaping and the pitch

Before a bet, senior people **shape** the work: rough enough to leave the team room, solved enough to answer the main questions, bounded by what it will not do. The result is a pitch with five parts. Here is the hidden-charge feature, shaped:

```text
Problem   At move-in an owner asks for a ₹4,000 "maintenance"
          charge the listing never showed. The student emails
          support and waits days.
Appetite  Small batch: 2 weeks, 1 designer, 2 programmers
Solution  A "charge not on listing" button on the booking for
          7 days after move-in. It shows the charges Roost
          recorded at verification and sends the claim, with
          the booking, to operations.
Rabbit    Refunds through the payment partner. Patch:
holes     operations refunds by bank transfer for now.
No-gos    Owner rebuttals, photo evidence, in-app chat.
```

Every case that sank the seven-week version is named and set aside.

## Bets, cycles and the circuit breaker

Work runs in **six-week cycles**, each followed by a **two-week cool-down** for bugs, small fixes and shaping the next bets. Singer's reason for six: long enough to finish something meaningful, short enough to see the end from the start.

A small **betting table** picks each cycle's pitches. At Basecamp it was the CEO, the CTO, a senior programmer and a product strategist. There is no central backlog: a pitch not chosen is let go, and anyone who still believes in it can pitch it again later.

Once bet, the **circuit breaker** applies: a project not done at the end of its cycle is not extended by default. The most a bet can lose is its appetite.

Progress is shown on a **hill chart** instead of a percentage. Each piece of the work is a dot climbing a hill: the uphill side is figuring out, where unknowns remain; the downhill side is execution. Task counts mislead, because work discovered along the way grows the list. In Singer's phrase, a dot that stops moving is a raised hand.

## Where it breaks

Shape Up depends on senior people with time to shape a cycle ahead; at Roost that is one PM and one designer, whose week discovery already claims. It assumes a team can finish a project without waiting on other teams, and eight-week cycles give only 52 / 8 = 6.5 bets a year. Take the two ideas that travel, appetite and the circuit breaker; they work inside two-week sprints too. Adopt the whole method only once someone can reliably shape the next cycle's work before the current one ends.

## Predict, then verify

A six-week bet on "owner payouts in the owner app" reaches week 5. The hill chart shows payout history over the top and nearly done. Reconciling payouts with the partner's statements is still uphill, and its dot has not moved in two weeks. The team asks for two more weeks. Do you grant them?

Answer: no. Ship payout history at the end of week 6 if it is done, and stop reconciliation there. A dot stuck uphill in week 5 means an unknown the shaping missed, and "two more weeks" is an estimate made from inside that unknown, the least reliable kind there is. Reshape reconciliation in the cool-down and pitch it again against everything else. The principle is the circuit breaker: fixed time, variable scope, and a bet that runs past its appetite is a new bet that must win its place again.
