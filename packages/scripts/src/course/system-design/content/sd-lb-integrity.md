A leaderboard is a target. The moment a ranking is public, some fraction of players will try to appear on it dishonestly, and a design that does not account for that produces a leaderboard nobody believes.

## Never trust the client

The rule, and it is absolute: a score must never be something the client asserts.

If the client sends "I won, add a point", then anyone can send that, repeatedly, without playing. Packet capture makes the endpoint visible in minutes, and no amount of obfuscation in the client changes it, because the client runs on hardware the attacker controls.

The score must be derived from something the server witnessed. In a server-authoritative game the server already runs the match and knows who won, so the leaderboard update is an internal event rather than a request. For a game where clients simulate, the server must at minimum validate the result against what it knows: the match existed, both players were in it, the reported outcome is consistent with the match's recorded events.

This changes the architecture rather than adding a check. The score-update path is not a public API; it is an internal call from the match service, and the leaderboard service should not accept writes from anywhere else.

## Idempotency

A match result may be delivered more than once, by a retry or a duplicate event from the queue. Counted twice, a player gets two points for one win.

The fix is the one from Part 2 and the hotel section: make the update idempotent on `match_id`. Record which matches have been counted and reject a repeat, or make the increment conditional on inserting a row keyed by `(user_id, match_id)`.

Without it, the most common inflation is not cheating at all, it is your own retry logic.

## Detecting what validation misses

Some cheating passes validation because the match really happened and the player really won, by colluding with an opponent who threw it, or by playing against bot accounts.

That is a detection problem rather than a validation one, and detection is statistical:

- **Rate anomalies.** A player winning 200 matches in an hour when the average is 10 a day.
- **Opponent anomalies.** The same pair of accounts playing each other repeatedly with one always losing.
- **Account anomalies.** New accounts that exist only to lose to one player.

None of these is conclusive alone, which is why the response is usually to flag for review rather than to ban automatically. A false positive removes a legitimate player from a tournament they earned, which is worse than a cheater lasting another day.

## Why the point table matters again

The storage lesson kept a MySQL `point` table so the sorted set could be rebuilt. It earns its place twice more here.

It is the audit trail: when a score is disputed, the individual wins with timestamps are the evidence, and a sorted set holding only a total cannot answer how a player got there. And it makes correction possible: removing a cheater's illegitimate wins means deleting rows and rebuilding, which works precisely because the leaderboard is a derived view.

A design that stores only the aggregate has no way to remove a specific contribution to it, and that is a failure worth naming in any system that accumulates a total from events.

## Predict, then verify

You detect a player who inflated their score through collusion and want to remove their illegitimate wins. Their score was 800, of which 300 came from collusion. What is the correct operation?

Answer: delete the specific point rows and rebuild the leaderboard from the point table, rather than setting the score to 500. The two produce the same number today and differ in every other respect. Setting the score directly leaves the fraudulent rows in the record, so a later rebuild after any Redis failure silently restores the inflated score, and the audit trail still claims those wins happened. It also cannot be reviewed: if the detection turns out to be wrong, there is no way to restore exactly what was removed, whereas deleted rows can be kept in a separate table and reinstated. The general principle is that a derived aggregate should only ever be corrected by correcting its source and rederiving, never by writing to the aggregate, because the aggregate will be recomputed one day and any adjustment made only there will vanish. This is the same reasoning as the ad click reconciliation lesson: the raw events are the truth, and everything downstream is a view you can always rebuild.
