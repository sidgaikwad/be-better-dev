A reservation is not a row that exists or does not. It moves through states, and cancellation runs the inventory change backwards, which is where the interesting failures are.

## The states

```text
pending_pay -> paid -> cancelled -> refunded
```

A reservation is created `pending_pay` when the customer submits, becomes `paid` when the payment succeeds, and can be `cancelled` afterwards, with `refunded` following once the money is returned.

Inventory is consumed at creation, not at payment. That is the decision to defend: holding the room while payment is in flight means a customer who has entered card details is not beaten to the room by someone who has not, which is what anyone would expect. The cost is that inventory is held by bookings that may never pay.

Which means `pending_pay` needs a timeout. A reservation stuck there for more than a few minutes should be expired and its inventory released, or a customer who abandons the payment page holds a room forever. That expiry job is easy to forget and its absence takes days to notice, since the symptom is a hotel that appears full while having empty rooms.

## Cancellation

Cancelling decrements `total_reserved` for every date in the stay, in one transaction, in the same ascending-date order as booking, for the same deadlock reason.

The correctness requirement is that a cancellation runs exactly once. Run it twice and inventory is released twice, which oversells the hotel in a way the constraint cannot catch, because the constraint only checks that reserved does not exceed inventory and double-releasing moves the count the safe direction. It is silent.

The fix is the state machine itself: transition `paid` to `cancelled` conditionally.

```sql
UPDATE reservation SET status = 'cancelled'
WHERE reservation_id = :id AND status = 'paid';
```

Zero rows updated means someone else already cancelled it, so the inventory release is skipped. The state column is doing the same job the idempotency key did at booking, which is worth noticing: both turn "has this already happened?" into a condition the database evaluates atomically.

## Dynamic pricing

Prices vary by date, so the rate is a row per hotel per room type per date rather than a field on the room type:

```sql
CREATE TABLE room_type_rate (
  hotel_id     BIGINT NOT NULL,
  room_type_id BIGINT NOT NULL,
  date         DATE   NOT NULL,
  rate         DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (hotel_id, room_type_id, date)
);
```

Which raises the question the schema does not answer: a price shown at 10:00 and a booking submitted at 10:04, with a price change in between. The rate must be captured onto the reservation when it is created, not looked up at payment time, or the customer is charged something different from what they agreed to.

That is a general rule for anything with a price: the quote is part of the offer, so it is stored with the order rather than referenced from a table that keeps moving.

## Predict, then verify

A customer cancels. Your code updates the status to `cancelled`, then releases inventory, then issues a refund. The refund call fails. What is the state, and what should the ordering be?

Answer: the room is released and resellable, the reservation says cancelled, and the customer has not been refunded, which is the worst of the three possible failure points because the customer has lost both the room and the money and only they will notice. The ordering is wrong: it performs the irreversible customer-facing step last, after the steps that make the cancellation appear complete. Two changes. Do not treat the refund as part of the cancellation transaction at all, since it is a call to an external system and cannot be atomic with a database write; record a refund as owed in the same transaction that sets `cancelled`, and let a separate worker drive it to completion with retries. And make that worker's queue monitored, because an unpaid refund is a support case and a regulatory problem rather than a background job that can quietly fail. The general shape is the notification system's persist-before-promise applied to money: write down the obligation transactionally, discharge it asynchronously, and never let the external call be the thing that must succeed for your state to be consistent.
