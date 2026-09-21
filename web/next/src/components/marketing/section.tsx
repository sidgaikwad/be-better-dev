import { cn } from "@/lib/utils"

// One band of the landing page: the shared vertical rhythm (py-24) and gutter
// (px-4 md:px-6) in one place, so no section re-declares them and they cannot
// drift apart. `relative` is here because most sections layer a decorative
// background behind their content.
export function Section({
  children,
  className,
  id,
  innerClassName,
  labelledBy,
}: {
  children: React.ReactNode
  className?: string
  id?: string
  innerClassName?: string
  /** id of the section's visible heading; names the region in the a11y tree. */
  labelledBy?: string
}) {
  return (
    <section aria-labelledby={labelledBy} className={cn("relative py-24", className)} id={id}>
      <div className={cn("relative mx-auto w-full max-w-6xl px-4 md:px-6", innerClassName)}>
        {children}
      </div>
    </section>
  )
}
