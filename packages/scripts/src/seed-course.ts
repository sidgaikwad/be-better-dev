// Seed (or resync) the course content tables from packages/scripts/src/course.
// Content only: progress, XP, badges and reviews are never touched. Rows whose
// ids left the seed are deleted, so renaming a slug orphans progress; treat
// slugs as permanent.
//
//   bun run db:seed

import { course, coursePart, courseSection, courseUnit, db, lesson, quizItem } from "@packages/db"
import { notInArray } from "drizzle-orm"

import { rustCourse } from "./course"

const content = rustCourse

type Row = Record<string, unknown>
const partRows: Row[] = []
const sectionRows: Row[] = []
const unitRows: Row[] = []
const lessonRows: Row[] = []
const quizRows: Row[] = []

const seenSections = new Set<string>()
const seenLessons = new Set<string>()

for (const [pi, part] of content.parts.entries()) {
  const partId = `${content.slug}/${part.slug}`
  partRows.push({
    id: partId,
    courseId: content.slug,
    position: pi,
    title: part.title,
    description: part.description,
  })
  for (const [si, section] of part.sections.entries()) {
    if (seenSections.has(section.slug)) throw new Error(`duplicate section slug: ${section.slug}`)
    seenSections.add(section.slug)
    sectionRows.push({
      id: section.slug,
      partId,
      position: si,
      title: section.title,
      description: section.description,
      badgeIcon: section.badgeIcon,
      badgeTitle: section.badgeTitle,
    })
    for (const [ui, unit] of section.units.entries()) {
      const unitId = `${section.slug}/${unit.slug}`
      unitRows.push({
        id: unitId,
        sectionId: section.slug,
        position: ui,
        title: unit.title,
        description: unit.description,
      })
      for (const [li, lessonSeed] of unit.lessons.entries()) {
        if (seenLessons.has(lessonSeed.slug)) {
          throw new Error(`duplicate lesson slug: ${lessonSeed.slug}`)
        }
        seenLessons.add(lessonSeed.slug)
        const markdown = await Bun.file(
          `${import.meta.dir}/course/content/${lessonSeed.contentFile}`,
        ).text()
        lessonRows.push({
          id: lessonSeed.slug,
          unitId,
          position: li,
          title: lessonSeed.title,
          summary: lessonSeed.summary,
          content: markdown,
          xp: lessonSeed.xp ?? 20,
        })
        for (const [qi, quiz] of lessonSeed.quiz.entries()) {
          if (quiz.answer < 0 || quiz.answer >= quiz.options.length) {
            throw new Error(`answer index out of range in ${lessonSeed.slug} quiz ${qi + 1}`)
          }
          quizRows.push({
            id: `${lessonSeed.slug}#${qi + 1}`,
            lessonId: lessonSeed.slug,
            position: qi,
            kind: quiz.kind ?? "mcq",
            prompt: quiz.prompt,
            options: quiz.options,
            answerIndex: quiz.answer,
            explanation: quiz.explanation,
          })
        }
      }
    }
  }
}

await db
  .insert(course)
  .values({ id: content.slug, title: content.title, description: content.description })
  .onConflictDoUpdate({
    target: course.id,
    set: { title: content.title, description: content.description },
  })

for (const row of partRows) {
  const { id, ...set } = row as typeof coursePart.$inferInsert
  await db
    .insert(coursePart)
    .values({ id, ...set })
    .onConflictDoUpdate({ target: coursePart.id, set })
}
for (const row of sectionRows) {
  const { id, ...set } = row as typeof courseSection.$inferInsert
  await db
    .insert(courseSection)
    .values({ id, ...set })
    .onConflictDoUpdate({ target: courseSection.id, set })
}
for (const row of unitRows) {
  const { id, ...set } = row as typeof courseUnit.$inferInsert
  await db
    .insert(courseUnit)
    .values({ id, ...set })
    .onConflictDoUpdate({ target: courseUnit.id, set })
}
for (const row of lessonRows) {
  const { id, ...set } = row as typeof lesson.$inferInsert
  await db
    .insert(lesson)
    .values({ id, ...set })
    .onConflictDoUpdate({ target: lesson.id, set })
}
for (const row of quizRows) {
  const { id, ...set } = row as typeof quizItem.$inferInsert
  await db
    .insert(quizItem)
    .values({ id, ...set })
    .onConflictDoUpdate({ target: quizItem.id, set })
}

// Remove rows that left the seed, children first so nothing dangles even
// without relying on cascades.
await db.delete(quizItem).where(
  notInArray(
    quizItem.id,
    quizRows.map((r) => r.id as string),
  ),
)
await db.delete(lesson).where(
  notInArray(
    lesson.id,
    lessonRows.map((r) => r.id as string),
  ),
)
await db.delete(courseUnit).where(
  notInArray(
    courseUnit.id,
    unitRows.map((r) => r.id as string),
  ),
)
await db.delete(courseSection).where(
  notInArray(
    courseSection.id,
    sectionRows.map((r) => r.id as string),
  ),
)
await db.delete(coursePart).where(
  notInArray(
    coursePart.id,
    partRows.map((r) => r.id as string),
  ),
)
await db.delete(course).where(notInArray(course.id, [content.slug]))

console.log(
  `seeded: ${partRows.length} parts, ${sectionRows.length} sections, ${unitRows.length} units, ${lessonRows.length} lessons, ${quizRows.length} quiz items`,
)
process.exit(0)
