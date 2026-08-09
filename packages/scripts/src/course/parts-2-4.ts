import { asyncFromScratch } from "./sections/async-from-scratch"
import { concurrencyPatterns } from "./sections/concurrency-patterns"
import { pinningSection } from "./sections/pinning"
import { rustAi } from "./sections/rust-ai"
import { rustCli } from "./sections/rust-cli"
import { rustDatabases } from "./sections/rust-databases"
import { rustDocker } from "./sections/rust-docker"
import { rustEventDriven } from "./sections/rust-event-driven"
import { rustGrpc } from "./sections/rust-grpc"
import { rustKubernetes } from "./sections/rust-kubernetes"
import { rustObservability } from "./sections/rust-observability"
import { rustPerformance } from "./sections/rust-performance"
import { rustQueues } from "./sections/rust-queues"
import { rustTypescript } from "./sections/rust-typescript"
import { rustWasm } from "./sections/rust-wasm"
import { rustWeb3 } from "./sections/rust-web3"
import { rustWebrtc } from "./sections/rust-webrtc"
import { rustWebsockets } from "./sections/rust-websockets"
import { streamsCancellation } from "./sections/streams-cancellation"
import { threadsSendSync } from "./sections/threads-send-sync"
import { tokioSection } from "./sections/tokio"
import { z2pAxumPort } from "./sections/z2p-axum-port"
import { z2pConfirmationEmails } from "./sections/z2p-confirmation-emails"
import { z2pErrorHandling } from "./sections/z2p-error-handling"
import { z2pFaultTolerance } from "./sections/z2p-fault-tolerance"
import { z2pFirstSubscriber } from "./sections/z2p-first-subscriber"
import { z2pGettingStarted } from "./sections/z2p-getting-started"
import { z2pGoingLive } from "./sections/z2p-going-live"
import { z2pNewsletterDelivery } from "./sections/z2p-newsletter-delivery"
import { z2pSecuringApi } from "./sections/z2p-securing-api"
import { z2pTelemetry } from "./sections/z2p-telemetry"
import { z2pTypeDriven } from "./sections/z2p-type-driven"
import type { PartSeed } from "./types"

// Parts 2-4: on the map as the six-month arc, gaining lessons as they are
// written. Section slugs are stable; do not rename them once progress exists.

export const part2: PartSeed = {
  slug: "part-2",
  title: "Concurrency and async",
  description:
    "Threads and Send/Sync first, then async built from scratch (Future, poll, wakers, a hand-made executor), then tokio and the patterns above it.",
  sections: [
    threadsSendSync,
    asyncFromScratch,
    tokioSection,
    pinningSection,
    streamsCancellation,
    concurrencyPatterns,
  ],
}

export const part3: PartSeed = {
  slug: "part-3",
  title: "Zero to production",
  description:
    "The book, chapter by chapter: an email newsletter API from empty repository to deployed, fault-tolerant service, ending with an axum port.",
  sections: [
    z2pGettingStarted,
    z2pFirstSubscriber,
    z2pTelemetry,
    z2pGoingLive,
    z2pTypeDriven,
    z2pConfirmationEmails,
    z2pErrorHandling,
    z2pNewsletterDelivery,
    z2pSecuringApi,
    z2pFaultTolerance,
    z2pAxumPort,
  ],
}

export const part4: PartSeed = {
  slug: "part-4",
  title: "Rust in the wild",
  description:
    "The ecosystem, one deep section at a time, each extending the newsletter service where it fits.",
  sections: [
    rustDocker,
    rustKubernetes,
    rustQueues,
    rustEventDriven,
    rustWebsockets,
    rustWebrtc,
    rustGrpc,
    rustDatabases,
    rustAi,
    rustWasm,
    rustWeb3,
    rustTypescript,
    rustCli,
    rustObservability,
    rustPerformance,
  ],
}
