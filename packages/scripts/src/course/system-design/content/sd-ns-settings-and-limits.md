The hardest constraint on a notification system is not throughput. It is that people turn notifications off, and once they do you have lost the channel permanently. Everything here exists to prevent that.

## Opt-out settings

Before sending anything, check whether the user wants it:

```sql
CREATE TABLE notification_setting (
  user_id BIGINT NOT NULL,
  channel VARCHAR(20) NOT NULL,  -- push, sms, email
  opt_in  BOOLEAN NOT NULL,
  PRIMARY KEY (user_id, channel)
);
```

Per channel at minimum, and in practice per channel per category, since a user who wants security alerts by SMS and marketing by nothing at all is the normal case rather than an edge case.

Check it in the notification server, before the event reaches a queue. Checking later wastes queue capacity and worker time on notifications that will be discarded, and it puts the check in more places, each of which can be forgotten.

## Rate limiting

Cap how many notifications a user receives in a period, regardless of how many your services generate.

This is Part 2's rate limiter applied to a different dimension, and the reason is worth stating plainly: the failure mode is not overload, it is churn. A user getting fifteen pushes in an hour does not complain, they disable notifications, and that decision is permanent and invisible to you. One over-eager service can destroy a channel for a user who would have welcomed the other ten notifications you were going to send that month.

The limit belongs at the notification system, not in each calling service, for the same reason the check belongs there: there are many services and they do not know about each other, so only the shared component can see the total.

## Templates

Millions of notifications follow a handful of formats. A template is a preformatted notification with parameters:

```text
BODY: You dreamed of it. We dared it. [ITEM NAME] is back, only until [DATE].
CTA:  Order Now
```

The benefits are consistency, fewer mistakes, and not rebuilding markup per notification. The practical one is that a change to wording or layout is one edit rather than a search through every service that sends.

## Security

The notification API is internal, and it must be authenticated, because an unauthenticated endpoint that sends push notifications to your entire user base is a spam cannon with your name on it. An appKey and appSecret per calling client is the usual mechanism, and it also gives you per-client rate limits and an audit trail of who sent what.

## The ordering

These checks form a pipeline in the notification server, before anything is queued:

1. Authenticate the caller.
2. Validate the payload: is the email well-formed, is the phone number plausible.
3. Check the user's opt-in for this channel and category.
4. Check the per-user rate limit.
5. Render the template.
6. Queue.

Cheap checks first, and the ones that reject most traffic before the ones that cost most.

## Predict, then verify

You add a rate limit of 5 notifications per user per day. A password reset arrives for a user who has already hit the limit from marketing emails. What happens?

Answer: the reset is dropped and the user cannot get into their account, which is a much worse outcome than the fifteen marketing emails the limit was protecting them from. The mistake is a single limit across notifications that are not comparable: transactional messages (password resets, payment confirmations, security alerts, two-factor codes) are ones the user asked for and is actively waiting on, while promotional ones are ones you decided to send. Limiting them together lets the discretionary traffic starve the essential traffic, and it fails in the direction that generates support tickets and account lockouts. The fix is to classify notifications by category and apply limits per category, with transactional either unlimited or limited very loosely. The same reasoning applies to opt-out: a user who opts out of marketing has not opted out of being told their password changed, and conflating the two is both a product failure and, for some categories, a compliance one.
