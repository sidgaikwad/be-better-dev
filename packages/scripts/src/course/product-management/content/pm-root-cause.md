The video's instructor offers a hypothetical: an online retailer (he says Amazon, for the example) hears that deliveries are running late. The obvious suspect is the courier. His answer is the address screen: customers drop the map pin in the wrong place, the delivery partner cannot find the house, and every order to that pin is late. A design problem, found by refusing to stop at the first explanation.

Roost has its own pin. Students search by college, and each listing shows its distance to campus, computed from a pin the owner sets. In July, cancellations citing "farther from college than shown" rise from about 40 a month to 110. The previous lesson's eleven students said the same.

## Five whys, and its limits

Taiichi Ohno, the architect of the Toyota Production System, called asking "why?" five times the basis of Toyota's scientific approach. His book (Japan 1978, English 1988) traces a stopped machine: a blown fuse, an overload from a dry bearing, a pump delivering too little oil, a worn pump shaft, and at the bottom a missing strainer that let metal scrap in. Replace the fuse and the machine stops again; fit the strainer and it does not.

Its limits are known. It follows one chain when problems often have several causes, stops wherever the asker feels satisfied, and cannot reach past what the asker knows. Teruyuki Minoura, a former Toyota managing director, called it too basic. Its commonest failure: stopping at a person. "Owners are careless" fixes nothing.

## Go wide, then deep

The instructor's method supplies the breadth. List hypotheses in every facet: technology, user experience, operations, and the outside world (he names lockdowns, regulation and local unrest). Then reject them one at a time with data, asking what changed recently. Kaoru Ishikawa's fishbone diagram, popularized in Japanese quality control in the 1960s, sorts causes by category the same way. For Roost:

1. **Technology: the distance math is wrong.** Check 60 cancelled listings against each building's real location, found from its address. The math matches every pin, but 44 pins sit 1.5 to 8 km from the building: the pins are wrong, not the math.
2. **Outside: a college moved its classes.** The 110 span 37 colleges in three cities, not one cluster. Rejected.
3. **Operations: verification missed it.** 41 of the 44 wrong pins passed verification, whose checklist never mentions the pin. Not the origin, but it let the error through.
4. **User experience: owners set the pin wrong.** Since April, owners can list from the phone app, where the pin starts at the phone's location. 39 of the 44 wrong pins were created that way, by owners at home or at work.

Then five whys goes deep on the survivor:

1. Why did students cancel? The room was farther than the listing said.
2. Why? The distance came from a pin that was not at the property.
3. Why? The app drops the pin where the owner is standing.
4. Why do owners not move it? The form shows nothing to check it against.
5. Why did nobody notice? Verification visits the building but never checks the pin.

Two causes, two fixes: place the pin from the typed address and ask the owner to confirm it, and have operations check the pin on every visit. Neither fix is "remind owners to be careful".

## Predict, then verify

In August, "room was already taken" complaints in Hyderabad jump from 20 a week to 55, while Pune and Bengaluru stay flat. Four hypotheses: a 1 August release changed how availability is cached in all three cities; two of Hyderabad's four operations staff, the ones who call owners weekly to confirm vacancies, are on leave; a Hyderabad college ran late admissions, adding about 3,000 students to search; some Hyderabad owners joined a rival app. What do you reject, and what do you test first?

Answer: Reject the release: it reached all three cities, the rise appears in one, and a cause must vary where the effect varies. Test the operations gap first, as the cheapest: the operations log shows how many Hyderabad vacancies were confirmed each week. If confirmations halved while complaints nearly tripled, that is the likely cause. Late admissions may compound it, so check new Hyderabad searchers next. The rival app needs owner calls, so it goes last. The principle: let the shape of the data cut the list before you pay for expensive tests, and keep several causes alive until evidence rules them out.
