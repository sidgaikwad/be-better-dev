Before "Ask this listing" had a single engineer on it, Roost's designer made a Figma prototype of it. Students tapped a question and a perfect answer appeared, because the designer had written every answer herself. It showed students liked the idea. It could not show what the model would actually say, which for an AI feature is the main question.

So on a Sunday the PM built a working version with an AI app builder: one listing page, 20 real Pune listing records exported as a file, and a real model answering from them. On Monday six first-years asked it their own questions.

## The coded rung got cheap

The fidelity ladder lesson put the coded build on the top, most expensive rung, and said to turn up the dial your question depends on. AI coding tools have made a throwaway coded build cheap. Colin Matthews's guide on Lenny's Newsletter (January 2025) sorts the tools into three kinds: chatbots such as Claude and ChatGPT for one-screen prototypes, cloud builders such as v0, Bolt, Lovable and Replit for multi-screen apps with data, and coding assistants such as Cursor that edit real code.

For an AI feature, that dial is the output itself. A mock can test layout; only a working prototype on real content shows whether students ask at all, what they ask, and whether they trust the answers.

```text
Prototype brief: Ask this listing, round 1
Question:  Do first-years ask a listing instead of messaging
           the owner, and do they check money answers?
Build:     1 listing page, 20 real Pune records, live model
Data:      Listing records only. No student accounts, no
           payments, no production keys.
Test:      6 first-years, 30 minutes each, their own questions
Signal:    4 of 6 ask 3 or more questions unprompted; count
           how many open the charges table before trusting
           a money answer
Lifetime:  Deleted after the round. The traces are kept as
           eval cases; the code is not kept.
```

## What a prototype hides

A working prototype feels like a product, which is the danger. It proves desirability and usability, and hides:

- **Feasibility at scale**: cost per month, latency with real traffic, and the error rate on 12,000 questions rather than 60.
- **Security**: sign-in, access rules, and who can read whose data.
- **Maintenance**: keeping 1,200 records in sync, monitoring, and someone on call.

The security gap is real. In May 2025 a researcher disclosed CVE-2025-48757: apps generated with Lovable could ship with database access rules that were missing or too loose, so anyone could read and change their tables, including users' emails and payment status. In July 2025, SaaStr founder Jason Lemkin reported that Replit's agent deleted his production database during a code freeze; Replit's CEO called it unacceptable and announced fixes, including separate development and production databases. Hence the brief's data line.

Speed claims need the same care. A 2023 study of GitHub Copilot found developers wrote a small HTTP server in JavaScript 55.8% faster with it. But in METR's randomized trial published July 2025, 16 experienced developers working on 246 tasks in their own mature repositories were 19% slower with AI tools, while believing they were about 20% faster. METR's February 2026 update said later tools likely help more, but it could not measure cleanly, partly because many developers would no longer work without AI. The speed is surest where a prototype lives: new code you will throw away.

## Predict, then verify

The six sessions go well: five of six students asked three or more questions, and the traces show two new failure types. The founder watches a recording and says, "It works. Put it live in Pune next week." The engineering lead estimates six weeks for a production version. What do you tell the founder?

Answer: the prototype answered its question, and "ship it" is a different one. It showed that students want to ask listings questions, which is worth a lot; it did not show the error rate at 12,000 questions a month, the monthly bill, access control, or the handoff to owners, and its code has none of them. Ship the learning instead of the code: the traces become the first eval cases, the brief's findings go into the spec, and production starts with the evals and the routing table, then a staged rollout in Pune. The principle: a prototype proves people want it and can use it; it does not prove you can run it, so keep its lessons and delete its code.
