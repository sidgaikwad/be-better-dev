"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * Type sizes for the focus reader.
 *
 * Three, not a slider. A slider is one more thing to fiddle with instead of
 * reading, and the fiddling is the failure mode this whole surface exists to
 * avoid. Each step pairs its size with looser leading, since long lines of
 * tight text are the part that is actually hard to track.
 */
export const READING_SIZES = {
  comfortable: { label: "Comfortable", className: "text-base leading-7" },
  large: { label: "Large", className: "text-lg leading-8" },
  largest: { label: "Largest", className: "text-xl leading-9" },
} as const

export type ReadingSize = keyof typeof READING_SIZES

const SIZE_KEY = "focus:reading-size"

/** Remembers the reader's chosen type size. Set once, never asked again. */
export function useReadingComfort() {
  const [size, setSizeState] = useState<ReadingSize>("large")

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIZE_KEY)
      if (stored && stored in READING_SIZES) setSizeState(stored as ReadingSize)
    } catch {
      // Falls back to the default size, which is the point of having one.
    }
  }, [])

  const setSize = useCallback((value: ReadingSize) => {
    setSizeState(value)
    try {
      window.localStorage.setItem(SIZE_KEY, value)
    } catch {
      // Preference is best-effort; the reader still works at the chosen size.
    }
  }, [])

  return { size, setSize, className: READING_SIZES[size].className }
}
