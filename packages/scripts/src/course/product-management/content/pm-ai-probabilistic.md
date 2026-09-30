Roost's designer is testing a prototype called "Ask this listing": a student types a question on a listing page and a language model answers from that listing's verified record. She asks one Pune PG's page the same question five times: "Is the deposit refundable?" The record says the ₹18,000 deposit is refunded within 30 days of moving out, minus any damage. Four answers say so. The fifth says "fully refundable within 7 days".

Same input, five runs, one wrong answer. Nothing else in Roost's codebase behaves like that.

## Code is deterministic, model output is not

`totalDueAtBooking(listing)` returns ₹27,000 for this listing every time; if it ever returns something else, that is a bug with a line number. A language model writes its answer one token at a time, choosing each from a probability distribution. Most of the probability sits on answers faithful to the record, not all of it, so some runs land on a wrong one.

Two tempting fixes do not fix it. Setting the sampling temperature to zero makes answers more repeatable, but a model consistently wrong on a question is still wrong. And the model behind an API name can change when the provider updates it, so behavior you checked in May is not guaranteed in June.

So quality is not proved once, like a passing unit test. It is a rate, measured on real inputs, and never zero.

## Design around the rate

Roost ran the prototype on 600 real questions students had sent owners in chat, and the operations lead marked each answer right or wrong against the record:

| Question type                 | Asked | Wrong | Rate |
| ----------------------------- | ----- | ----- | ---- |
| Money: rent, deposit, charges | 240   | 11    | 4.6% |
| Safety: locks, area at night  | 60    | 4     | 6.7% |
| Other: food, wifi, curfew     | 300   | 9     | 3.0% |
| Total                         | 600   | 24    | 4.0% |

Now scale it to Roost's 32,000 listing opens a month:

```text
opens where the student asks something (25%):  8,000
questions (1.5 per asking session):            12,000
money (40%):   4,800 x 4.6% = 221 wrong
safety (10%):  1,200 x 6.7% =  80 wrong
other (50%):   6,000 x 3.0% = 180 wrong
wrong answers a month: 221 + 80 + 180 = 481
```

"96% accurate" sounds finished. It is 481 wrong answers a month, 221 of them about money. Roost handles about 360 disputes a month; wrong money answers alone would come close to that.

## Choose problems where wrong is cheap

A wrong answer's cost depends on three things: what the student loses by acting on it, whether she can see the error on the spot, and whether it can be undone. A wrong "yes, there is wifi" costs an annoyed student. A wrong deposit answer can cost a family ₹18,000 and Roost a dispute. A wrong "safe at night" is the worst answer possible.

So the first AI feature should sit where errors are cheap and visible. A summary of a listing's verified reviews is a good start: the reviews sit right below it, so a student can check any claim in seconds, and nobody pays rent on the strength of a summary.

Averages also hide what one student experiences, because she asks several questions. At 96% per answer, the chance that five answers are all right is 0.96 multiplied by itself five times, 0.815, so 18.5% of students who ask five questions get at least one wrong answer.

## Predict, then verify

Two AI features compete for the weeks before June. "Ask this listing" would replace about 2,000 owner chat messages a month and is wrong 4% of the time. The review summary is wrong more often: 5% of summaries contain a claim no review supports. The founder wants "Ask this listing" first, since it saves more work. Which ships first?

Answer: the review summary, despite its higher error rate. Its errors are visible, because the reviews are on the same screen, and low stakes, because no one pays a ₹27,000 upfront cost on a summary. "Ask this listing" errors are invisible, since a student has no reason to doubt a confident answer, and 40% of its questions are about money. Ship the summary; build "Ask this listing" next, with money and safety questions routed away from the model. The principle: choose AI features by the cost of a wrong answer, not by the error rate alone.
