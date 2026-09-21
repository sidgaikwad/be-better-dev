import { cn } from "@/lib/utils"

// One band of the landing page: the shared vertical rhythm (py-24) and gutter
// (px-4 md:px-6) in one place, so no section re-declares them and they cannot
// drift apart.
export function Section({
  background,
  children,
  className,
  id,
  innerClassName,
  labelledBy,
}: {
  /** Decorative layer behind the content, outside the container so it can bleed
      to the edges of the band. Pair it with `overflow-hidden`. */
  background?: React.ReactNode
  children: React.ReactNode
  className?: string
  id?: string
  innerClassName?: string
  /** id of the section's visible heading; names the region in the a11y tree. */
  labelledBy?: string
}) {
  return (
    <section aria-labelledby={labelledBy} className={cn("relative py-24", className)} id={id}>
      {background}
      <div className={cn("relative mx-auto w-full max-w-6xl px-4 md:px-6", innerClassName)}>
        {children}
      </div>
    </section>
  )
}
