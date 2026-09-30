After refinement, Roost's instalments backlog holds 34 stories, ranked top to bottom. Each is small, valuable and testable, and the list still cannot answer the team's most urgent question: if we stop after story 9, can a family actually pay in instalments? A ranked list shows what matters most. It cannot show what is missing.

## A map instead of a list

Jeff Patton wrote about this in articles from 2005 and 2008, and in his book _User Story Mapping_ (O'Reilly, 2014). His complaint about the flat backlog is a picture: the team spends weeks understanding users' goals, a tree of context, then pulls off the leaves, bags them, and cuts down the tree. What remains is, in his words, "a bag of context-free mulch."

A story map keeps the tree. The mechanics:

1. Lay out the **backbone** left to right: the activities a user goes through, in the order they tell the story.
2. Hang the stories for each activity beneath it, most important at the top.
3. The top row across every activity is the **walking skeleton**, the smallest version that works from end to end. Patton borrowed the term from Alistair Cockburn.
4. Draw lines across the map (Patton uses masking tape) to cut **release slices**, each one a full pass through the backbone.

Roost's instalments map has five activities across the backbone, spanning both sides of the marketplace, and two slices:

| Activity            | Slice 1: Pune soft launch                     | Slice 2: June campaign                   |
| ------------------- | --------------------------------------------- | ---------------------------------------- |
| Owner opts in       | Operations opts owners in by phone            | Opt-in screen in the owner app           |
| Payer applies       | Schedule and application (S1)                 | Payer can edit a mistyped phone number   |
| Partner decides     | Approval (S1), decline with 24-hour hold (S4) | Decision status shown to the student too |
| Owner gets paid     | Partner pays within 1 working day (S2)        | Payout status on the owner dashboard     |
| Payer pays the rest | SMS reminders (S3), failed payment retry (S5) | WhatsApp fallback (S8), date change (S6) |

Below the second line of tape sit payers without a PAN, a choice of parts, Hyderabad and monthly rent: the out-of-scope list from the lesson on a PRD's hard sections, now in place.

## What the map shows that the list hides

Read slice 1 across. Every activity has something in it, and one cell is not software at all: operations phones the owners. That is the MVP scoping lesson's rule at the scale of a feature: steps can be manual, but they cannot be missing. The walking skeleton is thin in every column and empty in none.

Read a column down and you see depth: how each activity improves in later slices. Ranking works inside a column, where stories really do compete. It fails across columns, where they depend on each other.

In practice a map is built in a few hours, in one room or on one shared board, by the PM, designer, engineers and operations walking the story aloud: "and then what happens?" The stories still go into the tracker; the map is where the team decides which ones form a release. It breaks down in two ways. A one-screen change has no journey, so do not map it. And a map of a whole product, hundreds of cards across dozens of activities, becomes a wall nobody reads; map one journey or one feature at a time.

## Predict, then verify

The team has 40 engineer-days before the soft launch. The flat backlog, ranked by RICE, puts nine payer-side stories in the first 40 days. None sits under "Owner gets paid", because the team counts reach in students, and owner stories touch none directly; S2 ranks 14th. The founder says to trust the scores. Operations could opt in the 150 most-booked Pune owners by phone, at 15 minutes a call. What ships?

Answer: the walking skeleton. Pull S2 (3 days) into the release and drop the lowest-ranked payer story to make room; the phone opt-ins cost operations 150 × 15 = 2,250 minutes, about 37.5 hours, and no engineering time. RICE scores each story as if it stood alone. But without S2 the partner never pays an owner, so no instalment booking completes, and the real reach of all nine payer stories is zero. The principle is Patton's: rank within an activity, slice across the backbone, and never release a slice with an empty column.
