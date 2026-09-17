The four steps are the structure. This is everything around them: where the time goes, what is being assessed besides design skill, and the specific behaviors that cost candidates offers.

## Time allocation

For a 45-minute session:

| Step                                          | Time             |
| --------------------------------------------- | ---------------- |
| 1. Understand the problem and establish scope | 3 to 10 minutes  |
| 2. Propose a high-level design and get buy-in | 10 to 15 minutes |
| 3. Design deep dive                           | 10 to 25 minutes |
| 4. Wrap up                                    | 3 to 5 minutes   |

A rough guide, not a rule. The shape is what matters: a short opening, a medium blueprint, a long deep dive, a short close. The two common failures are spending twenty minutes on clarifying questions and never designing anything, and skipping step 1 entirely and designing the wrong system well.

## What is being assessed

Design skill is part of it and not all of it. The session is also reading:

- **Collaboration.** Do you treat the interviewer as a teammate or as an examiner?
- **Handling ambiguity.** Given an underspecified problem, do you make reasonable assumptions and move, or stall?
- **Working under pressure.** What happens when a flaw is pointed out.
- **Question quality.** Many interviewers watch this specifically, because it is the part of the job that most resembles the job.

## Red flags

**Over-engineering** is the one the books call out by name, and it is a real failure in production, not just in interviews. Proposing Kubernetes, a service mesh, event sourcing and CQRS for a system with 1,000 users signals that you optimize for design purity over cost. The strong move is the opposite: propose something simple, say what would make you reach for more, and name the threshold.

**Narrow-mindedness.** Insisting on one technology regardless of fit, or treating a tradeoff as having only one acceptable side.

**Stubbornness.** Defending a design after a genuine flaw is shown. Responding to feedback constructively is explicitly part of what is measured, so the flaw itself costs you little and the defense costs a lot.

## The short list

Do:

- Ask for clarification rather than assuming. Then state the assumptions you did make.
- Say there is no single right answer, and mean it. A startup design and an established-company design are both correct for their context.
- Think out loud, continuously.
- Offer more than one approach where there is a real choice, then pick one and justify it.
- Design the most critical components first.

Do not:

- Jump to a solution before clarifying.
- Go deep on one component before the high-level design exists.
- Think in silence. If you are stuck, ask for a hint. That is a normal move and not a penalty.
- Assume the session ends when the drawing does.

## Predict, then verify

You are 30 minutes in and realize the design cannot meet the write throughput you estimated. Starting over would take the rest of the session. What do you do?

Answer: do not start over, and do not proceed as if the problem is not there. Name it precisely, say which part of the design is responsible, and describe the change rather than making it: "at 7,000 writes per second this single primary is the bottleneck, roughly an order of magnitude past what one node handles. The fix is to shard by user id, which I would do here, and it means the cross-user query in the feed path becomes a scatter-gather that I would solve by denormalizing." You have identified the flaw, located it, proposed a fix and named its cost, in four sentences. That demonstrates more than a correct design would, because a correct design shows you know an answer while this shows you can find one under time pressure with someone watching. Rebuilding from scratch, by contrast, ends with an unfinished second design and no wrap-up, which is strictly worse.
