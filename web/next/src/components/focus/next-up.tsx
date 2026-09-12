"use client"

import {
  RiArrowRightLine,
  RiCheckboxCircleFill,
  RiErrorWarningLine,
  RiFireLine,
  RiMapPinLine,
  RiTimerLine,
} from "@remixicon/react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { BREAK_MINUTES, FOCUS_LENGTHS, useFocusTimer } from "@/hooks/use-focus-timer"
import { apiClient, unwrap } from "@/lib/api/client"
import { cn } from "@/lib/utils"

/**
 * The start screen: one lesson, one button.
 *
 * The course map is the honest picture of the syllabus and a bad place to
 * begin a session, because choosing from 256 lessons is a decision you have to
 * win before any studying happens, and it is a decision that is easy to lose.
 * Lessons unlock in order, so there is exactly one right answer at any moment.
 * This screen shows that answer and nothing to weigh against it.
 */
type LessonTarget = { id: string; title: string; summary: string; xp: number }

export function NextUp() {
  const timer = useFocusTimer()

  const map = useQuery({
    queryKey: ["learn", "map"],
    queryFn: async () => {
      const { data, error } = await unwrap(apiClient.v1.learn.map.$get())
      if (error) throw new Error(error.message)
      return data
    },
  })

  const stats = useQuery({
    queryKey: ["learn", "stats"],
    queryFn: async () => {
      const { data, error } = await unwrap(apiClient.v1.learn.stats.$get())
      if (error) throw new Error(error.message)
      return data
    },
  })

  if (map.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-56" />
        <Skeleton className="h-20" />
      </div>
    )
  }

  if (map.error || !map.data) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiErrorWarningLine />
          </EmptyMedia>
          <EmptyTitle>Could not work out what is next</EmptyTitle>
          <EmptyDescription>{map.error?.message ?? "The API returned no course."}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="secondary" onClick={() => map.refetch()}>
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  // The next lesson is the first unlocked one not yet finished. Falling back to
  // the last unlocked lesson keeps the button useful for someone who has caught
  // up: revisiting beats being shown an empty screen.
  let next: LessonTarget | null = null
  let breadcrumb = ""
  let lastUnlocked: LessonTarget | null = null
  let lastBreadcrumb = ""
  for (const part of map.data.parts) {
    for (const section of part.sections) {
      for (const unit of section.units) {
        for (const lesson of unit.lessons) {
          if (!lesson.unlocked) continue
          const entry = {
            id: lesson.id,
            title: lesson.title,
            summary: lesson.summary,
            xp: lesson.xp,
          }
          lastUnlocked = entry
          lastBreadcrumb = `${section.title} · ${unit.title}`
          if (!lesson.completed && !next) {
            next = entry
            breadcrumb = `${section.title} · ${unit.title}`
          }
        }
      }
    }
  }
  const revisiting = !next && lastUnlocked !== null
  const target = next ?? lastUnlocked
  const trail = next ? breadcrumb : lastBreadcrumb

  if (!target) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiMapPinLine />
          </EmptyMedia>
          <EmptyTitle>Nothing unlocked yet</EmptyTitle>
          <EmptyDescription>
            The course has not been seeded, or nothing has opened up. The map shows the whole
            picture.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/learn" />}>Open the course map</Button>
        </EmptyContent>
      </Empty>
    )
  }

  const done = stats.data?.lessonsCompleted ?? 0
  const total = stats.data?.lessonsTotal ?? map.data.totals.lessons
  const streak = stats.data?.streak ?? 0
  const reviewsDue = stats.data?.reviewsDue ?? 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-muted-foreground text-xs">{trail}</p>
              <h2 className="text-lg font-semibold">{target.title}</h2>
            </div>
            {revisiting ? (
              <Badge variant="secondary" className="text-success">
                <RiCheckboxCircleFill data-slot="badge-icon" />
                All caught up
              </Badge>
            ) : (
              <Badge variant="secondary">{target.xp} XP</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-muted-foreground text-sm">{target.summary}</p>

          <fieldset className="space-y-2">
            <legend className="text-muted-foreground mb-2 text-xs font-medium">
              How long are you sitting down for?
            </legend>
            <div className="flex flex-wrap gap-2">
              {FOCUS_LENGTHS.map((length) => (
                <Button
                  key={length}
                  type="button"
                  variant={timer.minutes === length ? "secondary" : "ghost"}
                  size="sm"
                  aria-pressed={timer.minutes === length}
                  onClick={() => timer.setMinutes(length)}
                  className={cn(timer.minutes === length && "ring-ring/50 ring-2")}
                >
                  {length} min
                </Button>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">
              A {timer.minutes} minute block, then a {BREAK_MINUTES} minute break. The clock keeps
              running if you leave the page, and you can add time without restarting.
            </p>
          </fieldset>

          <div className="flex flex-wrap items-center gap-2">
            <Button render={<Link href={`/focus/${target.id}?start=1`} />} size="lg">
              Start {timer.minutes} minutes
              <RiArrowRightLine />
            </Button>
            <Button render={<Link href={`/focus/${target.id}`} />} variant="ghost" size="lg">
              Open without a timer
            </Button>
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="focus-momentum">
        <h2 id="focus-momentum" className="sr-only">
          Momentum
        </h2>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <RiFireLine className="size-4" aria-hidden />
            {streak === 0 ? "No streak yet" : `${streak} day streak`}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <RiCheckboxCircleFill className="text-success size-4" aria-hidden />
            {done} of {total} lessons
          </span>
          <span className="inline-flex items-center gap-1.5">
            <RiTimerLine className="size-4" aria-hidden />
            {reviewsDue === 0
              ? "No reviews due"
              : `${reviewsDue} review${reviewsDue === 1 ? "" : "s"} due`}
          </span>
        </div>
      </section>

      <p className="text-muted-foreground text-xs">
        Want the whole syllabus instead?{" "}
        <Link href="/learn" className="underline underline-offset-4">
          The course map
        </Link>{" "}
        has all {total} lessons, and{" "}
        <Link href="/audiobook" className="underline underline-offset-4">
          the audiobook
        </Link>{" "}
        reads them to you.
      </p>
    </div>
  )
}
