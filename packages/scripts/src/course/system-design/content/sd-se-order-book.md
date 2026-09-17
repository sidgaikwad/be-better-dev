An exchange matches buyers with sellers. The data structure that holds the unmatched orders is the order book, and its shape determines what the matching engine can do in the time it has.

## Scope

- Stocks only
- Limit orders only: place and cancel
- Normal trading hours
- Clients place orders and receive matched trades in real time, and can query the order book and price history

A limit order says "buy 100 shares at no more than $100.10". A market order says "buy 100 at whatever the price is". Restricting to limit orders is a real simplification: every resting order has a price, so the book is fully ordered.

## What an order book is

Two sorted collections per symbol:

- The **buy book** (bids), ordered by price descending. The highest bid is the **best bid**.
- The **sell book** (asks), ordered by price ascending. The lowest ask is the **best ask**.

Within a price level, orders queue in arrival order, which is what makes the exchange fair: at the same price, whoever arrived first is filled first. Price first, then time.

```text
        price    quantity
ask  100.13       100
     100.12       600
     100.11       900
     100.10       200   <- best ask
     ------------------  spread
     100.08       500   <- best bid
bid  100.07       100
     100.06      1100
     100.05       500
```

The gap between best bid and best ask is the **spread**. No match is possible while it exists, because no buyer will pay what any seller is asking.

## Matching

An incoming buy order matches against the ask side, starting at the best ask and walking up until it is filled or the price limit is reached.

A buy of 2,700 shares against the book above takes 200 at 100.10, then 900 at 100.11, then 600 at 100.12, then 100 at 100.13, and the rest rests in the book if the limit allows.

Each match produces two **executions**, also called fills: one for the buyer, one for the seller. An order may produce many executions or none.

## What the structure must do

The requirements on the data structure follow directly:

- **Constant-time lookup** of volume at a price level.
- **`O(1)` add, cancel and execute**, since these are the hot operations.
- **Fast best bid and best ask**, read on every incoming order.
- **Iterate price levels in order**, for walking a large order through the book.

The usual construction is a map from price to a price level, each level holding a doubly linked list of orders in time order, plus a structure over the prices themselves for ordering. Add is appending to a list. Cancel is unlinking a node, given a map from order id to node, which is why cancel is `O(1)` rather than a search. Matching consumes from the head of the best level.

Note the shape: two indexes over the same orders, one by price for matching and one by id for cancelling, which is what makes both operations constant time. That is a recurring move for any structure needing two access paths.

## Predict, then verify

Best bid is 100.08 and best ask is 100.10. A buy limit order arrives at 100.09 for 500 shares. What happens?

Answer: nothing matches and the order rests in the book as the new best bid, narrowing the spread to a single tick. It cannot match because the cheapest seller wants 100.10 and this buyer will not pay more than 100.09, so the order joins the buy book above the previous best bid at 100.08. The interesting consequence is what it does to everyone else: the visible market has changed, with the best bid now 100.09, and every participant watching the book sees it immediately. That is why the market data feed is part of the matching engine's output rather than a separate reporting system, and why a resting order that never matches is still a market event. It also shows what the spread is for: it is the price of immediacy, so a buyer who wants to trade right now crosses it and pays 100.10, while a buyer willing to wait posts at 100.09 and may get a better price or no trade at all.
