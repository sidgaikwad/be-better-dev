Every component in this system talks asynchronously to parties it does not control, and none of them will roll back to match you. Reconciliation is how the resulting disagreements are found, and it is the last line of defense rather than a background job.

## The settlement file

Every night, each PSP and bank sends a settlement file: the account balance plus every transaction that touched it that day.

Reconciliation parses it and compares it against your ledger. Three outcomes for each transaction: present in both and matching, present in one only, or present in both with different values.

That external comparison is what makes payments different from the ad click section, which had no second party to check against and had to reconcile against itself. Here a genuine independent record exists, and the PSP's version is authoritative about money that actually moved.

## Internal reconciliation too

The same process checks your own components against each other. The wallet is derived from the ledger, so their disagreement is detectable by comparison, and the previous lesson's failure, a ledger entry written and a wallet update lost, is exactly what this finds.

Reconcile internal state as well as external, because internal divergence is more common and easier to fix.

## Three kinds of mismatch

Found mismatches sort into three buckets, and the classification is itself the design:

1. **Classifiable, and worth automating.** You know the cause and the fix and can write the correction. Both classification and adjustment run automatically.
2. **Classifiable, not worth automating.** You know the cause and the fix, and the cases are too rare to justify the code. It goes to a queue and the finance team applies the correction.
3. **Unclassifiable.** You do not know how it happened. A separate queue, and someone investigates.

Bucket 3 is the one to watch, because its rate is a measure of how well you understand your own system. A growing unclassifiable rate means something new is going wrong, and that is the alert worth building, in the same way the ad click section alerted on a change in the reconciliation gap rather than on the gap.

## Why a human is in the loop

Automatic correction of a financial discrepancy you do not understand is worse than leaving it, which is unusual advice in a course about automation.

If the classification is wrong, the correction moves money incorrectly and creates a second discrepancy that is harder to diagnose than the first. Finance teams also carry obligations that engineering does not: adjustments may need approval, documentation, and an audit trail.

So the system's job is detection, classification and presentation, and the correction for anything uncertain is applied by a person who can be accountable for it.

## Processing delays

A payment usually completes in seconds and sometimes takes much longer, because a risk check is queued for review or a bank is slow. The design has to hold that state rather than deciding.

Which means the customer-facing answer is "processing" rather than success or failure, and the order should not ship until the payment resolves. A system that assumes a payment either succeeds or fails within a request will eventually ship goods against a payment that is later declined.

## Predict, then verify

Reconciliation finds a payment in the PSP's settlement file that is absent from your ledger. What happened, and what do you do?

Answer: the customer was charged and you have no record of it, which means the PSP processed a payment whose confirmation never reached you, or reached you and was lost before the ledger write. Money moved and your system does not know, so the order was probably never fulfilled and the customer has paid for nothing. Note the direction: this is the failure mode that produces an angry customer rather than a lost cent, and it is the reason reconciliation is described as the last line of defense rather than an accounting formality. The resolution has two parts. Immediately, create the missing ledger entries from the settlement record so your books match reality, and check whether the order was fulfilled, refunding if it was not. Then find the cause, because a single instance is a lost message and a pattern is a broken callback path, and the settlement file is the only thing that would ever have told you. This is why the file is parsed every night rather than when someone complains: the discrepancies it finds are, by construction, ones your own system cannot detect.
