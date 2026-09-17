A hotel reservation system looks like a CRUD application and is a concurrency problem wearing one. Almost nothing about it is hard except the moment two people book the last room.

## Scope

- 5,000 hotels, 1 million rooms
- Payment in full at booking
- Bookings via website and app
- Cancellations allowed
- 10% overbooking permitted, since hotels expect cancellations
- Prices change daily
- Room search is out of scope

## The estimate, and what it reveals

```text
occupied rooms      = 1 million × 70% = 700,000
average stay        = 3 days
daily reservations  = 700,000 / 3 = ~240,000
reservations/second = 240,000 / 10^5 = ~3
```

Three reservations per second. Not three thousand.

That number reshapes the interview. Nothing here is a throughput problem, so an answer built around sharding and caching is answering a question nobody asked. The difficulty is entirely correctness under contention: those three per second are not evenly spread, and at a popular hotel during a conference they arrive at the same instant for the same room type.

Page views are higher, since roughly 10% of viewers proceed at each step, so detail-page QPS is maybe a hundred times the reservation rate. Reads scale by ordinary caching and are not interesting.

## You reserve a type, not a room

The central modeling decision. A guest books "a king room, non-smoking" and the specific room number is assigned at check-in.

So the inventory is not a row per room. It is a count per room type per date:

```sql
CREATE TABLE room_type_inventory (
  hotel_id       BIGINT NOT NULL,
  room_type_id   BIGINT NOT NULL,
  date           DATE   NOT NULL,
  total_inventory  INT  NOT NULL,
  total_reserved   INT  NOT NULL,
  PRIMARY KEY (hotel_id, room_type_id, date)
);
```

A three-night stay touches three rows, one per date, and must succeed or fail for all of them together.

This is why the API takes a `roomTypeID` and a count rather than a room id:

```text
POST /v1/reservations
{
  "startDate": "2021-04-28",
  "endDate": "2021-04-30",
  "hotelID": "245",
  "roomTypeID": "12354673389",
  "roomCount": 3,
  "reservationID": "13422445"
}
```

Modeling it as a counter rather than as individual rooms is what makes the whole problem a concurrency problem rather than an allocation problem, and it is worth saying why: with rooms, two bookings conflict only if they want the same room, and with a counter every booking for that type on that date contends on one row.

## Overbooking

10% overbooking makes the check `total_reserved + requested <= 110% of total_inventory`, and nothing else changes.

It is worth a sentence because the reason is interesting: hotels overbook because cancellations are predictable in aggregate, so the inventory constraint is a business parameter rather than a physical one. That means the check must be expressed as configuration rather than as a hardcoded rule, since the percentage differs by hotel and by season.

## Predict, then verify

At three reservations per second, is a race condition on the inventory row actually likely?

Answer: yes, and the average rate is exactly why people talk themselves out of defending against it. Three per second across 5,000 hotels means any given hotel sees a reservation every half hour on average, which sounds like no contention at all. But reservations are not uniformly distributed: they cluster on the hotels and dates people want, so a conference hotel on the conference weekend can receive dozens of attempts in the same second for the same room type, and that is precisely when the inventory is nearly exhausted and the check matters most. The contention is concentrated exactly where being wrong is most expensive, and averaging hides it completely. The general lesson is that an average rate tells you about capacity and nothing about concurrency: for correctness you need the peak rate on the hottest single row, which here is bounded only by how many people want the same room, and that number is unrelated to the 3 per second the estimate produced.
