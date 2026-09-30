import type { SectionSeed } from "../../types"

export const pmResponsibleProduct: SectionSeed = {
  slug: "pm-responsible-product",
  title: "Building responsibly",
  description:
    "The obligations that come with shipping to many people: dark patterns and the regulators now pursuing them, accessibility as a requirement, privacy by design, and asking whether to build it at all.",
  badgeIcon: "🛡️",
  badgeTitle: "Guardian",
  units: [
    {
      slug: "the-screen",
      title: "What the screen owes",
      description: "Interfaces that do not trick people, and that everyone can use.",
      lessons: [
        {
          slug: "pm-dark-patterns",
          title: "Dark patterns",
          summary:
            "Designs that earn only when users misread or give up, the regulators pursuing them, and the metrics they quietly corrupt.",
          contentFile: "pm-dark-patterns.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which test best separates a dark pattern from fair persuasion?",
              options: [
                "Whether the design raises revenue for the business",
                "Whether an A/B test showed users preferred it",
                "Whether it would still earn if every user fully understood it",
                "Whether a competitor already uses the same design",
              ],
              answer: 2,
              explanation:
                "Business gain alone is not the problem; every product needs revenue. A design is deceptive when its extra return depends on a mistake, so it would fall to zero if everyone understood the screen.",
            },
            {
              kind: "predict",
              prompt:
                "A team makes cancellation of a subscription require a phone call. Next month the retention dashboard improves. What does the new retention number now measure?",
              options: [
                "Both satisfied customers and customers who could not leave",
                "Only customers who value the product more than before",
                "The same thing as before, since cancellations are still counted",
                "Only the effect of the phone call on support costs",
              ],
              answer: 0,
              explanation:
                "A subscriber who tried to cancel and gave up counts as retained, so the number mixes loyalty with obstruction. Any decision built on it, such as a price rise, rests on a figure that is partly false.",
            },
            {
              kind: "mcq",
              prompt: "What made the FTC's Amazon Prime case a landmark for dark patterns?",
              options: [
                "It created a federal rule that cancelling must take one click",
                "It found that retention offers of any kind are illegal",
                "It applied only to companies with over a billion users",
                "It priced an obstructive cancellation flow at $2.5 billion",
              ],
              answer: 3,
              explanation:
                'The "Iliad" flow made leaving three to six times harder than joining, and the 2025 settlement cost $2.5 billion under existing law. No federal click-to-cancel rule was in force: the 2024 rule had been vacated weeks earlier.',
            },
          ],
        },
        {
          slug: "pm-accessibility",
          title: "Accessibility is a requirement",
          summary:
            "WCAG 2.2's four principles, who they serve, and accessibility written into acceptance criteria instead of bolted on.",
          contentFile: "pm-accessibility.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Helper text on the checkout is #999999 on white, a 2.85:1 contrast ratio. What does WCAG AA require for normal text?",
              options: [
                "At least 2:1, so it passes",
                "At least 4.5:1, so it fails",
                "At least 7:1, so it fails",
                "No ratio, only a visible border",
              ],
              answer: 1,
              explanation:
                "AA sets 4.5:1 for normal text and 3:1 for large text. Because the ratio is arithmetic on luminance, a criterion like this can be checked without debate, which is why it belongs in acceptance criteria.",
            },
            {
              kind: "predict",
              prompt:
                "An automated checker reports zero errors on Roost's new checkout. A screen reader user still cannot complete a payment. How is that possible?",
              options: [
                "The checker was run on the wrong browser version",
                "Screen readers ignore any page without errors",
                "The page must be using WCAG 2.1 instead of 2.2",
                "Scanners catch only part of what blocks real users",
              ],
              answer: 3,
              explanation:
                "WebAIM itself warns that no detected errors does not mean accessible: a scanner cannot judge whether a custom control is usable or alt text is accurate. Someone has to complete the core path with a screen reader and a keyboard.",
            },
            {
              kind: "predict",
              prompt:
                'Three days before launch, the new "Pay in 3 parts" toggle turns out to be unusable with TalkBack. The fix takes one engineer three days. What should decide whether you launch?',
              options: [
                "The same severity rule as any bug that blocks paying",
                "Whether disabled users are a large share of bookings",
                "Whether an overlay widget can patch it by Monday",
                "Whether the law in India requires WCAG today",
              ],
              answer: 0,
              explanation:
                "A control that some users cannot operate blocks a task, exactly like a toggle that fails on one phone brand. Triage it by the same severity rules, and anything that stops the core task blocks the launch.",
            },
          ],
        },
      ],
    },
    {
      slug: "the-data-and-the-decision",
      title: "The data and the decision",
      description:
        "Collecting only what a feature needs, and asking who a feature could hurt before it ships.",
      lessons: [
        {
          slug: "pm-privacy-by-design",
          title: "Privacy by design",
          summary:
            "Lawful basis, purpose, minimisation, storage limits and real consent, worked through Roost's ID verification documents.",
          contentFile: "pm-privacy-by-design.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Roost checks a student's ID so a booking can go ahead. Under the GDPR's framing, what is the lawful basis for that check?",
              options: [
                "Consent, since every processing step needs it",
                "Legitimate interest in growing the business",
                "No basis is needed for identity documents",
                "Necessity for the contract the student is entering",
              ],
              answer: 3,
              explanation:
                "Consent is one of six bases, and often not the right one. Verification is needed to perform the booking, while sending the student's details to a lending partner is not, and would need its own consent.",
            },
            {
              kind: "predict",
              prompt:
                'Operations wants to keep every ID image forever "in case of disputes". Last season, the verification record alone settled nearly every dispute. What should the retention policy be?',
              options: [
                "Keep all images, since disputes can arrive years later",
                "Keep the record, and delete images soon after move-in",
                "Delete everything, including the record, after move-in",
                "Keep images but let support agents browse them freely",
              ],
              answer: 1,
              explanation:
                "Storage limitation keeps data only while its purpose needs it. The record answers who was checked, by whom and when, so the images add risk without adding use once move-in is done.",
            },
            {
              kind: "mcq",
              prompt:
                "Owners want a copy of each student's Aadhaar before move-in. Which design follows privacy by default?",
              options: [
                "Send owners the full image, since they asked for it",
                "Refuse any identity information to owners at all",
                "Show a verified profile and let the student decide more",
                "Ask students to tick a pre-selected sharing box",
              ],
              answer: 2,
              explanation:
                "The owner needs to know who is moving in and that someone checked. A verified profile shares that fact without a document that can never be recalled, and a pre-ticked box is not valid consent.",
            },
          ],
        },
        {
          slug: "pm-should-we-build-it",
          title: "Should we build it?",
          summary:
            "The ethical assumption next to the other four: misuse cases, a pre-mortem for harm, and who pays when the product works as designed.",
          contentFile: "pm-should-we-build-it.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why was the Strava heatmap a lesson for product teams rather than a security bug?",
              options: [
                "The feature worked as designed and still caused harm",
                "An attacker broke in and stole the activity data",
                "Strava's engineers shipped the map without testing it",
                "Users were charged for a feature they did not choose",
              ],
              answer: 0,
              explanation:
                "Nothing broke or leaked: the map showed exactly what users had shared, and that revealed military bases. Harm from a feature working as intended is the case a pre-mortem for harm is built to catch.",
            },
            {
              kind: "mcq",
              prompt:
                "What does a misuse case, as Sindre and Opdahl proposed it, add to a set of requirements?",
              options: [
                "A list of features users asked for but did not get",
                "A test plan for the feature's happy path",
                "A use case for an actor you do not want to serve",
                "An estimate of how many users will misread the screen",
              ],
              answer: 2,
              explanation:
                "It writes down what someone who wants to cause harm would do with the feature, so the requirements can include guardrails against it. For tenant ratings, that actor is an owner retaliating against a student who complained.",
            },
            {
              kind: "predict",
              prompt:
                "A pilot of tenant ratings cuts disputes by 40% and lifts happy move-ins, but spot checks find unlisted charges at the same 3% rate as before. What happened?",
              options: [
                "Owners improved their listings to earn better ratings",
                "Students stopped reporting problems they still faced",
                "The pilot was too small to measure disputes at all",
                "Disputes fell because students chose better rooms",
              ],
              answer: 1,
              explanation:
                "The problems did not fall, only the complaints did. A north star defined by the absence of disputes rises when students are afraid to dispute, so the metric was measuring fear.",
            },
          ],
        },
      ],
    },
  ],
}
