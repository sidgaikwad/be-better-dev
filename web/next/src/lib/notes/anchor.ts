// Anchoring notes to rendered lesson text.
//
// A DOM Range cannot be stored: the lesson is markdown re-rendered on every
// visit, so node identity is gone by the next load. What survives is the text
// itself, so a note records the exact `quote`, a little context either side,
// and which occurrence it was. Re-anchoring searches the rendered text for that
// combination.
//
// Everything here works on the container's flattened text, then maps offsets
// back onto the text nodes, so no DOM is mutated and React keeps ownership of
// the tree.

export type Anchor = {
  quote: string
  prefix: string
  suffix: string
  occurrence: number
}

const CONTEXT = 40

type TextMap = { text: string; nodes: { node: Text; start: number; end: number }[] }

// Flatten a container to text plus an index of where each text node landed.
export function mapText(container: HTMLElement): TextMap {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const nodes: TextMap["nodes"] = []
  let text = ""
  let current = walker.nextNode() as Text | null
  while (current) {
    const start = text.length
    text += current.data
    nodes.push({ node: current, start, end: text.length })
    current = walker.nextNode() as Text | null
  }
  return { text, nodes }
}

// Describe the current selection well enough to find it again later. Returns
// null when the selection is empty or reaches outside the container.
export function describeSelection(container: HTMLElement): Anchor | null {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null

  const range = selection.getRangeAt(0)
  if (!container.contains(range.commonAncestorContainer)) return null

  const quote = range.toString().trim()
  if (!quote) return null

  const { text } = mapText(container)
  const offset = offsetOfRange(container, range)
  if (offset === null) return { quote, prefix: "", suffix: "", occurrence: 0 }

  // Which occurrence of this exact string the selection landed on.
  let occurrence = 0
  let at = text.indexOf(quote)
  while (at !== -1 && at < offset) {
    occurrence += 1
    at = text.indexOf(quote, at + 1)
  }

  return {
    quote,
    prefix: text.slice(Math.max(0, offset - CONTEXT), offset),
    suffix: text.slice(offset + quote.length, offset + quote.length + CONTEXT),
    occurrence,
  }
}

function offsetOfRange(container: HTMLElement, range: Range): number | null {
  const { nodes } = mapText(container)
  const entry = nodes.find((n) => n.node === range.startContainer)
  if (!entry) return null
  return entry.start + range.startOffset
}

// Find a stored anchor in the current render and build a Range over it.
// Falls back through: exact occurrence, then context match, then first match.
// Returns null when the text is gone, which is how a note becomes "unanchored"
// rather than silently attaching to the wrong sentence.
export function locate(container: HTMLElement, anchor: Anchor): Range | null {
  if (!anchor.quote) return null
  const map = mapText(container)

  const hits: number[] = []
  let at = map.text.indexOf(anchor.quote)
  while (at !== -1) {
    hits.push(at)
    at = map.text.indexOf(anchor.quote, at + 1)
  }
  if (hits.length === 0) return null

  let chosen = hits[anchor.occurrence]
  if (chosen === undefined) {
    // The occurrence moved, so fall back to whichever hit best matches the
    // remembered surroundings.
    chosen = hits.reduce((best, candidate) => {
      const score = (h: number) =>
        (anchor.prefix &&
        map.text.slice(Math.max(0, h - CONTEXT), h).endsWith(anchor.prefix.slice(-12))
          ? 2
          : 0) +
        (anchor.suffix &&
        map.text
          .slice(h + anchor.quote.length, h + anchor.quote.length + CONTEXT)
          .startsWith(anchor.suffix.slice(0, 12))
          ? 1
          : 0)
      return score(candidate) > score(best) ? candidate : best
    }, hits[0]!)
  }

  return rangeAt(map, chosen, anchor.quote.length)
}

function rangeAt(map: TextMap, start: number, length: number): Range | null {
  const end = start + length
  const startNode = map.nodes.find((n) => start >= n.start && start < n.end)
  const endNode = map.nodes.find((n) => end > n.start && end <= n.end)
  if (!startNode || !endNode) return null

  const range = document.createRange()
  range.setStart(startNode.node, start - startNode.start)
  range.setEnd(endNode.node, end - endNode.start)
  return range
}
