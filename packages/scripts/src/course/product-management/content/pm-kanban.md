Roost's owner-app fixes live on a board with three columns: To do, In progress, Done. Two engineers on a rotation work it. Right now In progress holds 24 cards, and the rotation finishes about 6 a week. Owners complain that a bug takes a month to fix once someone picks it up. Nobody is slow; the board is doing what arithmetic says it must.

## Kanban in three practices

Kanban, Japanese for a signboard or card, comes from Toyota's production system, where a card moving upstream authorized making more parts: work was pulled by demand rather than pushed by a schedule. David J. Anderson adapted it to software teams, starting at Microsoft, and set it out in his 2010 book "Kanban". The Kanban Guide by Daniel Vacanti and John Coleman (first published December 2020, revised since) reduces it to three practices:

1. Define and visualize the workflow: the columns and when a card may move.
2. Actively manage the items in it, above all by explicitly limiting work in progress, so that people pull new work only when they have finished old work.
3. Improve the workflow, using four measures: work in progress (WIP), throughput (items finished per week), work item age (how long an unfinished item has been going), and cycle time (start to finish).

Kanban has no sprints, roles or required meetings. That suits work that arrives continuously, and it means the WIP limit is nearly the whole method.

## Little's Law, worked

John Little proved in 1961, in the journal Operations Research, a relationship that holds for any stable system:

```text
average cycle time = average WIP / average throughput

Roost today:   24 in progress / 6 a week  = 4 weeks
WIP limit 6:    6 in progress / 6 a week  = 1 week
```

Cap In progress at 6 and every started card finishes in about a week. The other 18 move back to an ordered Ready column that you, the PM, rank. So the map pin bug, the owners' worst complaint, starts next and is fixed in about a week instead of joining a four-week crowd.

What did not change: Throughput is still 6 a week, so the pile of 24 still takes 4 weeks to clear: Little's Law applies to whatever boundary you draw, and drawn around Ready plus In progress, the average is unchanged. What the limit buys is choice, since unstarted work can still be reordered, and less switching between a dozen half-done fixes, which in practice tends to lift throughput. What it cannot do is make a team finish more than it finishes.

One caution: the law describes averages in a stable system, where work arrives about as fast as it leaves. It is not a promise about any single card.

## The video's board

The course's instructor walks through Trello: lists for To do, In progress and Completed, cards with a member, labels, a checklist and a due date, moved across as work progresses. He calls it a kanban board, and it is a correct first practice: the work is visible. It is not yet Kanban. There is no WIP limit on any list, no rule for pulling, and nothing measured. A board without a limit is a to-do list with columns, and Roost's board is what it becomes after a busy month. Put a number on the In progress header and watch each card's age, and the same board becomes the method.

## Predict, then verify

June. Owner bug reports arrive at 10 a week and the rotation finishes 8; 16 are in progress, a cycle time of 2 weeks. Operations asks that every urgent report be started the day it arrives, so owners see "in progress". Nothing else changes for four weeks. What happens, and what do you do?

Answer: WIP grows by 10 - 8 = 2 a week, from 16 to 24, and cycle time rises from 16 / 8 = 2 weeks to 24 / 8 = 3 weeks. Starting sooner changes only the label owners see; they wait longer for the fix. Set a limit of 8 in progress, a one-week cycle, and rank the queue. Then close the real gap of 2 a week: move a third engineer onto the rotation for June, or decline the lowest-value reports openly. The principle is the Kanban community's slogan, stop starting and start finishing: when work arrives faster than it leaves, only capacity or a clear "no" fixes it.
