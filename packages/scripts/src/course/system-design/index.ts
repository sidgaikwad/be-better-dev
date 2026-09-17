import type { CourseSeed } from "../types"
import { part1, part2, part3, part4 } from "./parts"

export const systemDesignCourse: CourseSeed = {
  slug: "system-design",
  title: "System Design: Interview to Production",
  description:
    "System design from first principles to the whiteboard, with Alex Xu's two volumes as the spine: how a system grows, the building blocks it grows out of, and thirty systems designed end to end.",
  parts: [part1, part2, part3, part4],
}
