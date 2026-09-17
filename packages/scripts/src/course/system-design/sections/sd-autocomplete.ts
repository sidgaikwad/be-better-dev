import type { SectionSeed } from "../../types"

export const sdAutocomplete: SectionSeed = {
  slug: "sd-autocomplete",
  title: "Design search autocomplete",
  description:
    "A trie with the top k cached at every node, how the data gathering pipeline rebuilds it, and why the browser cache carries most of the load.",
  badgeIcon: "🔎",
  badgeTitle: "Autocomplete",
  units: [],
}
