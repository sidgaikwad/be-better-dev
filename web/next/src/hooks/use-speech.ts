"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type { SpeechSegment } from "@/lib/speech"

export type SpeechStatus = "idle" | "playing" | "paused"

export const SPEECH_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const

const RATE_KEY = "read-aloud:rate"
const VOICE_KEY = "read-aloud:voice"

// Chrome stops feeding a synthesis job after roughly fifteen seconds of
// speaking and never resumes on its own. Calling resume() on a timer while we
// believe we are playing keeps the queue alive, and is a no-op on engines
// without the bug. Only ticks while playing, so it can never undo a user pause.
const KEEPALIVE_MS = 10_000

// localStorage throws in Safari private browsing rather than returning null,
// and a saved playback rate is never worth failing a render over.
function readStored(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStored(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Preference is best-effort; playback works fine without it.
  }
}

/**
 * Drives `window.speechSynthesis` over a queue of {@link SpeechSegment}s.
 *
 * The queue is spoken one segment per utterance rather than as one long string:
 * that sidesteps engine truncation, and it is what makes "skip back a sentence"
 * and the live position readout possible.
 *
 * `onSegmentEnd` fires after each segment, `onQueueEnd` once the last one
 * finishes naturally (never on stop), which is how the audiobook advances to
 * the next lesson.
 */
