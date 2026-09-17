"use client"

import { useQuery } from "@tanstack/react-query"

import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { apiClient, unwrap } from "@/lib/api/client"

/**
 * The shelf: which course the map, the audiobook and focus are drawing.
 *
 * Renders nothing at all when the platform carries a single course, so the
 * surface stays exactly as it was until a second one is seeded.
 */
export function CourseSwitcher({
  courseId,
  onSelect,
}: {
  courseId: string | null
  onSelect: (id: string) => void
}) {
  const { data, isPending } = useQuery({
    queryKey: ["learn", "courses"],
    queryFn: async () => {
      const { data, error } = await unwrap(apiClient.v1.learn.courses.$get())
      if (error) throw new Error(error.message)
      return data
    },
  })

  if (isPending) return <Skeleton className="h-9 w-64" />
  const courses = data?.courses ?? []
  if (courses.length < 2) return null

  // No stored choice yet means the map is drawing the first course, so that is
  // the one to show as selected.
  const selected = courseId ?? courses[0]?.id

  return (
    <ToggleGroup
      variant="outline"
      value={selected ? [selected] : []}
      onValueChange={(value) => {
        // The group empties itself when the pressed item is the selected one;
        // a course always has to be chosen, so ignore that.
        const next = value[0]
        if (next) onSelect(next)
      }}
      aria-label="Course"
    >
      {courses.map((entry) => (
        <ToggleGroupItem key={entry.id} value={entry.id}>
          {entry.title}
          <span className="text-muted-foreground text-xs">
            {entry.lessonsDone}/{entry.lessonsTotal}
          </span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
