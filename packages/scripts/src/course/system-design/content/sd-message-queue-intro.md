A user uploads a photo and your server crops it, sharpens it, generates three thumbnails and stores them. That takes four seconds, during which the request is open, a web worker is occupied, and the user is watching a spinner. Multiply by a traffic spike and the web tier is full of workers doing image processing instead of serving pages.

The work does not need to happen inside the request. That observation is what a message queue is for.

## The shape

A queue is a durable buffer that two sides talk to without talking to each other.

- **Producers** publish messages. Here, the web server writes "process photo 4471" and returns immediately.
- **Consumers** read messages and act on them. Here, a pool of image workers picks up jobs and does the four seconds of work.

The request now returns in milliseconds. The photo is processed shortly afterward.

What makes this more than a thread pool is the decoupling in time. The producer can publish when no consumer is running, and the messages wait. The consumers can process when the producer is down. Neither side needs the other to be healthy at the moment it does its work.

## Scaling the two sides separately

This is the property that matters at scale. Web servers and image workers have completely different demands: the web tier needs many cheap concurrent handlers, image processing needs CPU and memory per job. Without a queue they are the same process and you scale them together, buying image-processing-sized machines to serve HTML.

With a queue, you watch the queue depth. If it is growing, consumers are falling behind and you add workers. If it is empty most of the time, you have too many and you remove some. The queue length is a direct, honest signal of whether capacity matches demand, which is a rarer thing than it sounds.

It also absorbs bursts. Ten thousand uploads in a minute against workers that handle a hundred a minute is not an outage, it is a queue that grows to ten thousand and drains over a hundred minutes. Without the queue, the same burst is ten thousand simultaneous requests and a web tier that falls over. The queue converts a failure into a delay, and a delay is almost always the better failure.

## What it costs

The response now lies a little. You told the user their photo was uploaded, and it has not been processed. The interface has to be honest about that, with a pending state, and the client needs some way to learn when the work is done. That is real product work, not just plumbing.

You also inherit the delivery question. If a worker takes a message and crashes, does the message come back? If it comes back after the worker had already finished, the job runs twice. Photo processing run twice is harmless. A payment run twice is not. The rule of thumb is to make consumers idempotent, so that running a message twice has the same effect as running it once, which is cheaper than trying to guarantee exactly-once delivery. Part 4 has a whole section on why.

## Predict, then verify

Your queue normally sits near zero. After a deploy it grows steadily at 500 messages per minute and does not stop. Consumers report no errors. What is happening, and does adding consumers fix it?

Answer: consumers are slower than they were, and the steady growth tells you how much. Since the arrival rate did not change with the deploy, throughput per consumer dropped, most likely because the new code added work per message, an extra query or a slower call. Adding consumers does fix the backlog, and it is the right immediate action to stop the queue growing. It is not the diagnosis. If each message got twice as expensive you now need twice the workers forever, and the useful number to find is time-per-message before and after the deploy, because that says whether you are looking at a capacity problem or a regression. Monitoring queue depth alone tells you something is wrong; monitoring depth together with processing time tells you what.
