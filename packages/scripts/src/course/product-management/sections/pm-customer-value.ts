import type { SectionSeed } from "../../types"

export const pmCustomerValue: SectionSeed = {
  slug: "pm-customer-value",
  title: "Measuring the value you deliver",
  description:
    "Value creation, communication and delivery as one chain: creating with customers, Porter's value chain, satisfaction scores and their limits, and fixing delivery where it breaks.",
  badgeIcon: "😊",
  badgeTitle: "Value",
  units: [
    {
      slug: "creating-value",
      title: "Creating value",
      description: "What customers are actually buying, and which of your activities provide it.",
      lessons: [
        {
          slug: "pm-value-creation",
          title: "Creating value customers can feel",
          summary:
            "Rank needs by how far they move the customer's goal, as the video's instructor does when he says his learners mostly want a higher income, and co-create without handing over the ranking.",
          contentFile: "pm-value-creation.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "A test-prep app's users want to pass an exam. 40% of survey comments call the interface dated; 10% say the mock tests do not match the real exam. Predict which need a value ranking puts first.",
              options: [
                "The interface, since it is mentioned four times as often",
                "Mock tests that match the exam, since they decide the goal",
                "Both equally, since each one lowers satisfaction",
                "Neither, until a Kano survey has sorted them",
              ],
              answer: 1,
              explanation:
                "The goal is passing the exam, and mock tests that do not match it set that goal back directly; a dated interface is friction. Frequency measures how easy a complaint is to voice, not how much value fixing it creates.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does LEGO Ideas require 10,000 supporters and its own review before a fan design ships?",
              options: [
                "Co-creators select themselves, so the company keeps the final call",
                "Royalties are only affordable above a fixed sales volume",
                "Fans would rather vote on sets than design them",
                "Crowdsourced products need a legal review to be sold",
              ],
              answer: 0,
              explanation:
                "The people who volunteer to co-create are the most engaged customers, not the typical one. The threshold tests wider demand, and the review keeps the ranking with the company, which is the lesson's rule for Roost's owner panel too.",
            },
            {
              kind: "predict",
              prompt:
                "An owner can get a ₹8,280 payout 5 days sooner, or have a ₹9,000-a-month bed filled 3 days sooner. Predict which adds more to the owner's income.",
              options: [
                "The payout, since every owner receives one",
                "About equal, once interest on the payout is counted",
                "The payout, since it was the most named complaint",
                "The filled bed, about ₹900 against about ₹14",
              ],
              answer: 3,
              explanation:
                "A filled bed earns ₹300 a day the owner would never otherwise see, so 3 days is ₹900. An earlier payout only moves money they already have, worth about ₹14 of interest at 12% a year.",
            },
          ],
        },
        {
          slug: "pm-value-chain",
          title: "Porter's value chain",
          summary:
            "Porter's nine activities and the margin they leave, run on Roost's costs per booking, and why a marketplace is closer to a value network than a chain.",
          contentFile: "pm-value-chain.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In Porter's value chain, what is margin?",
              options: [
                "What buyers will pay minus the cost of all the activities",
                "Revenue minus the cost of the goods that were sold",
                "The markup a firm adds on top of its operations cost",
                "The profit left once support activities are paid for",
              ],
              answer: 0,
              explanation:
                "Porter defined value as what buyers are willing to pay, and margin as that value minus the cost of performing every activity, primary and support. It is why each activity must either add value or be cheap.",
            },
            {
              kind: "predict",
              prompt:
                "A firm competing on differentiation has to cut costs. Predict where Porter's logic says to cut first.",
              options: [
                "Evenly across all nine activities",
                "In the activities buyers pay a premium for",
                "In the activities buyers never see",
                "In support activities, since they add no value",
              ],
              answer: 2,
              explanation:
                "A differentiator's premium is paid for specific activities, so cutting there erodes the advantage. Cost cuts belong where buyers do not notice, as Roost's payment contract is, while its verification visits stay protected.",
            },
            {
              kind: "mcq",
              prompt:
                "Why does Stabell and Fjeldstad's value network describe Roost better than Porter's chain?",
              options: [
                "Roost is too small for a value chain analysis",
                "Roost links students to owners instead of transforming inputs",
                "Roost has no support activities to map",
                "Roost's owners perform all of its operations",
              ],
              answer: 1,
              explanation:
                "The chain was drawn for firms that transform inputs in sequence. A marketplace creates value by connecting two sides, which is the network configuration, though the nine boxes still work as a checklist of activities and costs.",
            },
          ],
        },
      ],
    },
    {
      slug: "measuring-delivery",
      title: "Measuring and fixing delivery",
      description:
        "Satisfaction scores and what they miss, then fixing delivery where it actually breaks.",
      lessons: [
        {
          slug: "pm-satisfaction-scores",
          title: "NPS, CSAT, and CES",
          summary:
            "Net Promoter Score worked from raw counts with its margin of error, why the number alone never says why, and which question CSAT and customer effort score each answer.",
          contentFile: "pm-satisfaction-scores.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "A survey returns 200 answers: 100 promoters, 60 passives and 40 detractors. Predict the Net Promoter Score.",
              options: ["+43", "+60", "+20", "+30"],
              answer: 3,
              explanation:
                "Promoters are 100 / 200 = 50% and detractors 40 / 200 = 20%, so NPS is +30. Getting +43 means the passives were left out of the denominator, the most common mistake.",
            },
            {
              kind: "mcq",
              prompt:
                "The video's instructor says NPS never told him why customers were unhappy. What does Reichheld's own system add for that?",
              options: [
                "A split of the score by customer segment",
                "A follow-up asking the main reason for the score",
                "A satisfaction question asked alongside it",
                "A separate score reported for the passives",
              ],
              answer: 1,
              explanation:
                "The recommend question comes with a follow-up asking for the reason. The number shows whether sentiment moved; the reasons show what to fix, and a team that skips them keeps only the half it cannot act on.",
            },
            {
              kind: "predict",
              prompt:
                "Roost wants to know whether its new dispute flow works for the students who go through it. Predict which measure fits best.",
              options: [
                "NPS, sent to every student each quarter",
                "CSAT, asked on the search results page",
                "CES, asked right after the dispute closes",
                "NPS, sent only to last year's promoters",
              ],
              answer: 2,
              explanation:
                "Customer effort score was built for service interactions and asked right after one, which is exactly a dispute. NPS measures the overall relationship, and CSAT on search judges a different touchpoint.",
            },
          ],
        },
        {
          slug: "pm-improving-delivery",
          title: "Improving value delivery",
          summary:
            "Find the bottleneck with operational metrics like first contact resolution, then fix it with transparency and empowered frontline staff, as American Express and Amazon do.",
          contentFile: "pm-improving-delivery.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Roost's agents reply to disputes within hours, yet the median decision takes 6 days. Where is the bottleneck?",
              options: [
                "Agents who reply too slowly in peak season",
                "Owners who ignore Roost's messages",
                "Delays in the app's push notifications",
                "The approval queue in front of one person",
              ],
              answer: 3,
              explanation:
                "Every refund request is forwarded to the operations lead, who approves between visits, so disputes wait in one queue. Only 25% resolve on first contact, and those close in under a day.",
            },
            {
              kind: "predict",
              prompt:
                "Agents get authority to settle disputes on first contact. Handling cost falls ₹300 on each of 400 disputes a month, and 25 bad approvals cost ₹3,000 each. Predict the monthly net.",
              options: [
                "A saving of ₹120,000",
                "A loss of ₹75,000",
                "A saving of ₹45,000",
                "Roughly break-even",
              ],
              answer: 2,
              explanation:
                "Handling saves 400 x ₹300 = ₹120,000 and leakage costs 25 x ₹3,000 = ₹75,000, netting ₹45,000 before any cancellations saved. Leakage is a cost to bound with a ceiling and an audit, not a reason to keep the queue.",
            },
            {
              kind: "mcq",
              prompt:
                "What did Amazon's customer service Andon Cord give agents beyond settling each customer's case?",
              options: [
                "Pulling a defective product from the site until it is fixed",
                "Offering a refund without asking a manager first",
                "Dropping the script and talking freely with customers",
                "Letting the customer decide how long the call lasts",
              ],
              answer: 0,
              explanation:
                "An agent who heard about a repeated defect could take the product off the site, so what the frontline saw stopped the defect recurring. The last two options describe American Express's Relationship Care instead.",
            },
          ],
        },
      ],
    },
  ],
}
