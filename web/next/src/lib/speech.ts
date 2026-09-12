// Turns lesson markdown into an ordered list of short, speakable segments.
//
// Two constraints shape this. First, a screen reader for prose is not a screen
// reader for code: reading a Rust snippet character by character is unlistenable,
// so code blocks and tables are announced rather than read, and the listener
// looks at the screen for those. Second, browser speech engines truncate long
// utterances (Chrome cuts off past roughly fifteen seconds), so prose is split
// to sentence size. Short segments also give the player somewhere to seek to.
//
// Pure and DOM-free on purpose: the hook in @/hooks/use-speech owns the engine.

export type SpeechSegmentKind = "heading" | "text" | "quote" | "code" | "table"

export type SpeechSegment = {
  /** Position in the queue, also its React key. */
  index: number
  kind: SpeechSegmentKind
  /** What the engine is asked to say. Never empty, never only punctuation. */
  text: string
}

// A sentence longer than this is split again at the nearest clause boundary.
const MAX_SEGMENT_CHARS = 280
// Anything shorter merges into the sentence before it: "See below." on its own
// is a hitch in the delivery, not a place anyone wants to seek to.
const MIN_SEGMENT_CHARS = 24
// Rough words per minute for a browser voice at rate 1, used only to show an
// estimate next to a lesson. Measured across the default macOS and Chrome
// voices; it is a signpost, not a promise.
const WORDS_PER_MINUTE = 185

