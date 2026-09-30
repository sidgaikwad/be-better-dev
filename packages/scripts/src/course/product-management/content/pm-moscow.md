Roost's pre-season release has six weeks and five engineers: 30 engineer-weeks. The planning sheet has twelve items, and when each person marks their own, eight come back Must. The Musts alone are estimated at 41 engineer-weeks. MoSCoW is meant to prevent this, and as most teams use it, it cannot.

## Where it comes from

Dai Clegg devised MoSCoW at Oracle UK in 1994, for rapid application development projects where the deadline was fixed and scope had to give. DSDM, an agile method now maintained by the Agile Business Consortium, adopted it and still publishes the standard definitions:

- **Must have**: the Minimum Usable SubseT, which the project guarantees to deliver. The acronym is the point.
- **Should have**: important but not vital. The solution still works without it, perhaps with a painful workaround.
- **Could have**: wanted, but with less impact if left out.
- **Won't have this time**: agreed as out of scope for this timeframe. Not never; not now.

The video's examples come from an e-commerce app. Registration and login are musts. Reviews and ratings, and a wish list, are shoulds: useful, but the app functions without them. Social sharing and extra payment options such as Apple Pay or buy now, pay later are coulds, after the basic cards and UPI. Augmented-reality product previews are a won't. Its definitions match DSDM's; it leaves out the rule that makes the method work.

## The 60% rule

DSDM advises that Musts take no more than 60% of the effort in a timebox, and that about 20% be Coulds. The Coulds are contingency: when an estimate slips, they are dropped, and the Musts stay safe. For Roost's window:

```text
Capacity           5 engineers x 6 weeks = 30 engineer-weeks
Musts, at most     30 x 0.60 = 18 engineer-weeks
Coulds, about      30 x 0.20 = 6 engineer-weeks
Shoulds            whatever the Musts and Coulds leave
Musts as marked    41 engineer-weeks, 137% of capacity
```

A plan with 137% of its capacity in Musts has no Musts in the DSDM sense. It has a list of hopes and a guarantee that something promised will not ship. The consortium warns that Must effort above 60% risks failure unless estimates are accurate, the approach is well understood and the team is proven.

## Forcing real Musts

The consortium's test is a question: what happens if this is not delivered? If the honest answer is that there would be no point going ahead, it is a Must. If there is a workaround, however clumsy, it is a Should. Asked of Roost's eight:

- Payment reliability fixes (6 weeks): without them, bookings fail. Must.
- Map pin fix (2 weeks): without it, listings keep showing false distances, which breaks the one promise Roost makes. Must.
- Parent page (7 weeks): today students forward screenshots to their parents. Clumsy, but it works. Should.
- Weekly availability confirmation (8 weeks): operations can phone the owners of the most-requested listings each week. Should.

The other four have workarounds too and drop to Could or Won't this time. The Musts shrink to 8 engineer-weeks, 27% of capacity, and the Shoulds become a real plan instead of a casualty list. A Should is expected to ship, just not guaranteed.

Two failures remain. MoSCoW does not rank inside a category, so a pile of Shoulds still needs ordering by something else, which is where scoring comes in. And "Won't" gets read as "never", so people fight to keep their item out of it. Writing "won't have this time" in full, with a date to revisit, takes the heat out.

## Predict, then verify

After the test, Roost's plan is Musts 8 engineer-weeks, Shoulds 15 (the parent page and availability confirmation), and Coulds 7. In week 3, the payment fixes turn out to need 10 weeks, not 6. The founder asks to keep everything and push the release back two weeks, which puts it after 1 June. What do you do?

Answer: Keep the date and drop Coulds. The Musts grow from 8 to 12 engineer-weeks, 4 more. The 7 weeks of Coulds absorb that with 3 to spare, and both Shoulds survive intact, which is what the 20% contingency is for. Moving the date costs more than it saves: bookings arrive from June to August, and a pre-season release that lands in mid-June misses the weeks it was built for. The principle: in a timebox, scope moves and the date does not, and the Coulds are the slack that keeps the Musts a guarantee.
