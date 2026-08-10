"use client"

import {
  RiArrowRightLine,
  RiFireLine,
  RiFlashlightLine,
  RiMedalLine,
  RiTimeLine,
} from "@remixicon/react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

import { ActivityHeatmap } from "@/components/learn/heatmap"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient, unwrap } from "@/lib/api/client"

function formatHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

export function LearnDashboard() {
  const { data: stats, isPending } = useQuery({
    queryKey: ["learn", "stats"],
    queryFn: async () => {
      const { data, error } = await unwrap(apiClient.v1.learn.stats.$get())
      if (error) throw new Error(error.message)
      return data
    },
  })

  if (isPending || !stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    )
  }

  const lessonsPct =
    stats.lessonsTotal === 0 ? 0 : Math.round((stats.lessonsCompleted / stats.lessonsTotal) * 100)
  const levelPct = stats.levelNext === 0 ? 0 : Math.round((stats.levelInto / stats.levelNext) * 100)

  return (
    <div className="space-y-4">
      {stats.reviewsDue > 0 && (
        <Card className="border-primary/30">
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">
                {stats.reviewsDue} review{stats.reviewsDue === 1 ? "" : "s"} due
              </p>
              <p className="text-muted-foreground text-sm">
                A few minutes of recall keeps earlier lessons from fading.
              </p>
            </div>
            <Button render={<Link href="/review" />}>
              Review now
              <RiArrowRightLine />
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <RiFireLine className="size-4" />
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {stats.streak} day{stats.streak === 1 ? "" : "s"}
            </p>
            <p className="text-muted-foreground text-xs">
              {stats.streak === 0 ? "Complete a lesson to start one" : "Keep it alive today"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <RiFlashlightLine className="size-4" />
              Level {stats.level}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-semibold">{stats.xp} XP</p>
            <Progress value={levelPct} aria-label={`Progress to level ${stats.level + 1}`} />
            <p className="text-muted-foreground text-xs">
              {stats.levelNext - stats.levelInto} XP to level {stats.level + 1}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <RiMedalLine className="size-4" />
              Lessons
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-semibold">
              {stats.lessonsCompleted}
              <span className="text-muted-foreground text-base font-normal">
                {" "}
                / {stats.lessonsTotal}
              </span>
            </p>
            <Progress value={lessonsPct} aria-label="Course progress" />
            <p className="text-muted-foreground text-xs">{lessonsPct}% of published lessons</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <RiTimeLine className="size-4" />
              Time studied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatHours(stats.secondsStudied)}</p>
            <p className="text-muted-foreground text-xs">Across every session</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap activity={stats.activity} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Badges</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.badges.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <RiMedalLine />
                </EmptyMedia>
                <EmptyTitle>No badges yet</EmptyTitle>
                <EmptyDescription>
                  Finish a whole section to earn its badge; streaks earn their own.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {stats.badges.map((badge) => (
                <div
                  key={badge.badge}
                  className="border-border flex items-center gap-3 rounded-lg border p-3"
                >
                  <span className="text-2xl" aria-hidden>
                    {badge.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{badge.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(badge.awardedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
