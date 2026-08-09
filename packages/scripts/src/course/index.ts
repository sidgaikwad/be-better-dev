import { part1 } from "./part-1"
import { part2, part3, part4 } from "./parts-2-4"
import type { CourseSeed } from "./types"

export const rustCourse: CourseSeed = {
  slug: "rust",
  title: "Rust: Zero to Production",
  description:
    "Rust from first principles to production, with Zero to Production in Rust as the spine: language, machine, system, and the ecosystem around it.",
  parts: [part1, part2, part3, part4],
}
