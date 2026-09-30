In the video's live class, the instructor types out about twenty features for the customer side of a food delivery app: login with a mobile number, address and location capture, payments, restaurant listings, offers and coupons, filters, menus, ratings and reviews, delivery tracking, calling the restaurant or support, scheduled orders, order history, push notifications, subscriptions, multiple languages, advertising, contactless delivery, recommendations, a chatbot, and pickup. The only context he gives: this is version one, built from scratch. Then he asks the class to mark each feature must, should, could or won't.

The result, in his word, is chaos. People rated from their own experience, so whatever annoyed them last week became a must. With no context, there was nothing to be right about.

## Priority is a property of the situation

His fix is to go back up the chain before touching the list. Why build another food delivery app at all? Who is it for? What do competitors already offer, where is the gap, and what will make this one different? He proposes a gap: the market has plenty of apps tied to huge restaurant catalogues, and few that get you food in under 15 minutes. Once that sentence is written down, the same list sorts itself differently. One way it could go:

| Feature                    | No context | Food in under 15 minutes            |
| -------------------------- | ---------- | ----------------------------------- |
| Delivery tracking          | Should     | Must: the promise is a time         |
| Scheduled orders           | Should     | Won't: the promise is now           |
| Filters across restaurants | Must       | Could: only nearby kitchens qualify |
| Recommendations            | Could      | Won't, this time                    |
| Login, location, payment   | Must       | Must                                |

The basics stay musts under any strategy. The differentiators become musts because of this one. Everything else is ranked by how much it serves the promise.

His sharpest example is search. The class treated product search as an obvious must for an e-commerce app, and he asked how many products the store has. With 10 to 20, one scrolling page shows everything and search adds nothing. Past about 5,000, search is essential. The feature did not change; the product's situation did. "Every app has search, so we should too" is exactly the reasoning that produced the chaos.

## Tools are the small part

The instructor puts it bluntly: knowing tools is less than 5% of the job. A company that uses Mixpanel will not reject you for knowing Google Analytics instead. It will judge whether you think clearly about the product.

That applies to the rest of this section. MoSCoW, RICE, the value and effort matrix and cost of delay all compare items on some notion of value against some notion of cost. None of them says what value means. Strategy does. The strategy cascade lesson traced every ticket upward to a goal; a prioritization framework is what you run after that trace, to order the items that survived it. Run it before, and it ranks the chaos with more decimal places.

In practice, write three lines at the top of any prioritization sheet before scoring anything: the goal the work serves this period, the strategy's guiding policy, and what the product will not do. Anyone who disagrees with a score can then argue with the line above it, which is where most disagreements actually live.

## Predict, then verify

A rival app lists about 3,000 rooms per city and offers a filter panel with 40 amenities. A board member wants Roost to match it this season, which would take about six engineer-weeks. Roost has about 1,200 verified properties across three cities, and its search has four filters: rent, distance, gender and meals. A student searching near one campus within budget typically sees around 40 rooms. Roost's guiding policy is to compete on the truth of each listing, not on listing count. Do you build the filter panel?

Answer: No, not this season. Forty rooms is the instructor's store with 20 products: a student can scroll the whole list in a minute, so 40 amenity filters add effort without adding choice. The rival needs filters because its strategy produces volume. Roost's strategy produces fewer rooms that are exactly as described, and six engineer-weeks are better spent making each listing more trustworthy. Revisit it when results near a single campus grow into the hundreds. The principle: a feature's priority comes from the product's situation and strategy, never from the fact that other products have it.
