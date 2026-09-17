The previous lesson worked one estimate. This one is about how to do it under pressure, in front of someone, without a calculator, which is a different skill from knowing the arithmetic.

## Round aggressively

Nobody is checking your long division. Asked for `99,987 / 9.1`, do not compute it. Compute `100,000 / 10` and say 10,000.

The error there is about 10%, and your input assumption, "half of monthly users are daily users", is a guess that could be off by a factor of two. Carrying three significant figures through a calculation whose inputs are guesses produces false precision, which is worse than a round number because it suggests a confidence the estimate does not have.

Round to numbers you can multiply in your head: 1, 2, 5, 10 and powers of ten. A year is 365 days, and for estimation it is 400, or 300, depending on which makes the arithmetic cleaner and which direction you would rather err.

## Write down your assumptions

Write them where you and the interviewer can both see them. Three reasons, and the third is the one people miss.

They make the answer checkable. An answer of 55 PB is unverifiable on its own, but "150 million DAU, 2 posts each, 10% with 1 MB media, 5 years" can be examined a step at a time.

They let you revise cheaply. When the interviewer says "assume 10x the users", you change one line and rerun, instead of starting over.

And they convert disagreement into a conversation instead of a wrong answer. If the interviewer thinks 10% media is low, that is a fact about the product, not a mistake in your method, and finding it is what the exercise is for.

## Label your units

Write "30 TB", never "30". A number without a unit will be read back later as the wrong thing, usually by you, and a factor of 1000 error is the most common way an estimate ends up absurd.

Label the time base too. "3,500 QPS" and "300 million per day" are the same quantity and belong in different sentences. Say which one you mean every time.

## What actually gets asked

The list is short, which is why it is worth practicing:

- **QPS**, average and peak. Peak is usually 2x average, and peak is the one that sizes the system.
- **Storage**, per day and over the retention period.
- **Cache size**, which is usually storage times the fraction that is hot, following the rule that 20% of the data serves 80% of the traffic.
- **Number of servers**, which is peak QPS divided by what one server handles. Know that a single server handling simple requests does something on the order of 1,000 per second, and say that you are assuming it.
- **Bandwidth**, which is QPS times object size.

## The point is the process

The estimate is not being graded on being right. It is being graded on whether you reach for numbers at all before designing, whether your assumptions are stated, and whether you notice when a number tells you the design is wrong. A candidate who computes 700,000 reads per second and says "so this cannot be a database, it has to be cache plus CDN" has demonstrated the entire skill. A candidate who computes the same number correctly and then designs a system that sends it to a database has demonstrated arithmetic.

## Predict, then verify

You need 7,000 peak QPS. You assume one server handles 1,000 requests per second, so you propose 7 servers. What is wrong?

Answer: the arithmetic is fine and the answer is wrong, for two reasons that both push the same way. Seven servers at exactly 100% utilization have no headroom, so any one failing pushes the rest past capacity and the whole tier cascades. Real provisioning targets something like 50 to 70% at peak, which is 10 to 14 servers. And "one server handles 1,000 requests per second" is a made-up figure that is only true for a cheap request; if each one does a database query and some serialization, 200 to 500 per second is more honest, which is 14 to 35 servers before headroom. The lesson is that the server count is the estimate most sensitive to an unstated assumption, so state the per-server number out loud and add headroom explicitly rather than quietly dividing.
