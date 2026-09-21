import { site } from "@packages/config/site"

// A six-faced book in CSS 3D: covers, spine, and three cut edges of paper, lit
// from the upper left with a contact shadow under it and audio rings leaving it.
//
// Pure CSS and server-rendered on purpose. It is the hero's first paint on every
// visit, so it must not wait on a canvas, a WebGL context, or JavaScript at all;
// it is also what a reader sees when any of those are missing. The geometry and
// the keyframes live in the route's marketing.css, which is also where the
// reduced-motion gate is.
export function BookCss({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <div className="book-scene relative flex items-center justify-center py-8">
        <div className="book-glow glow-animate size-80" />
        {/* The rings sit behind the book and outside its 3D context: dragging
            them into `preserve-3d` would tilt them with the cover. */}
        <div className="absolute size-96">
          <div className="book-ring ring-animate" />
          <div className="book-ring ring-animate ring-delay-1" />
          <div className="book-ring ring-animate ring-delay-2" />
        </div>

        <div className="relative">
          <div className="book book-animate">
            <div className="book-face book-back" />
            <div className="book-face book-spine" />
            <div className="book-face book-pages book-fore" />
            <div className="book-face book-top" />
            <div className="book-face book-bottom" />
            <div className="book-face book-front">
              <div className="text-brand-foreground relative flex h-full flex-col justify-between p-6">
                <p className="text-xs font-semibold tracking-widest uppercase opacity-70">
                  {site.name}
                </p>
                <div>
                  <p className="text-2xl leading-tight font-bold">
                    Rust:
                    <br />
                    Zero to
                    <br />
                    Production
                  </p>
                  <div className="mt-4 mb-3 h-px w-10 bg-current opacity-50" />
                  <p className="font-mono text-xs opacity-70">256 lessons, read aloud</p>
                </div>
              </div>
              <div className="book-key-light" />
            </div>
          </div>
          {/* Floor contact, offset below the spine rather than centred: the book
              is lit from the upper left, so its shadow falls down and right. */}
          <div className="book-shadow -bottom-10 left-4 h-8 w-56" />
        </div>
      </div>
    </div>
  )
}
