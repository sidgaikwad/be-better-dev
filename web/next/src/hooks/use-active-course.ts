"use client"

import { useCallback, useEffect, useState } from "react"

const COURSE_KEY = "learn:course"

/**
 * Which course the learner is currently studying.
 *
 * Kept in localStorage rather than on the user row: it is a view preference,
 * not progress, and progress is already per lesson, so a learner who switches
 * courses loses nothing. `null` means "whatever the API calls first", which is
 * the state on a fresh device and the only state the platform had before it
 * carried a second course.
 */
export function useActiveCourse() {
  const [courseId, setCourseIdState] = useState<string | null>(null)
  // The stored value only arrives after mount, so a component that has to wait
  // for the real course (rather than render the default one) can ask.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COURSE_KEY)
      if (stored) setCourseIdState(stored)
    } catch {
      // Falls back to the first course, which is the point of having one.
    }
    setReady(true)
  }, [])

  const setCourseId = useCallback((value: string) => {
    setCourseIdState(value)
    try {
      window.localStorage.setItem(COURSE_KEY, value)
    } catch {
      // Best effort: the switch still holds for this page.
    }
  }, [])

  return { courseId, setCourseId, ready }
}
