"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type FocusPhase = "idle" | "focus" | "break" | "done"

/** Session lengths offered on the start screen, in minutes. */
export const FOCUS_LENGTHS = [5, 10, 15, 25] as const
/** One fixed short break. Choosing its length is another decision to make. */
export const BREAK_MINUTES = 3

const STATE_KEY = "focus:timer"
const LENGTH_KEY = "focus:length"

type Persisted = { phase: FocusPhase; endsAt: number; minutes: number }

function readStored<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeStored(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Best effort. A timer that forgets itself across a reload still counts down.
  }
}

function clearStored(key: string) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Nothing to do; the stale entry is discarded on read if it has expired.
  }
}

/**
 * A focus block and the short break after it.
 *
 * The clock is a deadline timestamp rather than a decrementing counter, so the
 * remaining time stays right when the tab is backgrounded (browsers throttle
 * timers in hidden tabs, and a counter would silently drift slow). The
 * deadline is also persisted, so walking from the start screen into a lesson,
 * or reloading, does not quietly reset a session that is already running.
 *
 * Making time visible is the point. Underestimating how long something will
 * take, and losing track of how long it has taken, are the two failures this
 * is here to catch, so the number on screen has to be the real one.
 */
export function useFocusTimer() {
  const [minutes, setMinutesState] = useState<number>(10)
  const [phase, setPhase] = useState<FocusPhase>("idle")
  const [endsAt, setEndsAt] = useState<number>(0)
  const [now, setNow] = useState<number>(() => Date.now())
  // Fires once when a phase runs out, for the caller to chime or nudge on.
  const onExpireRef = useRef<((phase: FocusPhase) => void) | null>(null)

  useEffect(() => {
    const storedLength = readStored<number>(LENGTH_KEY)
    if (typeof storedLength === "number" && storedLength > 0) setMinutesState(storedLength)

    const stored = readStored<Persisted>(STATE_KEY)
    // A deadline in the past belongs to a session that ended while the page was
    // closed. Resuming it would show a timer at zero, so it is dropped.
    if (stored && stored.endsAt > Date.now()) {
      setPhase(stored.phase)
      setEndsAt(stored.endsAt)
      setMinutesState(stored.minutes)
    } else if (stored) {
      clearStored(STATE_KEY)
    }
  }, [])

  // Only ticks while something is counting down, so an idle page does no work.
  useEffect(() => {
    if (phase !== "focus" && phase !== "break") return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [phase])

  const remaining = Math.max(Math.ceil((endsAt - now) / 1000), 0)

  useEffect(() => {
    if (phase !== "focus" && phase !== "break") return
    if (remaining > 0) return
    const finished = phase
    clearStored(STATE_KEY)
    setPhase(finished === "focus" ? "break" : "done")
    setEndsAt(finished === "focus" ? Date.now() + BREAK_MINUTES * 60_000 : 0)
    onExpireRef.current?.(finished)
  }, [phase, remaining])

  // The break's own deadline has to be persisted too, or a reload during it
  // loses the break and drops the reader straight back into work.
  useEffect(() => {
    if (phase === "focus" || phase === "break") {
      writeStored(STATE_KEY, { phase, endsAt, minutes } satisfies Persisted)
    }
  }, [phase, endsAt, minutes])

  const start = useCallback(
    (length?: number) => {
      const chosen = length ?? minutes
      setMinutesState(chosen)
      writeStored(LENGTH_KEY, chosen)
      setPhase("focus")
      setEndsAt(Date.now() + chosen * 60_000)
    },
    [minutes],
  )

  const stop = useCallback(() => {
    clearStored(STATE_KEY)
    setPhase("idle")
    setEndsAt(0)
  }, [])

  const skipBreak = useCallback(() => {
    clearStored(STATE_KEY)
    setPhase("idle")
    setEndsAt(0)
  }, [])

  /** Adds time without restarting, for when the thought is nearly finished. */
  const extend = useCallback((extraMinutes: number) => {
    setEndsAt((current) => Math.max(current, Date.now()) + extraMinutes * 60_000)
  }, [])

  const setMinutes = useCallback((value: number) => {
    setMinutesState(value)
    writeStored(LENGTH_KEY, value)
  }, [])

  const onExpire = useCallback((handler: ((phase: FocusPhase) => void) | null) => {
    onExpireRef.current = handler
  }, [])

  return {
    phase,
    minutes,
    remaining,
    running: phase === "focus" || phase === "break",
    /** How far through the current block, 0 to 100. */
    percent:
      phase === "focus" && minutes > 0
        ? Math.min(Math.round((1 - remaining / (minutes * 60)) * 100), 100)
        : phase === "break"
          ? Math.min(Math.round((1 - remaining / (BREAK_MINUTES * 60)) * 100), 100)
          : 0,
    start,
    stop,
    skipBreak,
    extend,
    setMinutes,
    onExpire,
  }
}

/** "9:05" / "0:42". Minutes and seconds, because a bare count of seconds is not time anyone reads. */
export function formatClock(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${String(secs).padStart(2, "0")}`
}
