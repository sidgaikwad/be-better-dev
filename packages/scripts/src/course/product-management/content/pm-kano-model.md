Roost asked 200 students to rate eight planned features from 1 (not important) to 5 (very important). Every feature scored between 4.1 and 4.6. When saying so costs nothing, people call everything important. Worse, the survey assumed every feature moves satisfaction the same way.

## Five shapes of satisfaction

Noriaki Kano and three colleagues published "Attractive Quality and Must-Be Quality" in 1984, in the journal of the Japanese Society for Quality Control. Satisfaction, they argued, is not one line from bad to good. Features move it in different shapes:

- **Must-be:** expected. Having it earns no praise; missing it causes real anger.
- **One-dimensional** (often called performance): the better you deliver, the happier people are.
- **Attractive:** unexpected. Present, it delights; absent, nobody complains.
- **Indifferent:** nobody cares either way.
- **Reverse:** some people are happier without it.

The course's instructor applies this to a streaming service: playback is must-be, HD is performance, offline downloads are attractive, custom themes indifferent, and autoplaying the next video reverse for some users, though on a music app autoplay delights. His own reverse example is the stack of pop-ups many sites open with: a cookie banner, then a coupon, then a sign-up box. The video presents Kano as a labelling list like MoSCoW; Kano's version is a measurement method, and the method is the useful part.

## The question pair

For each feature, ask two questions, each with the same five answers: I like it, I expect it, I am neutral, I can live with it, I dislike it.

```text
Functional:    If Roost shows every charge before you book,
               how do you feel?
Dysfunctional: If Roost does not show every charge before you
               book, how do you feel?
```

Rows are the functional answer, columns the dysfunctional one. A is attractive, O one-dimensional, M must-be, I indifferent, R reverse, Q a contradictory pair.

| Functional | Like | Expect | Neutral | Live with | Dislike |
| ---------- | ---- | ------ | ------- | --------- | ------- |
| Like       | Q    | A      | A       | A         | O       |
| Expect     | R    | I      | I       | I         | M       |
| Neutral    | R    | I      | I       | I         | M       |
| Live with  | R    | I      | I       | I         | M       |
| Dislike    | R    | R      | R       | R         | Q       |

Roost's answers from 200 students:

```text
Every charge shown:  M 104  O 46  A 18  I 26  R 2   Q 4
Parent page:         A 64   I 58  R 40  M 16  O 14  Q 8
```

The most common answer names the category: all-in charges are must-be, the parent page attractive. Berger and colleagues added two coefficients in 1993, leaving out R and Q:

```text
Better = (A + O) / (A + O + M + I)    Worse = -(O + M) / (A + O + M + I)
Charges:  Better = 64 / 194 = 0.33    Worse = -150 / 194 = -0.77
Parent:   Better = 78 / 152 = 0.51    Worse =  -30 / 152 = -0.20
```

Showing every charge earns little praise, and leaving it out is punished. The parent page pleases half the students and costs little if absent.

## Where it breaks

The parent page has 40 reverse answers: students who would rather their parents did not see where they live. Pooled, it barely beats indifferent (64 against 58). Split by segment, it is likely attractive to first-years moving cities and reverse to older students, so ship it as a link the student chooses to share.

Categories also move. In 2001 Kano described features drifting from attractive to one-dimensional to must-be as rivals copy them; free hotel Wi-Fi made that journey. Answers are stated preferences, and two questions per feature caps a survey at about 20 features. Rerun it yearly.

## Predict, then verify

Roost can build one thing before June. Option one closes the gaps in all-in charges: 3% of move-ins still meet an unlisted charge, about 110 families a month out of 3,600 move-ins. Option two is the parent page, with the higher Better score (0.51 against 0.33). The founder argues that must-be work never gets noticed. Which?

Answer: The charges. A must-be that is only partly met sits at the bottom of Kano's curve, and 110 angry families a month is that dissatisfaction made visible. A delighter does not cancel it: a parent hit with a surprise ₹3,500 charge on move-in day forgets the nice link. Better scores rank what to add once the basics hold; Worse scores tell you what must hold first. The principle: bring must-be features to parity before spending on attractive ones.
