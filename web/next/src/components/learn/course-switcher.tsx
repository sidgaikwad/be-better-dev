"use client"

import { RiBookShelfLine } from "@remixicon/react"
import { useQuery } from "@tanstack/react-query"

import { useActiveCourse } from "@/components/learn/active-course"
import { SidebarDropdownMenu } from "@/components/shell/sidebar-dropdown-menu"
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient, unwrap } from "@/lib/api/client"

// The mark is repeated in the trigger and in the panel header, which the shared dropdown draws as two separate nodes.
function CourseMark() {
  return (
    <div className="bg-sidebar-accent text-sidebar-accent-foreground flex aspect-square size-8 items-center justify-center rounded-md">
      <RiBookShelfLine className="size-4" />
    </div>
  )
}

/**
 * The shelf: which course the map, the audiobook and focus are drawing.
 *
 * Sits in the sidebar header so the choice is reachable from every learn
 * surface rather than only from the map, and so a third course is a seed away
 * from appearing with no layout to rethink. Renders nothing while the platform
 * carries a single course, since a picker with one option is just chrome.
 */
export function CourseSwitcher() {
  const { courseId, setCourseId } = useActiveCourse()
  const { data, isPending } = useQuery({
    queryKey: ["learn", "courses"],
    queryFn: async () => {
      const { data, error } = await unwrap(apiClient.v1.learn.courses.$get())
      if (error) throw new Error(error.message)
      return data
    },
  })

  // Matches the lg SidebarMenuButton the trigger renders as, so the header does not resize under the nav when the courses land.
  if (isPending) return <Skeleton className="h-12 w-full" />
  const courses = data?.courses ?? []
  if (courses.length < 2) return null

  // No stored choice, or one naming a course that has since left the seed, means the map is drawing the first course on the shelf: /map with no filter orders by the same (position, id), so this is the course actually on screen rather than a guess at it.
  const active = courses.find((entry) => entry.id === courseId) ?? courses[0]
  if (!active) return null

  const identity = {
    leading: <CourseMark />,
    primary: active.title,
    secondary: `${active.lessonsDone}/${active.lessonsTotal} lessons`,
    secondaryClassName: "text-muted-foreground",
  }

  return (
    <SidebarDropdownMenu align="start" mobileSide="bottom" trigger={identity} header={identity}>
      {/* A radio group rather than plain items: the courses are one exclusive choice, so the panel should say which one is current instead of leaving the reader to infer it from the trigger. */}
      <DropdownMenuRadioGroup
        value={active.id}
        onValueChange={(value) => setCourseId(String(value))}
      >
        {courses.map((entry) => (
          // Two lines rather than a row: the panel is only as wide as the sidebar, and a title beside its count truncated every course to its first two words. No leading icon either, since every row here is a course and the check already marks the current one.
          <DropdownMenuRadioItem
            key={entry.id}
            value={entry.id}
            // Radio items keep the menu open by default, which suits a filter you tick several of. Picking a course is a single decision that redraws the page behind the panel, so it should get out of the way.
            closeOnClick
            className="py-1.5"
          >
            <div className="grid flex-1 leading-tight">
              <span className="truncate">{entry.title}</span>
              <span className="text-muted-foreground truncate text-xs">
                {entry.lessonsDone}/{entry.lessonsTotal} lessons
              </span>
            </div>
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </SidebarDropdownMenu>
  )
}
