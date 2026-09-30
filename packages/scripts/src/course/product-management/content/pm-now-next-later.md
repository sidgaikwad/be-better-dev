Roost's roadmap for the first half of the year was a Gantt chart, one bar per feature:

```text
Parent page              1 Mar to 15 Apr
Map pin fix              1 Apr to 15 Apr
Availability check       15 Apr to 15 Jun
Instalments              1 May to 31 Jul
Verified-stay reviews    1 Jul to 30 Sep
```

By 1 April the parent page had slipped three weeks, and availability, which shared its engineers, slipped with it. Instalments waited on a lending partner's contract nobody could date. Each redrawn bar reached someone as a broken promise. The chart was precise about things nobody knew: verified-stay reviews, six months out, had dates as exact as work already in progress.

## Three columns of confidence

Janna Bastow's alternative has three columns: Now, Next and Later. In her own account (ProdPad's blog, 2019), she and Simon Cast sketched it at a cafe in south London late in 2012, while building ProdPad; the first napkin read Current, Near term and Future.

The columns are a gradient of confidence and detail, not time boxes:

- **Now**: in progress, specified, with people assigned.
- **Next**: the problem is clear and a solution is being validated; less detail.
- **Later**: problems on the horizon, large and fuzzy, not yet broken down.

Each card carries a label for the objective it serves; ProdPad uses colors. Bastow's point: the commitment lives in the objectives, which frees the cards to move without breaking a promise.

_Product Roadmaps Relaunched_ (O'Reilly, 2017), by C. Todd Lombardo, Bruce McCarthy, Evan Ryan and Michael Connors, writes roadmap items as **themes**: customer needs or problems, with candidate features beneath them. Its roadmap also carries the product vision, the business objectives, broad time frames rather than dates, and a disclaimer that the plan will change.

## Converting Roost's roadmap

The conversion is four steps:

1. Rewrite each bar as the customer problem it solves. That is its theme.
2. Tag each theme with the key result it serves. Untagged themes go through the strategy cascade lesson's trace check.
3. Place by confidence: people on it, Now; a solution under test, Next; only a problem, Later.
4. Delete the dates. Keep only a date the world sets (the last lesson).

Against the season OKR (KR1 request-to-booking, KR2 days from request to payment, KR3 move-ins that meet an unlisted charge):

```text
Now
  Parents can check a room without visiting   KR1, KR2
    parent page
  The room is where the map says              KR1
    map pin fix
Next
  Rooms shown as free are free                KR1
    weekly availability check, tested by phone
  The price shown is the whole price          KR3
    charges recorded at the verification visit
Later
  Families who cannot pay ₹27,000 at once     no KR yet
  Reviews students can trust                  no KR yet
  Owners answer requests within a day         no KR yet
```

## Where it breaks

- **Quarters in disguise.** ProdPad's own glossary warns against reading the columns as Q1, Q2 and Q3, which brings the dates back, only vaguer.
- **Hidden slippage.** A card can sit in Now for months and the roadmap shows nothing. Show each Now card's start and original estimate.
- **Later becomes never.** Adding to Later costs nothing. Review it each season and delete what no longer traces.
- **Sales still needs some dates.** A common hybrid dates Now items only; better to date a card only when an outside deadline needs it.

## Predict, then verify

The founder wants availability and instalments moved into Now "to show ambition". Roost has five engineers. The parent page has three, with three weeks left; the pin fix has one, with a week left; the fifth is on the agreed maintenance share. Availability needs two engineers for eight weeks, instalments three for sixteen, and the lending partner has not signed. What goes in Now?

Answer: nothing new yet. All five engineers are placed: 3 + 1 + 1 = 5. Adding both would need 5 + 2 + 3 = 10, so each item would get about half its people and everything, the parent page included, would finish later, as the cost of delay lesson warned. Availability enters Now next week, when the pin fix engineer is free, and reaches its full two engineers in three weeks, when the parent page ships. Instalments stays in Next: until the partner signs, nobody can build it. The principle: Now describes where people are working, so it is bounded by capacity; a Now column longer than the team is a Gantt chart without the dates.
