import { cn } from "@/lib/utils"

// The lit background every marketing band sits on: a faded engineering grid
// under three blurred lights, one per brand hue. Decorative only, so it is
// aria-hidden and takes no pointer events; the section above it owns the
// contrast, which is why nothing here goes above ~40% opacity.
export function Aurora({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="aurora-grid" />
      <div className="aurora-blob aurora-blob-brand aurora-animate" />
      <div className="aurora-blob aurora-blob-audio aurora-animate" />
      <div className="aurora-blob aurora-blob-spark aurora-animate" />
    </div>
  )
}
