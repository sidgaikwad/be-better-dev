"use client"

import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckboxCircleFill,
  RiLockLine,
} from "@remixicon/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { Markdown } from "@/components/learn/markdown"
import { NotesLayer } from "@/components/learn/notes-layer"
import { QuizRunner, type QuizResult } from "@/components/learn/quiz"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { apiClient, unwrap } from "@/lib/api/client"

export function LessonPlayer({ slug }: { slug: string }) {
  const queryClient = useQueryClient()
  const [results, setResults] = useState<QuizResult[] | null>(null)
  // Time on the lesson, capped server-side; the ref avoids a re-render a second.
  const secondsRef = useRef(0)
  // The notes layer anchors to text inside this element.
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    secondsRef.current = 0
    setResults(null)
    const interval = setInterval(() => {
      if (!document.hidden) secondsRef.current += 1
    }, 1000)
    return () => clearInterval(interval)
  }, [slug])

  const { data, isPending } = useQuery({
    queryKey: ["learn", "lesson", slug],
    queryFn: async () => {
      const { data, error } = await unwrap(
        apiClient.v1.learn.lesson[":id"].$get({ param: { id: slug } }),
      )
      if (error) throw new Error(error.message)
      return data
    },
  })

  const complete = useMutation({
    mutationFn: async (answers: number[]) => {
      const { data, error } = await unwrap(
        apiClient.v1.learn.lesson[":id"].complete.$post({
          param: { id: slug },
          json: { answers, seconds: Math.min(secondsRef.current, 7200) },
        }),
      )
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (outcome) => {
      setResults(outcome.results)
      if (outcome.firstCompletion) {
        toast.add({
          title: `+${outcome.xpAwarded} XP · ${outcome.correct}/${outcome.total} correct`,
          type: "success",
        })
        for (const badge of outcome.badgesAwarded) {
          toast.add({ title: `${badge.icon} Badge earned: ${badge.title}`, type: "success" })
        }
      } else {
        toast.add({
          title: `Practice run: ${outcome.correct}/${outcome.total} correct`,
          type: "info",
        })
      }
      queryClient.invalidateQueries({ queryKey: ["learn", "map"] })
      queryClient.invalidateQueries({ queryKey: ["learn", "stats"] })
      queryClient.invalidateQueries({ queryKey: ["learn", "lesson", slug] })
    },
    onError: (error) => {
      toast.add({ title: error.message || "Could not submit the lesson", type: "error" })
    },
  })

  if (isPending || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!data.unlocked) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiLockLine />
          </EmptyMedia>
          <EmptyTitle>{data.lesson.title} is locked</EmptyTitle>
          <EmptyDescription>
            Lessons unlock in order. Finish the previous one and this opens up.
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

  return (
    <article className="space-y-6">
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs">
          {data.context.partTitle} · {data.context.sectionTitle} · {data.context.unitTitle}
        </p>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{data.lesson.title}</h1>
          {data.completed && (
            <Badge variant="secondary" className="text-success">
              <RiCheckboxCircleFill data-slot="badge-icon" />
              Completed
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">{data.lesson.summary}</p>
      </div>

      <div ref={contentRef} className="relative">
        <Markdown>{data.lesson.content}</Markdown>
        <NotesLayer lessonId={slug} contentRef={contentRef} />
      </div>

      {data.quiz.length > 0 && (
        <>
          <Separator />
          <section aria-labelledby="lesson-quiz">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 id="lesson-quiz" className="font-semibold">
                Check yourself
              </h2>
              <span className="text-muted-foreground text-xs">
                {data.completed
                  ? "Practice: no XP, reviews unaffected"
                  : `${data.lesson.xp} XP on completion`}
              </span>
            </div>
            <QuizRunner
              items={data.quiz}
              results={results}
              submitting={complete.isPending}
              submitLabel={data.completed ? "Check again" : "Complete lesson"}
              onSubmit={(answers) => complete.mutate(answers)}
            />
          </section>
        </>
      )}

      <Separator />
      <nav className="flex items-center justify-between" aria-label="Lesson navigation">
        {data.nav.prevId ? (
          <Button render={<Link href={`/learn/${data.nav.prevId}`} />} variant="ghost">
            <RiArrowLeftLine />
            Previous
          </Button>
        ) : (
          <span />
        )}
        {data.nav.nextId ? (
          <Button render={<Link href={`/learn/${data.nav.nextId}`} />}>
            Next lesson
            <RiArrowRightLine />
          </Button>
        ) : (
          <Button render={<Link href="/learn" />} variant="secondary">
            Back to the map
          </Button>
        )}
      </nav>
    </article>
  )
}
