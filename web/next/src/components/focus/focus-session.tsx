"use client"

import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiBookOpenLine,
  RiCheckboxCircleFill,
  RiErrorWarningLine,
  RiFontSize,
  RiLockLine,
} from "@remixicon/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import { BreakCard, FocusClock, SessionDoneCard } from "@/components/focus/focus-timer"
import { Markdown } from "@/components/learn/markdown"
import { QuizRunner, type QuizResult } from "@/components/learn/quiz"
import { ReadAloud } from "@/components/learn/read-aloud"
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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { useFocusTimer } from "@/hooks/use-focus-timer"
import { READING_SIZES, useReadingComfort, type ReadingSize } from "@/hooks/use-reading-comfort"
import { apiClient, unwrap } from "@/lib/api/client"
import { formatReadTime, toFocusSteps, totalReadSeconds } from "@/lib/focus"
import { cn } from "@/lib/utils"

/**
 * A lesson delivered one step at a time, on a clock.
 *
 * The same content as `/learn/<slug>`, arranged for a reader who cannot hold a
 * long page. Four things change, and each one is doing a job:
 *
 * - **One step on screen.** Nothing below the fold to pull at your attention,
 *   and a finish line close enough to be worth reaching.
 * - **A count that only goes up.** "Step 3 of 7" answers "how much is left"
 *   without the reader having to estimate, which is the estimate that goes
 *   wrong.
 * - **A clock you did not have to keep.** Time spent is externalised instead of
 *   tracked in your head, and the break is scheduled rather than stumbled into.
 * - **Bigger type by default.** Set once and remembered.
 *
 * Nothing here is a separate copy of the course: same lessons, same quiz, same
 * XP, same unlock order. This is a different door into the same room, and the
 * link back to the full page is always on screen so it is never a trap.
 */
