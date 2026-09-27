The trio has three candidate solutions for "my parents won't pay until someone has seen the room": a verification report parents open from a link, a live video tour, and a refund if the room does not match. The tech lead can build the report page in three weeks. Before anyone starts: what has to be true for this to work, and which of those are we least sure of?

## Five kinds of assumption

Teresa Torres sorts the assumptions behind a solution into five types: desirability (people want it and will do what it takes), viability (it is good for the business), feasibility (we can build it, legal and security limits included), usability (people can find, understand and use it), and ethical (it harms no one). The first four refine Cagan's risks from the four risks lesson; ethical is her addition. For the verification report:

```text
Desirability  A parent who reads it will pay without visiting.
Desirability  Students will forward the link to a parent.
Viability     Reports reuse the ₹1,000 verification visit
              already paid for, so they add little cost.
Feasibility   The link opens in WhatsApp without an account.
Usability     A parent can read it on a phone, in English.
Ethical       Photos show no other residents and no owner's family.
```

Torres surfaces assumptions by mapping the steps users would take, by a pre-mortem (imagine the launch failed, and ask why), and by asking of each line in the tree why it should hold.

## Mapping by importance and evidence

David J. Bland's assumptions mapping, from _Testing Business Ideas_ (2019, with Alexander Osterwalder), places each assumption on two axes: how important it is (would the idea die if it were false?) and how much evidence you have. Important with no evidence goes first; Torres uses the same axes.

| Assumption                   | Importance     | Evidence                 |
| ---------------------------- | -------------- | ------------------------ |
| Parent pays without visiting | Fatal if false | 4 interview stories      |
| Student forwards the link    | High           | None                     |
| Link opens in WhatsApp       | Fatal if false | Listing links already do |

The WhatsApp link would be fatal if wrong, but is already proven. Forwarding has no evidence, but Roost can design around it by asking for a parent's number. A parent paying without a visit is fatal and rests on four stories: it goes first.

## The smallest test that could fail

A good test is small, cheap and able to fail. Test the assumption, not the whole solution: nobody needs a report page to learn whether a report changes what parents do.

```text
Assumption  A parent who reads a verification report will pay
            without visiting.
Test        For 2 weeks, operations sends a hand-made PDF from the
            visit on file to the parent of each student who
            requests a Pune listing and agrees: about 40.
Baseline    50% of requests end in a booking: 20 of 40.
Pass        28 or more book (70%), most with no parent visit.
Fail        22 or fewer (55%).
Between     Extend to 80 requests before deciding.
```

The pass line is high on purpose: with 40 requests, chance alone routinely moves the count by three either way and sometimes by six, so only a large jump means anything. And write the lines down before the test runs: a test whose success is defined afterwards always succeeds.

The test costs operations a few hours; if it fails, the three-week build never happens. Run similar tests on the tour and the refund in the same weeks, so the three are compared on evidence, not preference. Tests like this, and the MVPs that grow from them, get their own section later in this part.

## Predict, then verify

The tech lead wants to start the report page now, since a one-day spike proved the WhatsApp link works. The founder wants a survey first: ask 500 parents whether they would pay for a room without visiting if Roost sent a verification report. Which do you run?

Answer: Neither. The survey collects predictions, the fluff of the Mom Test lesson, and 500 hypotheticals are no better than 5. The build rests on the assumption the spike already retired, and spends three weeks before the riskiest one is touched. Run the hand-made report on 40 real requests: two weeks, almost no cost, and it measures what parents do with real money. The principle: test the most important assumption with the least evidence first, with the smallest test that could prove it wrong, and measure behavior, not opinion.
