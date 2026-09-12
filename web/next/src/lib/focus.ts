// Splits a lesson into short steps that are shown one at a time.
//
// A lesson is authored as one long page, which is the right shape for reading
// and the wrong shape for a reader who loses the thread partway down it. The
// wall gives no sense of how much is left, offers no stopping point, and puts
// every remaining paragraph in peripheral vision at once. Cutting it into
// steps replaces all three with: one thing on screen, a visible count, and a
// finish line close enough to aim at.
//
// A step is a slice of the original markdown, not a parsed tree, so the
// existing renderer draws it with its code highlighting and tables intact.
//
// Pure and DOM-free; the components own the state.

export type FocusBlockKind = "heading" | "paragraph" | "list" | "code" | "table" | "quote"

export type FocusStep = {
  /** Position in the lesson, also its React key. */
  index: number
  /** Nearest heading at or above this step, used as its label. */
  heading: string | null
  /** Raw markdown for this step, handed straight to the renderer. */
  markdown: string
  words: number
  /** Estimated reading seconds, code counted at its own slower pace. */
  seconds: number
  hasCode: boolean
}

type Block = { kind: FocusBlockKind; text: string; words: number; codeLines: number }

// Roughly how many words a step aims for. Small enough that the end is always
// in sight, large enough that a step is still a thought rather than a line.
const TARGET_WORDS = 110
// A step is allowed past the target to keep a code sample with the sentence
// that introduces it, but not indefinitely.
const MAX_WORDS = 240
// Silent reading, a little under the usual 240 wpm estimate because this is
// technical prose that is reread.
const WORDS_PER_MINUTE = 210
// Code is not read at prose speed; it is scanned line by line.
const SECONDS_PER_CODE_LINE = 3

const CODE_FENCE = /^\s*(`{3,}|~{3,})/
const HEADING = /^#{1,6}\s+(.*)$/
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s+/
const BLOCKQUOTE = /^\s*>/
const TABLE_ROW = /^\s*\|/

function countWords(text: string) {
  const trimmed = text.trim()
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length
}

/**
 * Cuts markdown into its top-level blocks, each keeping its exact source text.
 * Consecutive list items are one block, because splitting a list mid-way loses
 * the parallelism that makes it a list.
 */
function toBlocks(markdown: string): Block[] {
  const lines = markdown.split("\n")
  const blocks: Block[] = []
  const push = (kind: FocusBlockKind, text: string, codeLines = 0) => {
    if (text.trim() === "") return
    blocks.push({ kind, text: text.replace(/\s+$/, ""), words: countWords(text), codeLines })
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i] ?? ""

    if (line.trim() === "") {
      i++
      continue
    }

    const fence = CODE_FENCE.exec(line)
    if (fence) {
      const opener = fence[1] ?? "```"
      const collected = [line]
      let codeLines = 0
      i++
      while (i < lines.length) {
        const current = lines[i] ?? ""
        collected.push(current)
        const closer = CODE_FENCE.exec(current)
        // Same rule the speech converter uses: only a run at least as long as
        // the opener closes the block, so a four-backtick block can quote a
        // three-backtick one.
        if (
          closer &&
          closer[1] &&
          closer[1][0] === opener[0] &&
          closer[1].length >= opener.length
        ) {
          i++
          break
        }
        codeLines++
        i++
      }
      push("code", collected.join("\n"), codeLines)
      continue
    }

    if (HEADING.test(line)) {
      push("heading", line)
      i++
      continue
    }

    if (TABLE_ROW.test(line)) {
      const collected: string[] = []
      while (i < lines.length && TABLE_ROW.test(lines[i] ?? "")) {
        collected.push(lines[i] ?? "")
        i++
      }
      push("table", collected.join("\n"))
      continue
    }

    if (BLOCKQUOTE.test(line)) {
      const collected: string[] = []
      while (i < lines.length && BLOCKQUOTE.test(lines[i] ?? "")) {
        collected.push(lines[i] ?? "")
        i++
      }
      push("quote", collected.join("\n"))
      continue
    }

    if (LIST_ITEM.test(line)) {
      const collected: string[] = []
      while (i < lines.length) {
        const current = lines[i] ?? ""
        // A blank line inside a list is a paragraph break within an item, so
        // peek past it rather than ending the list on the first gap.
        if (current.trim() === "") {
          const next = lines[i + 1] ?? ""
          if (!LIST_ITEM.test(next) && !/^\s+\S/.test(next)) break
          collected.push(current)
          i++
          continue
        }
        if (!LIST_ITEM.test(current) && !/^\s+\S/.test(current)) break
        collected.push(current)
        i++
      }
      push("list", collected.join("\n"))
      continue
    }

    const collected: string[] = []
    while (i < lines.length) {
      const current = lines[i] ?? ""
      if (
        current.trim() === "" ||
        CODE_FENCE.test(current) ||
        HEADING.test(current) ||
        TABLE_ROW.test(current) ||
        BLOCKQUOTE.test(current) ||
        LIST_ITEM.test(current)
      ) {
        break
      }
      collected.push(current)
      i++
    }
    push("paragraph", collected.join("\n"))
  }

  return blocks
}

