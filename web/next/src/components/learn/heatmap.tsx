"use client"

export type ActivityPoint = { day: string; xp: number; lessons: number; seconds: number }

const WEEKS = 26
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function localDayKey(d: Date): string {
  return d.toLocaleDateString("en-CA")
}

function intensityClass(xp: number): string {
  if (xp <= 0) return "bg-muted"
  if (xp < 30) return "bg-success/25"
  if (xp < 60) return "bg-success/50"
  if (xp < 100) return "bg-success/75"
  return "bg-success"
}

// GitHub-style contribution heatmap of the last 26 weeks. Columns are weeks
// (Sunday-first), the last column is the current week.
export function ActivityHeatmap({ activity }: { activity: ActivityPoint[] }) {
  const byDay = new Map(activity.map((a) => [a.day, a]))
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - start.getDay() - (WEEKS - 1) * 7)

  const columns: { label: string | null; days: (Date | null)[] }[] = []
  let previousMonth = -1
  for (let w = 0; w < WEEKS; w++) {
    const days: (Date | null)[] = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      days.push(date > today ? null : date)
    }
    const first = days.find((d) => d !== null)
    const month = first ? first.getMonth() : -1
    const label = month !== -1 && month !== previousMonth ? MONTHS[month]! : null
    if (month !== -1) previousMonth = month
    columns.push({ label, days })
  }

  return (
    <div tabIndex={0} aria-label="Daily activity heatmap" className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1">
        <div className="flex gap-1">
          {columns.map((column, i) => (
            <div key={i} className="text-muted-foreground h-4 w-3 text-xs">
              {column.label && <span className="absolute">{column.label}</span>}
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          {columns.map((column, i) => (
            <div key={i} className="flex flex-col gap-1">
              {column.days.map((date, j) => {
                if (!date) return <div key={j} className="size-3" />
                const key = localDayKey(date)
                const point = byDay.get(key)
                const xp = point?.xp ?? 0
                return (
                  <div
                    key={j}
                    title={`${key}: ${xp} XP${point?.lessons ? `, ${point.lessons} lesson${point.lessons === 1 ? "" : "s"}` : ""}`}
                    className={`size-3 rounded-xs ${intensityClass(xp)}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <span className="mr-1">Less</span>
          <div className="bg-muted size-3 rounded-xs" />
          <div className="bg-success/25 size-3 rounded-xs" />
          <div className="bg-success/50 size-3 rounded-xs" />
          <div className="bg-success/75 size-3 rounded-xs" />
          <div className="bg-success size-3 rounded-xs" />
          <span className="ml-1">More</span>
        </div>
      </div>
    </div>
  )
}
