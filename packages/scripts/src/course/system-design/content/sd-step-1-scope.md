"Design Twitter." Forty-five minutes. The question is deliberately vague, and the first mistake is the obvious one: starting to answer it.

Real Twitter took thousands of engineers years. Nobody expects you to reproduce it in an hour, and the interviewer knows that better than you do. What the session actually simulates is two colleagues meeting an ambiguous problem and negotiating it into something solvable. The final design matters less than the process that produced it.

So the first move is not an answer. It is a set of questions.

## Why this is a signal rather than a formality

Answering immediately reads as one of two things, and both are bad. Either you have memorized a design for this question, which tests nothing, or you are willing to build a system without knowing what it is for, which is a statement about how you work.

Asking good questions is a skill interviewers specifically look for, because it is the skill the job actually requires. Nobody at work hands you a complete specification either.

## What to ask

Aim at the things that would change the architecture. A question whose answer does not move the design is a question not worth the time.

- **What features are in scope?** "Design Twitter" could mean the timeline, or search, or trending topics, or direct messages. Those are four different systems. Pick a few and say you are excluding the rest.
- **How many users, and how fast is that growing?** A design for a startup and a design for 150 million daily users are legitimately different, and neither is wrong. Ask for the scale in three months, six months, a year.
- **What is the read-to-write ratio?** This one question often determines the whole shape of the answer, as the estimation section showed.
- **What is the existing stack?** If the company already runs Kafka and Cassandra, a design that invents new infrastructure is worse than one that uses theirs.
- **What is not required?** Explicitly dropping things is as valuable as including them. "I will assume no strong consistency across regions" is a decision, and stating it is a signal.

## What to do with the answers

The interviewer will either answer directly or say "you tell me". The second is not a dodge, it is the actual exercise: make a reasonable assumption, say it out loud, and write it where both of you can see it.

Written assumptions are what you check the design against later, and what you revise when the interviewer changes the scale halfway through. A design with no stated assumptions cannot be evaluated, because there is no statement of what it was supposed to do.

Five to ten minutes here in a forty-five minute session. Longer and you are stalling; shorter and you are guessing.

## Predict, then verify

You ask about scale. The interviewer says "10 million daily active users". You ask about features and get "posting and viewing a feed". What is the most important thing you still do not know?

Answer: how many people follow the most-followed account. The user count sizes your storage and your average QPS, and the feature list tells you the flows, but the fanout distribution is the thing that decides whether the architecture works at all. If the maximum is 5,000, you can push every new post into every follower's feed at write time and the design is simple. If one account has 40 million followers, that same write produces 40 million writes, and you need a hybrid that pulls celebrity posts at read time instead. Same user count, same features, two different systems, and the difference is a number you only get by asking. The general form: after scope and scale, ask what the distribution looks like, because averages hide the case that breaks the design.
