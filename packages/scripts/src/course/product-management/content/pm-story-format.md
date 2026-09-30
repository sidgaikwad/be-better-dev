The course's instructor opens Jira, clicks Create, picks the issue type Story, and types a story close to this: "As a customer, I want to search for food items so that I can order the item I searched for." Read the last clause again. A customer wants to search so that they can have what they searched for. It restates the want and adds nothing, and it is the clause the whole format exists to carry.

## Three clauses, three jobs

The template is "As a [role], I want [capability], so that [benefit]." It came from the Extreme Programming team at Connextra in London in 2001. Rachel Davies is usually named as its author, though she credits the whole team, and Mike Cohn's book _User Stories Applied_ (2004) spread it.

It fixed a specific problem. At Connextra, sales and marketing people wrote most stories, and they wrote down the feature they wanted. The developer who picked up the card could not tell who it was for or why. Each clause answers one of those questions:

- **As a** names who, specific enough to picture. "User" rarely is. The video's examples do better: "As Max, I want to invite my friends", "As a manager, I want to understand my colleagues' progress".
- **I want** names the intent, not the interface: in the video's words, what the person is trying to achieve, not the feature they use.
- **So that** names the benefit. It is what lets an engineer choose between two ways to build the same capability. Skip it or fake it and the story is a feature request again.

Here is the difference on Roost's instalments feature, for requirement F1 from the requirements lesson:

```text
Weak    As a user, I want a "Pay in 3 parts" button at
        checkout, so that I can pay in 3 parts.

Strong  As a parent paying for my daughter's first room,
        I want to split the ₹27,000 due before move-in
        into three payments, so that I can hold the room
        this week instead of waiting for next month's
        salary and losing it to another family.
```

The weak version names a button and a circular benefit. The strong one tells the team that timing is the point: an approval that takes three days fails this parent even if the button works.

## A card, a conversation, a confirmation

The same year, on 30 August 2001, Ron Jeffries described the story in three parts. The card is small on purpose: "The card is a token representing the requirement." The conversation between the people who want the feature and those who build it carries the real requirement. The confirmation is the acceptance tests that show the story is done, which is the next lesson.

So a story is a placeholder for a conversation, not a contract. In the video, the Jira description holds the details: search by restaurant, dish or area, wireframes attached, criteria at the end. That records what the conversation settled; it does not replace it. The common failure is a PM who writes 40 detailed tickets alone and treats every question as proof the ticket needed more detail.

Two smaller failures: forcing technical work into the template ("As a developer, I want to upgrade the database driver") adds words and no information, so write it as a plain task; and a "so that" that restates the feature, as in the video's search story, means you have not found the reason yet.

## Predict, then verify

Roost's owner dashboard shipped from 30 stories. The PM wrote each in full detail and skipped refinement to save time. After the demo, 9 stories were reopened, built to the letter but missing the point, at about 2 engineer-days of rework each. For instalments, the PM can again write detailed tickets alone, or write shorter stories and hold a two-hour refinement session with the designer and the five engineers. Is the meeting worth it?

Answer: yes. The session costs 7 people, the PM included, × 2 hours = 14 person-hours, under 2 working days. The dashboard's rework was 9 × 2 = 18 engineer-days; preventing even a third of it saves 6 days for 2 spent. More detail would not have helped: those 9 stories were detailed, just never discussed. The principle is Jeffries': the card is a token and the requirement lives in the conversation, so budget for the conversation instead of lengthening the card.
