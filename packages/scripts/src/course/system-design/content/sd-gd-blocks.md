The naive design uploads a file when it changes. For a 100 MB presentation where someone fixed a typo, that is 100 MB of bandwidth to move a few hundred bytes of meaning. Block-level storage is the fix, and it is the decision the whole system is built around.

## Scope

- Upload, download, sync across devices, revision history, sharing, notifications
- Any file type, up to 10 GB
- Encrypted at rest
- 50 million registered users, 10 million daily active
- Not in scope: simultaneous collaborative editing, which is a different problem

Non-functional requirements, in the order they matter: reliability, because data loss is unacceptable; sync speed; bandwidth, because users on mobile data notice; then scalability and availability.

## The estimate

```text
allocated space = 50 million × 10 GB = 500 PB
uploads         = 10 million × 2 = 20 million per day
upload QPS      = 20 million / 86,400 = ~240
peak QPS        = ~480
```

480 requests per second is nothing. 500 PB is not. This is a storage problem wearing a request-handling costume, and noticing that early tells you where to spend the interview.

Note also the 1:1 read-to-write ratio, the same unusual property as the chat system. There is no read-heavy skew to cache away.

## Files become blocks

Split each file into blocks of a fixed maximum size. Dropbox uses 4 MB. Each block is hashed, and the hash identifies it.

The file becomes an ordered list of block hashes, stored as metadata. Reconstructing it means fetching those blocks and joining them in order.

Three things follow, and they are the reason for the whole design.

**Delta sync.** Edit a file and only the blocks that changed are different. Upload those. A one-character edit in a 100 MB file touches one 4 MB block, so you transfer 4 MB instead of 100 MB.

**Deduplication.** Blocks are identified by content hash, so two identical blocks are one stored block. A file uploaded twice, or a shared file everyone has a copy of, costs storage once. At 500 PB allocated, this is not a minor saving.

**Parallelism.** Blocks are independent, so a large file uploads and downloads as many concurrent transfers rather than one long stream.

## What block servers do

Between the client and cloud storage:

1. Split the file into blocks.
2. Compress each block, with the algorithm chosen by file type, since gzip on an already-compressed video is wasted CPU.
3. Encrypt each block.
4. Upload to cloud storage.

Compress before encrypting, in that order. Encrypted data is indistinguishable from random and does not compress, so reversing the steps silently disables compression entirely.

## Storage

Files go to an object store like S3, replicated across regions. Metadata goes to a database. This split is the same as YouTube's: blobs in blob storage, references in a database.

Cold storage is worth naming: files untouched for years move to something like Glacier, which is far cheaper per byte with much slower retrieval. Given 500 PB of which most is dormant, this is a large fraction of the storage bill.

## Predict, then verify

Blocks are deduplicated by content hash across all accounts. What is the security problem?

Answer: it leaks whether a file already exists in the system, to anyone who can measure upload time. If uploading a block you possess returns instantly because the server already has it, then an attacker with a candidate file learns whether anyone else has stored it, which is a real disclosure for anything sensitive or identifying. The stronger version is worse: some systems let a client claim a block by presenting its hash, so anyone who learns a hash can obtain the content without ever having had the file. The fixes trade the saving against the leak. Deduplicate within an account only, which keeps most of the benefit for the common case of one user storing the same file twice while removing the cross-account signal. Or deduplicate globally at the storage layer without letting the client observe it, so the server stores one copy but every upload transfers fully. This is worth raising unprompted, because deduplication is always proposed as a pure win and the cost is a privacy property rather than a performance one.
