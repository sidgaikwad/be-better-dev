Chapter 11 ended with the delivery worker retrying newsletter sends. Now a customer asks for the mirror image: "when an issue finishes delivering, POST to our URL so our CRM knows." That is a webhook: an event crossing the public internet to a server you do not run. You already live on the receiving end; Postmark can call your service back about bounces and spam complaints. Between you and the receiver there is no shared broker and no shared database, so the guarantees the last two lessons got from Postgres and the broker must be rebuilt from three parts: authenticity, retries, dedup.

## Sign what you send

Anyone who discovers `https://crm.example.com/hooks/newsletter` can POST fake events to it. The fix is the primitive from chapter 10, where HMAC-SHA256 signed the login error's query parameters before cookies took over: sender and receiver share a secret per endpoint, and every delivery carries a tag over its exact bytes.

```rust
use hmac::{Hmac, Mac};
use sha2::Sha256;

fn sign(secret: &[u8], id: &str, timestamp: i64, body: &[u8]) -> String {
    let mut mac = Hmac::<Sha256>::new_from_slice(secret).expect("HMAC takes any key length");
    mac.update(format!("{id}.{timestamp}.").as_bytes());
    mac.update(body);
    hex::encode(mac.finalize().into_bytes())
}
```

The delivery is a POST carrying three headers: `webhook-id` (a uuid for the event), `webhook-timestamp`, and `webhook-signature`. Binding the id and timestamp into the tag matters: the receiver rejects timestamps older than a few minutes, so a captured delivery cannot be replayed next week, and neither field can be swapped without breaking the tag. Verification recomputes and compares:

```rust
fn verify(secret: &[u8], id: &str, ts: i64, body: &[u8], claimed_hex: &str) -> bool {
    let mut mac = Hmac::<Sha256>::new_from_slice(secret).unwrap();
    mac.update(format!("{id}.{ts}.").as_bytes());
    mac.update(body);
    let Ok(claimed) = hex::decode(claimed_hex) else { return false };
    mac.verify_slice(&claimed).is_ok() // constant-time, via the subtle crate
}
```

`verify_slice`, not `==`: an equality check that returns at the first differing byte leaks, through response timing, how much of a forged signature is correct, the same class of leak chapter 10 found in authentication timing. And verify the raw body bytes, before any deserialization. Providers differ only in dialect: Stripe packs `t=` and `v1=` into one `Stripe-Signature` header, GitHub sends `X-Hub-Signature-256: sha256=<hex>`, and the header trio above follows the Standard Webhooks convention, a Svix-led effort to make the dialects converge. The primitive never changes.

## Retries make duplicates; duplicates need keys

Receivers go down. A sender that fires once and shrugs is not delivering events, so real senders retry with exponential backoff plus jitter, for a long time; Stripe keeps trying for about three days. Retries mean the receiver will see duplicates, because a timeout does not tell the sender whether the work happened: the queues section's core dilemma, replayed over HTTP. So receivers dedup: insert the `webhook-id` into a table with a unique constraint, inside the same transaction as whatever the event causes; a conflict means already processed, return 200 and do nothing. Chapter 11's idempotency key, pointed outward. The last discipline is speed: verify, record, return 2xx, and do the real work asynchronously (the next lesson's job queue is its natural home). A receiver that processes inline for 45 seconds against a 30-second sender timeout manufactures its own duplicate storm, one timeout-retry per delivery.

## Predict, then verify

A receiver deserializes the body into a struct, then re-serializes it to JSON and computes the HMAC over that. Its tests pass against its own fixtures. In production, some fraction of genuine deliveries fail verification. Why a fraction, and not all or none?

Answer: HMAC binds bytes, not meaning. Serde's output need not match the sender's bytes: field order, whitespace, escape choices, and number formatting (`1.0` versus `1`) can all differ, so only payloads where every choice happens to coincide still verify. The fixtures were round-tripped through the same serializer, so the tests could never see the mismatch. Verify the raw request body first, then parse.
