The type-driven validation section ended with `SubscriberEmail`: a string guaranteed to look like an email address. Two questions remain that no parser can answer. Does the inbox exist? And did its owner actually ask for your newsletter?

## An email address is not a password

Addresses are easy to come by, and plenty are outright public. That opens two kinds of abuse. A malicious user can subscribe a victim to hundreds of newsletters and flood their inbox with junk they never asked for. A shady newsletter owner can scrape addresses off the web and bulk-add them to the list. Either way, a request to `POST /subscriptions` proves nothing about consent, and if you serve EU citizens, explicit consent is not a nicety, it is a legal requirement.

The industry answer is double opt-in: after the form, send a confirmation email containing a link, and only a click on that link makes the subscription real. It solves both problems at once. The victim never confirms, and the scraper's harvest never confirms either. As a bonus, a delivered-and-clicked email is the existence proof no validator could give you.

## Map the journey before any code

The chapter's discipline is worth stealing: write the entire journey down, both sides of it, before opening an editor.

The user submits the form, finds an email with a confirmation link, clicks it, and gets a success response. From then on, issues arrive.

`POST /subscriptions` will:

- insert the subscriber with `status = 'pending_confirmation'`
- generate a unique `subscription_token`
- store the token against the subscriber's id in a new `subscription_tokens` table
- email a link like `https://<api>/subscriptions/confirm?subscription_token=<token>`
- return `200 OK`

`GET /subscriptions/confirm` will:

- read `subscription_token` from the query string
- look up the subscriber id it belongs to
- update that subscriber from `pending_confirmation` to `confirmed`
- return `200 OK`

`status` is a tiny state machine living in a column. The token is a capability: whoever presents it has demonstrated control of the inbox we mailed it to. Tokens are not passwords, they are single-use and guard nothing but a subscription, so the worst case of a guessed token is an unwanted newsletter in someone's inbox. They still must be unguessable, which means a cryptographically secure random generator, not `rand::random` seeded from the clock:

```rust
use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};

/// A 25-character, case-sensitive, alphanumeric token.
fn generate_subscription_token() -> String {
    let mut rng = thread_rng();
    std::iter::repeat_with(|| rng.sample(Alphanumeric))
        .map(char::from)
        .take(25)
        .collect()
}
```

Twenty-five alphanumeric characters give roughly 10^45 possibilities. (The book pins rand 0.8; on today's 0.9 the same function reads `rand::rng()` and `rand::distr::Alphanumeric`.)

Just as valuable, the map marks its own blank spots. What if the user clicks the link twice? Subscribes twice? The chapter names both corner cases and explicitly defers them. An honest plan says "not yet" out loud instead of silently hoping.

## The plan constrains the build

With the journey fixed, the work splits into three chunks: write an email-sending module, adapt `POST /subscriptions` to the new spec, and build `GET /subscriptions/confirm` from scratch. The next two lessons build and test that email module.

One level down, the plan is also an operations problem. It demands a new mandatory column on a table production is writing to right now, plus a brand-new table. Rolling that out on a live service without a maintenance window is its own engineering discipline, and it is where this section ends: zero-downtime deployments, and the migration choreography they force.

## Predict, then verify

With the journey exactly as mapped above (the token row is never deleted), a subscriber confirms successfully, then clicks the same link again. What status code does the second click get, and what changes in the database?

Answer: `200 OK`, and nothing changes. The token still resolves to the subscriber id, and the update sets `status = 'confirmed'` on a row that already reads `'confirmed'`, an accidental idempotency. If confirming had deleted the token row instead, the second click would fail the lookup and surface as an error. Neither behavior was chosen on purpose, which is exactly why the chapter flags "clicked twice" as an open question rather than pretending the design answered it.
