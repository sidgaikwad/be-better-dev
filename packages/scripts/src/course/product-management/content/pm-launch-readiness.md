On October 6, 2014, Flipkart ran its first Big Billion Day sale and, by the widely reported figure, sold about US$100 million of goods in ten hours. It also buckled. From the 8 a.m. start shoppers could not add items to their carts, prices showed wrongly, popular products sold out and orders were cancelled. The next day the founders, Sachin and Binny Bansal, emailed customers to apologise for promises they had not kept.

The course's instructor tells this story, and also recalls Hotstar going down when it first streamed the IPL. That one could not be confirmed, so treat it as his memory. His point stands on Flipkart alone: "We all plan for failure but often we kind of forget to plan for success." The sale worked. Its success is what broke it.

Even a careful worst case can miss. For Pokémon GO's July 2016 launch, Niantic and Google planned for a traffic target with a worst case of five times it. Within 15 minutes of launching in Australia and New Zealand, traffic passed expectations; it reached 50 times the target, ten times the worst case, Google's reliability team later wrote.

## Size for the success case

A readiness plan sizes each constraint for the expected case and a success case, here the campaign working twice as well as forecast. For Roost's June instalment campaign:

| Constraint                    | Expected | Success case | Limit today                  |
| ----------------------------- | -------- | ------------ | ---------------------------- |
| Approvals per peak day        | 150      | 300          | 200, agreed with the partner |
| Support tickets per day       | 40       | 80           | 40, two people               |
| Beds wanted near top campuses | 1,000    | 2,000        | 1,300 free                   |

In the expected case nothing breaks, which is why a forecast-only plan looks fine. In the success case all three break, and the last one is Roost's version of Flipkart's stock-outs. In a marketplace the inventory is the other side: students arriving from a campaign to find the good rooms full is a failed launch even if every server stays up.

Agree a response to each break before launch. Ask the partner for a surge limit, or queue applications with an honest time estimate. Line up temporary support. Have operations verify more properties near the top campuses in May, and show "fully booked" plainly with a waitlist. Then decide who watches the guardrail dashboard, and when.

## Planning for failure too

The video's other half is crisis management: known risks, prepared responses, and a named rapid response team. The artifact is short:

```text
CRISIS PLAN: instalment campaign, launch fortnight
Rapid response team: PM (decides), on-call backend engineer,
  operations lead, marketing lead
Severity 1, payments failing or taken twice:
  flag off within 15 minutes, pause ads, message affected families
Severity 2, approvals slower than 24 hours:
  pause ad spend, tell waiting families the real time
Severity 3, copy or layout bugs: fix in the normal cycle
Pre-written messages: payment failure, delay, feature paused
Rule: when in doubt, flag off first and investigate second
```

The cheapest lever in both plans is on the demand side. Flipkart's traffic came from its own marketing, and a campaign you schedule is demand you can pace: pause the ads, hold the next phase, open a waitlist. Degrading on purpose beats crashing by accident.

## Predict, then verify

One support person answers about 20 tickets a day, so the expected case needs two people, whom operations can spare, and the success case four. Two temporary agents cost ₹30,000 a month each, so ₹30,000 for the fortnight. Finance says to staff for the forecast. What do you decide?

Answer: staff for the success case. Roost earns 8% of the first month's rent, 8% of ₹9,000 = ₹720 per booking, so the agents pay for themselves if they save ₹30,000 / ₹720 = about 42 bookings. In the success case 40 tickets a day go unanswered (80 arrive, 40 are answered), which is 40 x 14 = 560 over the fortnight. If one family in ten gives up and books elsewhere, that is 56 lost bookings, 56 x ₹720 = ₹40,320, more than the agents cost, before counting lost trust. If the success case never comes, you are out ₹30,000. If it comes and you are short, the loss is larger and public. The principle: when a shortfall costs more than spare capacity and the moment will not come again, buy the capacity. The admissions season does not rerun.
