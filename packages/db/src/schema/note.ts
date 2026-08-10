import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { user } from "@/schema/auth"
import { lesson } from "@/schema/course"

// A sticky note the learner attaches to selected text, or to a lesson as a
// whole, or to nothing at all (a global note).
//
// Anchoring: lesson bodies are markdown rendered to HTML, so a DOM range does
// not survive a reload. Instead a note stores what it was attached to, the
// exact `quote`, plus the text immediately before and after it and which
// occurrence it was. On load the client re-finds the quote in the rendered
// text using those three together, which survives everything except an edit to
// the sentence itself. When re-anchoring fails the note is not lost: it still
// belongs to the lesson and shows in the margin as unanchored.
export const note = pgTable(
  "note",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Null for a global note that belongs to no particular lesson.
    lessonId: text("lesson_id").references(() => lesson.id, { onDelete: "cascade" }),
    // The selected text this note hangs off. Null when the note is about the
    // whole lesson rather than a passage.
    quote: text("quote"),
    prefix: text("prefix"),
    suffix: text("suffix"),
    // Which occurrence of `quote` in the lesson, so repeated phrases anchor to
    // the right one. Zero-based.
    occurrence: integer("occurrence").default(0).notNull(),
    // Editor output. HTML rather than a document model: it renders directly and
    // stays readable if the editor is ever swapped out.
    body: text("body").notNull(),
    // Sticky colour, and an optional font override chosen per note.
    color: text("color").default("amber").notNull(),
    fontFamily: text("font_family"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // The two reads: every note for one lesson, and the global list newest first.
    index("note_userId_lessonId_idx").on(table.userId, table.lessonId),
    index("note_userId_createdAt_idx").on(table.userId, table.createdAt),
  ],
)
