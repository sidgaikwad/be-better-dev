Roost ships a redesigned search in Pune, with a map view and filters for verified rooms, girls-only PGs and food. A week later, searches per student are up 25%. The designer calls it a hit. But a student who searches more might love the new search or be lost in it, and the number cannot say which.

Google's researchers hit the same wall. In their paper, Kerry Rodden, Hilary Hutchinson and Xin Fu noted that a rise in page views for a feature can mean it is popular, or that a confusing interface has users clicking around to escape. Their answer was HEART, presented at the CHI conference in 2010 and applied to more than 20 Google products.

## Five categories

HEART sits beside what the paper calls PULSE metrics (page views, uptime, latency, seven-day active users, earnings), which track business and technical health but say little directly about the experience. The five HEART categories:

- **Happiness**: attitudes, such as satisfaction or perceived ease, usually from a survey. After an iGoogle redesign, satisfaction dipped and then recovered, which pointed to change aversion, and the team kept the design.
- **Engagement**: frequency, intensity or depth of use, reported per user rather than as a total, since a total rises with user count alone. Gmail used the share of active users who visited on five or more days in the past week, and found it predicted long-term retention.
- **Adoption**: new users of a product or feature in a period.
- **Retention**: users from one period still active in a later one.
- **Task success**: efficiency, effectiveness and error rate. Google Maps tested dropping its separate "what" and "where" search boxes, compared error rates, and found users adapted to the single box.

Not every category fits every product; the paper's point is to decide explicitly. For Roost's search, drop Engagement: in the transaction game from the north star lesson, more searching is a cost.

## Goals, signals, metrics

The paper pairs HEART with a three-step process for filling each category:

1. **Goals**: what the experience should achieve. Do not worry yet about measuring it.
2. **Signals**: what behavior or attitude would show success or failure. Failure is often easier to see, through abandonment or undo.
3. **Metrics**: signals turned into numbers you can track, as ratios, percentages or averages per user. Raw counts climb with growth and mislead.

For Roost's search, with targets set before launch:

| Category     | Goal                                  | Signal                                 | Metric (now, target)                  |
| ------------ | ------------------------------------- | -------------------------------------- | ------------------------------------- |
| Task success | Find a suitable verified room quickly | Searches that end in a saved shortlist | 22% of searches, target 30%           |
| Happiness    | Trust the results                     | Survey: "I trust these listings"       | 48% agree, target 60%                 |
| Adoption     | Use the new filters                   | First use of any filter                | 0%, target 40% of searchers in a week |

Task success comes first because it is closest to the north star: shortlists feed requests, which feed happy move-ins.

HEART has limits. It measures the experience of a product or feature, not the business, so it feeds a north star rather than replacing one. Surveys are slow and noisy, and the paper says to triangulate metrics with usability and field studies. And important actions are often not logged by default, so check that every signal exists in the data before launch.

## Predict, then verify

Two weeks after launch: searches per student rose from 8 to 10, the share of searches ending in a shortlist fell from 22% to 18%, 45% of searchers used a filter, and trust went from 48% to 52% agree on about 400 survey responses. The designer wants to roll out to Bengaluru and Hyderabad. Do you?

Answer: not yet. Shortlists per student went from 8 x 0.22 = 1.76 to 10 x 0.18 = 1.80, essentially flat, so students now search 25% more to reach the same result. That is a task-success regression wearing an engagement costume, the same shape as the Bing puzzle in the metric trees lesson. Adoption at 45% says students want the filters, so keep them, and a 4-point rise in trust is inside the roughly 5-point margin of a 400-response survey. Fix what makes searches fail, starting with filter combinations that return nothing, and expand when the shortlist rate beats 22%. The principle: for a product whose users want to finish, judge a change by task success, not by activity.
