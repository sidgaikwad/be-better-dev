"Notification" means three different things with three different delivery mechanisms, and the first design decision is that you do not control any of them.

## Scope

- Push notifications, SMS and email
- iOS, Android, desktop
- Soft real time: as fast as possible, a delay under load is acceptable
- Triggered by client applications or scheduled server-side
- Users can opt out
- 10 million pushes, 1 million SMS, 5 million emails per day

Work the rate: 16 million a day is about 185 per second average, 370 at peak. That is small, and it is worth saying so early, because it tells you the hard parts are not throughput. They are reliability, fan-out across providers, and not annoying people.

## iOS push

Three parties:

- **Your provider**, the service that builds and sends the request. This is you.
- **APNs**, Apple Push Notification Service.
- **The device.**

You send APNs a device token, which uniquely identifies an app installation on a device, and a JSON payload. APNs delivers it.

## Android push

The same shape with Firebase Cloud Messaging instead of APNs. Different API, same three-party structure.

## SMS and email

Both go through commercial providers: Twilio or Nexmo for SMS, SendGrid or Mailchimp for email. You could run your own mail servers, and almost nobody should, because deliverability is a reputation problem that takes years to build and one bad sending run to destroy.

## What the channels have in common

Every channel ends at a third party you do not control, cannot fix, and cannot make faster. That single fact drives the whole design:

- **They fail independently.** APNs having a bad hour says nothing about SendGrid. If one queue backs up, the others must keep moving.
- **They have their own rate limits**, which you must respect or be throttled.
- **They are regional.** FCM is unavailable in China, so that market needs a different provider such as Jpush or PushY. Your design needs provider substitution as a first-class feature, not an afterthought.
- **They are slow and variable.** A provider call is a network round trip to someone else's system, so hundreds of milliseconds, sometimes seconds.

Extensibility here is not a nice-to-have. Adding, removing or swapping a provider per region per channel is an ordinary operation.

## Gathering contact info

You cannot send anything without a destination, and destinations are collected when a user installs the app or signs up:

```sql
CREATE TABLE user (
  id    BIGINT PRIMARY KEY,
  email VARCHAR(255),
  phone VARCHAR(20)
);

CREATE TABLE device (
  id           BIGINT PRIMARY KEY,
  user_id      BIGINT NOT NULL,
  device_token VARCHAR(255) NOT NULL,
  last_seen    TIMESTAMP
);
```

The shape that matters: email and phone are on the user, and device tokens are their own table because one user has many devices. A push goes to every device the user has, which means the fan-out from "notify this user" to "make these API calls" happens inside your system.

## Predict, then verify

A user reinstalls your app on the same phone. Their old device token stays in the table. What happens over a year of this?

Answer: the device table fills with dead tokens and you make a growing number of pointless API calls that will never reach anyone. Tokens are per installation, not per device, so reinstalling, restoring from a backup or updating the OS can all issue a new one, and nothing tells you the old one is dead except the provider. That is the important part: APNs and FCM both report invalid tokens in their responses, and a system that ignores those responses accumulates garbage forever. A user with five years of reinstalls generates ten push calls for one delivered notification, which wastes quota and can count against your sending reputation. The fix is to treat the provider's response as data rather than as a status code: on an invalid-token error, delete the row. It is worth raising unprompted, because it is the kind of slow-growing waste that never causes an incident and quietly makes every metric worse.
