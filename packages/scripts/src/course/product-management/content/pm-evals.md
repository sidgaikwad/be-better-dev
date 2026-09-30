Engineers changed the "Ask this listing" prompt three times in a week. Each time someone tried ten questions and declared it better, and nobody could say whether guessing had gone down. That is a vibe check.

An eval replaces it: real inputs, a written definition of a good output, and a pass-or-fail check for each. For a probabilistic feature the eval set is the working spec. A PRD says "answers must be accurate"; the eval says what accurate means, case by case.

## Read the traces first

The most cited method comes from Hamel Husain and Shreya Shankar (a course, and a public FAQ updated September 2026). It starts with reading:

1. Log full traces: question, record seen, answer.
2. A domain expert reads at least 30, aiming for about 100, noting anything wrong in free text (open coding).
3. Group the notes into failure categories and count them (axial coding).

Roost's operations lead, who knows these properties, read 100 pilot traces:

| Failure                                   | Traces |
| ----------------------------------------- | ------ |
| Guessed when the record was silent        | 5      |
| Quoted rent without deposit or charges    | 4      |
| Contradicted the record                   | 2      |
| Replied in English to a question in Hindi | 2      |
| Total failing                             | 13     |

The pilot's right-or-wrong label caught 4 (the contradictions and 2 guesses): the previous lesson's 4%. The other 9 were not false, yet were failures.

## One binary check per failure

```text
Eval spec: Ask this listing, v1
Owner of "good": operations lead. Owner of the spec: PM.
1. Amounts   Every rupee amount in the answer is in the record. (code)
2. Total     A cost question gets the total due at booking. (code)
3. Gaps      If the record does not answer it, the reply says so
             and offers to ask the owner. (LLM judge)
4. Language  The reply uses the language of the question. (code)
Launch bar: 100% on 1, 98% on 2 to 4, over 400 held-out questions.
```

Each check is pass or fail, not a 1-to-5 score. Husain and Shankar argue that binary labels force a clear definition: nobody knows what separates a 3 from a 4 on "helpfulness", and graders hide doubt in the middle. Use code where a rule is mechanical, a judge model only where it takes judgment.

A judge is a model too, so validate it. The lead labels 120 traces for check 3: 30 fail, 90 pass. The judge catches 24 of the 30 (true positive rate 80%) and passes 81 of the 90 (true negative rate 90%). In production it flags 1,500 of 12,000 monthly answers, 12.5%. The real guessing rate f solves:

```text
0.80 f + 0.10 (1 - f) = 0.125
0.70 f = 0.125 - 0.10 = 0.025
f = 0.025 / 0.70 = 3.6%, about 430 real guesses a month
```

Raw, the judge overstates the problem 3.5 times.

## Why the PM owns what good means

Whether "let me ask the owner" beats a careful guess is a product decision, so the PM writes the spec and one domain expert, whom Husain and Shankar call a benevolent dictator, has the final word on labels. Shankar and colleagues' 2024 paper "Who Validates the Validators?" found that people refine their criteria while grading outputs.

Metrics stay proxies. On April 25, 2025, OpenAI shipped a GPT-4o update that added a reward signal from users' thumbs-up and thumbs-down. Offline evals looked good, A/B tests showed users liked it, and some expert testers said it felt slightly off. It shipped, proved sycophantic, and was rolled back days later. OpenAI then said behavior problems would block launches even when metrics look positive.

## Predict, then verify

Prompt v2 raises the judge's pass rate on check 3 from 91% to 97%. The operations lead reads 30 v2 traces: it now offers to ask the owner even when the record answers the question, such as whether the room has wifi. Do you ship v2?

Answer: no. Check 3 only punishes guessing, and v2 found the cheap way to pass: hand everything off. Each needless handoff sends a student to wait on an owner. Add the paired check, "if the record answers it, the reply answers it", and ship only when both clear the bar. The principle: a check that can be passed by refusing will be, so pair each check with its opposite, and when the expert's reading disagrees with a metric, trust the reading until the eval is fixed.
