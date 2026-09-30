Outside the season, Roost gets about 560 bookings a week: 22,000 spread over 39 weeks. In July it gets about 2,000. A fix that saves 1.5% of bookings saves about 8 a week in November and 30 a week in July. Same fix, very different cost of not having it, and no framework so far can see that.

## What waiting costs

Don Reinertsen put the idea at the center of _The Principles of Product Development Flow_ (2009): "If you only quantify one thing, quantify the Cost of Delay." Cost of delay is the value lost for each week something is not live, in money per week.

Divide it by how long the work takes and you get CD3, cost of delay divided by duration, which says what to do first when a team works on one thing at a time. Black Swan Farming's example: three features cost $1,000, $4,000 and $5,000 a week of delay and take 5, 1 and 2 weeks. Done in that order, they rack up $69,000 of delay cost. In CD3 order, the 1-week job, then the 2-week job, then the 5-week one, it is $27,000, 61% less. SAFe adopted the idea as Weighted Shortest Job First (WSJF).

## Roost in peak season

Three items from the RICE lesson, each costed for July at ₹720 commission per booking. The team does one at a time.

```text
Pin fix        about 25 "farther than shown" cancellations a week
               25 x ₹720 = ₹18,000 a week, 1 week
               CD3 = 18,000 / 1 = 18,000
Availability   about 30 bookings a week saved
               30 x ₹720 = ₹21,600 a week, 3 weeks
               CD3 = 21,600 / 3 = 7,200
Instalments    about 2% more bookings, 40 a week
               40 x ₹720 = ₹28,800 a week, 6 weeks
               CD3 = 28,800 / 6 = 4,800
```

RICE put availability first. CD3 puts the pin fix first, because one week of work stops ₹18,000 a week of loss. The total delay cost of an order adds up what is still waiting during each job; all three together cost 18,000 + 21,600 + 28,800 = ₹68,400 a week:

```text
RICE order: availability, pin fix, instalments
  3 weeks x ₹68,400 = ₹205,200
  1 week  x ₹46,800 =  ₹46,800
  6 weeks x ₹28,800 = ₹172,800     total ₹424,800
CD3 order: pin fix, availability, instalments
  1 week  x ₹68,400 =  ₹68,400
  3 weeks x ₹50,400 = ₹151,200
  6 weeks x ₹28,800 = ₹172,800     total ₹392,400
```

CD3 saves ₹32,400. Starting with the biggest item, instalments, then the pin fix, then availability, costs 6 x ₹68,400 + 1 x ₹39,600 + 3 x ₹21,600 = ₹514,800, which is ₹122,400 more than the CD3 order.

## Where it breaks

The weekly figures are estimates, often rougher than RICE's inputs, and they move with the calendar: every figure above is about 3.5 times smaller in November. SAFe's WSJF replaces money with relative scores: user and business value, plus time criticality, plus risk reduction or opportunity enablement, divided by job size. That is faster to agree on but gives up Reinertsen's units, so nobody can say what a week actually costs. Both versions favor short jobs, so a large strategic bet can wait forever behind a stream of small ones; decide how much capacity the bet gets before sorting the rest. And CD3 assumes one job at a time. Five engineers split three ways finish everything later.

## Predict, then verify

It is 1 July. The pin fix has shipped. Availability confirmation is half done, with 1.5 weeks left. A payment bug appears: 3% of bookings fail at payment and never return, 60 a week, or ₹43,200 a week. The fix takes 2 weeks. The tech lead wants to finish availability first, since it is half built. What do you do?

Answer: Switch to the payment bug. CD3 uses the work that remains, not the work already done: availability now scores 21,600 / 1.5 = 14,400, the payment fix 43,200 / 2 = 21,600. Availability first costs 1.5 x ₹64,800 + 2 x ₹43,200 = ₹97,200 + ₹86,400 = ₹183,600. The payment fix first costs 2 x ₹64,800 + 1.5 x ₹21,600 = ₹129,600 + ₹32,400 = ₹162,000, saving ₹21,600. Even if putting availability down costs half a week of lost context, that adds only 0.5 x ₹21,600 = ₹10,800, and switching still wins. The principle: order by cost of delay over remaining duration; work already done is sunk and earns no place in the queue.
