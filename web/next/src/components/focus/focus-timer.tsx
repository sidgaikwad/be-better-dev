"use client"

import { RiAddLine, RiCupLine, RiPauseCircleLine, RiTimerLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatClock, type useFocusTimer } from "@/hooks/use-focus-timer"
import { cn } from "@/lib/utils"

type Timer = ReturnType<typeof useFocusTimer>

/** The running clock, small enough to sit in a header without competing. */
export function FocusClock({ timer, className }: { timer: Timer; className?: string }) {
  if (!timer.running) return null
  const low = timer.phase === "focus" && timer.remaining <= 60
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs tabular-nums",
          low ? "border-destructive/30 text-destructive" : "text-muted-foreground",
        )}
        // Read out at the minute rather than the second: a clock that announces
        // itself every second is the opposite of a focus aid.
        aria-live="off"
      >
        {timer.phase === "break" ? (
          <RiCupLine className="size-3.5" aria-hidden />
        ) : (
          <RiTimerLine className="size-3.5" aria-hidden />
        )}
        {formatClock(timer.remaining)}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => timer.extend(5)}
        aria-label="Add five minutes"
        title="Add five minutes"
      >
        <RiAddLine />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={timer.stop}
        aria-label="End the session"
        title="End the session"
      >
        <RiPauseCircleLine />
      </Button>
    </div>
  )
}

/**
 * The break card, shown in place of the lesson when a block runs out.
 *
 * It takes over the reading area on purpose. A break offered as a dismissible
 * badge in the corner is a break nobody takes, and the point of the block was
 * to stop somewhere chosen rather than somewhere random.
 */
export function BreakCard({ timer }: { timer: Timer }) {
  return (
    <Card>
      <CardContent className="space-y-4 py-8 text-center">
        <RiCupLine className="text-muted-foreground mx-auto size-8" aria-hidden />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Break</h2>
          <p className="text-muted-foreground text-sm">
            Stand up, look at something further away than this screen, get water. The lesson keeps
            your place.
          </p>
        </div>
        <p className="text-3xl font-semibold tabular-nums">{formatClock(timer.remaining)}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={timer.skipBreak} variant="secondary">
            Back to it now
          </Button>
          <Button onClick={() => timer.extend(2)} variant="ghost">
            Two more minutes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/** The end-of-session card, offering the one honest next choice: again, or stop. */
export function SessionDoneCard({ timer }: { timer: Timer }) {
  return (
    <Card>
      <CardContent className="space-y-4 py-8 text-center">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Break is over</h2>
          <p className="text-muted-foreground text-sm">
            Another {timer.minutes} minute block, or leave it here. Stopping on purpose is a real
            option, and a better one than drifting.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => timer.start()}>Another {timer.minutes} minutes</Button>
          <Button onClick={timer.stop} variant="ghost">
            Done for now
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
