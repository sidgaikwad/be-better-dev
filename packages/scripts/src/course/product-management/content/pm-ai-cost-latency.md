In beta, Roost tested two AI features on the same model. "Ask this listing" costs about ₹1.40 per question. "Compare my shortlist", which weighs up to ten saved listings against a student's budget and commute, costs about ₹50 per run. Students loved the second more. At Roost's traffic it would eat more than half of what Roost keeps from its bookings.

A normal feature costs close to nothing per use once built. An AI feature pays for every use, so its cost belongs in the spec next to its error rate.

## The bill, worked from tokens

Model APIs charge per token (an English word is about one and a third), with separate prices for input, what you send, and output, what the model writes. Anthropic's pricing page, checked on September 30, 2026, lists per million tokens:

| Model             | Input | Output |
| ----------------- | ----- | ------ |
| Claude Haiku 4.5  | $1    | $5     |
| Claude Sonnet 5.5 | $2    | $10    |
| Claude Opus 5.5   | $4    | $20    |

One question sends 6,000 input tokens (instructions, the listing record and reviews, the question) and gets 250 back. On Sonnet 5.5:

```text
input:   6,000 x $2 / 1,000,000  = $0.0120
output:    250 x $10 / 1,000,000 = $0.0025
per question:                      $0.0145
a month: 12,000 questions x $0.0145 = $174
at about ₹96 to the dollar:          ₹16,704
per booking: ₹16,704 / 4,000      = ₹4.18
```

Haiku 4.5 would cost $87 a month and Opus 5.5 $348. Against a contribution of ₹525 per booking, even Opus is affordable, so choose this model on quality.

The comparison is an agent: five model steps, each resending the ten records plus everything so far, about 250,000 input tokens and 2,000 output per run:

```text
Sonnet 5.5: 250,000 x $2/1M + 2,000 x $10/1M = $0.52, about ₹50
Opus 5.5:   250,000 x $4/1M + 2,000 x $20/1M = $1.04, about ₹100
runs a month: 8,000 students who enquire x 3 = 24,000
Sonnet 5.5: 24,000 x $0.52 = $12,480, about ₹1,198,000
Opus 5.5:   24,000 x $1.04 = $24,960, about ₹2,396,000
monthly contribution: 4,000 x ₹525 = ₹2,100,000
```

On Sonnet it takes 57% of contribution; on Opus, 114%. A feature can be loved and still unaffordable.

## The levers

- **Cache what repeats.** Each run sends the same 42,000 tokens of records and instructions five times. Written to Anthropic's prompt cache once ($2.50 per million) and read back four times ($0.20 per million), a run drops to about $0.24, or ₹550,000 a month.
- **Route easy steps to a smaller model**, such as pulling rent out of a record.
- **Move work out of the request.** Whatever can be computed before the student asks can run overnight through the Batch API, at half price.

## Latency is a requirement

Students feel the time to the first word. Streaming words as they are generated makes a five-second answer feel responsive. Agents stack waits: at about three seconds a step (measure yours), five sequential steps leave a student watching a spinner for fifteen. Put a budget in the spec: for Roost, first words within two seconds on mobile data, the full answer within eight.

Prices move, in both directions. Sonnet 5 launched at $2 and $10 as an introductory price, with a rise to $3 and $15 scheduled for September 1, 2026; Anthropic cancelled the rise and made the lower price standard. Anthropic also notes that its newer models' tokenizer produces about 30% more tokens for the same text, so compare cost per answer, not price per token.

## Predict, then verify

The engineer proposes shipping the comparison on Opus 5.5 "for the best answers". The designer proposes a redesign: every night, a Batch API job on Haiku 4.5 turns each of the 1,200 listing records into an 800-token fact card, for $4.80 a night or $144 a month. The comparison becomes one Sonnet 5.5 call reading ten cards (10,000 input tokens, 600 output). Which do you ship?

Answer: the fact cards. One call costs 10,000 x $2/1M + 600 x $10/1M = $0.026; 24,000 runs cost $624, plus $144 for the cards, $768 or about ₹74,000 a month: 3.5% of contribution instead of 114%. It also fixes latency, one call instead of five, and the operations lead can check each card once instead of grading every comparison. The principle: cost per use times uses must fit inside what a use earns, and the cheapest token is the one computed once, before anyone asks.
