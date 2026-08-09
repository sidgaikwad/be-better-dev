// Authoring types for course content. The seed script (seed-course.ts) walks
// this tree and upserts it into the content tables; ids must be stable across
// reseeds because progress rows point at them.

export type QuizSeed = {
  // "predict" is asked before the learner has seen the answer in prose;
  // "mcq" is a recall check. Both grade the same way.
  kind?: "mcq" | "predict"
  prompt: string
  options: string[]
  answer: number
  explanation: string
}

export type LessonSeed = {
  // Globally unique; becomes the lesson id and the /learn/<slug> URL.
  slug: string
  title: string
  summary: string
  xp?: number
  // Markdown file under course/content/.
  contentFile: string
  quiz: QuizSeed[]
}

export type UnitSeed = {
  slug: string
  title: string
  description: string
  lessons: LessonSeed[]
}

export type SectionSeed = {
  slug: string
  title: string
  description: string
  badgeIcon: string
  badgeTitle: string
  // A section may ship before its lessons are written; it shows on the map
  // as upcoming and unlocks once content lands.
  units: UnitSeed[]
}

export type PartSeed = {
  slug: string
  title: string
  description: string
  sections: SectionSeed[]
}

export type CourseSeed = {
  slug: string
  title: string
  description: string
  parts: PartSeed[]
}
