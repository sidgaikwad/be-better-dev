"use client"

import { RiCheckboxCircleFill, RiCloseCircleFill } from "@remixicon/react"
import { useState } from "react"

import { Markdown } from "@/components/learn/markdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export type QuizPublicItem = {
  id: string
  kind: string
  prompt: string
  options: string[]
  // Shown above the prompt when items come from several lessons (review mode).
  label?: string
}

export type QuizResult = {
  quizItemId: string
  correct: boolean
  chosenIndex: number
  correctIndex: number
  explanation: string
}

// Shared quiz runner for the lesson player and the review session. The parent
// owns submission; results arriving non-null flips the runner into its graded,
// read-only state.
export function QuizRunner({
  items,
  results,
  submitting,
  submitLabel = "Check answers",
  onSubmit,
}: {
  items: QuizPublicItem[]
  results: QuizResult[] | null
  submitting: boolean
  submitLabel?: string
  onSubmit: (answers: number[]) => void
}) {
  const [chosen, setChosen] = useState<Record<number, number>>({})
  const resultFor = new Map((results ?? []).map((r) => [r.quizItemId, r]))
  const allAnswered = items.every((_, i) => chosen[i] !== undefined)

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const result = resultFor.get(item.id)
        return (
          <Card key={item.id}>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {item.label && <p className="text-muted-foreground mb-1 text-xs">{item.label}</p>}
                  <Markdown className="font-medium [&_p]:my-0">{item.prompt}</Markdown>
                </div>
                {item.kind === "predict" && <Badge variant="secondary">Predict</Badge>}
              </div>
              <div className="space-y-2" role="group" aria-label={`Question ${index + 1}`}>
                {item.options.map((option, optionIndex) => {
                  const selected = chosen[index] === optionIndex
                  const isCorrect = result && optionIndex === result.correctIndex
                  const isWrongPick =
                    result && optionIndex === result.chosenIndex && !result.correct
                  return (
                    <button
                      key={optionIndex}
                      type="button"
                      disabled={!!result || submitting}
                      onClick={() => setChosen((prev) => ({ ...prev, [index]: optionIndex }))}
                      className={cn(
                        "border-border flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                        !result && "hover:bg-accent",
                        !result && selected && "border-primary bg-accent",
                        isCorrect && "border-success/40 bg-success/10",
                        isWrongPick && "border-destructive/40 bg-destructive/10",
                        result && !isCorrect && !isWrongPick && "opacity-60",
                      )}
                    >
                      {isCorrect && (
                        <RiCheckboxCircleFill className="text-success mt-0.5 size-4 shrink-0" />
                      )}
                      {isWrongPick && (
                        <RiCloseCircleFill className="text-destructive mt-0.5 size-4 shrink-0" />
                      )}
                      <span className="min-w-0 [&_code]:font-mono">{option}</span>
                    </button>
                  )
                })}
              </div>
              {result && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs font-semibold">
                    {result.correct ? "Correct" : "Not quite"}
                  </p>
                  <Markdown className="text-muted-foreground [&_p]:my-1">
                    {result.explanation}
                  </Markdown>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
      {!results && items.length > 0 && (
        <Button
          disabled={!allAnswered || submitting}
          onClick={() => onSubmit(items.map((_, i) => chosen[i] ?? -1))}
        >
          {submitting ? <Spinner /> : null}
          {submitLabel}
        </Button>
      )}
    </div>
  )
}
