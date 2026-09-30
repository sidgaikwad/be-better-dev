One line in Roost's instalments PRD read: "The app must support parents as payers." Three people read it three ways: an engineer built a parent login into the student's account, the designer drew a payment link the student forwards on WhatsApp, and operations told owners that parents could pay in cash at the property. The designer's was the one intended; undoing the other two cost nine engineer-days and forty awkward calls to owners. Nobody misread: "support" allowed all three.

## Words that cause rework

Some words feel precise to the writer and mean nothing to the reader: "support", "fast", "simple", "handle", "all users". Each lets every reader fill the gap with what they expected. The fix is mechanical. Replace an adjective with a number, and a verb like "support" with who does what, where:

| Vague                     | Readers heard              | Rewrite                                                                    |
| ------------------------- | -------------------------- | -------------------------------------------------------------------------- |
| support parents as payers | parent login; a link; cash | A parent pays from a link the student sends, with no Roost account         |
| fast approval             | instant; same day          | The partner decides within 24 hours, weekends included                     |
| simple application        | few screens; no documents  | At most 6 fields, no uploads, median under 3 minutes in the prototype test |

The test comes from the requirements lesson: could someone not in the room check it?

## Same facts, different readers

The video makes the audience point twice. With a CPO or CEO, an instructor says, a RICE table is too much detail; they want business value and its justification. And the template the video attributes to Uber should give engineers technical clarity and business stakeholders a way to measure success. That is right, with one rule to add: change the order and the depth for each reader, never the facts. Engineers get requirements, edge cases and dependencies; the founder gets a page that starts with the decision:

```text
To: founder                       Decide by: 3 April
Decision: sign the lending partner, with a surge clause.
Why: the ₹27,000 due before move-in is where many of our
  8,000 monthly requests fail. Target: request-to-booking
  from 50% to 54%.
Cost: owners pay the partner's 4% fee (₹1,080 a booking).
  Roost keeps its ₹720 commission.
Risk: the partner has never approved more than 40 a day.
  A good June could need 75. Pune soft launch in May first.
```

Both documents say 40 a day. A founder's page saying "the partner can scale" would state a different fact, and June's argument would be about who was told what.

## Narrative instead of slides

On 9 June 2004, Jeff Bezos emailed Amazon's senior team that PowerPoint presentations were over at their meetings. His reasoning: a good four-page memo is harder to write than a 20-page deck, because a narrative forces you to show what matters more and how ideas connect, while slides "flatten out any sense of relative importance". His 2017 shareholder letter describes the result: six-page narrative memos, read silently at the start of each meeting in "a kind of study hall". A great memo, he wrote, should probably take a week or more.

A team Roost's size cannot spend a week per decision, so copy the two cheap parts. Choose length by the weight of the decision: a one-pager for anything reversible, a full PRD for a build, a narrative for a bet like a new city. And read together. A pre-read sent the night before is skimmed at best; ten silent minutes at the start means everyone argues from the same page.

## Predict, then verify

The partner decision is on Thursday, in a 20-minute slot. The founder asks for "ten slides, I don't have time to read". The PRD runs nine pages. You could build the deck, send the PRD, or bring the memo above and ask for five minutes of silent reading. What do you bring?

Answer: the memo, read in the room. Five minutes of reading leaves fifteen for the argument, and the argument is one relationship: June could need 75 approvals a day from a partner that has done 40. In a deck it becomes one bullet on slide seven, weighted like the partner's logo: Bezos's flattened importance. The nine-page PRD fails the other way, with the decision buried on page six. Offer slides made from the memo afterwards if the founder still wants them. The principle: write for the decision the reader has to make, and make the reading part of the meeting.
