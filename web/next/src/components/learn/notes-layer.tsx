"use client"

import { RiDeleteBinLine, RiStickyNoteAddLine, RiStickyNoteLine } from "@remixicon/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"

import {
  colorStyles,
  NOTE_COLORS,
  NOTE_FONTS,
  NoteEditor,
  type NoteColor,
} from "@/components/learn/note-editor"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { apiClient, unwrap } from "@/lib/api/client"
import { type Anchor, describeSelection, locate } from "@/lib/notes/anchor"
import { cn } from "@/lib/utils"

type Note = {
  id: string
  lessonId: string | null
  quote: string | null
  prefix: string | null
  suffix: string | null
  occurrence: number
  body: string
  color: string
  fontFamily: string | null
}

type Marker = { note: Note; top: number; anchored: boolean }

const HIGHLIGHT_SUPPORTED = typeof CSS !== "undefined" && "highlights" in CSS

export function NotesLayer({
  lessonId,
  contentRef,
}: {
  lessonId: string
  contentRef: React.RefObject<HTMLDivElement | null>
}) {
  const queryClient = useQueryClient()
  const [pending, setPending] = useState<Anchor | null>(null)
  const [editing, setEditing] = useState<Note | null>(null)
  const [draft, setDraft] = useState("")
  const [color, setColor] = useState<NoteColor>("amber")
  const [font, setFont] = useState<string | null>(null)
  const [bubble, setBubble] = useState<{ top: number; left: number } | null>(null)
  const [markers, setMarkers] = useState<Marker[]>([])
  const selectionRef = useRef<Anchor | null>(null)

  const { data: notes } = useQuery({
    queryKey: ["notes", lessonId],
    queryFn: async () => {
      const { data, error } = await unwrap(apiClient.v1.notes.$get({ query: { lessonId } }))
      if (error) throw new Error(error.message)
      return data.notes as Note[]
    },
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["notes", lessonId] })
    queryClient.invalidateQueries({ queryKey: ["notes", "all"] })
  }

  const create = useMutation({
    mutationFn: async (
      input: Anchor & { body: string; color: string; fontFamily: string | null },
    ) => {
      const { data, error } = await unwrap(
        apiClient.v1.notes.$post({ json: { lessonId, ...input } }),
      )
      if (error) throw new Error(error.message)
      return data.note
    },
    onSuccess: () => {
      toast.add({ title: "Note saved", type: "success" })
      closeDialog()
      invalidate()
    },
    onError: (e) => toast.add({ title: e.message || "Could not save the note", type: "error" }),
  })

  const update = useMutation({
    mutationFn: async (input: {
      id: string
      body: string
      color: string
      fontFamily: string | null
    }) => {
      const { id, ...rest } = input
      const { data, error } = await unwrap(
        apiClient.v1.notes[":id"].$patch({ param: { id }, json: rest }),
      )
      if (error) throw new Error(error.message)
      return data.note
    },
    onSuccess: () => {
      toast.add({ title: "Note updated", type: "success" })
      closeDialog()
      invalidate()
    },
    onError: (e) => toast.add({ title: e.message || "Could not update the note", type: "error" }),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await unwrap(apiClient.v1.notes[":id"].$delete({ param: { id } }))
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast.add({ title: "Note deleted", type: "success" })
      closeDialog()
      invalidate()
    },
    onError: (e) => toast.add({ title: e.message || "Could not delete the note", type: "error" }),
  })

  function closeDialog() {
    setPending(null)
    setEditing(null)
    setDraft("")
    setFont(null)
    setColor("amber")
  }

  // Watch for a selection inside the lesson body and float the add button
  // beside it. Pointerup rather than selectionchange: the latter fires on every
  // keystroke of a drag and would make the bubble jitter.
  useEffect(() => {
    const container = contentRef.current
    if (!container) return

    const onPointerUp = () => {
      // Let the browser settle the selection before reading it.
      window.setTimeout(() => {
        const anchor = describeSelection(container)
        if (!anchor) {
          setBubble(null)
          selectionRef.current = null
          return
        }
        const range = window.getSelection()?.getRangeAt(0)
        if (!range) return
        const rect = range.getBoundingClientRect()
        const box = container.getBoundingClientRect()
        selectionRef.current = anchor
        setBubble({ top: rect.top - box.top - 8, left: rect.left - box.left + rect.width / 2 })
      }, 10)
    }

    container.addEventListener("pointerup", onPointerUp)
    return () => container.removeEventListener("pointerup", onPointerUp)
  }, [contentRef])

  // Paint highlights and place the margin markers. The CSS Custom Highlight API
  // styles ranges without touching the DOM, so React keeps ownership of the
  // rendered markdown and nothing here can corrupt it.
  const paint = useCallback(() => {
    const container = contentRef.current
    if (!container || !notes) return

    const byColor = new Map<string, Range[]>()
    const placed: Marker[] = []
    const box = container.getBoundingClientRect()

    for (const n of notes) {
      if (!n.quote) {
        placed.push({ note: n, top: 0, anchored: false })
        continue
      }
      const range = locate(container, {
        quote: n.quote,
        prefix: n.prefix ?? "",
        suffix: n.suffix ?? "",
        occurrence: n.occurrence,
      })
      if (!range) {
        placed.push({ note: n, top: 0, anchored: false })
        continue
      }
      const list = byColor.get(n.color) ?? []
      list.push(range)
      byColor.set(n.color, list)
      placed.push({ note: n, top: range.getBoundingClientRect().top - box.top, anchored: true })
    }

    if (HIGHLIGHT_SUPPORTED) {
      for (const key of Object.keys(colorStyles)) CSS.highlights.delete(`note-${key}`)
      for (const [c, ranges] of byColor) {
        CSS.highlights.set(`note-${c}`, new Highlight(...ranges))
      }
    }

    // Nudge overlapping markers down so several notes on one paragraph stay clickable.
    placed.sort((a, b) => a.top - b.top)
    let last = -Infinity
    for (const m of placed) {
      if (m.anchored && m.top - last < 28) m.top = last + 28
      if (m.anchored) last = m.top
    }
    setMarkers(placed)
  }, [contentRef, notes])

  useEffect(() => {
    paint()
    window.addEventListener("resize", paint)
    return () => {
      window.removeEventListener("resize", paint)
      if (HIGHLIGHT_SUPPORTED) {
        for (const key of Object.keys(colorStyles)) CSS.highlights.delete(`note-${key}`)
      }
    }
  }, [paint])

  const openForSelection = () => {
    const anchor = selectionRef.current
    if (!anchor) return
    setPending(anchor)
    setDraft("")
    setBubble(null)
    window.getSelection()?.removeAllRanges()
  }

  const openExisting = (n: Note) => {
    setEditing(n)
    setDraft(n.body)
    setColor((n.color as NoteColor) ?? "amber")
    setFont(n.fontFamily)
  }

  const open = pending !== null || editing !== null
  const saving = create.isPending || update.isPending

  return (
    <>
      {bubble && (
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-full"
          style={{ top: bubble.top, left: bubble.left }}
        >
          <Button size="sm" onClick={openForSelection} className="shadow-md">
            <RiStickyNoteAddLine />
            Add note
          </Button>
        </div>
      )}

      {markers
        .filter((m) => m.anchored)
        .map((m) => (
          <button
            key={m.note.id}
            type="button"
            onClick={() => openExisting(m.note)}
            title="Open note"
            aria-label="Open note"
            className={cn(
              "absolute -right-2 z-10 flex size-6 items-center justify-center rounded-full border shadow-sm transition-transform hover:scale-110",
              colorStyles[m.note.color]?.sticky ?? colorStyles.amber!.sticky,
            )}
            style={{ top: m.top }}
          >
            <RiStickyNoteLine className="size-3.5" />
          </button>
        ))}

      {markers.some((m) => !m.anchored) && (
        <div className="border-border mt-6 space-y-2 rounded-lg border border-dashed p-3">
          <p className="text-muted-foreground text-xs">
            Notes whose text has changed since you wrote them, so they no longer attach to a
            passage.
          </p>
          {markers
            .filter((m) => !m.anchored)
            .map((m) => (
              <button
                key={m.note.id}
                type="button"
                onClick={() => openExisting(m.note)}
                className={cn(
                  "block w-full rounded-md border px-3 py-2 text-left text-sm",
                  colorStyles[m.note.color]?.sticky ?? colorStyles.amber!.sticky,
                )}
                dangerouslySetInnerHTML={{ __html: m.note.body }}
              />
            ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit note" : "New note"}</DialogTitle>
            <DialogDescription>
              {(pending?.quote ?? editing?.quote) ? (
                <span className="block border-l-2 border-current/30 pl-2 italic">
                  “{pending?.quote ?? editing?.quote}”
                </span>
              ) : (
                "A note on this lesson."
              )}
            </DialogDescription>
          </DialogHeader>

          <NoteEditor value={draft} onChange={setDraft} fontFamily={font} autoFocus />

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Colour</span>
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  aria-label={c.label}
                  title={c.label}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "size-5 rounded-full border transition-transform hover:scale-110",
                    colorStyles[c.value]!.swatch,
                    color === c.value ? "ring-ring scale-110 ring-2 ring-offset-1" : "",
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Font</span>
              {NOTE_FONTS.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setFont(f.value)}
                  style={{ fontFamily: f.value }}
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs",
                    font === f.value ? "border-ring bg-accent" : "border-border",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            {editing ? (
              <Button
                variant="ghost"
                onClick={() => remove.mutate(editing.id)}
                disabled={remove.isPending}
                className="text-destructive"
              >
                <RiDeleteBinLine />
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                disabled={saving || draft.trim().length === 0}
                onClick={() => {
                  if (editing) {
                    update.mutate({ id: editing.id, body: draft, color, fontFamily: font })
                  } else if (pending) {
                    create.mutate({ ...pending, body: draft, color, fontFamily: font })
                  }
                }}
              >
                {saving ? <Spinner /> : null}
                {editing ? "Save changes" : "Add note"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
