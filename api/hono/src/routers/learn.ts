import { sValidator } from "@hono/standard-validator"
import type { Session } from "@packages/auth"
import {
  activityDay,
  badgeAward,
  course,
  coursePart,
  courseSection,
  courseUnit,
  db,
  lesson,
  lessonProgress,
  quizItem,
  reviewItem,
  user,
  xpEvent,
} from "@packages/db"
import { and, asc, eq, gte, inArray, lte, sql } from "drizzle-orm"
import { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"
import { z } from "zod"

import {
  ApiError,
  authErrorResponses,
  notFoundErrorResponses,
  validationErrorResponses,
} from "@/lib/error"
import {
  addDays,
  dayKey,
  FIRST_LESSON_BADGE,
  levelForXp,
  MAX_LESSON_SECONDS,
  nextReviewInterval,
  REVIEW_FIRST_INTERVAL_DAYS,
  STREAK_BADGES,
  streakFrom,
  XP_PER_BADGE,
  XP_PER_REVIEW,
  XP_PERFECT_BONUS,
  type MilestoneBadge,
} from "@/lib/gamify"

const lessonNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  xp: z.number(),
  completed: z.boolean(),
  unlocked: z.boolean(),
})

const unitNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  lessons: z.array(lessonNodeSchema),
})

const sectionNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  badgeIcon: z.string(),
  badgeTitle: z.string(),
  earned: z.boolean(),
  lessonsTotal: z.number(),
  lessonsDone: z.number(),
  units: z.array(unitNodeSchema),
})

const partNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  sections: z.array(sectionNodeSchema),
})

const quizPublicSchema = z.object({
  id: z.string(),
  kind: z.string(),
  prompt: z.string(),
  options: z.array(z.string()),
})

const gradedItemSchema = z.object({
  quizItemId: z.string(),
  correct: z.boolean(),
  chosenIndex: z.number(),
  correctIndex: z.number(),
  explanation: z.string(),
})

const badgeSchema = z.object({
  badge: z.string(),
  title: z.string(),
  icon: z.string(),
})

const completeBodySchema = z.object({
  // One entry per quiz item, in quiz order; -1 marks an unanswered item.
  answers: z.array(z.number().int().min(-1).max(15)).max(50),
  seconds: z.number().int().min(0).max(MAX_LESSON_SECONDS),
})

const reviewBodySchema = z.object({
  answers: z
    .array(z.object({ quizItemId: z.string(), answerIndex: z.number().int().min(0).max(15) }))
    .min(1)
    .max(50),
})

// Global lesson order: part, then section, then unit, then lesson position.
// The id tiebreaker keeps the order total even if positions ever collide.
async function orderedLessonIds(): Promise<string[]> {
  const rows = await db
    .select({ id: lesson.id })
    .from(lesson)
    .innerJoin(courseUnit, eq(lesson.unitId, courseUnit.id))
    .innerJoin(courseSection, eq(courseUnit.sectionId, courseSection.id))
    .innerJoin(coursePart, eq(courseSection.partId, coursePart.id))
    .orderBy(
      asc(coursePart.position),
      asc(courseSection.position),
      asc(courseUnit.position),
      asc(lesson.position),
      asc(lesson.id),
    )
  return rows.map((r) => r.id)
}

async function completedLessonIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ lessonId: lessonProgress.lessonId })
    .from(lessonProgress)
    .where(eq(lessonProgress.userId, userId))
  return new Set(rows.map((r) => r.lessonId))
}

async function userActivityDays(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ day: activityDay.day })
    .from(activityDay)
    .where(eq(activityDay.userId, userId))
  return new Set(rows.map((r) => r.day))
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

async function bumpActivity(
  tx: Tx,
  userId: string,
  delta: { xp: number; lessons: number; seconds: number },
) {
  await tx
    .insert(activityDay)
    .values({ userId, day: dayKey(), ...delta })
    .onConflictDoUpdate({
      target: [activityDay.userId, activityDay.day],
      set: {
        xp: sql`${activityDay.xp} + ${delta.xp}`,
        lessons: sql`${activityDay.lessons} + ${delta.lessons}`,
        seconds: sql`${activityDay.seconds} + ${delta.seconds}`,
      },
    })
}

