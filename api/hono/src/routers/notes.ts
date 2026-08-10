import { sValidator } from "@hono/standard-validator"
import type { Session } from "@packages/auth"
import { db, lesson, note } from "@packages/db"
import { and, desc, eq, isNull } from "drizzle-orm"
import { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"
import { z } from "zod"

import {
  ApiError,
  authErrorResponses,
  notFoundErrorResponses,
  validationErrorResponses,
} from "@/lib/error"

// Sticky-note bodies are editor HTML, so they are capped rather than trusted
// for length; the client sanitizes on render.
const MAX_BODY = 20_000
const MAX_QUOTE = 2_000

const noteSchema = z.object({
  id: z.string(),
  lessonId: z.string().nullable(),
  lessonTitle: z.string().nullable(),
  quote: z.string().nullable(),
  prefix: z.string().nullable(),
  suffix: z.string().nullable(),
  occurrence: z.number(),
  body: z.string(),
  color: z.string(),
  fontFamily: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const createSchema = z.object({
  lessonId: z.string().max(200).nullable().optional(),
  quote: z.string().max(MAX_QUOTE).nullable().optional(),
  prefix: z.string().max(MAX_QUOTE).nullable().optional(),
  suffix: z.string().max(MAX_QUOTE).nullable().optional(),
  occurrence: z.number().int().min(0).max(10_000).optional(),
  body: z.string().min(1).max(MAX_BODY),
  color: z.string().max(32).optional(),
  fontFamily: z.string().max(120).nullable().optional(),
})

const updateSchema = z.object({
  body: z.string().min(1).max(MAX_BODY).optional(),
  color: z.string().max(32).optional(),
  fontFamily: z.string().max(120).nullable().optional(),
})

type Row = typeof note.$inferSelect & { lessonTitle?: string | null }

const toDto = (row: Row) => ({
  id: row.id,
  lessonId: row.lessonId,
  lessonTitle: row.lessonTitle ?? null,
  quote: row.quote,
  prefix: row.prefix,
  suffix: row.suffix,
  occurrence: row.occurrence,
  body: row.body,
  color: row.color,
  fontFamily: row.fontFamily,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

export const notesRouter = new Hono<{ Variables: Session }>()
  .get(
    "/",
    describeRoute({
      tags: ["Notes"],
      description:
        "List the caller's notes, newest first. `lessonId` narrows to one lesson; `scope=global` returns only notes attached to no lesson.",
      ...({
        "x-codeSamples": [
          {
            lang: "typescript",
            label: "hono/client",
            source: `import { apiClient, unwrap } from "@/lib/api/client"

const { data, error } = await unwrap(apiClient.v1.notes.$get({ query: { lessonId: "one-owner" } }))`,
          },
        ],
      } as object),
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: resolver(z.object({ data: z.object({ notes: z.array(noteSchema) }) })),
            },
          },
        },
        ...authErrorResponses,
      },
    }),
    async (c) => {
      const { id: userId } = c.get("user")
      const lessonId = c.req.query("lessonId")
      const scope = c.req.query("scope")

      const where = lessonId
        ? and(eq(note.userId, userId), eq(note.lessonId, lessonId))
        : scope === "global"
          ? and(eq(note.userId, userId), isNull(note.lessonId))
          : eq(note.userId, userId)

      const rows = await db
        .select({ note, lessonTitle: lesson.title })
        .from(note)
        .leftJoin(lesson, eq(note.lessonId, lesson.id))
        .where(where)
        .orderBy(desc(note.createdAt))

      const notes = rows.map((r) => toDto({ ...r.note, lessonTitle: r.lessonTitle }))
      return c.json({ data: { notes } })
    },
  )
  .post(
    "/",
    describeRoute({
      tags: ["Notes"],
      description:
        "Create a note. Omit `lessonId` for a global note; omit `quote` to attach it to the lesson as a whole rather than a passage.",
      ...({
        "x-codeSamples": [
          {
            lang: "typescript",
            label: "hono/client",
            source: `import { apiClient, unwrap } from "@/lib/api/client"

const { data, error } = await unwrap(
  apiClient.v1.notes.$post({ json: { lessonId: "one-owner", quote: "a move is a memcpy", body: "<p>remember this</p>" } }),
)`,
          },
        ],
      } as object),
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: resolver(z.object({ data: z.object({ note: noteSchema }) })),
            },
          },
        },
        ...authErrorResponses,
        ...notFoundErrorResponses,
        ...validationErrorResponses,
      },
    }),
    sValidator("json", createSchema, (result) => {
      if (!result.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid note", { issues: result.error })
      }
    }),
    async (c) => {
      const { id: userId } = c.get("user")
      const input = c.req.valid("json")

      // A note naming a lesson that does not exist would be unreachable from
      // every surface, so refuse it rather than storing an orphan.
      if (input.lessonId) {
        const [exists] = await db
          .select({ id: lesson.id })
          .from(lesson)
          .where(eq(lesson.id, input.lessonId))
        if (!exists) throw new ApiError(404, "NOT_FOUND", "Lesson not found")
      }

      const [created] = await db
        .insert(note)
        .values({
          userId,
          lessonId: input.lessonId ?? null,
          quote: input.quote ?? null,
          prefix: input.prefix ?? null,
          suffix: input.suffix ?? null,
          occurrence: input.occurrence ?? 0,
          body: input.body,
          color: input.color ?? "amber",
          fontFamily: input.fontFamily ?? null,
        })
        .returning()

      return c.json({ data: { note: toDto(created!) } })
    },
  )
  .patch(
    "/:id",
    describeRoute({
      tags: ["Notes"],
      description: "Update a note's body, colour, or font.",
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: resolver(z.object({ data: z.object({ note: noteSchema }) })),
            },
          },
        },
        ...authErrorResponses,
        ...notFoundErrorResponses,
        ...validationErrorResponses,
      },
    }),
    sValidator("json", updateSchema, (result) => {
      if (!result.success) {
        throw new ApiError(400, "VALIDATION_ERROR", "Invalid note", { issues: result.error })
      }
    }),
    async (c) => {
      const { id: userId } = c.get("user")
      const input = c.req.valid("json")

      // Scoping the update by userId is the authorization check: another user's
      // id simply matches no row.
      const [updated] = await db
        .update(note)
        .set(input)
        .where(and(eq(note.id, c.req.param("id")), eq(note.userId, userId)))
        .returning()
      if (!updated) throw new ApiError(404, "NOT_FOUND", "Note not found")

      return c.json({ data: { note: toDto(updated) } })
    },
  )
  .delete(
    "/:id",
    describeRoute({
      tags: ["Notes"],
      description: "Delete a note.",
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: resolver(z.object({ data: z.object({ id: z.string() }) })),
            },
          },
        },
        ...authErrorResponses,
        ...notFoundErrorResponses,
      },
    }),
    async (c) => {
      const { id: userId } = c.get("user")
      const [deleted] = await db
        .delete(note)
        .where(and(eq(note.id, c.req.param("id")), eq(note.userId, userId)))
        .returning({ id: note.id })
      if (!deleted) throw new ApiError(404, "NOT_FOUND", "Note not found")
      return c.json({ data: { id: deleted.id } })
    },
  )
