Drew Houston's talk at the Startup Lessons Learned conference in 2010 described Dropbox's early search ads costing $233 to $388 per customer, for a product that sold for $99 a year. Dropbox's answer was a two-sided referral: invite a friend, and when the friend signs up, both of you get extra storage. Houston's deck reports that referrals permanently increased signups by 60%, that 35% of daily signups came through them, and that users sent 2.8 million invitations in a single 30-day period. Registered users went from 100,000 in September 2008 to 4 million in January 2010, the 40x jump that retellings quote as "3,900% growth". The video's GTM chapter uses this story as its customer acquisition example.

One correction to the usual retelling: the bonus during that growth was 250 MB for each side. Dropbox doubled it to 500 MB in April 2012, and most articles quote the later number.

## The viral coefficient

Andrew Chen's standard definition splits virality into two measurable parts:

```text
K = i x c
i = invitations sent per new user
c = share of invitations that become new users
```

Suppose each new user sends 4 invitations and 15% of them convert. K = 4 x 0.15 = 0.6. Seed 1,000 users with paid ads and follow the generations:

```text
generation 0   1,000
generation 1     600   (1,000 x 0.6)
generation 2     360   (600 x 0.6)
generation 3     216
generation 4     130
generation 5      78
total          1,000 / (1 - 0.6) = 1,000 / 0.4 = 2,500
```

The 1,000 bought users become 2,500. If they cost $20 each, $20,000 bought 2,500 users, a blended cost of $8 each. So K below 1 is still worth building: it multiplies every other channel by 1 / (1 - K). Chen's view is that K around 0.5, a 2x multiplier, is realistic and sustained K above 1 is rare.

Above 1, growth feeds itself. At K = 1.2, 1,000 seed users bring 1,200, who bring 1,440, then 1,728, 2,074 and 2,488: 9,930 in total after five cycles, seed included. How fast that happens depends on cycle time, the days between one user signing up and their invitee signing up. With a 3-day cycle, five cycles take 15 days. With a 30-day cycle they take 150.

## Paid to invite, or built in

Dropbox's virality is an incentive. Hotmail's, from 1996, was built into the product. Tim Draper, whose venture firm backed Hotmail, pushed the founders to add a line to every outgoing email; the line most sources say shipped was "Get your free email at Hotmail". Microsoft bought Hotmail in December 1997 for about $400 million. Its user count at the time varies by source: contemporary reports say more than 8.5 million, while Draper's firm has claimed 12 million within about 18 months. Built-in virality needs no reward, but it only works when ordinary use of the product reaches non-users.

## What K does not tell you

K counts sign-ups, not value. Rewards attract people who join for the reward, so track the retention of referred users, not just their number. K also decays: early users invite their most likely friends first, and later invitations land on people who already use the product or never will. And Dropbox's reward was cheap in a specific way: storage cost little at the margin, and a user with more space stored more files, which made leaving harder. The reward was the product.

## Predict, then verify

Roost's marketing lead wants to copy Dropbox: ₹500 to the inviting student and ₹500 to the friend, paid when the friend books. Roost earns ₹720 commission per booking, and its Instagram ads cost ₹900 per booking, as in the loops lesson. Referred students convert well. Ship it as proposed?

Answer: No, not at that price. Each referred booking costs ₹1,000 in rewards, ₹280 more than its ₹720 commission and ₹100 more than buying the same booking with ads. Worse, some of it rewards friends who would have booked anyway, so the cost per added booking is higher still. A referral reward is an acquisition cost, and it has to be priced against margin and paid CAC like any other. Cut it to ₹250 per side, paid once the friend moves in, so a referred booking costs ₹500, below both numbers. Then look for a reward that costs Roost little and deepens use, the way storage did for Dropbox, such as early access to new listings a week before the season opens.
