import type { SectionSeed } from "../../types"

export const sdNearbyFriends: SectionSeed = {
  slug: "sd-nearby-friends",
  title: "Design nearby friends",
  description:
    "Locations that change every few seconds, a WebSocket per user, and a pub-sub fanout sized by how many friends are actually listening.",
  badgeIcon: "👥",
  badgeTitle: "Nearby",
  units: [],
}
