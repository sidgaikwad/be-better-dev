Scope is settled. Now propose a design, at the level of boxes and the arrows between them, and get agreement before building anything on top of it.

The goal of this step is buy-in. Fifteen minutes of deep work on a component the interviewer thinks is beside the point is fifteen minutes wasted, and the way to avoid it is to show the blueprint early and ask.

## What goes on the board

Components and the flows between them. Clients, the API layer, web servers, data stores, cache, CDN, queues. Not classes, not language choices, not library names.

Draw the flows separately rather than drawing one diagram of everything. For a news feed, that is two flows:

- **Publishing.** A user posts. The post is written to a store, and then it reaches their followers' feeds somehow.
- **Reading.** A user opens the app. Their feed is assembled from their friends' posts in reverse chronological order.

Two diagrams, each simple, is much better than one that tries to be both and is legible as neither.

## Check the blueprint against numbers

This is where the estimation section pays off. Having drawn the boxes, ask whether they survive the scale you agreed on.

If reads are 700,000 per second and the diagram shows the web tier reading from a database, the diagram is already wrong and you should say so and fix it now. Doing this out loud is much of the signal in this step: you proposed something, checked it against a number, and revised it. That is the behavior being assessed.

Ask before doing a long calculation, though. "Do you want me to work out the QPS here, or take it as given?" respects the clock and lets the interviewer steer.

## How deep to go

API signatures and database schemas are sometimes right for this step and sometimes far too low level. It depends entirely on the question.

"Design Google search" is too large; schemas at this stage are noise. "Design the backend for a multiplayer poker game" is small enough that the API is most of the design, and sketching it is exactly right.

When unsure, ask. "Do you want me to sketch the API here, or stay at the component level?" is a fifteen-second question that can save ten minutes of work in the wrong direction.

## Walk a concrete case

Once the boxes are up, trace one real request through them, out loud. "A user with 200 followers posts. The write goes here, then this queue, then these 200 feed entries are written here."

This is the cheapest bug-finding technique available. Concrete cases expose gaps that the diagram hides, because a box labeled "feed service" looks complete until you try to walk a request through it and discover nothing decides what order things come back in.

Ten to fifteen minutes for this step.

## Predict, then verify

You present a high-level design. The interviewer says "what happens if the cache goes down?" Is this a gap in your design, or an invitation?

Answer: treat it as an invitation, because it almost always is. The interviewer is picking the deep dive, and they have picked the failure mode of a component you drew. Answering with "the database absorbs the reads" is not enough, and the caching section already gave you the real answer: the database is provisioned for the cached workload, so a cold cache sends it perhaps a hundred times its usual load, and it falls over. Then say what you would do about it, which is a cache tier spread across nodes and data centers so it cannot all go cold at once, plus request coalescing so one miss becomes one query. That is a complete answer, and it happened because you read the question as an opening rather than as criticism. Defensiveness here reads as stubbornness, which is one of the red flags interviewers are explicitly watching for.
