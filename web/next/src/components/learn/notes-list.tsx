"use client"

import { RiSearchLine, RiStickyNoteLine } from "@remixicon/react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useMemo, useState } from "react"

import { colorStyles } from "@/components/learn/note-editor"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient, unwrap } from "@/lib/api/client"
import { cn } from "@/lib/utils"

type Note = {
  id: string
  lessonId: string | null
  lessonTitle: string | null
  quote: string | null
  body: string
  color: string
  fontFamily: string | null
  updatedAt: string
}

// Strip tags so a search matches what the note reads as, not its markup.
const plain = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

export function NotesList() {
  const [query, setQuery] = useState("")

  const { data: notes, isPending } = useQuery({
    queryKey: ["notes", "all"],
    queryFn: async () => {
      const { data, error } = await unwrap(apiClient.v1.notes.$get())
      if (error) throw new Error(error.message)
      return data.notes as Note[]
    },
  })

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const matched = (notes ?? []).filter(
      (n) =>
        !needle ||
        plain(n.body).toLowerCase().includes(needle) ||
        (n.quote ?? "").toLowerCase().includes(needle) ||
        (n.lessonTitle ?? "").toLowerCase().includes(needle),
    )
    const byLesson = new Map<string, { title: string; lessonId: string | null; notes: Note[] }>()
    for (const n of matched) {
      const key = n.lessonId ?? "__global__"
      const entry = byLesson.get(key) ?? {
        title: n.lessonTitle ?? "Not tied to a lesson",
        lessonId: n.lessonId,
        notes: [],
      }
      entry.notes.push(n)
      byLesson.set(key, entry)
    }
    return [...byLesson.values()]
  }, [notes, query])

  if (isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  if (!notes || notes.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiStickyNoteLine />
          </EmptyMedia>
          <EmptyTitle>No notes yet</EmptyTitle>
          <EmptyDescription>
            Select any text inside a lesson and an Add note button appears. Notes you write there
            collect here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <RiSearchLine className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your notes"
          className="pl-9"
        />
      </div>

      {groups.length === 0 && (
        <p className="text-muted-foreground text-sm">Nothing matches “{query}”.</p>
      )}

      {groups.map((group) => (
        <section key={group.lessonId ?? "global"} className="space-y-2">
          <h2 className="text-sm font-semibold">
            {group.lessonId ? (
              <Link href={`/learn/${group.lessonId}`} className="hover:underline">
                {group.title}
              </Link>
            ) : (
              group.title
            )}
            <span className="text-muted-foreground ml-2 font-normal">{group.notes.length}</span>
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {group.notes.map((n) => (
              <Card
                key={n.id}
                className={cn("border", colorStyles[n.color]?.sticky ?? colorStyles.amber!.sticky)}
              >
                <CardContent className="space-y-2">
                  {n.quote && (
                    <p className="border-l-2 border-current/30 pl-2 text-xs italic opacity-80">
                      “{n.quote}”
                    </p>
                  )}
                  <div
                    className="text-sm [&_blockquote]:border-l-2 [&_blockquote]:pl-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                    style={n.fontFamily ? { fontFamily: n.fontFamily } : undefined}
                    dangerouslySetInnerHTML={{ __html: n.body }}
                  />
                  <p className="text-xs opacity-60">
                    {new Date(n.updatedAt).toLocaleDateString()}
                    {n.lessonId && (
                      <>
                        {" · "}
                        <Link href={`/learn/${n.lessonId}`} className="underline">
                          open lesson
                        </Link>
                      </>
                    )}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
