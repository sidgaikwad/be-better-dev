Roost verifies both sides. A first-time student uploads a college ID and a government ID, usually a photo of their Aadhaar card, with its full 12-digit number and home address. An owner uploads an ID and proof of ownership. Operations checks them and marks the account verified. The images stay, in one bucket, with no deletion date. At 28,000 first bookings a year and two images each, that is 56,000 student documents a year, 168,000 after three seasons. Nobody decided to keep them; keeping was the default. Now support wants access "to settle disputes faster".

## The principles a PM meets

Privacy by design is Ann Cavoukian's idea, developed in the 1990s while she was Ontario's Information and Privacy Commissioner: build protection in rather than patch it later, and make privacy the default, so a user who does nothing is still protected. The EU's GDPR, applied since 25 May 2018, made it law as "data protection by design and by default" (Article 25). The principles a PM meets in feature decisions:

- **Lawful basis:** Article 6 lists six, and consent is only one. Checking an ID is necessary for the booking contract; passing details to a lending partner is not, and needs its own consent.
- **Purpose limitation:** data collected to verify a booking is not reused for marketing because it happens to be there.
- **Data minimisation:** collect only what the purpose needs.
- **Storage limitation:** keep it only while the purpose needs it.
- **Real consent:** freely given, specific, informed, unambiguous. Recital 32 says silence, pre-ticked boxes and inactivity are not consent, and withdrawing must be as easy as giving (Article 7).

India's Digital Personal Data Protection Act 2023 has the same shape. Its rules were notified on 13 November 2025, with most duties applying from 13 May 2027. Data must be erased once its purpose is served, unless another law requires keeping it, and failing to protect it can cost up to ₹2.5 billion.

## The verification feature, redesigned

Ask of each item: what is it for, is it needed, and for how long?

| Data                    | Needed for                  | Decision                                 |
| ----------------------- | --------------------------- | ---------------------------------------- |
| Full Aadhaar image      | Matching a name to a person | Accept a masked Aadhaar                  |
| College ID image        | Proving enrolment           | Delete 30 days after move-in             |
| Verification record     | Disputes and audit          | Keep: name, last 4 digits, checker, date |
| Owner's ownership proof | The right to list           | Keep while listed, then 1 year           |

UIDAI, which issues Aadhaar, offers a masked copy that hides the first eight digits. The record answers every later question (was this person checked, by whom, when) and spares returning students a second upload. The defaults follow: an owner sees "ID verified by Roost" with the student's name and photo, a support agent sees the record, and nobody browses images.

What the bucket holds shrinks about eightfold:

```text
Peak month:  8,700 bookings x 58% first bookings = about 5,000
Uploads:     5,000 x 2 images = 10,000 a month
Held:        about 2 months (upload, move-in, 30 days) = 20,000
Old policy:  168,000 after three seasons, still growing
```

And a breach exposes no full Aadhaar numbers.

Operations will say disputes need images. Test it: last season, how many disputes did an ID image settle that the record could not? If a handful, keep the record. Where a law names a document and a period, keep exactly that.

## Predict, then verify

Owners want a copy of each student's Aadhaar before move-in, and 180 of 1,200 say they may stop listing without it. Copies would send up to 4,000 ID images a month into owners' phones and WhatsApp chats, beyond Roost's reach to delete. Options: full copies, nothing, or a verified profile (photo, name, college, last four digits, "verified by Roost on 12 June"). Which ships?

Answer: The verified profile. The owner's real need is to know who is moving in and that someone checked; the profile answers it with Roost's name behind it, which is the product. Full copies fail minimisation and can never be recalled. Sharing nothing ignores a real need and pushes owners to demand copies on WhatsApp, where nothing protects the student. A student who wants to can still send a masked copy. If a few owners leave, that is the strategy's price. The principle: share the fact, not the document, and let the person the document belongs to decide.
