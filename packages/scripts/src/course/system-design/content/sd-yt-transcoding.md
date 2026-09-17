An uploaded video is unusable as uploaded. It is in whatever format the recording device produced, at one resolution, possibly hundreds of gigabytes an hour. Transcoding converts it into the set of formats your clients can actually play.

## Why it is mandatory

- **Raw video is enormous.** An hour of high definition at 60 frames per second can be hundreds of GB.
- **Devices support different formats.** A format a phone plays may not play on a smart TV.
- **Bandwidth varies.** A viewer on fibre should get a high bitrate; one on a train should get a low one.
- **Conditions change mid-playback.** Quality has to switch without interrupting the stream, which means the alternatives must already exist as separate encodings.

An encoding has two parts: a **container** (`.mp4`, `.mov`, `.avi`), which holds video, audio and metadata together, and a **codec** (H.264, VP9, HEVC), the compression algorithm inside it.

## Why it is a DAG

Transcoding is not one operation. A video needs inspecting for malformation, encoding at several resolutions, a thumbnail, maybe a watermark, and its audio handled separately. Some steps depend on others and some do not, which is a dependency graph.

Facebook's video engine models this as a directed acyclic graph, and it is the right abstraction for two reasons.

**Parallelism.** Independent tasks run at the same time. Splitting into video, audio and metadata, then encoding video at four resolutions while the thumbnail is generated, is a much shorter critical path than a sequence.

**Configurability.** Creators have different needs: some want watermarks, some supply their own thumbnails, some upload in 4K. A DAG defined by a configuration file means a new processing requirement is a config change rather than a code change in the pipeline.

## The architecture

Six components:

- **Preprocessor.** Splits the video into Group of Pictures chunks, each independently playable and a few seconds long. Generates the DAG from configuration. Caches chunks in temporary storage so a failure can retry from there rather than from the original upload.
- **DAG scheduler.** Splits the graph into stages and queues each stage's tasks.
- **Resource manager.** Holds a task queue by priority, a worker queue by utilization, and a running queue. Its scheduler takes the highest-priority task, picks the best available worker, and records the pairing.
- **Task workers.** Execute tasks. Different workers handle different task types.
- **Temporary storage.** Metadata in memory since it is small and hot; video and audio in blob storage. Freed when the video completes.
- **Encoded video.** The output, `funny_720p.mp4` and its siblings.

## GOP splitting is the key idea

Chunking into independently playable segments is what makes everything else possible, and it is worth recognizing as the load-bearing decision rather than a preprocessing detail.

It makes transcoding parallel: a two-hour video becomes hundreds of chunks encoded simultaneously on different machines, turning hours of serial work into minutes.

It makes uploads resumable: a failure at 90% resumes from the last chunk rather than restarting.

And it makes adaptive bitrate possible: a player switching quality mid-video is just requesting the next chunk from a different encoding, which works precisely because chunk boundaries align across encodings.

## Predict, then verify

You parallelize transcoding by encoding each GOP chunk on a different worker. One chunk of a 500-chunk video fails permanently. What is the state of the video, and what should happen?

Answer: 499 chunks are encoded and the video is unplayable, because a gap makes the stream break at that point rather than degrade. This is the awkward property of a parallel pipeline over a sequential artifact: partial success is not partial value, and the work is only worth anything when all of it finishes. So the completion event has to be gated on every chunk, and "499 of 500 done" is a failure rather than 99.8% progress. That points at the error handling the design needs: retry a failing chunk several times on a different worker, since the first failure may be the worker rather than the chunk, and only then declare the video failed and tell the uploader. It also argues for keeping the preprocessor's cached chunks until completion, so a retry re-encodes one chunk rather than re-splitting the source. The general shape worth naming: when parallel work assembles into one artifact, the pipeline's success rate is the per-task rate raised to the number of tasks, so a 99.9% per-chunk success rate gives a 500-chunk video only a 61% chance of completing without a retry.
