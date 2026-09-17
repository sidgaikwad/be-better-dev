The service can sign a subscriber up, confirm them, and report its failures cleanly. What it cannot do is the one thing it exists for: send an issue of the newsletter to anybody. Chapter 9 starts that feature at the requirement, and the requirement turns out to be broken.

## Stories are not set in stone

The getting-started section pinned the scope with three user stories. The author's story read: as the blog author, I want to send an email to all my subscribers, so that I can notify them when new content is published. Read it again with the confirmation-email section in mind and it breaks on one word: _subscribers_. Since the double-opt-in work, the `subscriptions` table holds two populations, `status = 'pending_confirmation'` and `status = 'confirmed'`. Which of them receives the issue? The story cannot answer. It was written before the distinction existed.

The book's advice is to make a habit of revisiting user stories throughout a project's lifecycle. Time spent working on a problem deepens your understanding of its domain, and the deepening shows up as sharper language: "confirmed subscriber" is vocabulary the chapter 2 author did not have yet. Fold the sharper language back into the requirement: as the blog author, I want to send an email to all my _confirmed_ subscribers, so that I can notify them when new content is published.

One word changed, and not a cosmetic one. Sending to everyone would email people who never clicked their confirmation link, exactly the outcome the double-opt-in machinery was built to prevent, and the kind of behavior that turns into spam complaints and a burned sender reputation with Postmark. The distinction already lived in the schema; now it lives in the requirement too.

## Slicing it honestly

With the story amended, the chapter declares its implementation strategy up front, and it is deliberately naive:

- read the issue's title and content out of the request body;
- fetch the list of all confirmed subscribers from the database;
- loop over the list, sending one email per subscriber through `EmailClient`.

No authentication in front of the endpoint. No draft or review step. No retries when a send fails, and one email at a time. The book chooses this version knowing all of that, which is what makes it a strategy rather than negligence: the naive implementation will satisfy the functional requirement, pass its integration tests, and its shortcomings will be written down by name at the end of the chapter and become the agenda for the chapters that follow, in priority order. That is what slicing a story honestly means: ship the thin slice, and say out loud what the slice does not include.

There is an engineering argument underneath, not just a pedagogical one. You cannot design retry logic well before you have watched a delivery fail, and you cannot secure an endpoint that does not exist. A running naive version turns "what must a delivery system defend against?" from speculation into observation, so each hardening chapter starts from working code plus one named defect. The opposite approach, designing the authenticated, fault-tolerant, queued system on paper first, tends to defend against the wrong failures. The iteration lesson from the getting-started section made this argument in the abstract; this chapter is the argument executed.

The build starts where the book always starts: not with the handler, but with a test that pins the story's sharpest edge before any delivery code exists.

## Predict, then verify

That first test must assert that unconfirmed subscribers receive nothing. The application under test is a black box reached over HTTP: the test cannot inspect its internals, and "no email was sent" is the absence of an effect. Through what seam can a black-box test observe an absence?

Answer: through the fake Postmark. Since the confirmation-email section, every email the application sends is an HTTP request made by `EmailClient` against a configurable `base_url`, and the test harness points that URL at a local wiremock server. If no request reaches the mock while the test runs, no email left the application, full stop. The next lesson turns that observation into a one-line expectation, `.expect(0)`.
