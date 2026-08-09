Most curricula pick topics first and invent examples to fit them. The book flips that hierarchy and names the flip: problem-based learning. Choose a problem, then let the problem drive which concepts get introduced, and when. Material earns its place by being useful for the solution, and you learn each technique together with the situation that calls for it. Part 1 kept borrowing newsletter examples for exactly this reason; from here on the newsletter is not an example, it is the work.

## Choosing the problem

The book's criteria for a driving example: it must be small enough to build in one book without cutting corners, complex enough to surface most of the themes that appear in bigger systems, and interesting enough to keep you going.

The pick is an email newsletter service. Not a MailChimp competitor: dozens of companies sell email-list products, and cloning one would mean applying the same techniques over and over across a feature list no book can hold. The target user is narrower: a blog author who wants a subscription page on their blog. Everything that person needs, nothing more.

## Requirements as user stories

"A newsletter service for blog authors" still leaves too much room. The book pins the scope with user stories, the standard agile format: as a (who), I want to (action), so that (motive). The service will fulfil three.

- As a blog visitor, I want to subscribe to the newsletter, so that I receive email updates when new content lands on the blog.
- As the blog author, I want to send an email to all my subscribers, so that I can notify them when new content is published.
- As a subscriber, I want to unsubscribe, so that the updates stop.

Three sentences carry the who, the what, and the why. Just as load-bearing is the explicit not-list: no managing multiple newsletters, no segmenting subscribers into audiences, no open or click tracking. Barebone, and still enough for most blog authors.

## Working in iterations

Zoom into the author's story and questions multiply. How do we know the caller actually is the blog author: does that imply authentication? HTML email or plain text? What happens when delivery fails halfway through the list?

The trap the book names: spend months building a superb delivery engine, with retries and templates and scheduling, and no subscribe or unsubscribe. You would be best in class at sending email and have zero users, because nobody can complete the full journey.

The strategy instead: make the first release satisfy all three stories to an extent. Thin, plain-text, trusting, but complete. Then loop back and improve: a confirmation email for new subscribers, fault tolerance and retries for delivery. Each iteration takes a fixed amount of time and ships a slightly better product.

The distinction that keeps this honest: iterate on product features, not on engineering quality. However small the feature, each iteration's code is tested, documented, production-grade, because it deploys to production when the iteration ends. Scope is the corner you cut; quality never is.

## Where each story goes

The stories map directly onto the API this track builds:

```text
POST /subscriptions   story one   Sign up a new subscriber (ch. 3)
POST /newsletters     story two   Newsletter delivery (ch. 9)
```

Story one gains its confirmation flow in "Confirmation emails (ch. 7)". Story two gets locked behind a login in "Securing the API (ch. 10)" and rebuilt crash-safe in "Fault-tolerant workflows (ch. 11)". Story three rides the same tokenized one-click-link machinery the confirmation flow builds. Three sentences of requirements, eleven sections of consequences.

## Predict, then verify

You have one month. Plan A: a polished delivery system, no subscribe or unsubscribe. Plan B: a thin, plain-text slice of all three stories. Which does the book's strategy choose, and what does month two look like?

Answer: B. At the end of month one a real blog author can adopt the service: visitors subscribe, issues go out, unsubscribing works. Month two improves the weakest slice, say confirmation emails or delivery retries, guided by actual use. Plan A ships something nobody can adopt, so month two is spent guessing. Iteration only compounds when every release is usable end to end.
