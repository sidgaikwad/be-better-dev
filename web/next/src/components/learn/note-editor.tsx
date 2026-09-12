"use client"

import {
  RiBold,
  RiDoubleQuotesL,
  RiEraserLine,
  RiH1,
  RiH2,
  RiItalic,
  RiListOrdered,
  RiListUnordered,
  RiStrikethrough,
  RiUnderline,
} from "@remixicon/react"
import { useCallback, useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Toggle } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"

// Fonts offered per note. The first two are the app's own faces, already
// loaded; the rest are system stacks, so choosing one costs no download.
export const NOTE_FONTS = [
  { label: "Sans", value: "var(--font-sans)" },
  { label: "Mono", value: "var(--font-mono)" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Rounded", value: "'Avenir Next', 'Segoe UI', system-ui, sans-serif" },
  { label: "Handwritten", value: "'Bradley Hand', 'Segoe Script', cursive" },
] as const

export const NOTE_COLORS = [
  { label: "Amber", value: "amber" },
  { label: "Pink", value: "pink" },
  { label: "Green", value: "green" },
  { label: "Blue", value: "blue" },
  { label: "Purple", value: "purple" },
] as const

export type NoteColor = (typeof NOTE_COLORS)[number]["value"]

// Sticky palette. Kept here beside the editor so the swatch, the note card and
// the text highlight can never drift apart.
export const colorStyles: Record<string, { sticky: string; swatch: string; highlight: string }> = {
  amber: {
    sticky: "bg-amber-100 text-amber-950 border-amber-300",
    swatch: "bg-amber-300",
    highlight: "rgb(253 230 138 / 0.55)",
  },
  pink: {
    sticky: "bg-pink-100 text-pink-950 border-pink-300",
    swatch: "bg-pink-300",
    highlight: "rgb(251 207 232 / 0.55)",
  },
  green: {
    sticky: "bg-green-100 text-green-950 border-green-300",
    swatch: "bg-green-300",
    highlight: "rgb(187 247 208 / 0.55)",
  },
  blue: {
    sticky: "bg-blue-100 text-blue-950 border-blue-300",
    swatch: "bg-blue-300",
    highlight: "rgb(191 219 254 / 0.55)",
  },
  purple: {
    sticky: "bg-purple-100 text-purple-950 border-purple-300",
    swatch: "bg-purple-300",
    highlight: "rgb(233 213 255 / 0.55)",
  },
}

// Formatting runs through document.execCommand. It is marked deprecated, yet it
// is implemented everywhere and is the only built-in that edits a contenteditable
// selection without shipping a document model. The alternative is a ProseMirror
// stack, which is a large dependency for a sticky note. Swapping the editor
// later touches this file alone, since notes are stored as plain HTML.
function exec(command: string, value?: string) {
  document.execCommand(command, false, value)
}

export function NoteEditor({
  value,
  onChange,
  fontFamily,
  className,
  autoFocus,
}: {
  value: string
  onChange: (html: string) => void
  fontFamily?: string | null
  className?: string
  autoFocus?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Seed the DOM once. Writing `value` back on every render would move the
  // caret to the start mid-typing, since the browser owns the tree here.
  useEffect(() => {
    const el = ref.current
    if (el && el.innerHTML !== value) el.innerHTML = value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])

  const emit = useCallback(() => {
    if (ref.current) onChange(ref.current.innerHTML)
  }, [onChange])

  const run = (command: string, arg?: string) => {
    ref.current?.focus()
    exec(command, arg)
    emit()
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1">
        <Toggle size="sm" aria-label="Bold" onPressedChange={() => run("bold")}>
          <RiBold className="size-4" />
        </Toggle>
        <Toggle size="sm" aria-label="Italic" onPressedChange={() => run("italic")}>
          <RiItalic className="size-4" />
        </Toggle>
        <Toggle size="sm" aria-label="Underline" onPressedChange={() => run("underline")}>
          <RiUnderline className="size-4" />
        </Toggle>
        <Toggle size="sm" aria-label="Strikethrough" onPressedChange={() => run("strikeThrough")}>
          <RiStrikethrough className="size-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <Toggle size="sm" aria-label="Heading" onPressedChange={() => run("formatBlock", "<h3>")}>
          <RiH1 className="size-4" />
        </Toggle>
        <Toggle
          size="sm"
          aria-label="Subheading"
          onPressedChange={() => run("formatBlock", "<h4>")}
        >
          <RiH2 className="size-4" />
        </Toggle>
        <Toggle
          size="sm"
          aria-label="Quote"
          onPressedChange={() => run("formatBlock", "<blockquote>")}
        >
          <RiDoubleQuotesL className="size-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <Toggle
          size="sm"
          aria-label="Bullet list"
          onPressedChange={() => run("insertUnorderedList")}
        >
          <RiListUnordered className="size-4" />
        </Toggle>
        <Toggle
          size="sm"
          aria-label="Numbered list"
          onPressedChange={() => run("insertOrderedList")}
        >
          <RiListOrdered className="size-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label="Clear formatting"
          onClick={() => run("removeFormat")}
        >
          <RiEraserLine className="size-4" />
        </Button>
      </div>

      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-label="Note body"
        tabIndex={0}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        style={fontFamily ? { fontFamily } : undefined}
        className={cn(
          "border-input bg-background min-h-32 max-h-72 overflow-y-auto rounded-lg border px-3 py-2 text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
          "[&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-semibold",
          "[&_h4]:mt-2 [&_h4]:mb-1 [&_h4]:font-semibold",
          "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_blockquote]:border-border [&_blockquote]:my-1 [&_blockquote]:border-l-2 [&_blockquote]:pl-3",
          "[&_a]:underline [&_a]:underline-offset-2",
          className,
        )}
      />
    </div>
  )
}
