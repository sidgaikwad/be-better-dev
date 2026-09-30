On March 13, 2013, Google announced that Google Reader, its feed reader since 2005, would shut down on July 1. The post gave one reason: the product had a loyal following, but usage had declined.

```text
Notice, March 13 to July 1
Rest of March    18 days
April            30 days
May              31 days
June             30 days
July 1            1 day
Total           110 days
```

Google did several things right. It gave a date and a reason, and users could export their subscriptions through Google Takeout. Feedly, a rival reader, said it gained 500,000 users in the next 48 hours, so people had somewhere to go. The cost landed somewhere else: trust. A fan-run site called Killed by Google lists the products Google has discontinued, 307 of them when this lesson was written in September 2026, and the count only rises. When a company is known for closing things, people hesitate to commit to its next launch. No usage dashboard shows that cost.

## Why this is a PM job

Every product you keep has a running cost: engineers keeping it working as everything around it changes, security fixes, support tickets, a line in every test plan, and a team's attention. Retiring something is often the cheapest high-return item a roadmap can hold. It goes badly when it is treated as an engineering task, switching servers off, rather than a product decision about customers who built habits on it.

## A sunset plan

Suppose Roost's Roommate Finder, which matches students to share a room, has not earned its keep. Most of a sunset plan answers the questions below:

```text
Sunset plan: Roommate Finder
Usage       1,800 of 60,000 monthly students (3%); 40 owners
            use it to fill shared rooms
Cost        about 20% of one engineer, plus 6 hours a week
            of moderation by operations
Dependents  students mid-match; owners whose shared rooms
            rely on it
Migration   a "looking for a roommate" tag on shared-room listings
Export      students can download their matches and messages
Timeline    announce Oct 1 and stop new profiles; read-only Dec 1;
            off Feb 1, well before the June rush
Messages    at announcement, 30 days before read-only, and 7 days
            before switch-off
Support     brief support and operations a week before announcing,
            with an FAQ and reply templates
```

Three choices in it are worth copying. The timeline runs on the users' calendar, not the team's: Roost's year peaks from June to August, so a sunset announced in October ends before the next peak and never lands while families are paying deposits. The stages (no new sign-ups, then read-only, then off) give users a clear signal at each step and time to act on it. And support hears first, because support takes the calls.

## Notice should match dependence, not usage

Reader's 110 days is about three and a half months. Compare Atlassian, which announced in October 2020 that it would stop selling its self-hosted Server products on February 2, 2021 and end support on February 15, 2024: about 40 months for companies that ran their engineering work on those tools. Customers were unhappy, but they could plan. The usual practice is to set lead time by how hard it is to leave. Usage tells you how many people you will upset; dependence tells you how badly. A feature used by 3% with an export button can go in a few months, while a product customers have built processes around needs quarters, or years.

## Predict, then verify

It is late June. The engineer who maintains Roommate Finder is needed on the payments team for the rest of the season, and the feature takes about 20% of her time. A teammate proposes switching it off on July 31 with a single email. In July about 600 students are mid-match on it, choosing rooms for the new year. What do you do?

Answer: Stop investing now, and switch off later. Freezing the feature, with no new work and fixes only if it breaks, frees nearly all of her 20% at once and costs users nothing. Switching off in July strands 600 students mid-match in the month they are choosing where to live, which is the Reader mistake at Roost's scale: a small saving paid for in trust. Keep the moderation hours until the off-season, then run the plan from October. The principle: separate the decision to stop investing from the decision to switch off. The first is free and immediate; the second is paid in trust and should run on the users' calendar.
