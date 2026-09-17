The feature needs two schema changes: a mandatory `status` column on `subscriptions`, and a new `subscription_tokens` table. The previous lesson left us a constraint: during every deploy, the old and the new binary run against the same database at once. Try to ship everything in one motion and both possible orders fail.

Migrate first, deploy second: while the rollout is in flight, the still-running old code inserts subscribers without `status`. The column is `NOT NULL`, so Postgres rejects every insert: signups are down until the deploy completes.

Deploy first, migrate second: the new code writes a `status` column that does not exist yet. Every insert fails again, from the other side.

The old escape hatch, "take the service down, migrate, bring it back", is exactly what the previous lesson's SLA arithmetic priced out. A big-bang release will not cut it; we get there in smaller steps. The chapter's analogy is test-driven development: you never change the code and the tests in the same motion, one of them stays still. Here, application behavior and schema take turns.

## The three-step dance for a mandatory column

Step 1: add the column as optional. The application does not change.

```sql
ALTER TABLE subscriptions ADD COLUMN status TEXT NULL;
```

Old code keeps inserting rows and ignores the column entirely; `NULL` fills the gap. Run this against production while version N serves traffic. Nothing observable happens, which is the point.

Step 2: deploy code that writes it. The schema does not change. The insert query starts populating `status = 'confirmed'` for every new row ('confirmed', not 'pending_confirmation': behavior must stay identical until the whole flow exists). Old rows still hold `NULL`, and the column tolerates that. During this rollout N ignores the column while N+1 writes it, and both are valid against the same schema.

Step 3: backfill, then tighten. Once no running version writes `NULL`:

```sql
BEGIN;
    UPDATE subscriptions SET status = 'confirmed' WHERE status IS NULL;
    ALTER TABLE subscriptions ALTER COLUMN status SET NOT NULL;
COMMIT;
```

Backfill and constraint land inside one transaction, so the pair succeeds or fails as a unit and the schema is never left half-migrated. (`sqlx` does not wrap migration scripts in transactions for you; the `BEGIN`/`COMMIT` is deliberate, and the next lesson takes transactions apart properly.)

Three migrations, two production deploys, zero seconds of downtime, and at every instant the schema was legible to both versions in play.

## The new table is one step

`subscription_tokens` needs no dance at all:

```sql
CREATE TABLE subscription_tokens(
    subscription_token TEXT NOT NULL,
    subscriber_id uuid NOT NULL
        REFERENCES subscriptions (id),
    PRIMARY KEY (subscription_token)
);
```

Create it while every running version ignores it; deploy token-writing code whenever convenient. The asymmetry is the deep rule: adding something nobody reads yet is always safe, while tightening what running code relies on (a `NOT NULL`, a dropped column, a rename) is what demands choreography. The `REFERENCES subscriptions (id)` foreign key is its own small integrity guarantee: the database refuses any token row pointing at a subscriber that does not exist.

The pattern generalizes under the name expand-contract: expand the schema so old and new code both fit, move the code across, then contract away what only the old code needed. Postgres details shift over time (since Postgres 11, `ADD COLUMN ... NOT NULL DEFAULT ...` no longer rewrites the table, so some dances shrink), but the discipline is about running binaries, not SQL syntax.

## Predict, then verify

Next quarter someone wants to rename `subscribed_at` to `signed_up_at`, zero downtime required, "should be a quick migration". How many steps does it really take, and what are they?

Answer: a rename is a disguised add-plus-drop, so at minimum three: add `signed_up_at` as nullable; deploy code that writes both columns and reads the new one, backfilling old rows along the way; then, once no live version touches `subscribed_at`, drop it. A single `ALTER TABLE ... RENAME` would strand whichever version still queries the other name, the old binary during the rollout or the new one during a rollback. The dance has the same shape every time; only the columns change.
