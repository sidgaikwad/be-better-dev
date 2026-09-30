A usability test needs recruits, a prototype and a week. Three people with Jakob Nielsen's checklist and half an hour each can find many of the same problems first.

## The ten heuristics

Nielsen developed them with Rolf Molich in 1990 and refined them in 1994 from a factor analysis of 249 usability problems; NN/g updated the explanations in 2020 and kept all ten. Each is paired with a real product that follows it:

1. **Visibility of system status.** Keep people informed with timely feedback. Uber's map shows the driver's car moving toward you.
2. **Match between the system and the real world.** Use the user's words. Deleted files go to a trash can.
3. **User control and freedom.** A clear way out of a mistake. Gmail offers Undo just after Send.
4. **Consistency and standards.** The same thing looks and works the same way everywhere. Ctrl+C copies in nearly every desktop app.
5. **Error prevention.** Stop the error rather than report it. Gmail asks about a missing file when your email says "attached" and has none.
6. **Recognition rather than recall.** Show options; do not make people remember them. A browser's address bar suggests visited sites.
7. **Flexibility and efficiency of use.** Shortcuts experts use and novices can ignore. Gmail's keyboard shortcuts.
8. **Aesthetic and minimalist design.** Every extra element competes with what matters. Google's home page is mostly one box.
9. **Help users recognize, diagnose, and recover from errors.** Plain words, and a way out. Google's "Did you mean" catches a misspelled search.
10. **Help and documentation.** Help where it is needed. A Stripe API error carries a `doc_url` for that error.

## A review of the request form

In a heuristic evaluation, several people inspect an interface separately, note which heuristics it breaks, then merge their lists. Nielsen's severity scale (1994) runs from 0, not a problem, to 4, a catastrophe to fix before release, weighing how often it occurs, how hard it is to get past and whether it recurs.

You, the designer and an engineer each spend 30 minutes on Roost's request form, which loses 4,800 of the 12,800 who open it. Merged:

| Finding                                           | Heuristic              | Severity |
| ------------------------------------------------- | ---------------------- | -------- |
| ID upload fails with "Error 413"                  | 9, recover from errors | 4        |
| Back on step 3 clears every field                 | 3, control and freedom | 3        |
| Move-in dates before the room is free are allowed | 5, error prevention    | 3        |
| Step 4 makes you retype the room's name           | 6, recognition         | 2        |
| "Step 2" with no "of 4"                           | 1, system status       | 2        |
| Says "occupancy" where students say "sharing"     | 2, real world          | 1        |

"Error 413" is the HTTP status for a request too large. The engineer recognized it; a student cannot. The fix: compress photos on the phone, and failing that, say "This photo is too large: retake it or choose a smaller one." A severity-4 bug, found with no recruits.

## Where the checklist stops

Averaged over six projects, Nielsen found a single evaluator catches only about 35% of the problems, and different evaluators catch different ones. Hence three to five people working independently, merged afterward; a group session produces one person's list with nods.

A heuristic review finds violations, not consequences. It cannot say which row stops students and which they shrug past; a usability test can. Evaluators also flag problems users never have, and NN/g's own guidance is that heuristic evaluation does not replace testing with users.

The top reason students gave for leaving, the ₹27,000 they did not expect, is not in the table: no heuristic asks whether the business tells the truth early enough.

## Predict, then verify

Rewind to before the other two looked. You review the form alone for 40 minutes and log six problems, none above severity 2. The founder asks whether the form is ready for June. What do you tell him?

Answer: not yet, and six is no reassurance. If one evaluator catches about 35% of the problems, six found suggests 15 to 20 exist, and one person's finds are skewed by what that person knows: in the merged review, the severity-4 upload error came from the engineer, who reads HTTP codes. Ask two more people for 30 minutes each, separately, merge, fix the severe items, then test with five students. The principle: one reviewer's clean list measures the reviewer, not the design.
