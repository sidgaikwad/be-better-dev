In Pune, a student searching near campus sees dozens of verified PGs. Now suppose Roost opens in Chennai, and a student there sees four listings, none with a free bed in their budget, and leaves. An owner asked to list hears that almost no students use Roost in Chennai, and declines. Same app, same team, and the product is worse in Chennai for a reason no engineer can fix. That is a network effect running in reverse.

## What counts as a network effect

A product has a network effect when each additional user makes it more valuable to other users. NFX, a venture firm, catalogues 16 types. Three cover most products:

- **Direct**: users of one kind benefit each other, as each friend who joins a messaging app makes it worth more to you.
- **Two-sided**: two groups benefit each other. Each owner who lists gives students more choice; each student who searches gives owners more chances to fill a bed. More of your own side is often a cost: another owner is a competitor.
- **Data**: usage improves the product. Each verified-stay review makes Roost's rankings and rent estimates better for the next student.

NFX draws a line worth keeping: network effects are not virality. Virality is users bringing users, which cuts acquisition cost. A network effect is users making the product better for each other, which makes it hard to leave and hard to copy.

## Roost's network is a campus, not a country

Roost's effects are local. Hundreds of owners in Pune do nothing for a student in Hyderabad, so every new city starts cold. Andrew Chen's _The Cold Start Problem_ (2021) calls the smallest network that is stable and can grow on its own the atomic network. For Roost it is roughly one campus: the students looking for rooms near one college, and the PGs within a short commute.

The effect also flattens. NFX calls this an asymptotic marketplace, using ride-hailing: cutting a wait from 8 minutes to 4 is worth a lot, and from 4 to 2 much less. Suppose Roost's data from its three cities links search-to-booking conversion to verified listings within 2 km of a campus:

| Listings near campus | Searchers who book |
| -------------------- | ------------------ |
| 12                   | 3%                 |
| 30                   | 9%                 |
| 60                   | 10%                |

From 12 listings to 30, conversion triples; from 30 to 60 it barely moves. The threshold is liquidity, from the marketplace economics lesson: here, the chance that a search ends in a booking.

## Solving one side first

A marketplace cannot recruit both sides at once, so it picks one. Chen's advice is to start with the hard side: the smaller group whose participation creates most of the value. For Roost that is owners. There are fewer of them, each is worth many bookings, and they can be recruited by hand, as the operations team does when it verifies a property. Students arrive in a burst each June and cannot be stockpiled.

Two moves help. Subsidize the hard side, with free listing and verification for the first season. And give it a reason to join before the other side exists, which Chris Dixon called "come for the tool, stay for the network" in 2015. OpenTable is the standard case: restaurants adopted its reservation software, and diners came later. A Chennai owner might join Roost for a free rent-collection tool months before the first student searches.

## Predict, then verify

Roost's operations team can verify 60 properties in Chennai before June. Each campus there has about 2,000 students searching. Using the table above, which spread brings the most bookings: 12 properties at each of 5 campuses, 30 at each of 2, or all 60 at one?

Answer: 30 at each of 2 campuses. Five campuses with 12 each give 5 x 2,000 x 3% = 300 bookings, 5 per owner. Two campuses with 30 each give 2 x 2,000 x 9% = 360 bookings, 6 per owner. One campus with 60 gives 2,000 x 10% = 200 bookings, about 3.3 per owner, because past the threshold the extra listings mostly compete with each other. The principle is to concentrate supply until each atomic network crosses its liquidity threshold, then stop and start the next one. Spreading thin leaves every campus below the line, where students leave and owners see too few bookings to stay; over-concentrating spends scarce verification visits where they add little.