const CODE_FENCE = /^\s*(?:```|~~~)/
const HEADING = /^(#{1,6})\s+(.*)$/
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/
const BLOCKQUOTE = /^\s*>\s?(.*)$/
const HORIZONTAL_RULE = /^\s*(?:[-*_]\s*){3,}$/
const TABLE_ROW = /^\s*\|/

/**
 * Normalizes the contents of an inline code span for speech. Rust prose is
 * dense with `Vec<Option<T>>` and `from_str`, which a speech engine reads as a
 * run of symbol names. Collapsing the punctuation to spaces gets "Vec Option T"
 * and "from str", which is what a person reading aloud would say anyway.
 */
function speakableCode(value: string) {
  return value
    .replace(/::/g, " ")
    .replace(/[<>_]/g, " ")
    .replace(/->|=>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Strips markdown decoration, keeping the words a person would actually say. */
function speakableInline(value: string) {
  return (
    value
      // Images carry no spoken content beyond their alt text.
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/`([^`]+)`/g, (_match, code: string) => speakableCode(code))
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      // Single asterisks only. A lone underscore is far more likely to be part
      // of a snake_case identifier than an emphasis marker.
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/~~([^~]+)~~/g, "$1")
      .replace(/<[^>]+>/g, " ")
      .replace(/\\([\\`*_{}[\]()#+\-.!])/g, "$1")
      .replace(/\s+/g, " ")
      .trim()
  )
}

/** True when a string carries at least one letter or digit to pronounce. */
function hasSpeech(value: string) {
  return /[\p{L}\p{N}]/u.test(value)
}

/** Splits an over-long sentence at clause boundaries, then at a hard width. */
function splitLongSentence(sentence: string): string[] {
  if (sentence.length <= MAX_SEGMENT_CHARS) return [sentence]

  const out: string[] = []
  let current = ""
  // Semicolons and colons first, commas only if a clause is still too long: a
  // pause at a comma is natural, a pause mid-clause is not.
  for (const clause of sentence.split(/(?<=[;:,])\s+/)) {
    if (!current) {
      current = clause
    } else if (current.length + clause.length + 1 <= MAX_SEGMENT_CHARS) {
      current = `${current} ${clause}`
    } else {
      out.push(current)
      current = clause
    }
  }
  if (current) out.push(current)

  // A single clause can still run past the cap (a long list with no commas).
  return out.flatMap((chunk) => {
    if (chunk.length <= MAX_SEGMENT_CHARS) return [chunk]
    const words = chunk.split(" ")
    const parts: string[] = []
    let buffer = ""
    for (const word of words) {
      if (buffer && buffer.length + word.length + 1 > MAX_SEGMENT_CHARS) {
        parts.push(buffer)
        buffer = word
      } else {
        buffer = buffer ? `${buffer} ${word}` : word
      }
    }
    if (buffer) parts.push(buffer)
    return parts
  })
}

/**
 * Splits a paragraph into sentences. The lookbehind stops at sentence-ending
 * punctuation followed by whitespace and a capital or digit, which keeps
 * "e.g." and "0.5" whole without needing an abbreviation list.
 */
function toSentences(paragraph: string): string[] {
  const rough = paragraph.split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/)
  const merged: string[] = []
  for (const sentence of rough) {
    const trimmed = sentence.trim()
    if (!trimmed) continue
    const previous = merged[merged.length - 1]
    if (previous !== undefined && trimmed.length < MIN_SEGMENT_CHARS) {
      merged[merged.length - 1] = `${previous} ${trimmed}`
      continue
    }
    merged.push(trimmed)
  }
  return merged.flatMap(splitLongSentence)
}

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`
}

/** The spoken stand-in for a code block, which is shown but never read out. */
function announceCode(language: string, lines: number) {
  const named = language && language !== "text" ? `${language} ` : ""
  return `${named}code sample on screen, ${plural(lines, "line")}.`
}

/**
 * Converts lesson markdown into the speech queue.
 *
 * `title` and `summary` are spoken first when given, so a lesson started from
 * the audiobook queue announces itself instead of opening mid-thought.
 */
export function toSpeechSegments(
  markdown: string,
  opts?: { title?: string; summary?: string },
): SpeechSegment[] {
  const segments: Omit<SpeechSegment, "index">[] = []
  const push = (kind: SpeechSegmentKind, text: string) => {
    const trimmed = text.trim()
    if (trimmed && hasSpeech(trimmed)) segments.push({ kind, text: trimmed })
  }

  if (opts?.title) push("heading", speakableInline(opts.title))
  if (opts?.summary) push("text", speakableInline(opts.summary))

  const lines = markdown.split("\n")
  let paragraph: string[] = []
  let quote: string[] = []

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    const joined = speakableInline(paragraph.join(" "))
    paragraph = []
    for (const sentence of toSentences(joined)) push("text", sentence)
  }
  const flushQuote = () => {
    if (quote.length === 0) return
    const joined = speakableInline(quote.join(" "))
    quote = []
    for (const sentence of toSentences(joined)) push("quote", sentence)
  }
  const flushAll = () => {
    flushParagraph()
    flushQuote()
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""

    if (CODE_FENCE.test(line)) {
      flushAll()
      const language = line.replace(/^\s*(?:```|~~~)/, "").trim()
      let body = 0
      i++
      while (i < lines.length && !CODE_FENCE.test(lines[i] ?? "")) {
        body++
        i++
      }
      push("code", announceCode(language.split(/\s+/)[0] ?? "", body))
      continue
    }

    if (TABLE_ROW.test(line)) {
      flushAll()
      let rows = 0
      while (i < lines.length && TABLE_ROW.test(lines[i] ?? "")) {
        // The `|---|---|` separator is layout, not a row.
        if (!/^\s*\|[\s|:-]+\|?\s*$/.test(lines[i] ?? "")) rows++
        i++
      }
      i--
      // The header counts as a row for the reader's mental model, so subtract it.
      push("table", `Table on screen with ${plural(Math.max(rows - 1, 0), "row")}.`)
      continue
    }

    if (line.trim() === "") {
      flushAll()
      continue
    }

    if (HORIZONTAL_RULE.test(line)) {
      flushAll()
      continue
    }

    const heading = HEADING.exec(line)
    if (heading) {
      flushAll()
      push("heading", speakableInline(heading[2] ?? ""))
      continue
    }

    const quoted = BLOCKQUOTE.exec(line)
    if (quoted) {
      flushParagraph()
      quote.push(quoted[1] ?? "")
      continue
    }
    flushQuote()

    // Each list item becomes its own segment: a list is a set of separate
    // points, and one point is a sensible place to pause or seek to.
    const item = LIST_ITEM.exec(line)
    if (item) {
      flushParagraph()
      for (const sentence of toSentences(speakableInline(item[1] ?? ""))) push("text", sentence)
      continue
    }

    paragraph.push(line.trim())
  }
  flushAll()

  return segments.map((segment, index) => ({ ...segment, index }))
}

/** Word count of a speech queue, the basis for every duration estimate. */
export function countWords(segments: SpeechSegment[]) {
  return segments.reduce((total, segment) => total + segment.text.split(/\s+/).length, 0)
}

/** Estimated seconds to speak a queue at `rate`. Rounded up to a whole second. */
export function estimateSeconds(segments: SpeechSegment[], rate = 1) {
  const safeRate = rate > 0 ? rate : 1
  return Math.ceil((countWords(segments) / (WORDS_PER_MINUTE * safeRate)) * 60)
}

/** "12 min" / "1 hr 5 min" / "45 sec", for a listen-time label. */
export function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.max(seconds, 1)} sec`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`
}
