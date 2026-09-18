"use client"

import * as React from "react"

const COURSE_KEY = "learn:course"

type ActiveCourse = {
  courseId: string | null
  ready: boolean
  setCourseId: (value: string) => void
}

const ActiveCourseContext = React.createContext<ActiveCourse>({
  courseId: null,
  ready: false,
  setCourseId: () => {},
})

// Which course the learner is currently studying. Kept in localStorage rather than on the user row: it is a view preference, not progress, and progress is already per lesson, so a learner who switches courses loses nothing. `null` means "whatever the API lists first", which is the state on a fresh device.
// A provider rather than a bare hook because the switcher sits in the sidebar while the map, the audiobook and focus render in the page beside it: per-instance state would leave the sidebar naming one course and the page drawing another until something remounted.
export function ActiveCourseProvider({ children }: { children: React.ReactNode }) {
  const [courseId, setCourseIdState] = React.useState<string | null>(null)
  // The stored value only arrives after mount, so a surface that has to wait for the real course (rather than paint the default one and swap it) can ask.
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COURSE_KEY)
      if (stored) setCourseIdState(stored)
    } catch {
      // Falls back to the first course, which is the point of having one.
    }
    setReady(true)
  }, [])

  const setCourseId = React.useCallback((value: string) => {
    setCourseIdState(value)
    try {
      window.localStorage.setItem(COURSE_KEY, value)
    } catch {
      // Best effort: the switch still holds for this page.
    }
  }, [])

  // Memoized on the values, not the object: the provider sits above the whole shell, so a fresh object each render would re-render every learn surface that reads it.
  const value = React.useMemo(
    () => ({ courseId, ready, setCourseId }),
    [courseId, ready, setCourseId],
  )
  return <ActiveCourseContext value={value}>{children}</ActiveCourseContext>
}

export function useActiveCourse() {
  return React.use(ActiveCourseContext)
}
