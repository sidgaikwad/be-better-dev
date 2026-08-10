"use client"

import { RiCheckDoubleLine } from "@remixicon/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"

import { QuizRunner, type QuizResult } from "@/components/learn/quiz"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { apiClient, unwrap } from "@/lib/api/client"

export function ReviewSession() {
  const queryClient = useQueryClient()
  const [results, setResults] = useState<QuizResult[] | null>(null)

  const { data, isPending } = useQuery({
    queryKey: ["learn", "review"],
    queryFn: async () => {
      const { data, error } = await unwrap(apiClient.v1.learn.review.$get())
      if (error) throw new Error(error.message)
      return data
    },
  })

  const submit = useMutation({
    mutationFn: async (payload: { quizItemId: string; answerIndex: number }[]) => {
      const { data, error } = await unwrap(
        apiClient.v1.learn.review.submit.$post({ json: { answers: payload } }),
      )
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (outcome) => {
      setResults(outcome.results)
      toast.add({
        title:
          outcome.xpAwarded > 0
            ? `+${outcome.xpAwarded} XP · ${outcome.correct}/${outcome.total} recalled`
            : `${outcome.correct}/${outcome.total} recalled; misses return tomorrow`,
        type: outcome.correct === outcome.total ? "success" : "info",
      })
      queryClient.invalidateQueries({ queryKey: ["learn", "stats"] })
    },
    onError: (error) => {
      toast.add({ title: error.message || "Could not submit reviews", type: "error" })
    },
  })

  if (isPending || !data) {
    return <Skeleton className="h-64" />
  }

  if (data.items.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiCheckDoubleLine />
          </EmptyMedia>
          <EmptyTitle>Nothing due</EmptyTitle>
          <EmptyDescription>
            Review items appear a couple of days after each lesson, then space out as you keep
            answering them correctly.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/learn" />} variant="secondary">
            Go learn something new
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        {data.due} item{data.due === 1 ? "" : "s"} due. Right answers wait longer before returning;
        misses come back tomorrow.
      </p>
      <QuizRunner
        items={data.items.map((item) => ({ ...item, label: `From: ${item.lessonTitle}` }))}
        results={results}
        submitting={submit.isPending}
        submitLabel="Submit reviews"
        onSubmit={(answers) =>
          submit.mutate(
            data.items.map((item, i) => ({ quizItemId: item.id, answerIndex: answers[i] ?? -1 })),
          )
        }
      />
      {results && (
        <Button
          variant="secondary"

          onClick={() => {
            setResults(null)
            queryClient.invalidateQueries({ queryKey: ["learn", "review"] })
          }}
        >
          Load next batch
        </Button>
      )}
    </div>
  )
}