// Insert-if-new; on first insert also grants the badge XP. Returns the badge
// when it was newly awarded so the client can celebrate it.
async function awardBadge(
  tx: Tx,
  userId: string,
  badge: MilestoneBadge,
): Promise<MilestoneBadge | null> {
  const inserted = await tx
    .insert(badgeAward)
    .values({ userId, badge: badge.badge, title: badge.title, icon: badge.icon })
    .onConflictDoNothing()
    .returning({ id: badgeAward.id })
  if (inserted.length === 0) return null
  await tx
    .insert(xpEvent)
    .values({ userId, amount: XP_PER_BADGE, kind: "badge", refId: badge.badge })
  await bumpActivity(tx, userId, { xp: XP_PER_BADGE, lessons: 0, seconds: 0 })
  return badge
}

export const learnRouter = new Hono<{ Variables: Session }>()
  .get(
    "/map",
    describeRoute({
      tags: ["Learn"],
      description:
        "The full course tree (parts, sections, units, lessons) with the current user's completion and unlock state",
      ...({
        "x-codeSamples": [
          {
            lang: "typescript",
            label: "hono/client",
            source: `import { apiClient, unwrap } from "@/lib/api/client"

const { data, error } = await unwrap(apiClient.v1.learn.map.$get())`,
          },
        ],
      } as object),
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  data: z.object({
                    course: z.object({
                      id: z.string(),
                      title: z.string(),
                      description: z.string(),
                    }),
                    parts: z.array(partNodeSchema),
                    totals: z.object({ lessons: z.number(), completed: z.number() }),
                  }),
                }),
              ),
            },
          },
        },
        ...authErrorResponses,
        ...notFoundErrorResponses,
      },
    }),
    async (c) => {
      const { id: userId } = c.get("user")
      const [courseRow] = await db.select().from(course).orderBy(asc(course.id)).limit(1)
      if (!courseRow) throw new ApiError(404, "NOT_FOUND", "No course seeded yet")

      const [parts, sections, units, lessons, done, badges] = await Promise.all([
        db
          .select()
          .from(coursePart)
          .where(eq(coursePart.courseId, courseRow.id))
          .orderBy(asc(coursePart.position)),
        db.select().from(courseSection).orderBy(asc(courseSection.position)),
        db.select().from(courseUnit).orderBy(asc(courseUnit.position)),
        db.select().from(lesson).orderBy(asc(lesson.position), asc(lesson.id)),
        completedLessonIds(userId),
        db
          .select({ badge: badgeAward.badge })
          .from(badgeAward)
          .where(eq(badgeAward.userId, userId)),
      ])
      const earnedBadges = new Set(badges.map((b) => b.badge))

      // Unlock rule: the first lesson in the global order is open; every other
      // lesson opens when its predecessor is completed.
      let previousCompleted = true
      const lessonState = new Map<string, { completed: boolean; unlocked: boolean }>()
      const unitsBySection = new Map<string, typeof units>()
      for (const u of units) {
        const list = unitsBySection.get(u.sectionId) ?? []
        list.push(u)
        unitsBySection.set(u.sectionId, list)
      }
      const lessonsByUnit = new Map<string, typeof lessons>()
      for (const l of lessons) {
        const list = lessonsByUnit.get(l.unitId) ?? []
        list.push(l)
        lessonsByUnit.set(l.unitId, list)
      }
      const sectionsByPart = new Map<string, typeof sections>()
      for (const s of sections) {
        const list = sectionsByPart.get(s.partId) ?? []
        list.push(s)
        sectionsByPart.set(s.partId, list)
      }
      for (const part of parts) {
        for (const section of sectionsByPart.get(part.id) ?? []) {
          for (const unit of unitsBySection.get(section.id) ?? []) {
            for (const l of lessonsByUnit.get(unit.id) ?? []) {
              const completed = done.has(l.id)
              lessonState.set(l.id, { completed, unlocked: previousCompleted || completed })
              previousCompleted = completed
            }
          }
        }
      }

      const data = {
        course: {
          id: courseRow.id,
          title: courseRow.title,
          description: courseRow.description,
        },
        parts: parts.map((part) => ({
          id: part.id,
          title: part.title,
          description: part.description,
          sections: (sectionsByPart.get(part.id) ?? []).map((section) => {
            const sectionUnits = (unitsBySection.get(section.id) ?? []).map((unit) => ({
              id: unit.id,
              title: unit.title,
              description: unit.description,
              lessons: (lessonsByUnit.get(unit.id) ?? []).map((l) => ({
                id: l.id,
                title: l.title,
                summary: l.summary,
                xp: l.xp,
                completed: lessonState.get(l.id)?.completed ?? false,
                unlocked: lessonState.get(l.id)?.unlocked ?? false,
              })),
            }))
            const flat = sectionUnits.flatMap((u) => u.lessons)
            return {
              id: section.id,
              title: section.title,
              description: section.description,
              badgeIcon: section.badgeIcon,
              badgeTitle: section.badgeTitle,
              earned: earnedBadges.has(`section:${section.id}`),
              lessonsTotal: flat.length,
              lessonsDone: flat.filter((l) => l.completed).length,
              units: sectionUnits,
            }
          }),
        })),
        totals: { lessons: lessons.length, completed: done.size },
      }
      return c.json({ data })
    },
  )
  .get(
    "/lesson/:id",
    describeRoute({
      tags: ["Learn"],
      description:
        "One lesson: markdown content, its quiz (without answers), breadcrumb context, and prev/next navigation",
      ...({
        "x-codeSamples": [
          {
            lang: "typescript",
            label: "hono/client",
            source: `import { apiClient, unwrap } from "@/lib/api/client"

const { data, error } = await unwrap(apiClient.v1.learn.lesson[":id"].$get({ param: { id: "rust-l1" } }))`,
          },
        ],
      } as object),
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  data: z.object({
                    lesson: z.object({
                      id: z.string(),
                      title: z.string(),
                      summary: z.string(),
                      content: z.string(),
                      xp: z.number(),
                    }),
                    quiz: z.array(quizPublicSchema),
                    context: z.object({
                      partTitle: z.string(),
                      sectionTitle: z.string(),
                      unitTitle: z.string(),
                    }),
                    nav: z.object({
                      prevId: z.string().nullable(),
                      nextId: z.string().nullable(),
                    }),
                    completed: z.boolean(),
                    unlocked: z.boolean(),
                  }),
                }),
              ),
            },
          },
        },
        ...authErrorResponses,
        ...notFoundErrorResponses,
      },
    }),
    async (c) => {
      const { id: userId } = c.get("user")
      const id = c.req.param("id")
      const [row] = await db
        .select({
          lesson: lesson,
          unitTitle: courseUnit.title,
          sectionTitle: courseSection.title,
          partTitle: coursePart.title,
        })
        .from(lesson)
        .innerJoin(courseUnit, eq(lesson.unitId, courseUnit.id))
        .innerJoin(courseSection, eq(courseUnit.sectionId, courseSection.id))
        .innerJoin(coursePart, eq(courseSection.partId, coursePart.id))
        .where(eq(lesson.id, id))
      if (!row) throw new ApiError(404, "NOT_FOUND", "Lesson not found")

      const [order, done, quiz] = await Promise.all([
        orderedLessonIds(),
        completedLessonIds(userId),
        db
          .select({
            id: quizItem.id,
            kind: quizItem.kind,
            prompt: quizItem.prompt,
            options: quizItem.options,
          })
          .from(quizItem)
          .where(eq(quizItem.lessonId, id))
          .orderBy(asc(quizItem.position), asc(quizItem.id)),
      ])
      const index = order.indexOf(id)
      const prevId = index > 0 ? order[index - 1] : null
      const nextId = index >= 0 && index < order.length - 1 ? order[index + 1] : null
      const unlocked = index <= 0 || done.has(order[index - 1]!) || done.has(id)

      const data = {
        lesson: {
          id: row.lesson.id,
          title: row.lesson.title,
          summary: row.lesson.summary,
          // A locked lesson answers its metadata but keeps the content back,
          // so the map can show what is coming without skipping the path.
          content: unlocked ? row.lesson.content : "",
          xp: row.lesson.xp,
        },
        quiz: unlocked ? quiz : [],
        context: {
          partTitle: row.partTitle,
          sectionTitle: row.sectionTitle,
          unitTitle: row.unitTitle,
        },
        nav: { prevId, nextId },
        completed: done.has(id),
        unlocked,
      }
      return c.json({ data })
    },
  )
  .post(
    "/lesson/:id/complete",
    describeRoute({
      tags: ["Learn"],
      description:
        "Grade the lesson quiz and record completion. First completion awards XP, updates the day's activity and streak, schedules spaced reviews, and can award badges.",
      ...({
        "x-codeSamples": [
          {
            lang: "typescript",
            label: "hono/client",
            source: `import { apiClient, unwrap } from "@/lib/api/client"

const { data, error } = await unwrap(
  apiClient.v1.learn.lesson[":id"].complete.$post({
    param: { id: "rust-l1" },
    json: { answers: [1, 0], seconds: 300 },
  }),
)`,
          },
        ],
      } as object),
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  data: z.object({
                    results: z.array(gradedItemSchema),
                    correct: z.number(),
                    total: z.number(),
                    xpAwarded: z.number(),
                    firstCompletion: z.boolean(),
                    badgesAwarded: z.array(badgeSchema),
                    streak: z.number(),
                  }),
                }),
              ),
            },
          },
        },
        ...authErrorResponses,
        ...notFoundErrorResponses,
        ...validationErrorResponses,
      },
    }),
    sValidator("json", completeBodySchema, (result) => {
      if (!result.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid completion payload", {
          issues: result.error,
        })
      }
    }),
    async (c) => {
      const { id: userId } = c.get("user")
      const id = c.req.param("id")
      const { answers, seconds } = c.req.valid("json")

      const [lessonRow] = await db.select().from(lesson).where(eq(lesson.id, id))
      if (!lessonRow) throw new ApiError(404, "NOT_FOUND", "Lesson not found")

      const quiz = await db
        .select()
        .from(quizItem)
        .where(eq(quizItem.lessonId, id))
        .orderBy(asc(quizItem.position), asc(quizItem.id))

      const results = quiz.map((item, i) => ({
        quizItemId: item.id,
        correct: answers[i] === item.answerIndex,
        chosenIndex: answers[i] ?? -1,
        correctIndex: item.answerIndex,
        explanation: item.explanation,
      }))
      const correct = results.filter((r) => r.correct).length
      const total = quiz.length
      const perfect = total > 0 && correct === total

      const [existing] = await db
        .select({ id: lessonProgress.id })
        .from(lessonProgress)
        .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, id)))
      const firstCompletion = !existing

      let xpAwarded = 0
      const badgesAwarded: MilestoneBadge[] = []

      await db.transaction(async (tx) => {
        if (!firstCompletion) {
          // Practice run: time still counts toward the day, nothing else moves.
          await bumpActivity(tx, userId, { xp: 0, lessons: 0, seconds })
          return
        }

        xpAwarded = lessonRow.xp + (perfect ? XP_PERFECT_BONUS : 0)
        await tx.insert(lessonProgress).values({ userId, lessonId: id, correct, total, seconds })
        await tx.insert(xpEvent).values({ userId, amount: xpAwarded, kind: "lesson", refId: id })
        await bumpActivity(tx, userId, { xp: xpAwarded, lessons: 1, seconds })

        // Every quiz item enters the review queue; misses come back sooner.
        if (quiz.length > 0) {
          await tx
            .insert(reviewItem)
            .values(
              results.map((r) => ({
                userId,
                quizItemId: r.quizItemId,
                dueAt: addDays(new Date(), r.correct ? REVIEW_FIRST_INTERVAL_DAYS : 1),
                intervalDays: REVIEW_FIRST_INTERVAL_DAYS,
                lastResult: r.correct,
              })),
            )
            .onConflictDoNothing()
        }

        // Badges: first lesson, completed section, streak thresholds.
        const [{ count: lessonsDone }] = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(lessonProgress)
          .where(eq(lessonProgress.userId, userId))
        if (lessonsDone === 1) {
          const b = await awardBadge(tx, userId, FIRST_LESSON_BADGE)
          if (b) badgesAwarded.push(b)
        }

        const [sectionRow] = await tx
          .select({ section: courseSection })
          .from(courseUnit)
          .innerJoin(courseSection, eq(courseUnit.sectionId, courseSection.id))
          .where(eq(courseUnit.id, lessonRow.unitId))
        if (sectionRow) {
          const [{ count: inSection }] = await tx
            .select({ count: sql<number>`count(*)::int` })
            .from(lesson)
            .innerJoin(courseUnit, eq(lesson.unitId, courseUnit.id))
            .where(eq(courseUnit.sectionId, sectionRow.section.id))
          const [{ count: doneInSection }] = await tx
            .select({ count: sql<number>`count(*)::int` })
            .from(lessonProgress)
            .innerJoin(lesson, eq(lessonProgress.lessonId, lesson.id))
            .innerJoin(courseUnit, eq(lesson.unitId, courseUnit.id))
            .where(
              and(
                eq(lessonProgress.userId, userId),
                eq(courseUnit.sectionId, sectionRow.section.id),
              ),
            )
          if (inSection > 0 && doneInSection >= inSection) {
            const b = await awardBadge(tx, userId, {
              badge: `section:${sectionRow.section.id}`,
              title: sectionRow.section.badgeTitle,
              icon: sectionRow.section.badgeIcon,
            })
            if (b) badgesAwarded.push(b)
          }
        }
      })

      const streak = streakFrom(await userActivityDays(userId))
      for (const { days, badge } of STREAK_BADGES) {
        if (streak >= days) {
          const b = await db.transaction((tx) => awardBadge(tx, userId, badge))
          if (b) badgesAwarded.push(b)
        }
      }
      xpAwarded += badgesAwarded.length * XP_PER_BADGE

      const data = { results, correct, total, xpAwarded, firstCompletion, badgesAwarded, streak }
      return c.json({ data })
    },
  )
  .get(
    "/stats",
    describeRoute({
      tags: ["Learn"],
      description:
        "Dashboard numbers for the current user: XP, level, streak, badges, time studied, and a year of daily activity for the heatmap",
      ...({
        "x-codeSamples": [
          {
            lang: "typescript",
            label: "hono/client",
            source: `import { apiClient, unwrap } from "@/lib/api/client"

const { data, error } = await unwrap(apiClient.v1.learn.stats.$get())`,
          },
        ],
      } as object),
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  data: z.object({
                    xp: z.number(),
                    level: z.number(),
                    levelInto: z.number(),
                    levelNext: z.number(),
                    streak: z.number(),
                    lessonsCompleted: z.number(),
                    lessonsTotal: z.number(),
                    secondsStudied: z.number(),
                    reviewsDue: z.number(),
                    badges: z.array(badgeSchema.extend({ awardedAt: z.string() })),
                    activity: z.array(
                      z.object({
                        day: z.string(),
                        xp: z.number(),
                        lessons: z.number(),
                        seconds: z.number(),
                      }),
                    ),
                  }),
                }),
              ),
            },
          },
        },
        ...authErrorResponses,
      },
    }),
    async (c) => {
      const { id: userId } = c.get("user")
      const yearAgo = dayKey(addDays(new Date(), -371))
      const [[xpRow], [secondsRow], [lessonsDoneRow], [lessonsTotalRow], [dueRow], badges, days] =
        await Promise.all([
          db
            .select({ total: sql<number>`coalesce(sum(${xpEvent.amount}), 0)::int` })
            .from(xpEvent)
            .where(eq(xpEvent.userId, userId)),
          db
            .select({ total: sql<number>`coalesce(sum(${activityDay.seconds}), 0)::int` })
            .from(activityDay)
            .where(eq(activityDay.userId, userId)),
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(lessonProgress)
            .where(eq(lessonProgress.userId, userId)),
          db.select({ count: sql<number>`count(*)::int` }).from(lesson),
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(reviewItem)
            .where(and(eq(reviewItem.userId, userId), lte(reviewItem.dueAt, new Date()))),
          db
            .select()
            .from(badgeAward)
            .where(eq(badgeAward.userId, userId))
            .orderBy(asc(badgeAward.awardedAt)),
          db
            .select()
            .from(activityDay)
            .where(and(eq(activityDay.userId, userId), gte(activityDay.day, yearAgo)))
            .orderBy(asc(activityDay.day)),
        ])

      const xp = xpRow?.total ?? 0
      const { level, into, next } = levelForXp(xp)
      const data = {
        xp,
        level,
        levelInto: into,
        levelNext: next,
        streak: streakFrom(new Set(days.map((d) => d.day))),
        lessonsCompleted: lessonsDoneRow?.count ?? 0,
        lessonsTotal: lessonsTotalRow?.count ?? 0,
        secondsStudied: secondsRow?.total ?? 0,
        reviewsDue: dueRow?.count ?? 0,
        badges: badges.map((b) => ({
          badge: b.badge,
          title: b.title,
          icon: b.icon,
          awardedAt: b.awardedAt.toISOString(),
        })),
        activity: days.map((d) => ({
          day: d.day,
          xp: d.xp,
          lessons: d.lessons,
          seconds: d.seconds,
        })),
      }
      return c.json({ data })
    },
  )
  .get(
    "/leaderboard",
    describeRoute({
      tags: ["Learn"],
      description: "Weekly XP leaderboard (top 20, week starts Monday) plus the caller's own rank",
      ...({
        "x-codeSamples": [
          {
            lang: "typescript",
            label: "hono/client",
            source: `import { apiClient, unwrap } from "@/lib/api/client"

const { data, error } = await unwrap(apiClient.v1.learn.leaderboard.$get())`,
          },
        ],
      } as object),
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  data: z.object({
                    entries: z.array(
                      z.object({
                        rank: z.number(),
                        userId: z.string(),
                        name: z.string(),
                        image: z.string().nullable(),
                        xp: z.number(),
                        me: z.boolean(),
                      }),
                    ),
                    me: z.object({ rank: z.number(), xp: z.number() }).nullable(),
                  }),
                }),
              ),
            },
          },
        },
        ...authErrorResponses,
      },
    }),
    async (c) => {
      const { id: userId } = c.get("user")
      // Monday 00:00 in server time.
      const now = new Date()
      const monday = addDays(now, -((now.getDay() + 6) % 7))
      monday.setHours(0, 0, 0, 0)

      const sums = await db
        .select({
          userId: xpEvent.userId,
          xp: sql<number>`sum(${xpEvent.amount})::int`,
          name: user.name,
          image: user.image,
        })
        .from(xpEvent)
        .innerJoin(user, eq(xpEvent.userId, user.id))
        .where(gte(xpEvent.createdAt, monday))
        .groupBy(xpEvent.userId, user.name, user.image)
        .orderBy(sql`sum(${xpEvent.amount}) desc`, asc(xpEvent.userId))

      const entries = sums.slice(0, 20).map((row, i) => ({
        rank: i + 1,
        userId: row.userId,
        name: row.name,
        image: row.image,
        xp: row.xp,
        me: row.userId === userId,
      }))
      const myIndex = sums.findIndex((row) => row.userId === userId)
      const me = myIndex === -1 ? null : { rank: myIndex + 1, xp: sums[myIndex]!.xp }
      return c.json({ data: { entries, me } })
    },
  )
  .get(
    "/review",
    describeRoute({
      tags: ["Learn"],
      description: "Spaced-review queue: quiz items due now (max 20), oldest due first",
      ...({
        "x-codeSamples": [
          {
            lang: "typescript",
            label: "hono/client",
            source: `import { apiClient, unwrap } from "@/lib/api/client"

const { data, error } = await unwrap(apiClient.v1.learn.review.$get())`,
          },
        ],
      } as object),
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  data: z.object({
                    items: z.array(
                      quizPublicSchema.extend({ lessonId: z.string(), lessonTitle: z.string() }),
                    ),
                    due: z.number(),
                  }),
                }),
              ),
            },
          },
        },
        ...authErrorResponses,
      },
    }),
    async (c) => {
      const { id: userId } = c.get("user")
      const now = new Date()
      const [rows, [dueRow]] = await Promise.all([
        db
          .select({
            id: quizItem.id,
            kind: quizItem.kind,
            prompt: quizItem.prompt,
            options: quizItem.options,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
          })
          .from(reviewItem)
          .innerJoin(quizItem, eq(reviewItem.quizItemId, quizItem.id))
          .innerJoin(lesson, eq(quizItem.lessonId, lesson.id))
          .where(and(eq(reviewItem.userId, userId), lte(reviewItem.dueAt, now)))
          .orderBy(asc(reviewItem.dueAt))
          .limit(20),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(reviewItem)
          .where(and(eq(reviewItem.userId, userId), lte(reviewItem.dueAt, now))),
      ])
      return c.json({ data: { items: rows, due: dueRow?.count ?? 0 } })
    },
  )
  .post(
    "/review/submit",
    describeRoute({
      tags: ["Learn"],
      description:
        "Grade a batch of due review answers, reschedule each item (right answers wait longer, wrong ones come back tomorrow), and award review XP",
      ...({
        "x-codeSamples": [
          {
            lang: "typescript",
            label: "hono/client",
            source: `import { apiClient, unwrap } from "@/lib/api/client"

const { data, error } = await unwrap(
  apiClient.v1.learn.review.submit.$post({
    json: { answers: [{ quizItemId: "q1", answerIndex: 2 }] },
  }),
)`,
          },
        ],
      } as object),
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  data: z.object({
                    results: z.array(gradedItemSchema),
                    correct: z.number(),
                    total: z.number(),
                    xpAwarded: z.number(),
                  }),
                }),
              ),
            },
          },
        },
        ...authErrorResponses,
        ...validationErrorResponses,
      },
    }),
    sValidator("json", reviewBodySchema, (result) => {
      if (!result.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid review payload", {
          issues: result.error,
        })
      }
    }),
    async (c) => {
      const { id: userId } = c.get("user")
      const { answers } = c.req.valid("json")
      const ids = [...new Set(answers.map((a) => a.quizItemId))]

      // Only items that are actually in this user's queue and due count;
      // anything else in the payload is silently dropped.
      const due = await db
        .select({ review: reviewItem, quiz: quizItem })
        .from(reviewItem)
        .innerJoin(quizItem, eq(reviewItem.quizItemId, quizItem.id))
        .where(
          and(
            eq(reviewItem.userId, userId),
            inArray(reviewItem.quizItemId, ids),
            lte(reviewItem.dueAt, addDays(new Date(), 1)),
          ),
        )
      const byId = new Map(due.map((d) => [d.quiz.id, d]))

      const results: {
        quizItemId: string
        correct: boolean
        chosenIndex: number
        correctIndex: number
        explanation: string
      }[] = []
      let xpAwarded = 0

      await db.transaction(async (tx) => {
        for (const answer of answers) {
          const item = byId.get(answer.quizItemId)
          if (!item) continue
          const correct = answer.answerIndex === item.quiz.answerIndex
          results.push({
            quizItemId: item.quiz.id,
            correct,
            chosenIndex: answer.answerIndex,
            correctIndex: item.quiz.answerIndex,
            explanation: item.quiz.explanation,
          })
          const interval = nextReviewInterval(item.review.intervalDays, correct)
          await tx
            .update(reviewItem)
            .set({
              intervalDays: interval,
              dueAt: addDays(new Date(), correct ? interval : 1),
              lastResult: correct,
            })
            .where(eq(reviewItem.id, item.review.id))
          if (correct) {
            xpAwarded += XP_PER_REVIEW
            await tx
              .insert(xpEvent)
              .values({ userId, amount: XP_PER_REVIEW, kind: "review", refId: item.quiz.id })
          }
        }
        if (xpAwarded > 0) await bumpActivity(tx, userId, { xp: xpAwarded, lessons: 0, seconds: 0 })
      })

      const correct = results.filter((r) => r.correct).length
      return c.json({ data: { results, correct, total: results.length, xpAwarded } })
    },
  )
