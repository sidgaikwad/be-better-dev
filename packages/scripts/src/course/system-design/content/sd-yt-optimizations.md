The pipeline works. Now make it fast, safe and affordable, in that order of obviousness and reverse order of importance.

## Speed: chunk the upload

Uploading a 1 GB file as one request means a failure at 95% starts over. Split it into GOP-aligned chunks on the client and upload them independently: a failure costs one chunk.

Splitting client-side also means the server receives chunks it can start transcoding immediately, so encoding begins before the upload finishes. Old clients cannot do this, and the fallback is to upload whole and split server-side: a design that only works on current clients is not finished.

## Speed: upload centers near users

Uploading from Singapore to a data center in Virginia pays the full round trip on every chunk. Put upload endpoints around the world, which the CDN already provides, since CDNs accept uploads as well as serving downloads.

Same reasoning as the CDN for playback, in the other direction.

## Speed: queues between stages

The naive pipeline is a chain: download, encode, upload to CDN, each stage waiting on the previous, so the whole runs at the sum of the stages. Put message queues between them and the encoding module reads from a queue rather than waiting on the download module, so each stage proceeds and scales on its own queue depth.

This is Part 1's queue lesson applied inside a pipeline rather than between services, and the benefit is the same: stages fail and scale independently.

## Safety: pre-signed upload URLs

A client should not upload through your API servers. That puts gigabytes of video through machines built for JSON, and it means your servers are the bandwidth bottleneck.

Instead:

1. The client asks an API server for an upload URL.
2. The API server returns a pre-signed URL granting write access to one specific object for a limited time.
3. The client uploads directly to blob storage using it.

Your API servers handle a small authorization request; the bytes go straight to storage. Amazon calls these pre-signed URLs, Azure calls them shared access signatures.

The safety property is that the URL authorizes exactly one object for a bounded window, so a leaked URL is a small, expiring hole rather than write access to your bucket.

## Safety: protecting the video

Three levels, in increasing strength and cost:

- **Visual watermarking.** An overlay identifying the owner. Deters casual reuse only.
- **AES encryption** with an authorization policy. The video is encrypted at rest and decrypted at playback for authorized viewers.
- **DRM**: Apple FairPlay, Google Widevine, Microsoft PlayReady. Strongest, and it constrains which players and devices work, so it costs you reach.

## Cost: the long tail

The $150,000 a day. Views follow a long-tail distribution, so optimizations follow from that:

- **Serve only popular videos from the CDN**, and the tail from your own storage. The tail is where the CDN's value is lowest, because those videos are rarely in an edge cache anyway.
- **Do not pre-encode every version for unpopular videos.** Encode short ones on demand when someone actually watches.
- **Distribute regionally.** A video popular only in Brazil does not need to be in European edges.
- **Build your own CDN and partner with ISPs**, as Netflix does. An enormous project, and it pays off at enormous scale.

Each is a bet on a measured access pattern, so say you would analyze historical viewing first.

## Predict, then verify

You stop pre-encoding unpopular videos and encode on demand. A video that has had four views in a year is linked from a popular site and gets 50,000 views in an hour. What happens?

Answer: the first viewer waits for a transcode, which for a short video is seconds and for a long one is minutes, and in the meantime tens of thousands of requests arrive for a video that is still encoding. Without coordination, each of those triggers its own transcode job, and 50,000 duplicate encodes of the same video will saturate the transcoding fleet and delay every legitimate upload in the queue. That is a cache stampede with an expensive miss path, exactly the pattern from the caching section, and the defense is the same one: let the first request start the encode and have the others wait on its result rather than starting their own. The second defense is to promote on the first miss rather than the thousandth, so once a cold video is encoded it goes to the CDN and normal caching takes over. Worth noting the failure only exists because the miss path is minutes rather than milliseconds, which is the general lesson: stampede protection matters in proportion to how expensive a miss is, and a design with a very expensive miss needs it from the start rather than as a later optimization.
