In the video's opening story, Priya hands the hostel app's prototype to 100 students and watches them use it. Later, the video's roadmap chapter advises tests with five to seven users. Jakob Nielsen's answer is closer to the second number, and the reason is arithmetic.

## Why five

Nielsen and Tom Landauer's 1993 model: if one user reveals a share L of a design's usability problems, n users reveal about 1 - (1 - L)^n. Across their projects L averaged 31%:

```text
users   share of problems found
1       1 - 0.69        = 31%
3       1 - 0.69^3      = 1 - 0.329 = 67%
5       1 - 0.69^5      = 1 - 0.156 = 84%
10      1 - 0.69^10     = 1 - 0.024 = 98%
15      1 - 0.69^15     = 1 - 0.004 = 99.6%
```

Nielsen rounds five users to about 85%. Each new user mostly repeats what earlier ones showed. In "Why You Only Need to Test with 5 Users" (2000), he draws the conclusion most people skip: with budget for 15 users, run three studies of 5, fixing the design between them, not one of 15. Later rounds test the fixes and find problems the big ones were hiding. For distinct user groups, test 3 to 4 users from each.

Priya's 100 students would mostly repeat the first ten.

## Running a session

A usability test gives someone a realistic task and watches them attempt it. A Roost session on the new request form prototype:

```text
Setup:   "We're testing the app, not you. Think aloud as you go:
          say what you're looking for and what you expect."
Task 1:  "You like this PG near your college, ₹9,000 a month.
          Ask the owner to hold it for you from 1 July."
Task 2:  "Your mother wants to see it before you commit.
          Get it to her."
Rules:   Do not help. Do not explain the screen.
         If asked "should I tap this?", reply "what would you expect?"
Record:  pauses, misreadings, stated expectations, completion.
```

Think-aloud is the core technique; Nielsen called it the number one usability tool (2012). It has costs: talking while working is unnatural, and a facilitator who prompts too much steers the user. Above all, watch rather than ask. "Would you use this?" invites the polite answers the lesson on why people lie warned about; a student hesitating twelve seconds over a button tells you more.

Round one, five students, produced this:

| Finding                                            | Students |
| -------------------------------------------------- | -------- |
| Thought "Send request" would charge them           | 4 of 5   |
| Could not find how to share the room with a parent | 3 of 5   |
| Read the move-in date as a viewing date            | 1 of 5   |

Four of five is a finding, not a statistic. The designer relabeled the button "Ask owner to hold (no payment yet)", added a "Send to parent" link, and round two tested both.

The roadmap chapter names Maze and UsabilityHub (renamed Lyssna in October 2023) for remote tests.

## What five users cannot do

The 31% is an average, not a constant: Laura Faulkner (2003) found groups of five catching anywhere from about 55% to nearly all problems. Five users say nothing about tasks you did not set or groups you did not recruit, and Roost's parents are not students.

Above all, five users cannot give you a number. Finding problems is qualitative; measuring a success rate is quantitative and needs far more: Nielsen long advised at least 20 users, and NN/g's 2021 guidance is about 40. Report "4 of 5 thought they would be charged", never "80% of students".

## Predict, then verify

You have budget for 15 sessions over three weeks before admissions season. The founder wants to tell the board what share of students can finish the new form, so he asks for one study of 15 students. What do you run?

Answer: three rounds of five, fixing between rounds, with parents in the sample, and no percentage for the board. One round of 15 finds about what five would, shows the same broken button ten more times, and leaves no time to test fixes. Parents are a distinct group, so put two or three in round one. And 15 users cannot support a completion rate: if 12 of 15 finish, the 95% confidence interval runs from about 55% to 93%. Give the board the problems found and fixed. The principle: small tests are for finding problems, repeated; numbers need large samples.
