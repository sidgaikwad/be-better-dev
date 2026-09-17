By now you have agreed on scope, drawn a blueprint, and had it accepted. This is the longest step and the one where most of the signal is produced: pick a component and go deep enough to show you could actually build it.

## Choosing what to dig into

Do not choose alone. The interviewer usually has something in mind, and often signalled it during the high-level review, either by asking about a component or by lingering on one.

If no hint arrives, choose the part where the problem is genuinely hard, which is usually where scale bites:

- For a URL shortener, the hash function and collision handling, because that is the only interesting decision in the system.
- For a chat system, latency and how presence works, because those are what make it hard rather than just large.
- For a news feed, the fanout strategy, because the celebrity case is where the naive design fails.

The pattern: pick the component where your own estimate said the numbers were uncomfortable. That is where the design is load-bearing, and it is where an interviewer can tell whether you understand the system or have memorized a diagram of it.

Seniority shifts this. For a senior candidate the deep dive often moves toward bottlenecks, failure modes and resource estimates rather than component internals. If the interviewer keeps steering toward "what happens when this fails", take the hint and stay there.

## Depth without a rabbit hole

The failure mode of this step is depth in the wrong place. Explaining the exact ranking algorithm of a feed in detail burns ten minutes and demonstrates nothing about designing a scalable system, which is the thing being assessed.

The test for whether depth is worth it: does this detail change the architecture, the failure behavior, or the cost? Sharding strategy changes all three. The choice of ranking function changes none of them, and can be handed to a box labeled "ranking service" with one sentence about it being pluggable.

Watch the clock. You cannot finish the design in the time available, and you are not expected to. You are expected to spend the time on the parts that carry the most signal, and a candidate who gets absorbed in a minor component and runs out of time has made a prioritization error, which is exactly what the exercise measures.

## Keep talking

Silence is the most expensive thing you can do. An interviewer cannot assess reasoning they cannot hear, and a long pause reads as being stuck even when you are thinking productively.

Say what you are weighing, including the options you reject and why. "I could do this with a queue or with a synchronous call. The queue costs me a pending state in the UI but it means a slow downstream service cannot take my write path down, so I will take the queue." That is one sentence and it demonstrates knowing two approaches, the tradeoff, and a decision.

Ten to twenty-five minutes here, which is most of the interview.

## Predict, then verify

Halfway through a deep dive on your sharding scheme, you realize the sharding key you chose makes the most common query a scatter-gather. What do you do?

Answer: say it immediately, and say what you would change. Not because honesty is a virtue being tested, but because finding a flaw in your own design is a strong positive signal and concealing one is a serious negative. The interviewer has very likely already seen it, so the choice is between demonstrating that you catch your own mistakes and demonstrating that you do not, or worse, that you noticed and hoped they would not. The recovery is short: name the problem, name the fix, either a different key or a secondary index that maps the other access path to a shard, and note what the fix costs. Ninety seconds. A design that was revised once under scrutiny is more convincing than one that was never examined, and the ability to respond to feedback constructively is stated explicitly in what the interview is assessing.
