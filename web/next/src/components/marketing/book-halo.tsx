import { cn } from "@/lib/utils"

// The light around the book and the rings leaving it: the one visual cue that
// this is a book you listen to. Separate from the book itself because it
// outlives it. When the WebGL book fades in over the CSS one, the halo stays
// put, so the swap changes the book and nothing else.
export function BookHalo({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center",
        className,
      )}
    >
      <div className="book-glow glow-animate size-80" />
      {/* Outside the book's 3D context on purpose: inside it they would tilt
          with the cover and read as ellipses drawn on the page, not as sound. */}
      <div className="absolute size-96">
        <div className="book-ring ring-animate" />
        <div className="book-ring ring-animate ring-delay-1" />
        <div className="book-ring ring-animate ring-delay-2" />
      </div>
    </div>
  )
}
