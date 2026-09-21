"use client"

import { RiPauseLine, RiPlayLine } from "@remixicon/react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Whether the landing page's decorative motion is running.
//
// WCAG 2.2.2: anything that moves for more than five seconds needs a way to stop
// it. The hero has three such things (the book, the aurora drift, the audio
// rings) and they are one piece of ambience, not three, so they share one
// control rather than sprouting a button each. `prefers-reduced-motion` already
// stops all of them before they start; this is for the reader whose system says
// nothing but whose eyes still want it to hold still.
const MotionContext = React.createContext<{
  paused: boolean
  setPaused: (paused: boolean) => void
}>({ paused: false, setPaused: () => {} })

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [paused, setPaused] = React.useState(false)

  // The attribute goes on <html> rather than on a wrapper because the marketing
  // stylesheet is the single place that knows which classes animate, and it can
  // then pause every one of them with one rule.
  React.useEffect(() => {
    const root = document.documentElement
    if (paused) root.setAttribute("data-motion", "paused")
    else root.removeAttribute("data-motion")
    return () => root.removeAttribute("data-motion")
  }, [paused])

  const value = React.useMemo(() => ({ paused, setPaused }), [paused])
  return <MotionContext value={value}>{children}</MotionContext>
}

export function useMotion() {
  return React.use(MotionContext)
}

// Hidden until the reader goes looking, which is the point: a pause button
// parked permanently over a hero is itself a distraction. It stays in the tab
// order and reveals itself on focus, so a keyboard reader reaches it in the
// same breath as the calls to action.
export function MotionToggle({ className }: { className?: string }) {
  const { paused, setPaused } = useMotion()

  return (
    <Button
      aria-label={paused ? "Play the page animation" : "Pause the page animation"}
      className={cn(
        "opacity-0 transition-opacity group-focus-within/hero:opacity-100 group-hover/hero:opacity-100 focus-visible:opacity-100",
        className,
      )}
      onClick={() => setPaused(!paused)}
      size="icon-sm"
      variant="outline"
    >
      {paused ? <RiPlayLine aria-hidden="true" /> : <RiPauseLine aria-hidden="true" />}
    </Button>
  )
}
