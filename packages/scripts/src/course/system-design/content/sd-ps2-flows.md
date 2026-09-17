Money moving through software is the one domain where being approximately right is failure. The good news for a designer is that the industry has settled conventions, and knowing them is most of the answer.

## Scope

- Payment backend for an e-commerce site, credit cards as the example
- Card processing through a third-party PSP: Stripe, Braintree, Square
- No card numbers stored in your system
- One currency, global application
- 1 million transactions per day
- Both directions: pay-in from buyers, pay-out to sellers
- Reconciliation, because services will disagree

That third point is the one that shapes the architecture most. Storing card numbers puts you inside PCI DSS, which is an expensive compliance regime, so the design is arranged specifically so the numbers never touch your servers.

```text
transactions/day = 1 million
average TPS      = 1 million / 10^5 = ~10
```

Ten transactions per second. Again a design whose entire difficulty is correctness, not volume.

## Pay-in

1. A user clicks place order, producing a payment event.
2. The **payment service** stores it, after a risk check for money laundering and sanctions, usually a third-party service because the rules are specialized and change.
3. One event may contain several **payment orders**, since a basket can span sellers. The service creates one per seller.
4. The **payment executor** stores each order and calls the PSP for it.
5. The **PSP** moves money from the buyer's card, dealing with the **card schemes**, Visa and Mastercard.
6. The **ledger** records the financial fact.
7. The **wallet** holds each seller's balance.

The split between payment order and payment event is worth noticing. A basket with three sellers is one customer action and three independent money movements, each of which can succeed or fail separately, so modelling it as one payment would force all-or-nothing behaviour that neither the customer nor the sellers want.

## Pay-out

The mirror image: money from your bank account to sellers' bank accounts, through a third-party payouts provider rather than a card PSP, since it is bank transfers rather than card rails.

Same structure, different providers, and more regulation: paying money out carries tax reporting and jurisdictional rules that taking money in does not.

## The hosted payment page

The mechanism that keeps card numbers out of your system.

The PSP provides the form: an iframe or widget on web, a prebuilt screen in a mobile SDK. The customer types their card number into the PSP's page, not yours, so the number goes directly to the PSP and your servers receive only a token representing it.

Your code never sees a card number, so your servers are out of PCI scope for storage. That is not a minor convenience: it is the difference between an annual audit of your entire infrastructure and an audit of the integration.

The design constraint it creates is that your checkout is partly someone else's UI, so you get less control over the experience, and the PSP's availability is your checkout's availability.

## Predict, then verify

At 10 transactions per second, why is this considered a hard system?

Answer: because every failure is permanent and visible to someone who cares intensely. In every other system in this course a lost request is a retry, a stale read is a refresh, and a dropped event is a rounding error in a metric. Here a lost payment is a customer charged with no order, a duplicate is a customer charged twice, and an unreconciled discrepancy is a number in a financial statement that nobody can explain. The difficulty is also distributed across parties you do not control: the PSP, the card schemes, the banks, each with its own asynchronous timing and its own failure modes, and none of which will roll back to match your state. So the engineering is about what happens when a step fails between systems that cannot participate in a transaction with each other, which is why reconciliation is a required feature rather than an operational nicety. The general framing worth carrying: when throughput is low and correctness is absolute, the design effort goes entirely into failure handling, and an answer that spends its time on scaling has misread the problem.
