Five minutes left. The design is on the board and mostly done. This step is short and disproportionately affects how the session is remembered, because it is the last thing that happens.

## Never say it is finished

If asked where the bottlenecks are, there is always an answer. A design with no weaknesses is a design nobody examined, and claiming one reads as either inexperience or unwillingness to look.

Name the real ones. "The feed fanout is the bottleneck. At a million followers it is a million writes per post, and I handled it with a hybrid, but the crossover threshold is a tuning parameter I would want real data for." That sentence says you know where the system strains and how confident you are, which is more useful than any additional component.

## What to cover, in rough priority

- **A recap**, especially if you proposed alternatives along the way. After forty minutes the interviewer may not remember which option you settled on. Thirty seconds re-stating the final shape is worth it.
- **Failure cases.** What happens when a server dies, the network partitions, a dependency is slow rather than down. Slow is worth calling out specifically, because it is the harder case: a dead dependency fails fast, a slow one exhausts your connection pool and takes you with it.
- **Operations.** How you would know this system is unhealthy: which metrics, which alerts, how a deploy rolls out and rolls back. Many candidates never mention this, so it stands out.
- **The next scale curve.** "This supports 1 million users. At 10 million, the first thing to break is X, and I would change Y." This is the question a senior interviewer most wants answered, because it tests whether you know which part of your own design is closest to its limit.
- **What you would do with more time.** The parts you deliberately left shallow, named as deliberate rather than forgotten.

## You are not done until they say so

A common mistake is treating the design as the end of the interview. The interviewer is assessing the whole session, including how you handle questions after the drawing stops.

Ask for feedback, and ask early rather than only at the end. "Does this seem like the right tradeoff to you?" mid-session invites the collaboration the format is built around, and it can redirect you before you spend ten minutes in the wrong place.

## Predict, then verify

You are at the wrap-up and you know your design has a weakness you never mentioned: the write path has a single point of failure. Raise it, or hope it goes unnoticed?

Answer: raise it, and the reason is about what is being measured rather than about candour. The interviewer has spent the session building a model of how you think, and there are only two possibilities here: they already saw it, or they did not. If they saw it and you stay quiet, the reading is that you missed it or hid it, and both are worse than the flaw. If they did not see it, you have just demonstrated that you audit your own designs, which is the rarer skill. The cost is one sentence and the payoff is the last impression of the session. Say it as a bottleneck with a fix attached: "the write path goes through a single coordinator, which is a single point of failure. With more time I would put a standby behind a leader election, and accept the failover window." That is not an admission, it is the wrap-up doing its job.
