Sharing was in the scope and it is the feature that turns a personal sync tool into a product. It also quietly breaks several assumptions the previous lessons made.

## The model

A file has an owner and a set of grants. A grant names a principal, a user or a group, and a role, typically viewer, commenter or editor.

```sql
CREATE TABLE file_permission (
  file_id      BIGINT NOT NULL,
  principal_id BIGINT NOT NULL,
  role         VARCHAR(20) NOT NULL,
  granted_by   BIGINT NOT NULL,
  granted_at   TIMESTAMP NOT NULL,
  PRIMARY KEY (file_id, principal_id)
);
```

The complication is folders. A grant on a folder applies to everything inside it, including things added later, so a file's effective permissions are its own grants plus every grant on every ancestor folder.

That makes an authorization check a walk up the tree. For a deeply nested file that is several lookups on the path of every read, which is not affordable at any real rate.

## Two ways to make the check fast

**Materialize the effective permissions.** Store the computed set per file, so a check is one lookup. Fast reads, and a grant on a folder near the root must now update every descendant, which for a folder with a million files is a million writes.

**Cache the walk.** Keep the ancestor chain and the grants along it in cache, so the walk is memory lookups rather than database queries.

The usual answer is materialize, for the same reason the news feed fans out on write: permission checks vastly outnumber permission changes, so pay on the rare operation. The million-write case is real and is handled the way the fanout section handled celebrities: do it asynchronously, accept that a share takes seconds to fully propagate, and check the ancestor chain directly for the brief window where the materialized view may be behind.

## What sharing breaks

**The namespace assumption.** Earlier, a file was identified by joining a user's namespace and a relative path. A shared file appears in several users' namespaces at different paths, so path is no longer an identifier. Files need ids, and paths become a per-user view of them.

**Notification fanout.** The notification service told "relevant clients" about a change. With sharing, relevant means every device of every user with access, which for a widely shared folder is thousands of connections per change.

**Deletion.** If an editor deletes a shared file, whose file is it? The answer most products land on is that removing it from your view removes your grant, and only the owner can actually delete, with the file surviving in others' views until then.

## Revoking

A grant removed must stop access, and the obvious implementation leaks.

If a client already downloaded the blocks, revocation cannot recall them, which is unavoidable. What is avoidable is leaving the client able to fetch new blocks: block requests must be authorized against current permissions, not against a token issued when the share was made. Any pre-signed URL handed out for a shared file has to be short-lived for exactly this reason.

## Predict, then verify

Blocks are deduplicated globally and a file is shared with fifty people. The owner deletes it. What happens to the blocks?

Answer: they must not be deleted, and a naive implementation will delete them. The blocks are referenced by fifty other users' copies, and possibly by unrelated users who happened to upload identical content, so removing them on the owner's delete corrupts everyone else's files. This is ordinary reference counting, and the reason to raise it is that the failure is silent and delayed: the blocks disappear, and the damage only surfaces when someone else opens a file that now cannot be reassembled, possibly months later. The implementation is a count per block hash, incremented when a file references it and decremented on delete, with the block removed only at zero. The subtlety worth naming is that the counter and the metadata must be updated together or the count drifts, and a drifted count either leaks storage or deletes live data. Most systems therefore do not trust the counter as the sole authority: they use it to find deletion candidates, then verify no references remain before removing anything, which is the same shape as the orphaned-block garbage collector from the previous lesson.
