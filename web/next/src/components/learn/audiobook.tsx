"use client"

import {
  RiCheckboxCircleFill,
  RiErrorWarningLine,
  RiHeadphoneLine,
  RiLockLine,
  RiPlayFill,
  RiVolumeUpLine,
} from "@remixicon/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { ReadAloudBar } from "@/components/learn/read-aloud"
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
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { useSpeech } from "@/hooks/use-speech"
import { apiClient, unwrap } from "@/lib/api/client"
import { toSpeechSegments } from "@/lib/speech"
import { cn } from "@/lib/utils"

type QueueEntry = {
  id: string
  title: string
  sectionTitle: string
  completed: boolean
}

async function fetchLesson(id: string) {
  const { data, error } = await unwrap(apiClient.v1.learn.lesson[":id"].$get({ param: { id } }))
  if (error) throw new Error(error.message)
  return data
}

const lessonQueryOptions = (id: string) => ({
  queryKey: ["learn", "lesson", id] as const,
  queryFn: () => fetchLesson(id),
})

/**
 * Continuous listening across the whole course.
 *
 * The lesson player reads one lesson; this reads the queue, rolling into the
 * next lesson when one ends so the course can be followed on a walk or a
 * commute. Only unlocked lessons are queued, because a locked lesson answers
 * with its metadata and no body: the unlock order is the point of the course.
 *
 * Listening deliberately awards no XP and completes nothing. Completion means
 * answering the quiz, and a lesson you dozed through is not a lesson you passed.
 */
