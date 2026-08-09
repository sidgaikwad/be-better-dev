import { relations } from "drizzle-orm"
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { user } from "@/schema/auth"

// Content tables. Rows are authored and seeded from packages/scripts/src/course,
// so ids are human-readable slugs rather than generated uuids: stable across
// reseeds, and progress rows keep pointing at the same lesson.

export const course = pgTable("course", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const coursePart = pgTable(
  "course_part",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
  },
  (table) => [index("coursePart_courseId_idx").on(table.courseId)],
)

export const courseSection = pgTable(
  "course_section",
  {
    id: text("id").primaryKey(),
    partId: text("part_id")
      .notNull()
      .references(() => coursePart.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    // Completing every lesson in the section awards this badge.
    badgeIcon: text("badge_icon").notNull(),
    badgeTitle: text("badge_title").notNull(),
  },
  (table) => [index("courseSection_partId_idx").on(table.partId)],
)

export const courseUnit = pgTable(
  "course_unit",
  {
    id: text("id").primaryKey(),
    sectionId: text("section_id")
      .notNull()
      .references(() => courseSection.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
  },
  (table) => [index("courseUnit_sectionId_idx").on(table.sectionId)],
)

export const lesson = pgTable(
  "lesson",
  {
    id: text("id").primaryKey(),
    unitId: text("unit_id")
      .notNull()
      .references(() => courseUnit.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    // Markdown, rendered by the lesson player.
    content: text("content").notNull(),
    xp: integer("xp").default(20).notNull(),
  },
  (table) => [index("lesson_unitId_idx").on(table.unitId)],
)

export const quizItem = pgTable(
  "quiz_item",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    // "mcq" is a recall check after the lesson; "predict" is asked the same way
    // but framed before the reveal (the lesson text contains the answer).
    kind: text("kind").default("mcq").notNull(),
    prompt: text("prompt").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    answerIndex: integer("answer_index").notNull(),
    explanation: text("explanation").notNull(),
  },
  (table) => [index("quizItem_lessonId_idx").on(table.lessonId)],
)

// Progress and gamification tables, one row space per user. Never touched by
// the content seeder.

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    correct: integer("correct").notNull(),
    total: integer("total").notNull(),
    seconds: integer("seconds").default(0).notNull(),
    completedAt: timestamp("completed_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("lessonProgress_userId_lessonId_uidx").on(table.userId, table.lessonId),
    index("lessonProgress_lessonId_idx").on(table.lessonId),
  ],
)

export const xpEvent = pgTable(
  "xp_event",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    // "lesson" | "review" | "badge"
    kind: text("kind").notNull(),
    // The lesson/badge/quiz item behind the award, for dedup and display.
    refId: text("ref_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // The leaderboard and stats both sum per user over a time window.
    index("xpEvent_userId_createdAt_idx").on(table.userId, table.createdAt),
  ],
)

export const activityDay = pgTable(
  "activity_day",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    xp: integer("xp").default(0).notNull(),
    lessons: integer("lessons").default(0).notNull(),
    seconds: integer("seconds").default(0).notNull(),
  },
  (table) => [uniqueIndex("activityDay_userId_day_uidx").on(table.userId, table.day)],
)

export const badgeAward = pgTable(
  "badge_award",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    badge: text("badge").notNull(),
    title: text("title").notNull(),
    icon: text("icon").notNull(),
    awardedAt: timestamp("awarded_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("badgeAward_userId_badge_uidx").on(table.userId, table.badge)],
)

export const reviewItem = pgTable(
  "review_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    quizItemId: text("quiz_item_id")
      .notNull()
      .references(() => quizItem.id, { onDelete: "cascade" }),
    dueAt: timestamp("due_at").notNull(),
    intervalDays: integer("interval_days").default(2).notNull(),
    lastResult: boolean("last_result"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("reviewItem_userId_quizItemId_uidx").on(table.userId, table.quizItemId),
    index("reviewItem_userId_dueAt_idx").on(table.userId, table.dueAt),
  ],
)

export const courseRelations = relations(course, ({ many }) => ({
  parts: many(coursePart),
}))

export const coursePartRelations = relations(coursePart, ({ one, many }) => ({
  course: one(course, { fields: [coursePart.courseId], references: [course.id] }),
  sections: many(courseSection),
}))

export const courseSectionRelations = relations(courseSection, ({ one, many }) => ({
  part: one(coursePart, { fields: [courseSection.partId], references: [coursePart.id] }),
  units: many(courseUnit),
}))

export const courseUnitRelations = relations(courseUnit, ({ one, many }) => ({
  section: one(courseSection, {
    fields: [courseUnit.sectionId],
    references: [courseSection.id],
  }),
  lessons: many(lesson),
}))

export const lessonRelations = relations(lesson, ({ one, many }) => ({
  unit: one(courseUnit, { fields: [lesson.unitId], references: [courseUnit.id] }),
  quizItems: many(quizItem),
}))

export const quizItemRelations = relations(quizItem, ({ one }) => ({
  lesson: one(lesson, { fields: [quizItem.lessonId], references: [lesson.id] }),
}))
