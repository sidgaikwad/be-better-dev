"use client"

import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import * as React from "react"

import { BookCss } from "@/components/marketing/book-css"
import { BookHalo } from "@/components/marketing/book-halo"
import { useMotion } from "@/components/marketing/motion"
import { cn } from "@/lib/utils"

// three plus the scene is the largest thing on this page by an order of
// magnitude, and nothing above the fold needs it to paint. Browser-only and
// lazy, so the server sends the CSS book and the bundle arrives afterwards, if
// at all.
const BookWebgl = dynamic(
  () => import("@/components/marketing/book-webgl").then((module) => module.BookWebgl),
  { ssr: false },
)

// Three ways this stays on the CSS book: no WebGL2, a browser that fails to hand
// out a context (a blocklisted driver answers the feature check and then refuses
// the context), and Save-Data, where a decorative megabyte is exactly what the
// reader asked us not to send.
function canRenderWebgl() {
  if (typeof window === "undefined") return false
  const connection = (navigator as { connection?: { saveData?: boolean } }).connection
  if (connection?.saveData) return false
  try {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("webgl2")
    if (!context) return false
    context.getExtension("WEBGL_lose_context")?.loseContext()
    return true
  } catch {
    return false
  }
}

export function Book({ className }: { className?: string }) {
  const { paused } = useMotion()
  const { resolvedTheme } = useTheme()
  const container = React.useRef<HTMLDivElement>(null)

  const [enabled, setEnabled] = React.useState(false)
  const [reduced, setReduced] = React.useState(false)
  const [ready, setReady] = React.useState(false)
  const [onScreen, setOnScreen] = React.useState(true)

  React.useEffect(() => setEnabled(canRenderWebgl()), [])

  // The stylesheet holds the CSS book still under reduced motion; a canvas has
  // no stylesheet to do it for it, so the same preference is read here.
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(query.matches)
    sync()
    query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])

  // A hero canvas that keeps drawing while the reader is three sections down is
  // a battery bill for nothing.
  React.useEffect(() => {
    const element = container.current
    if (!element || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      threshold: 0.05,
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const onReady = React.useCallback(() => setReady(true), [])
  // A lost context is not recoverable here: drop back to the CSS book, which is
  // still mounted underneath and only has to be faded back in.
  const onLost = React.useCallback(() => {
    setReady(false)
    setEnabled(false)
  }, [])

  return (
    <div className={cn("relative", className)} ref={container}>
      <BookHalo />
      {/* Stays mounted under the canvas rather than being swapped out: fading
          between two identical poses is invisible, where an unmount and a mount
          is a flicker in the middle of the hero. */}
      <BookCss className={cn("relative transition-opacity duration-700", ready && "opacity-0")} />
      {enabled && (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -inset-10 transition-opacity duration-700",
            ready ? "opacity-100" : "opacity-0",
          )}
        >
          <BookWebgl
            onLost={onLost}
            onReady={onReady}
            still={paused || reduced || !onScreen}
            theme={resolvedTheme === "light" ? "light" : "dark"}
          />
        </div>
      )}
    </div>
  )
}
