import type { CourseSeed } from "../types"
import { part1, part2, part3, part4, part5, part6, part7 } from "./parts"

export const productManagementCourse: CourseSeed = {
  slug: "product-management",
  title: "Product Management: Idea to Market",
  description:
    "Product management from the first customer conversation to a launched, measured product, with Intellipaat's full product management course as the spine and the field's primary sources filling it in: discovery, strategy, building, measuring, and going to market.",
  parts: [part1, part2, part3, part4, part5, part6, part7],
}
