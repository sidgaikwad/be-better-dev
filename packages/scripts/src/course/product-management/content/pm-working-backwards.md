Roost's first try at a press release for instalments began: "Roost partners with a leading lender to launch instalment payments." Read it as a parent in Nagpur whose daughter has just got into a Pune college. Who is it for, what does it cost, what changes for her? The sentence is about Roost, and nobody outside the company would read past it.

Amazon's working backwards method forces that question early. Colin Bryar and Bill Carr, both former Amazon executives, describe it in _Working Backwards_ (2021): before building anything, the team writes the press release it would publish on launch day, then frequently asked questions. Amazon has used this PR/FAQ since about 2004.

## The press release

The format has fixed parts: a heading naming the product, a subheading with the customer and what they get, a summary with the city and a launch date the team actually expects, the problem from the customer's side, the solution and why it beats what they do today, quotes from the company and a hypothetical customer, and how to get started. It fits on less than a page. The second draft, shortened:

```text
Families can now pay Roost's move-in cost in 3 parts
Parents of students moving to Pune and Bengaluru can pay
the ₹27,000 due before move-in over 60 days, at no extra
cost when each part is paid on time.

PUNE and BENGALURU, 1 June. Families booking a verified room on Roost
can now split the first month's rent and the deposit into
3 payments of ₹9,000: today, in 30 days and in 60 days.

Problem: owners want a month's rent and a two-month deposit
before move-in, and ₹27,000 at once is the hardest part of
the move for many families.

Solution: choose "Pay in 3 parts" at checkout. Our lending
partner decides within hours and pays the owner in full,
so the room is confirmed that day.

"I found the room in a day. The deposit took my parents a
month," says a student. (hypothetical)
Getting started: pick a room marked "3 parts"; the payer
needs a PAN.
```

## The FAQ

The external FAQ answers what a customer or journalist would ask: what does it cost, who can apply, what if a payment is late or we cancel before move-in. The internal FAQ answers what leadership would ask: who pays the lender (the owner, as the four risks lesson proposed, so Roost keeps its ₹720 commission), how many applications the partner can approve in a day, what it adds to support, why now. The whole document runs about six pages.

Notice what the draft has already decided: one payer, the family; one amount, the ₹27,000; one promise, no extra cost, which holds only because the internal FAQ settled who pays; and one exclusion, no PAN, no application. All of it weeks before an engineer wrote code.

## Why it is cheap, and where it breaks

Bryar's argument is cost: iterating on a press release is far cheaper than iterating on the product. At a review it is read in silence for 15 to 20 minutes, then argued over. Most PR/FAQs he saw at Amazon never became products, which he calls a feature, not a bug.

Two limits. It is still the team's opinion: colleagues finding it exciting is not evidence that parents will choose it, so it sits beside interviews and prototype tests rather than replacing them. And it fits new, customer-facing products. A bug fix has no launch-day story, and forcing one produces marketing copy. The PR/FAQ decides whether and what; the PRD then specifies how.

## Predict, then verify

The team argues over the heading. The three students who raised instalments all spoke of monthly rent, so the founder wants "Students can now pay their rent in parts": ₹9,000 a month as three payments of ₹3,000. The PM's draft says the move-in cost: ₹27,000 once, before booking. The season's goal is request-to-booking, now 50%. Which heading goes to review?

Answer: the move-in cost. Working backwards starts from the moment the problem stops the customer, not from their words. The ₹27,000 is three times a month's rent and falls before the booking, where half of all requests are lost. Monthly rent in parts helps a student who has already moved in, so it cannot change whether a family books. The students' words were a solution in disguise, as the voice of customer section warned. The principle: write the press release for the decision you need the customer to make.