/** Estimated seconds to read prose words plus code lines. */
export function estimateReadSeconds(words: number, codeLines = 0) {
  const prose = (words / WORDS_PER_MINUTE) * 60
  return Math.max(Math.ceil(prose + codeLines * SECONDS_PER_CODE_LINE), 5)
}

/** "3 min" / "40 sec", for a step or lesson estimate. */
export function formatReadTime(seconds: number) {
  if (seconds < 60) return `${Math.max(Math.round(seconds / 5) * 5, 5)} sec`
  return `${Math.round(seconds / 60)} min`
}

/**
 * Groups a lesson's blocks into steps.
 *
 * Headings start a step, because a heading is the author's own statement that
 * a new idea begins. Otherwise a step fills to roughly {@link TARGET_WORDS} and
 * closes, except that it will run over rather than strand a code sample from
 * the sentence introducing it: "the fix is this:" followed by nothing is a
 * worse step than a slightly long one.
 */
export function toFocusSteps(markdown: string): FocusStep[] {
  const blocks = toBlocks(markdown)
  const steps: FocusStep[] = []

  let heading: string | null = null
  let currentHeading: string | null = null
  let buffer: Block[] = []
  let words = 0

  const flush = () => {
    if (buffer.length === 0) return
    // A step that is only its heading has nothing to read, so it waits for the
    // body rather than becoming a step of its own.
    if (buffer.every((block) => block.kind === "heading")) return
    const codeLines = buffer.reduce((total, block) => total + block.codeLines, 0)
    steps.push({
      index: steps.length,
      heading: currentHeading,
      markdown: buffer.map((block) => block.text).join("\n\n"),
      words,
      seconds: estimateReadSeconds(words, codeLines),
      hasCode: buffer.some((block) => block.kind === "code"),
    })
    buffer = []
    words = 0
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (!block) continue

    if (block.kind === "heading") {
      flush()
      heading = HEADING.exec(block.text)?.[1]?.trim() ?? null
      currentHeading = heading
      buffer.push(block)
      words += block.words
      continue
    }

    if (buffer.length === 0) currentHeading = heading
    buffer.push(block)
    words += block.words

    const next = blocks[i + 1]
    if (!next || next.kind === "heading") continue
    // Hold the step open for a code sample the current text is setting up.
    if (next.kind === "code" && words < MAX_WORDS) continue
    if (words >= TARGET_WORDS) flush()
  }
  flush()

  return steps
}

/** Total estimated reading time for a lesson, from its steps. */
export function totalReadSeconds(steps: FocusStep[]) {
  return steps.reduce((total, step) => total + step.seconds, 0)
}
