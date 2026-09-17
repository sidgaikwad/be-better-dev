YouTube is two products that share a database. Uploading is a slow, expensive, asynchronous pipeline. Watching is a fast, cheap, enormously high-volume read. Almost nothing they need is the same.

## Scope

- Upload and watch, nothing else
- Mobile, web, smart TV
- 5 million daily active users, 30 minutes each
- International
- Most formats and resolutions accepted
- Encryption required
- Videos up to 1 GB
- Existing cloud services are fair game

That last point deserves a sentence. Nobody builds their own blob storage or CDN in an interview, and nobody should: Netflix runs on Amazon's cloud and Facebook uses Akamai. Naming blob storage and moving on is the right level of detail, and going deeper on how to build one is spending your time in the wrong place.

## The estimate

Storage:

```text
uploaders     = 5 million × 10% = 500,000 per day
video size    = 300 MB average
daily storage = 500,000 × 300 MB = 150 TB per day
```

Then the number that changes the design:

```text
views per day = 5 million × 5 = 25 million
data served   = 25 million × 0.3 GB = 7.5 PB per day
CDN at $0.02/GB = 7,500,000 GB × $0.02 = $150,000 per day
```

$150,000 a day. $55 million a year, for bandwidth alone, before storage, transcoding or engineers.

That number is the most important output of the estimate, and it is why the cost-saving lesson exists. In most designs in this course the constraint is latency or throughput. Here the binding constraint is the invoice, and a design that ignores it is not a design anyone would ship.

## Three components

- **Client.** Browser, phone, TV.
- **CDN.** Videos stream from here, not from you.
- **API servers.** Everything else: signup, metadata, recommendations, issuing upload URLs.

Note what is absent from the streaming path. The API servers are not in it. A view does not touch your infrastructure at all beyond the initial page load, which is what makes 25 million views a day possible on a modest fleet, and what makes the CDN bill the dominant cost.

## Uploading

Two flows run in parallel.

**The video.** Uploaded to original storage, a blob store. Transcoding servers pick it up, produce the formats and resolutions, and write to transcoded storage, which is distributed to the CDN.

**The metadata.** Filename, size, format, owner. Goes straight to the metadata database and cache, without waiting for transcoding.

Parallel because they have wildly different durations. Metadata is a row write. Transcoding a 1 GB video is minutes of CPU. Making the metadata wait would mean a video does not exist in any listing until its transcoding finishes.

## Streaming

Streaming is not downloading. A download copies the file and then plays it; a stream delivers continuously so playback starts in a second or two and the rest arrives while you watch.

The protocols that do this are MPEG-DASH, Apple HLS, Microsoft Smooth Streaming and Adobe HDS. You do not need to recite their differences. What matters is knowing they exist, that they differ in which encodings and players they support, and that picking one is a compatibility decision driven by your client mix.

## Predict, then verify

The interviewer asks how to cut the $150,000 daily CDN bill in half. Where do you look first?

Answer: at what fraction of views the CDN is actually needed for, because video viewership follows a long tail. A small number of videos take most of the views, and an enormous number take almost none. Serving everything from the CDN means paying CDN rates for the long tail, where the CDN's whole value, a nearby cached copy, never materializes because nobody requests those videos often enough to keep them cached. So the first move is to serve popular videos from the CDN and the tail from your own storage servers, accepting worse latency for videos almost nobody watches. Before proposing it, say what you would measure: the view distribution, and where the crossover sits between CDN cost per GB and your own egress plus the latency you are willing to give up. This is the same skew as the news feed's celebrity problem and the URL shortener's viral link, and it points a third way: there it argued for special handling of the hot items, and here it argues for special handling of the cold ones.