export function FocusSession({ slug }: { slug: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const timer = useFocusTimer()
  const comfort = useReadingComfort()
  const { start: startTimer } = timer

  const [stepIndex, setStepIndex] = useState(0)
  const [results, setResults] = useState<QuizResult[] | null>(null)
  const secondsRef = useRef(0)
  // Scroll target for a step change: the reader should land at the top of the
  // new step, not wherever the last one happened to leave them.
  const topRef = useRef<HTMLDivElement>(null)
  // A session started from the start screen carries ?start=1. Consumed once,
  // so a refresh does not restart a block that has already been ended.
  const autoStartedRef = useRef(false)

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["learn", "lesson", slug],
    queryFn: async () => {
      const { data, error } = await unwrap(
        apiClient.v1.learn.lesson[":id"].$get({ param: { id: slug } }),
      )
      if (error) throw new Error(error.message)
      return data
    },
  })

  const steps = useMemo(() => toFocusSteps(data?.lesson.content ?? ""), [data?.lesson.content])

  useEffect(() => {
    setStepIndex(0)
    setResults(null)
    secondsRef.current = 0
    const interval = setInterval(() => {
      if (!document.hidden) secondsRef.current += 1
    }, 1000)
    return () => clearInterval(interval)
  }, [slug])

  useEffect(() => {
    if (autoStartedRef.current) return
    if (searchParams.get("start") !== "1") return
    autoStartedRef.current = true
    startTimer()
    // Drop the parameter so a reload does not re-arm the timer.
    router.replace(`/focus/${slug}`, { scroll: false })
  }, [searchParams, slug, router, startTimer])

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

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiErrorWarningLine />
          </EmptyMedia>
          <EmptyTitle>Could not load this lesson</EmptyTitle>
          <EmptyDescription>{error?.message ?? "The API returned no lesson."}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="secondary" onClick={() => refetch()}>
            Try again
          </Button>
        </EmptyContent>
      </Empty>
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
            Lessons unlock in order. Focus mode follows the same order as the map.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/focus" />} variant="secondary">
            What is next for me
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  // The quiz is one more step on the end, so "how much is left" stays a single
  // count rather than a page of reading plus an unknown quantity of questions.
  const hasQuiz = data.quiz.length > 0
  const totalSteps = steps.length + (hasQuiz ? 1 : 0)
  const onQuiz = hasQuiz && stepIndex >= steps.length
  const step = steps[stepIndex]
  const percent = totalSteps === 0 ? 0 : Math.round((stepIndex / totalSteps) * 100)
  const remaining = totalReadSeconds(steps.slice(stepIndex))

  const go = (target: number) => {
    setStepIndex(Math.min(Math.max(target, 0), Math.max(totalSteps - 1, 0)))
    topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
  }

  return (
    <div className="space-y-5">
      <div ref={topRef} className="scroll-mt-4 space-y-1">
        <p className="text-muted-foreground text-xs">
          {data.context.sectionTitle} · {data.context.unitTitle}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">{data.lesson.title}</h1>
          {data.completed && (
            <Badge variant="secondary" className="text-success">
              <RiCheckboxCircleFill data-slot="badge-icon" />
              Completed
            </Badge>
          )}
        </div>
      </div>

      {timer.phase === "break" ? (
        <BreakCard timer={timer} />
      ) : timer.phase === "done" ? (
        <SessionDoneCard timer={timer} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium tabular-nums">
                {onQuiz ? "Questions" : `Step ${stepIndex + 1} of ${totalSteps}`}
              </span>
              {!onQuiz && (
                <span className="text-muted-foreground text-xs">
                  {formatReadTime(remaining)} of reading left
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <FocusClock timer={timer} />
              <NativeSelect
                size="sm"
                aria-label="Text size"
                value={comfort.size}
                onChange={(event) => comfort.setSize(event.target.value as ReadingSize)}
              >
                {Object.entries(READING_SIZES).map(([value, entry]) => (
                  <NativeSelectOption key={value} value={value}>
                    {entry.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>

          <Progress value={percent} aria-label="Progress through this lesson" />

          {onQuiz ? (
            <section aria-labelledby="focus-quiz" className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 id="focus-quiz" className="font-semibold">
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
          ) : step ? (
            <article className="space-y-3">
              {step.heading && (
                <p className="text-muted-foreground text-xs font-medium uppercase">
                  {step.heading}
                </p>
              )}
              {/* The one thing on screen. The comfort class scales the whole
                  step, code blocks included, so nothing shrinks out from under
                  a reader who asked for larger type. */}
              <Markdown className={cn(comfort.className, "[&_p:first-child]:mt-0")}>
                {step.markdown}
              </Markdown>
              <ReadAloud content={step.markdown} />
            </article>
          ) : (
            <p className="text-muted-foreground text-sm">This lesson has no content yet.</p>
          )}

          <nav className="flex items-center justify-between gap-2" aria-label="Step navigation">
            <Button variant="ghost" onClick={() => go(stepIndex - 1)} disabled={stepIndex === 0}>
              <RiArrowLeftLine />
              Back
            </Button>
            {stepIndex < totalSteps - 1 ? (
              <Button onClick={() => go(stepIndex + 1)}>
                {stepIndex === steps.length - 1 && hasQuiz ? "To the questions" : "Next"}
                <RiArrowRightLine />
              </Button>
            ) : data.nav.nextId ? (
              <Button render={<Link href={`/focus/${data.nav.nextId}`} />} variant="secondary">
                Next lesson
                <RiArrowRightLine />
              </Button>
            ) : (
              <Button render={<Link href="/focus" />} variant="secondary">
                Back to what is next
              </Button>
            )}
          </nav>
        </>
      )}

      {/* Always reachable, so the chunked view is a door and not a cage. */}
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-4 text-xs">
        <Link
          href={`/learn/${slug}`}
          className="inline-flex items-center gap-1.5 underline underline-offset-4"
        >
          <RiBookOpenLine className="size-3.5" aria-hidden />
          Read the whole lesson on one page
        </Link>
        <span className="inline-flex items-center gap-1.5">
          <RiFontSize className="size-3.5" aria-hidden />
          Text size is remembered
        </span>
      </div>
    </div>
  )
}
