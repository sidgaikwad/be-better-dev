In April, Roost's founder tells an investor the team is "fully agile": two-week sprints, a standup at ten every morning, a Jira board. Now look at what students have seen. Since January the team has run seven sprints, and users have received one release, on 1 February. The next is planned for 1 June and holds five features. One of them, the parent page, has been finished since March. Off-season, about 560 bookings happen a week, and every one of them happens without it.

The team has the rhythm of agile and none of its point.

## What the manifesto says

On 11 to 13 February 2001, seventeen people met at The Lodge at Snowbird, a ski resort in Utah. They came from Extreme Programming, Scrum, DSDM, Crystal and other methods, and agreed not on a process but on four values, lightly paraphrased here:

- Individuals and interactions over processes and tools
- Working software over exhaustive documentation
- Customer collaboration over contract negotiation
- Responding to change over following a plan

The word that matters is "over". The manifesto's closing line says the items on the right have value; the items on the left are valued more. It does not say "no plan" or "no documents". A PRD is fine. A PRD that is treated as a contract nobody may revisit is the problem.

Twelve principles follow. Five do most of the work for a PM:

- The highest priority is satisfying the customer through early and continuous delivery of valuable software.
- Deliver working software frequently, every couple of weeks to couple of months, preferring the shorter end.
- Business people and developers work together daily.
- Working software is the primary measure of progress.
- Simplicity, the art of maximizing the work not done, is essential.

Run Roost's practice against them:

| Roost's practice                    | Principle                          | Verdict                          |
| ----------------------------------- | ---------------------------------- | -------------------------------- |
| Two-week sprints                    | Deliver frequently                 | A rhythm, but nothing ships      |
| Five features held for June         | Early, continuous delivery         | Violated                         |
| Progress reported as tickets closed | Working software measures progress | Violated                         |
| Daily standup                       | Business and developers together   | Partly: operations never attends |

## What it does not say

The manifesto never mentions sprints, standups, story points, velocity, Scrum Masters or boards. Those come from specific methods, mostly Scrum and Extreme Programming; the next lesson covers Scrum. "Agile" became the umbrella word, then a label a company could adopt by installing ceremonies without changing when software reaches users.

Some of its authors noticed. Dave Thomas, one of the seventeen, wrote "Agile is Dead (Long Live Agility)" on 4 March 2014, arguing that consultants had turned the word into a product. His replacement is four steps: find out where you are, take a small step toward your goal, adjust your understanding based on what you learned, and repeat. The loop only turns when the small step reaches someone who can react to it.

The course's video puts it the same way in its opening story. every week Priya's team "launched something small, tested it, improved it", and the instructor calls that the core of agile: learning and improving constantly. The video also has Priya running the daily standups, which is where many teams stop. The meeting is the easy part to copy. The weekly release is the part that matters.

## Predict, then verify

The parent page has been done since March. An engineer says a feature flag to release it in Pune alone would take one engineer-day. Marketing objects: they want one big "new Roost" launch on 1 June with all five features, and releasing one early spoils the story. Pune makes about 31% of Roost's bookings, roughly 175 a week in the off-season. Do you release now or hold for June?

Answer: release now, in Pune, behind the flag. Eight weeks until June is about 8 x 175 = 1,400 Pune bookings whose parents could use the page, and each one tells you whether parents open it, share it, and pay faster. Holding it buys a bigger launch story and learns nothing, and marketing can still run the June campaign: a launch is a message, not a deploy. The cost is one engineer-day. The principle is the manifesto's own: working software in users' hands is the measure of progress, and a finished feature on a branch is inventory, not progress.