export function useSpeech({
  onQueueEnd,
  onSegmentEnd,
}: {
  onQueueEnd?: () => void
  onSegmentEnd?: (index: number) => void
} = {}) {
  const [supported, setSupported] = useState(false)
  const [status, setStatus] = useState<SpeechStatus>("idle")
  const [segments, setSegments] = useState<SpeechSegment[]>([])
  const [index, setIndex] = useState(0)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceUri, setVoiceUriState] = useState<string | null>(null)
  const [rate, setRateState] = useState(1)

  // Speaking is driven from engine callbacks, which close over whatever was
  // current when the utterance was created. Refs keep that path reading live
  // values, while the state above only exists to render.
  const segmentsRef = useRef<SpeechSegment[]>([])
  const indexRef = useRef(0)
  const rateRef = useRef(1)
  const voiceUriRef = useRef<string | null>(null)
  // Set while we are deliberately cancelling, so the resulting `onend` is
  // recognised as ours and does not advance the queue.
  const cancellingRef = useRef(false)
  const onQueueEndRef = useRef(onQueueEnd)
  const onSegmentEndRef = useRef(onSegmentEnd)

  useEffect(() => {
    onQueueEndRef.current = onQueueEnd
    onSegmentEndRef.current = onSegmentEnd
  }, [onQueueEnd, onSegmentEnd])

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return
    setSupported(true)

    const storedRate = Number(readStored(RATE_KEY))
    if (Number.isFinite(storedRate) && storedRate > 0) {
      rateRef.current = storedRate
      setRateState(storedRate)
    }
    const storedVoice = readStored(VOICE_KEY)
    if (storedVoice) {
      voiceUriRef.current = storedVoice
      setVoiceUriState(storedVoice)
    }

    // Voices arrive asynchronously in Chrome: the first call returns an empty
    // list and `voiceschanged` fires once the engine has them.
    const sync = () => setVoices(window.speechSynthesis.getVoices())
    sync()
    window.speechSynthesis.addEventListener("voiceschanged", sync)
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", sync)
      window.speechSynthesis.cancel()
    }
  }, [])

  useEffect(() => {
    if (status !== "playing") return
    const timer = setInterval(() => window.speechSynthesis.resume(), KEEPALIVE_MS)
    return () => clearInterval(timer)
  }, [status])

  // Leaving the page mid-sentence would otherwise keep talking: the engine is
  // global to the tab and outlives the component that started it.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        cancellingRef.current = true
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const speakFrom = useCallback((start: number) => {
    const queue = segmentsRef.current
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return
    if (start < 0 || start >= queue.length) return

    cancellingRef.current = true
    window.speechSynthesis.cancel()
    cancellingRef.current = false

    indexRef.current = start
    setIndex(start)

    const segment = queue[start]
    if (!segment) return

    const utterance = new SpeechSynthesisUtterance(segment.text)
    utterance.rate = rateRef.current
    const voice = window.speechSynthesis
      .getVoices()
      .find((candidate) => candidate.voiceURI === voiceUriRef.current)
    if (voice) {
      utterance.voice = voice
      // Without this some engines keep the document language and mispronounce
      // the whole segment in the wrong accent.
      utterance.lang = voice.lang
    }

    utterance.onend = () => {
      if (cancellingRef.current) return
      onSegmentEndRef.current?.(indexRef.current)
      const next = indexRef.current + 1
      if (next < segmentsRef.current.length) {
        speakFrom(next)
        return
      }
      setStatus("idle")
      onQueueEndRef.current?.()
    }
    utterance.onerror = (event) => {
      // "interrupted" and "canceled" are what our own cancel() reports; anything
      // else is a real failure and should stop the queue rather than loop.
      if (event.error === "interrupted" || event.error === "canceled") return
      setStatus("idle")
    }

    window.speechSynthesis.speak(utterance)
    setStatus("playing")
  }, [])

  /** Replaces the queue. Pass `autoplay` to start speaking immediately. */
  const load = useCallback(
    (next: SpeechSegment[], opts?: { autoplay?: boolean; startIndex?: number }) => {
      cancellingRef.current = true
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
      cancellingRef.current = false
      segmentsRef.current = next
      setSegments(next)
      const start = Math.min(Math.max(opts?.startIndex ?? 0, 0), Math.max(next.length - 1, 0))
      indexRef.current = start
      setIndex(start)
      if (opts?.autoplay && next.length > 0) {
        speakFrom(start)
      } else {
        setStatus("idle")
      }
    },
    [speakFrom],
  )

  const play = useCallback(() => {
    if (segmentsRef.current.length === 0) return
    speakFrom(indexRef.current)
  }, [speakFrom])

  const pause = useCallback(() => {
    window.speechSynthesis.pause()
    setStatus("paused")
  }, [])

  const resume = useCallback(() => {
    window.speechSynthesis.resume()
    setStatus("playing")
  }, [])

  const stop = useCallback(() => {
    cancellingRef.current = true
    window.speechSynthesis.cancel()
    cancellingRef.current = false
    setStatus("idle")
  }, [])

  const toggle = useCallback(() => {
    if (status === "playing") pause()
    else if (status === "paused") resume()
    else play()
  }, [status, pause, resume, play])

  /** Jumps to a segment, keeping playback running if it already was. */
  const seek = useCallback(
    (target: number) => {
      const clamped = Math.min(Math.max(target, 0), Math.max(segmentsRef.current.length - 1, 0))
      if (status === "idle") {
        indexRef.current = clamped
        setIndex(clamped)
        return
      }
      speakFrom(clamped)
    },
    [status, speakFrom],
  )

  const next = useCallback(() => seek(indexRef.current + 1), [seek])
  const previous = useCallback(() => seek(indexRef.current - 1), [seek])

  const setRate = useCallback(
    (value: number) => {
      rateRef.current = value
      setRateState(value)
      writeStored(RATE_KEY, String(value))
      // Rate is fixed at the moment an utterance is created, so a change only
      // takes effect by restarting the segment being spoken.
      if (status === "playing") speakFrom(indexRef.current)
    },
    [status, speakFrom],
  )

  const setVoiceUri = useCallback(
    (value: string) => {
      voiceUriRef.current = value
      setVoiceUriState(value)
      writeStored(VOICE_KEY, value)
      if (status === "playing") speakFrom(indexRef.current)
    },
    [status, speakFrom],
  )

  return {
    supported,
    status,
    segments,
    index,
    current: segments[index] ?? null,
    voices,
    voiceUri,
    rate,
    load,
    play,
    pause,
    resume,
    stop,
    toggle,
    seek,
    next,
    previous,
    setRate,
    setVoiceUri,
  }
}

export type Speech = ReturnType<typeof useSpeech>