export function Audiobook() {
  const queryClient = useQueryClient()
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [continuous, setContinuous] = useState(true)
  // Set just before a lesson change that should start speaking on arrival, so
  // an auto-advance keeps playing while a click on the list does too, and a
  // plain page load stays silent.
  const autoplayRef = useRef(false)

  const map = useQuery({
    queryKey: ["learn", "map"],
    queryFn: async () => {
      const { data, error } = await unwrap(apiClient.v1.learn.map.$get())
      if (error) throw new Error(error.message)
      return data
    },
  })

  const { queue, locked } = useMemo(() => {
    const entries: QueueEntry[] = []
    let lockedCount = 0
    for (const part of map.data?.parts ?? []) {
      for (const section of part.sections) {
        for (const unit of section.units) {
          for (const lesson of unit.lessons) {
            if (!lesson.unlocked) {
              lockedCount++
              continue
            }
            entries.push({
              id: lesson.id,
              title: lesson.title,
              sectionTitle: section.title,
              completed: lesson.completed,
            })
          }
        }
      }
    }
    return { queue: entries, locked: lockedCount }
  }, [map.data])

  const position = queue.findIndex((entry) => entry.id === currentId)
  const upNext = position >= 0 ? queue[position + 1] : undefined

  const advance = useCallback(() => {
    if (!continuous) {
      toast.add({ title: "Reached the end of the lesson", type: "info" })
      return
    }
    if (!upNext) {
      toast.add({ title: "That was the last unlocked lesson", type: "info" })
      return
    }
    autoplayRef.current = true
    setCurrentId(upNext.id)
  }, [continuous, upNext])

  const speech = useSpeech({ onQueueEnd: advance })
  const { load } = speech

  // Start where the listener left off in the course rather than at lesson one.
  useEffect(() => {
    if (currentId || queue.length === 0) return
    setCurrentId((queue.find((entry) => !entry.completed) ?? queue[0])?.id ?? null)
  }, [queue, currentId])

  const lesson = useQuery({
    ...lessonQueryOptions(currentId ?? ""),
    enabled: Boolean(currentId),
  })

  const segments = useMemo(() => {
    const data = lesson.data
    if (!data?.lesson.content) return []
    return toSpeechSegments(data.lesson.content, {
      title: data.lesson.title,
      summary: data.lesson.summary,
    })
  }, [lesson.data])

  useEffect(() => {
    if (segments.length === 0) return
    load(segments, { autoplay: autoplayRef.current })
    autoplayRef.current = false
  }, [segments, load])

  // A gap between lessons would break the illusion of one long recording, so
  // the next body is fetched while the current one is still being spoken.
  useEffect(() => {
    if (!upNext) return
    queryClient.prefetchQuery(lessonQueryOptions(upNext.id))
  }, [upNext, queryClient])

  useEffect(() => {
    if (lesson.error) {
      toast.add({ title: lesson.error.message || "Could not load that lesson", type: "error" })
    }
  }, [lesson.error])

  if (!speech.supported) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiVolumeUpLine />
          </EmptyMedia>
          <EmptyTitle>Listening is not available in this browser</EmptyTitle>
          <EmptyDescription>
            The audiobook is read by your device&apos;s own speech engine, which this browser does
            not expose. Chrome, Edge, and Safari all support it.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/learn" />} variant="secondary">
            Back to the course map
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  if (map.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-96" />
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
          <EmptyTitle>Could not load the queue</EmptyTitle>
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

  if (queue.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiHeadphoneLine />
          </EmptyMedia>
          <EmptyTitle>Nothing unlocked to listen to yet</EmptyTitle>
          <EmptyDescription>
            The audiobook follows the same unlock order as the course. Finish the first lesson and
            it starts filling up.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/learn" />}>Open the course map</Button>
        </EmptyContent>
      </Empty>
    )
  }

  const playing = queue[position]
  const playFrom = (id: string) => {
    if (id === currentId) {
      load(segments, { autoplay: true })
      return
    }
    autoplayRef.current = true
    setCurrentId(id)
  }

  // Grouped for the list, in queue order: the section a lesson belongs to is
  // the only landmark a listener has once they stop looking at the screen.
  const groups: { title: string; entries: QueueEntry[] }[] = []
  for (const entry of queue) {
    const last = groups[groups.length - 1]
    if (last && last.title === entry.sectionTitle) last.entries.push(entry)
    else groups.push({ title: entry.sectionTitle, entries: [entry] })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">
                {playing?.sectionTitle ?? "Nothing selected"}
                {position >= 0 && ` · ${position + 1} of ${queue.length}`}
              </p>
              <h2 className="truncate font-semibold">
                {lesson.isPending && currentId ? "Loading…" : (playing?.title ?? "Pick a lesson")}
              </h2>
            </div>
            {playing && (
              <Button render={<Link href={`/learn/${playing.id}`} />} variant="secondary" size="sm">
                Open lesson
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ReadAloudBar
            speech={speech}
            caption={
              upNext
                ? `Up next: ${upNext.title}`
                : "Last lesson in the queue. Unlock more from the course map."
            }
          >
            <label className="text-muted-foreground flex items-center gap-2 text-xs">
              <Switch
                size="sm"
                checked={continuous}
                onCheckedChange={(checked) => setContinuous(checked)}
              />
              Keep playing
            </label>
          </ReadAloudBar>
        </CardContent>
      </Card>

      <section aria-labelledby="audiobook-queue">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 id="audiobook-queue" className="font-semibold">
            Queue
          </h2>
          <span className="text-muted-foreground text-xs">
            {queue.length} unlocked
            {locked > 0 && ` · ${locked} still locked`}
          </span>
        </div>
        <div className="space-y-4">
          {groups.map((group, groupIndex) => (
            <div key={`${group.title}-${groupIndex}`}>
              <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.entries.map((entry) => {
                  const active = entry.id === currentId
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => playFrom(entry.id)}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                          active && "bg-accent font-medium",
                        )}
                      >
                        {active && speech.status === "playing" ? (
                          <RiVolumeUpLine className="text-primary size-4 shrink-0" />
                        ) : entry.completed ? (
                          <RiCheckboxCircleFill className="text-success size-4 shrink-0" />
                        ) : (
                          <RiPlayFill className="text-muted-foreground size-4 shrink-0" />
                        )}
                        <span className="min-w-0 flex-1 truncate">{entry.title}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          {locked > 0 && (
            <p className="text-muted-foreground flex items-center gap-2 px-2 text-xs">
              <RiLockLine className="size-3.5 shrink-0" aria-hidden />
              {locked} lesson{locked === 1 ? "" : "s"} still locked. They join the queue as you
              finish the ones before them.
            </p>
          )}
        </div>
      </section>

      <Badge variant="secondary" className="text-muted-foreground">
        Listening earns no XP: finish the quiz on the lesson page for that.
      </Badge>
    </div>
  )
}
