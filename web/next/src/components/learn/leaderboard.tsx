"use client"

import { RiTrophyLine } from "@remixicon/react"
import { useQuery } from "@tanstack/react-query"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient, unwrap } from "@/lib/api/client"
import { cn } from "@/lib/utils"

export function Leaderboard() {
  const { data, isPending } = useQuery({
    queryKey: ["learn", "leaderboard"],
    queryFn: async () => {
      const { data, error } = await unwrap(apiClient.v1.learn.leaderboard.$get())
      if (error) throw new Error(error.message)
      return data
    },
  })

  if (isPending || !data) {
    return <Skeleton className="h-64" />
  }

  if (data.entries.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiTrophyLine />
          </EmptyMedia>
          <EmptyTitle>No XP this week yet</EmptyTitle>
          <EmptyDescription>Complete a lesson and claim first place.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">XP earned this week. Resets Monday.</p>
      <ol className="space-y-1">
        {data.entries.map((entry) => (
          <li
            key={entry.userId}
            className={cn("flex items-center gap-3 rounded-lg px-3 py-2", entry.me && "bg-accent")}
          >
            <span className="text-muted-foreground w-6 text-right text-sm tabular-nums">
              {entry.rank}
            </span>
            <Avatar className="size-8">
              {entry.image && <AvatarImage src={entry.image} alt="" />}
              <AvatarFallback>{entry.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {entry.name}
              {entry.me && (
                <Badge variant="secondary" className="ml-2">
                  you
                </Badge>
              )}
            </span>
            <span className="text-sm font-semibold tabular-nums">{entry.xp} XP</span>
          </li>
        ))}
      </ol>
      {data.me && data.me.rank > 20 && (
        <p className="text-muted-foreground text-sm">
          Your rank: {data.me.rank} with {data.me.xp} XP this week.
        </p>
      )}
    </div>
  )
}
