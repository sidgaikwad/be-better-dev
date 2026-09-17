import type { SectionSeed } from "../../types"

export const sdYoutube: SectionSeed = {
  slug: "sd-youtube",
  title: "Design YouTube",
  description:
    "The transcoding DAG, uploading and streaming as two separate problems, CDN economics, and the safety net around a long-running job.",
  badgeIcon: "📺",
  badgeTitle: "Video",
  units: [
    {
      slug: "upload-and-stream",
      title: "Upload and stream",
      description: "Two flows with almost nothing in common, and the bill that shapes both.",
      lessons: [
        {
          slug: "sd-yt-estimate",
          title: "The bill is the constraint",
          summary:
            "150 TB a day of storage, $150,000 a day of CDN egress, and why the API servers are not in the streaming path at all.",
          contentFile: "sd-yt-estimate.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What makes this design different from most others in the course?",
              options: [
                "The read rate is higher than anything else",
                "The binding constraint is cost rather than latency or throughput",
                "It cannot use a cache",
                "The data does not fit on any number of machines",
              ],
              answer: 1,
              explanation:
                "7.5 PB a day of egress at $0.02/GB is $150,000 daily, $55 million a year for bandwidth alone. A design that ignores that is not one anyone would ship.",
            },
            {
              kind: "mcq",
              prompt: "Why do the video upload and the metadata update run in parallel?",
              options: [
                "To avoid a distributed transaction",
                "Their durations differ by orders of magnitude: metadata is a row write, transcoding is minutes of CPU",
                "The metadata database cannot accept blobs",
                "Because the CDN needs metadata before the video",
              ],
              answer: 1,
              explanation:
                "Making metadata wait would mean a video does not exist in any listing until transcoding finishes. Different durations, so different flows.",
            },
            {
              kind: "predict",
              prompt: "Where do you look first to halve the CDN bill?",
              options: [
                "Negotiating a lower per-GB rate",
                "At the long tail: serve popular videos from the CDN and rarely-watched ones from your own storage",
                "Reducing the default playback resolution",
                "Caching more aggressively at the edge",
              ],
              answer: 1,
              explanation:
                "The tail is where the CDN's value is lowest, since those videos are rarely in an edge cache anyway. Same skew as the celebrity problem and the viral link, pointing a third way: there it argued for special handling of hot items, here for special handling of cold ones.",
            },
          ],
        },
        {
          slug: "sd-yt-transcoding",
          title: "The transcoding DAG",
          summary:
            "Why raw uploads are unplayable, why the pipeline is a graph rather than a sequence, and why GOP chunking is the load-bearing decision.",
          contentFile: "sd-yt-transcoding.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why model transcoding as a DAG rather than a sequence?",
              options: [
                "DAGs are easier to retry",
                "Independent tasks run in parallel, and a config-defined graph means new requirements are config rather than code",
                "It guarantees exactly-once execution",
                "Sequences cannot express audio and video together",
              ],
              answer: 1,
              explanation:
                "Encoding four resolutions while generating a thumbnail is a much shorter critical path than doing them in order. Creators differ in whether they want watermarks or supply their own thumbnails, and a DAG absorbs that without pipeline changes.",
            },
            {
              kind: "mcq",
              prompt: "What does GOP chunking make possible?",
              options: [
                "Only parallel transcoding",
                "Parallel transcoding, resumable uploads, and adaptive bitrate switching mid-playback",
                "Only resumable uploads",
                "Encryption at rest",
              ],
              answer: 1,
              explanation:
                "Chunk boundaries align across encodings, so switching quality is just requesting the next chunk from a different one. It is the load-bearing decision rather than a preprocessing detail.",
            },
            {
              kind: "predict",
              prompt:
                "One chunk of a 500-chunk video fails permanently while 499 succeed. What is the state?",
              options: [
                "99.8% complete, playable with a brief gap",
                "Unplayable: partial success is not partial value, so completion must be gated on every chunk",
                "Playable at reduced quality",
                "Automatically re-split into fewer chunks",
              ],
              answer: 1,
              explanation:
                "Retry the chunk on a different worker before declaring failure, since the first failure may be the worker. At a 99.9% per-chunk success rate, a 500-chunk video has only a 61% chance of completing without any retry.",
            },
          ],
        },
      ],
    },
    {
      slug: "making-it-work",
      title: "Making it work",
      description: "Speed, safety and the invoice.",
      lessons: [
        {
          slug: "sd-yt-optimizations",
          title: "Speed, safety and cost",
          summary:
            "Chunked uploads and queues between stages, pre-signed URLs that keep video off your API servers, and the long-tail optimizations that cut the bill.",
          contentFile: "sd-yt-optimizations.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why upload through a pre-signed URL rather than through your API servers?",
              options: [
                "API servers cannot accept files over 1 GB",
                "It keeps gigabytes of video off machines built for JSON, and the URL authorizes one object for a bounded window",
                "Pre-signed URLs are faster to generate than sessions",
                "It avoids the load balancer",
              ],
              answer: 1,
              explanation:
                "Your API servers handle a small authorization request and the bytes go straight to blob storage. A leaked URL is a small expiring hole rather than write access to the bucket.",
            },
            {
              kind: "mcq",
              prompt: "What do message queues between pipeline stages change?",
              options: [
                "They guarantee ordering of chunks",
                "Stages stop waiting on each other, so each scales and fails independently on its own queue depth",
                "They remove the need for temporary storage",
                "They make transcoding idempotent",
              ],
              answer: 1,
              explanation:
                "The naive chain runs at the sum of its stages. This is Part 1's queue lesson applied inside a pipeline rather than between services.",
            },
            {
              kind: "predict",
              prompt:
                "Unpopular videos are encoded on demand. One gets 50,000 views in an hour after being linked. What breaks?",
              options: [
                "The CDN rejects the uncached video",
                "50,000 duplicate transcode jobs saturate the fleet and delay every legitimate upload",
                "The metadata database is overwhelmed",
                "Nothing: the first encode serves everyone",
              ],
              answer: 1,
              explanation:
                "A cache stampede with a miss path measured in minutes. Let the first request start the encode and have the rest wait on it, and promote on the first miss rather than the thousandth. Stampede protection matters in proportion to how expensive a miss is.",
            },
          ],
        },
        {
          slug: "sd-yt-errors",
          title: "When a long job fails",
          summary:
            "Recoverable against permanent, the per-component playbook, and why an output path derived from the attempt quietly leaks storage forever.",
          contentFile: "sd-yt-errors.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What is the practical rule for classifying a transcoding failure?",
              options: [
                "Retry everything a fixed number of times",
                "A failure about the input is permanent; a failure about the machine or network is transient",
                "Anything reported by a worker is transient",
                "Classify by how long the task ran before failing",
              ],
              answer: 1,
              explanation:
                "When you cannot tell, retry a bounded number of times: a few wasted attempts on a bad file cost less than rejecting a good one. Getting it wrong burns the fleet in one direction and rejects valid uploads in the other.",
            },
            {
              kind: "mcq",
              prompt:
                "Why must the transcode output path be derived from the input rather than the attempt?",
              options: [
                "Storage systems reject timestamped filenames",
                "A retry then replaces rather than accumulates, instead of orphaning every failed partial output forever",
                "It keeps the CDN cache key stable",
                "It allows chunks to be reordered",
              ],
              answer: 1,
              explanation:
                "Writing to a per-attempt path means the storage bill grows with your failure rate, and a partial file from a crashed worker is never cleaned up. Idempotency is designed rather than assumed.",
            },
            {
              kind: "predict",
              prompt:
                "A worker finishes a chunk and writes it, then crashes before reporting. The task is retried elsewhere. What is the harm?",
              options: [
                "The chunk is duplicated in the final video",
                "Wasted compute and nothing worse, given an input-derived output path",
                "The video is corrupted at that chunk boundary",
                "The scheduler deadlocks waiting for two completions",
              ],
              answer: 1,
              explanation:
                "The retry writes identical bytes to the same path. Avoiding the duplicate work needs leases and a storage check, which is coordination that can fail too. Idempotent retry is the simple correct default; deduplicating work is an optimization justified by a failure rate.",
            },
          ],
        },
      ],
    },
  ],
}
