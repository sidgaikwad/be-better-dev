Each year the nonprofit WebAIM runs an automated accessibility check on the home pages of the top million websites. In 2026, 95.9% failed, averaging 56.1 detected errors a page. Six kinds account for about 96% of the errors: low-contrast text (on 83.9% of pages), images with no text alternative, form fields with no label, links and buttons with no name, and no declared language. None is hard to build. They are requirements nobody wrote down.

## The standard

The W3C's Web Content Accessibility Guidelines, version 2.2, became a Recommendation on 5 October 2023. Its testable success criteria come in levels A, AA and AAA; AA is what laws and contracts usually cite. They sit under four principles:

1. **Perceivable:** a user can sense the content. A listing photo has a text alternative a screen reader can speak: "twin room, window onto the street".
2. **Operable:** every control works by touch, keyboard or switch. WCAG 2.2 added a minimum target size at AA, 24 by 24 CSS pixels, which rules out the tiny "x" on Roost's filter chips.
3. **Understandable:** a failed payment says what went wrong in words, not only with a red border.
4. **Robust:** assistive technology can read the interface. A toggle built from a plain `div` has no role or state to announce.

The WHO estimates 1.3 billion people, 16% of the world, have a significant disability. Microsoft's inclusive design toolkit adds the persona spectrum: design for a person with one arm and you also serve someone with a broken wrist, and a parent holding a baby. Roost's version: a student on a crowded bus, one hand on a rail, and a parent in their fifties reading a verification report in the sun.

## Written into the criteria

Bolted on after launch, accessibility means rebuilding shipped components. Written into acceptance criteria, it gets tested like everything else. For the instalments checkout, in the acceptance criteria lesson's Given, When, Then shape:

```text
1  Given a TalkBack user on the checkout screen
   When they reach the payment choice
   Then "Pay in 3 parts" is announced as a switch with
     its state, and can be turned on without sight

2  Given the payer enters a card that is declined
   When the error appears
   Then it names the problem in text next to the field

3  Given any text on the screen
   Then its contrast against the background is at least
     4.5:1 (3:1 for large text)
```

Contrast is arithmetic, so the criterion ends arguments. The ratio is (lighter luminance + 0.05) / (darker luminance + 0.05), and white's relative luminance is 1:

```text
Gray #999999: luminance 0.319, (1.05) / (0.369) = 2.85:1  fails
Gray #767676: luminance 0.181, (1.05) / (0.231) = 4.54:1  passes
```

The paler gray is a common helper-text choice.

## Where the tools stop

Automated checkers find only part of the problem; WebAIM itself says no detected errors does not mean accessible. No scanner can tell whether alt text is accurate. A person still has to complete the core path with a screen reader, and with a keyboard, before each release that touches it.

Nor can it be bought as a widget. In January 2025 the FTC announced that accessiBe would pay $1 million for claiming its AI overlay could make any website compliant with WCAG, an order made final in April 2025. The European Accessibility Act has applied to e-commerce and banking in the EU since 28 June 2025. Roost's better reason is simpler: every blocked user is a lost booking.

## Predict, then verify

Instalments launch on Monday, as peak season starts. On Thursday an audit finds three problems. The "Pay in 3 parts" toggle cannot be operated with TalkBack: one engineer, three days. The helper text is #999999: one hour. And 40 listing photos have no text alternative: two days for operations. Do you launch Monday?

Answer: No, not with the toggle as it is. Fix the contrast today, move instalments to Thursday for the toggle, and schedule the photo text for next sprint, with a date. The toggle blocks a task: a screen reader user cannot pay in instalments. Nobody would ship a toggle that failed on every Samsung phone; this is the same severity. The ordinary checkout keeps working meanwhile, so three days cost little. Missing alt text degrades listings but blocks no task. The principle: accessibility defects are defects, so triage them with the same severity rules, and anything that stops a user completing the core task blocks the launch.
