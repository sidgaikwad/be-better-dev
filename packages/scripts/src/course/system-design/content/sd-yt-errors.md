A transcode is a job that runs for minutes across many machines, and every stage of it can fail. That is a different reliability problem from a request that fails in 50 ms, because the user has already left and there is no response to return an error on.

## Two kinds of failure

**Recoverable.** A chunk failed to transcode, a worker died mid-task, storage timed out. The input is fine and the attempt was not, so retry. If it keeps failing past a bounded number of attempts, stop and report.

**Non-recoverable.** The file is not a video, the container is corrupt, the codec is unsupported. Retrying reproduces the failure exactly, so stop immediately, cancel the other tasks for that video, and tell the uploader.

Distinguishing them is the whole job, and the cost of getting it wrong runs both ways. Treating a corrupt file as recoverable burns the fleet retrying something that cannot work. Treating a dead worker as non-recoverable rejects a perfectly good upload.

The practical rule: a failure that is about the input is permanent, and a failure that is about the machine or the network is transient. When you cannot tell, retry a bounded number of times, because a few wasted attempts on a bad file cost less than rejecting a good one.

## The playbook

- **Upload fails.** Retry, and with chunked uploads only the failed chunk.
- **Split fails** on an old client. Fall back to uploading whole and splitting server-side.
- **Transcode fails.** Retry on a different worker, then declare the video failed.
- **Preprocessor fails.** Retry from the cached chunks in temporary storage rather than from the original upload.
- **CDN distribution fails.** Retry, and serve from origin storage in the meantime, which is slower and correct.
- **Completion handler fails.** The metadata is not updated, so the video stays in a processing state even though it is encoded. This one is worth naming because it produces the confusing case: the work is done and the system does not know it.

## Retries must be idempotent

Every retry above assumes running a task twice is harmless. That is not automatic, and it is the thing to design rather than assume.

A transcode writing to `video_123_720p.mp4` is idempotent: run it twice and the second overwrites the first with identical bytes. A transcode writing to `video_123_720p_<timestamp>.mp4` is not, because the retry leaves the failed partial output behind forever, and the storage bill grows with your failure rate.

Make the output path a function of the input, not of the attempt. Then a retry replaces rather than accumulates, and a partially written file from a crashed worker is overwritten by the retry rather than orphaned.

## Telling the uploader

An upload that fails after the user closed the tab needs somewhere to report to. The video's metadata row carries a status, and the client polls it or receives a notification, which is the notification system from earlier in this part.

Be specific in the message. "Processing failed" tells someone nothing they can act on, while "this file uses a codec we cannot read" tells them to re-export it. The distinction between recoverable and non-recoverable is exactly the information the uploader needs, so having made it, pass it on.

## Predict, then verify

A worker transcodes a chunk successfully, writes it to storage, then crashes before reporting completion. The scheduler retries on another worker. What is the harm?

Answer: wasted compute and nothing worse, provided the output path is derived from the input. The second worker re-encodes the same chunk and writes the same bytes to the same path, so the result is correct and you paid twice for one chunk. That is the right outcome and it is worth being explicit that you chose it: the alternative, having workers claim tasks with a lease and detecting completion by checking storage before re-running, saves the duplicate work and adds a coordination mechanism that can itself fail. At a low failure rate, paying for occasional duplicate chunks is cheaper than the machinery to avoid it. The cost only inverts when tasks are expensive and failures common, which is the general form of the decision: idempotent retry is the simple correct default, and deduplicating work is an optimization you justify with a failure rate rather than assume you need.
