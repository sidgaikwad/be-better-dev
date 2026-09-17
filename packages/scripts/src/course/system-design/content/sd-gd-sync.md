A file exists on a laptop, a phone and a server. Keeping three copies in agreement while any of them can change offline is the actual product, and it is harder than storing the bytes.

## Notifying clients

A client cannot know a file changed elsewhere unless something tells it. Two options:

- **Long polling.** The client holds a request open until there is news, then reconnects.
- **WebSocket.** A persistent bidirectional connection.

The chat system chose WebSocket. This one should choose long polling, and the reasons are specific rather than a matter of taste.

Communication here is one-directional: the server tells clients something changed, and clients never push through this channel, so the bidirectionality that made WebSocket right for chat buys nothing. Notifications are also infrequent, so holding a persistent connection per device for a channel that is silent most of the day is a cost without a matching benefit.

The mechanism: the client holds a long poll. On a change, the server closes the connection, which is the signal. The client then fetches metadata and downloads the changed blocks, and immediately opens a new long poll.

Offline clients cannot be notified, so changes are recorded in an offline backup queue and delivered when the client reconnects.

## Upload

Two flows in parallel, as with YouTube:

**Metadata.** The client posts the new file's metadata. It is stored with status `pending`, and the notification service tells other clients an upload is starting.

**Content.** The client sends the file to block servers, which split, compress, encrypt and upload the blocks. Cloud storage fires a completion callback to the API servers, the status becomes `uploaded`, and the notification service tells other clients it is ready.

The `pending` status is worth defending: without it a 2 GB upload is invisible to other devices for minutes, and the user wonders whether it worked.

## Download

1. The notification service tells client 2 something changed.
2. Client 2 requests metadata from the API servers.
3. It compares against what it has and identifies missing blocks.
4. It requests those blocks from the block servers, which fetch them from cloud storage.
5. It reassembles the file.

Step 3 is delta sync from the receiving side: the client downloads only blocks whose hashes it does not already have, which for an edited file is usually one.

## Conflicts

Two clients edit the same file offline. Both come back.

The rule: first write processed wins. The second gets a conflict, and the system presents both versions, the local copy and the server's, letting the user merge or choose.

That is unsatisfying and it is correct. The system cannot know which version is right, because that is a question about the contents and the user's intent. What it must never do is pick silently, because that destroys work. Surfacing both is the honest failure, and it is the same principle as merging shopping cart siblings in the key-value section: prefer the resolution whose error the user can correct.

## Consistency

Metadata needs strong consistency: the same file must not appear differently on two devices at the same moment.

That drives two decisions. A relational database, because ACID is native and you do not have to build it. And cache invalidation on every write, since a cache holding a stale file listing is exactly the inconsistency being avoided.

This is the opposite call from the key-value section, and worth naming as such: there, availability beat consistency because a stale cart is survivable. Here, a file that disagrees with itself across devices is the product failing.

## Predict, then verify

A user edits a file on a laptop with no network, then edits the same file on their phone, which is online. The laptop reconnects. What happens?

Answer: the phone's edit was processed first and won, so the laptop's edit arrives second and is a conflict, and the user sees both versions of a file they edited twice themselves. That is the correct behavior of the rule and an awkward user experience, because the conflict is between one person and themselves rather than between collaborators. It is also the common case: a single user with several devices, one of which was offline, is far more frequent than two people editing simultaneously. The mitigation is not to change the conflict rule, which is sound, but to reduce how often it triggers: sync aggressively the moment a device regains connectivity and before it allows editing, so the laptop pulls the phone's version and the user edits the current file rather than a stale one. The general point is that a conflict-resolution rule is a last resort, and most of the work in a sync system is in not needing it.
