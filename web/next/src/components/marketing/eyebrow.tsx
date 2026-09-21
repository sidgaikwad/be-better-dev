import type { RemixiconComponentType } from "@remixicon/react"

import { cn } from "@/lib/utils"

// The small pill that labels a marketing section, and the hero badge. Badge is
// sized for compact UI (h-5, text-xs) and reads as a status chip next to a row
// of data; a section label needs the air, so this is its own primitive rather
// than a pile of overrides on Badge.
export function Eyebrow({
  children,
  className,
  icon: Icon,
}: {
  children: React.ReactNode
  className?: string
  icon?: RemixiconComponentType
}) {
  return (
    <span
      className={cn(
        "border-border/70 bg-card/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-sm",
        className,
      )}
    >
      {Icon ? <Icon className="text-brand size-3.5" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}
