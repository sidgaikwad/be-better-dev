import type { PartSeed } from "../types"
import { sdAdClickAggregation } from "./sections/sd-ad-click-aggregation"
import { sdAutocomplete } from "./sections/sd-autocomplete"
import { sdCachingAndDelivery } from "./sections/sd-caching-and-delivery"
import { sdChatSystem } from "./sections/sd-chat-system"
import { sdConsistentHashing } from "./sections/sd-consistent-hashing"
import { sdDigitalWallet } from "./sections/sd-digital-wallet"
import { sdEmailService } from "./sections/sd-email-service"
import { sdEstimation } from "./sections/sd-estimation"
import { sdGoogleDrive } from "./sections/sd-google-drive"
import { sdGoogleMaps } from "./sections/sd-google-maps"
import { sdHotelReservation } from "./sections/sd-hotel-reservation"
import { sdInterviewFramework } from "./sections/sd-interview-framework"
import { sdKeyValueStore } from "./sections/sd-key-value-store"
import { sdLeaderboard } from "./sections/sd-leaderboard"
import { sdMessageQueue } from "./sections/sd-message-queue"
import { sdMetricsMonitoring } from "./sections/sd-metrics-monitoring"
import { sdNearbyFriends } from "./sections/sd-nearby-friends"
import { sdNewsFeed } from "./sections/sd-news-feed"
import { sdNotificationSystem } from "./sections/sd-notification-system"
import { sdObjectStorage } from "./sections/sd-object-storage"
import { sdPaymentSystem } from "./sections/sd-payment-system"
import { sdProximityService } from "./sections/sd-proximity-service"
import { sdRateLimiter } from "./sections/sd-rate-limiter"
import { sdScalingData } from "./sections/sd-scaling-data"
import { sdScalingJourney } from "./sections/sd-scaling-journey"
import { sdStockExchange } from "./sections/sd-stock-exchange"
import { sdUniqueId } from "./sections/sd-unique-id"
import { sdUrlShortener } from "./sections/sd-url-shortener"
import { sdWebCrawler } from "./sections/sd-web-crawler"
import { sdYoutube } from "./sections/sd-youtube"

// The four parts follow the two books: the primitives and the framework first,
// then the reusable building blocks, then the systems themselves. Section slugs
// are stable; do not rename them once progress exists.

export const part1: PartSeed = {
  slug: "part-1",
  title: "Foundations",
  description:
    "The vocabulary the rest of the course assumes: how a system grows from one box to many, what each piece costs, how to estimate before you design, and the four steps that turn a vague prompt into an architecture.",
  sections: [
    sdScalingJourney,
    sdCachingAndDelivery,
    sdScalingData,
    sdEstimation,
    sdInterviewFramework,
  ],
}

export const part2: PartSeed = {
  slug: "part-2",
  title: "Building blocks",
  description:
    "Four components that show up inside almost every later design. Each is a whole interview question on its own, and each one you understand deeply is a deep dive you no longer have to improvise.",
  sections: [sdRateLimiter, sdConsistentHashing, sdKeyValueStore, sdUniqueId],
}

export const part3: PartSeed = {
  slug: "part-3",
  title: "Systems on the whiteboard",
  description:
    "The classic questions, each designed end to end with the framework from Part 1: scope, high-level design, one deep dive that matters, and the tradeoff you would be asked to defend.",
  sections: [
    sdUrlShortener,
    sdWebCrawler,
    sdNotificationSystem,
    sdNewsFeed,
    sdChatSystem,
    sdAutocomplete,
    sdYoutube,
    sdGoogleDrive,
  ],
}

export const part4: PartSeed = {
  slug: "part-4",
  title: "Scale in the wild",
  description:
    "Volume 2: systems where the hard part is no longer the topology but correctness under load, from geospatial indexes and stream aggregation to ledgers that must balance to the cent.",
  sections: [
    sdProximityService,
    sdNearbyFriends,
    sdGoogleMaps,
    sdMessageQueue,
    sdMetricsMonitoring,
    sdAdClickAggregation,
    sdHotelReservation,
    sdEmailService,
    sdObjectStorage,
    sdLeaderboard,
    sdPaymentSystem,
    sdDigitalWallet,
    sdStockExchange,
  ],
}
