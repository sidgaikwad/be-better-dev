In May, Roost's analytics dashboard shows 9,400 booking requests. The owner inbox, which stores every request, shows 8,000. The previous lesson's funnel put search-to-request at 20%; the dashboard says 23.5%. The cause takes an afternoon to find: the iOS app records a request when the button is tapped, the Android app when the server confirms it, and a student on weak hostel wifi who taps three times counts three times on iOS. Nobody decided this. Two engineers each added a tracking call in a different sprint.

## Events, properties, identity

Modern product analytics is event-based. An event is a record that something happened: a name, a timestamp, the user who did it, and properties that describe it. Google Analytics 4 works this way too, and it replaced the older session-based Universal Analytics, whose standard properties stopped processing data on 1 July 2023.

```json
{
  "event": "Request Sent",
  "user_id": "stu_48213",
  "timestamp": "2026-05-14T19:42:07+05:30",
  "properties": { "listing_id": "pg_1107", "city": "Pune", "rent": 9000, "platform": "android" }
}
```

Every funnel, cohort and segment in this section is a query over records like this, so the records decide what questions you can ever answer. With no `city` property, you cannot cut requests by city.

Identity is the part teams underestimate. A student browses logged out on a phone, which gets an anonymous ID, then logs in on a laptop. Until the tool is told these are one person, it sees two or three. Before Roost merged anonymous and logged-in IDs, its tool counted 52,000 monthly searchers instead of 40,000 and reported search-to-booking at 7.7% (4,000 / 52,000) instead of 10%.

## The tracking plan

The fix for the hook is a tracking plan: a shared document, agreed before code ships, listing every event, exactly when it fires, its properties, and who owns it. For Roost's core path:

```text
Search Performed   fires when results return        city, college_id, budget_max
Listing Viewed     fires when the page renders      listing_id, rent, featured
Request Started    fires when the form opens        listing_id
Request Sent       fires when the server stores it  listing_id, request_id, platform
Booking Paid       fires when the gateway confirms  booking_id, amount, payment_type
```

The names follow Segment's recommended convention: an object, then a past-tense action ("Product Viewed", "Order Completed"). Segment also warns against variables in names, such as "Sign Up - jake@segment.com"; the email belongs in a property. GA4's own events use snake_case, like `page_view`. Either style works. Mixing them, so that "Request Sent", "request_sent" and "Booking Request Submitted" all exist, does not.

Notice where the last two fire: on the server. Anything that means money or commitment should be recorded where it actually happens, since client events get lost to ad blockers and killed apps, and duplicated on retries.

## What the tools are for

The video names three tools, and they answer different questions:

1. **Google Analytics**: where visitors came from and what they did on your site or app. Strongest on acquisition and traffic.
2. **Mixpanel**: founded in 2009 by Suhail Doshi and Tim Trefren, built around events per user. Funnels, retention and cohorts live here.
3. **Hotjar**: founded in 2014 and part of Contentsquare since 2021. Heatmaps, session recordings and on-page surveys. The instructor's cursor-movement example is its territory: the why behind a drop.

## What breaks when tracking comes last

Instrumentation added after launch fails in predictable ways. Events exist only from the day they are added, so there is no baseline to compare against. Renaming an event splits its history in two. And each engineer's guess at the trigger produces the hook's two definitions of one event.

## Predict, then verify

The instalments feature is ready on 25 May. Its tracking (a new "Instalment Plan Selected" event and a `payment_type` property on Booking Paid) needs three more engineer-days, moving launch to 28 May. The engineering lead proposes launching on the 25th and adding tracking in a later sprint. Roost averages about 4,000 bookings a month, and June brings about 9,000. Launch now or wait?

Answer: wait the three days. June bookings will more than double whether or not instalments does anything, so total bookings cannot tell you if the feature worked. Only a `payment_type` on every booking, from day one, can show how many June bookings used instalments and whether those students converted better. Tracking added in July would miss the season that decides the feature's fate. Treat the tracking plan as part of the feature's definition of done, not a follow-up task.
