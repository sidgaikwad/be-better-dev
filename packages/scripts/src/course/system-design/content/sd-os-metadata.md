The data store holds bytes addressed by a UUID. Everything that makes it usable, names, buckets, listing, versions, lives in a separate metadata store, and the interesting problems are all there.

## Buckets and a flat namespace

An object is addressed as `s3://bucket-name/object-name`. In:

```text
s3://mybucket/abc/d/e/f/file.txt
```

the bucket is `mybucket` and the object name is the entire string `abc/d/e/f/file.txt`. The slashes are characters in the name, not a hierarchy. There are no directories.

**Prefixes** make that usable. Listing by prefix returns names beginning with it, and the API rolls up anything with further slashes into a common prefix. Given:

```text
CA/cities/losangeles.txt
CA/cities/sanfrancisco.txt
NY/cities/ny.txt
federal.txt
```

listing with prefix `/` returns `CA/`, `NY/` and `federal.txt`, which looks exactly like a directory listing and is a string operation over a flat namespace.

That is the trick worth appreciating: the hierarchy is entirely in the client's head, so the storage system keeps its flat namespace and its lack of coordination while users get folders.

## Listing at scale

Listing is the hard query. A bucket can hold billions of objects, and `list objects with prefix P` is a range scan over sorted names, which a single database answers by scanning.

Ordering the metadata by `(bucket_id, object_name)` makes a prefix scan a contiguous read, which is the same reason the geohash lesson mapped two dimensions to one: arrange the key so the query becomes a range.

Sharding it is where it gets hard. Shard by bucket and a large bucket exceeds one shard while a small one wastes it. Shard by object name and listing a prefix has to visit every shard. Most systems shard by bucket and accept that very large buckets need splitting by name range, which keeps listing within one shard for the common case.

## Versioning

With versioning on, a bucket keeps every version of an object.

Without it, overwriting replaces the metadata row and the old data becomes garbage. With it, the write adds a new version and the old one stays addressable, so an accidental overwrite or delete is recoverable.

Deleting a versioned object does not remove anything. It writes a delete marker as the newest version, so reads return "not found" while every prior version remains. That distinction, a delete being an append rather than a removal, is what makes the feature work, and it is the same immutability the first lesson said the whole design rests on.

The cost is that storage now only grows. A bucket with versioning and no lifecycle policy accumulates every version of every object forever, which is the single most common way object storage bills surprise people.

## Large uploads

A 5 GB upload as one request fails at 95% and starts over, and no sensible timeout accommodates it.

Multipart upload splits it: the client initiates, uploads numbered parts independently and in parallel, then sends a completion request listing the parts, and the service assembles them into one object.

A failed part is retried alone. This is the chunked upload from YouTube and the blocks from Drive, and the third appearance is worth noting as a general rule: any upload large enough to fail is uploaded in pieces.

## Predict, then verify

A client starts a multipart upload of 100 parts, uploads 60, and disappears. What is the state, and who cleans it up?

Answer: 60 parts are stored, billed, and belong to no object, because the object does not exist until the completion request assembles it. This is the orphaned-blob problem from the Google Drive section, arriving through a different door, and it is worse here because it is routine rather than exceptional: clients crash and networks fail constantly, so abandoned multipart uploads accumulate continuously rather than after an incident. Nothing in the request path can clean it up, since the service cannot distinguish a client that has given up from one that is slow. The answer is a lifecycle rule that aborts incomplete multipart uploads older than some age, typically a few days, which S3 exposes as a bucket setting precisely because everyone hits this. It is worth raising unprompted for the same reason as in the Drive section: it costs one sentence, and without it the system has a storage leak proportional to its client failure rate that no metric will attribute correctly.
