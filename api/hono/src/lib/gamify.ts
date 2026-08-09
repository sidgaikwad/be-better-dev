// Pure gamification rules: day keys, streaks, the level curve, and badge
// definitions. Kept out of the router so the numbers live in one place.

// YYYY-MM-DD in the server's timezone. The app is single-region personal
// software; the server clock is the user's clock.
export function dayKey(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA")
}

export function addDays(d: Date, days: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + days)
  return out
}

// Current streak: consecutive days ending today or yesterday (today not yet
// studied does not break the streak until midnight passes).
export function streakFrom(days: Set<string>, now: Date = new Date()): number {
  let cursor = days.has(dayKey(now)) ? now : addDays(now, -1)
  let streak = 0
  while (days.has(dayKey(cursor))) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

// Quadratic curve: reaching level n takes 50*n*(n-1) lifetime XP, so level 2
// lands at 100 XP and the gaps widen from there.
export function xpForLevel(level: number): number {
  return 50 * level * (level - 1)
}

export function levelForXp(xp: number): { level: number; into: number; next: number } {
  let level = 1
  while (xpForLevel(level + 1) <= xp) level += 1
  return { level, into: xp - xpForLevel(level), next: xpForLevel(level + 1) - xpForLevel(level) }
}

export const XP_PERFECT_BONUS = 5
export const XP_PER_REVIEW = 5
export const XP_PER_BADGE = 50
export const REVIEW_FIRST_INTERVAL_DAYS = 2
export const REVIEW_MAX_INTERVAL_DAYS = 90
export const MAX_LESSON_SECONDS = 7200

export function nextReviewInterval(intervalDays: number, correct: boolean): number {
  if (!correct) return REVIEW_FIRST_INTERVAL_DAYS
  return Math.min(Math.round(intervalDays * 2.5), REVIEW_MAX_INTERVAL_DAYS)
}

export type MilestoneBadge = { badge: string; title: string; icon: string }

export const STREAK_BADGES: { days: number; badge: MilestoneBadge }[] = [
  { days: 7, badge: { badge: "streak-7", title: "7-day streak", icon: "🔥" } },
  { days: 30, badge: { badge: "streak-30", title: "30-day streak", icon: "🌋" } },
  { days: 100, badge: { badge: "streak-100", title: "100-day streak", icon: "☄️" } },
]

export const FIRST_LESSON_BADGE: MilestoneBadge = {
  badge: "first-lesson",
  title: "First lesson",
  icon: "🦀",
}
