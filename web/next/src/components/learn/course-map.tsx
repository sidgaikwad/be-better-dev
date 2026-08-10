"use client"

import { RiCheckboxCircleFill, RiLockLine, RiPlayCircleLine } from "@remixicon/react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient, unwrap } from "@/lib/api/client"
import { cn } from "@/lib/utils"

export function CourseMap() {
  const { data, isPending } = useQuery({
    queryKey: ["learn", "map"],
    queryFn: async () => {
      const { data, error } = await unwrap(apiClient.v1.learn.map.$get())
      if (error) throw new Error(error.message)
      return data
    },
  })

  if (isPending || !data) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    )
  }

  const pct =
    data.totals.lessons === 0 ? 0 : Math.round((data.totals.completed / data.totals.lessons) * 100)

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <span>
            {data.totals.completed} of {data.totals.lessons} published lessons
          </span>
          <span>{pct}%</span>
        </div>
        <Progress value={pct} aria-label="Overall course progress" />
      </div>

      {data.parts.map((part, partIndex) => (
        <section key={part.id} aria-labelledby={part.id}>
          <div className="mb-3 space-y-1">
            <h2 id={part.id} className="text-lg font-semibold">
              Part {partIndex + 1}: {part.title}
            </h2>
            <p className="text-muted-foreground text-sm">{part.description}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {part.sections.map((section) => {
              const upcoming = section.lessonsTotal === 0
              return (
                <Card key={section.id} className={cn(upcoming && "opacity-70")}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-lg text-lg",
                            section.earned ? "bg-success/15" : "bg-muted",
                          )}
                          title={section.badgeTitle}
                          aria-hidden
                        >
                          {section.badgeIcon}
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold">{section.title}</h3>
                          <p className="text-muted-foreground line-clamp-2 text-xs">
                            {section.description}
                          </p>
                        </div>
                      </div>
                      {upcoming ? (
                        <Badge variant="outline">Soon</Badge>
                      ) : section.earned ? (
                        <Badge variant="secondary" className="text-success">
                          {section.badgeTitle}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {section.lessonsDone}/{section.lessonsTotal}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  {!upcoming && (
                    <CardContent className="space-y-4">
                      {section.units.map((unit) => (
                        <div key={unit.id}>
                          <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                            {unit.title}
                          </p>
                          <ul className="space-y-0.5">
                            {unit.lessons.map((lessonNode) => {
                              const row = (
                                <>
                                  {lessonNode.completed ? (
                                    <RiCheckboxCircleFill className="text-success size-4 shrink-0" />
                                  ) : lessonNode.unlocked ? (
                                    <RiPlayCircleLine className="text-primary size-4 shrink-0" />
                                  ) : (
                                    <RiLockLine className="text-muted-foreground size-4 shrink-0" />
                                  )}
                                  <span className="min-w-0 flex-1 truncate">
                                    {lessonNode.title}
                                  </span>
                                  <span className="text-muted-foreground shrink-0 text-xs">
                                    {lessonNode.xp} XP
                                  </span>
                                </>
                              )
                              return (
                                <li key={lessonNode.id}>
                                  {lessonNode.unlocked ? (
                                    <Link
                                      href={`/learn/${lessonNode.id}`}
                                      className="hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                                    >
                                      {row}
                                    </Link>
                                  ) : (
                                    <div className="text-muted-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
                                      {row}
                                    </div>
                                  )}
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
