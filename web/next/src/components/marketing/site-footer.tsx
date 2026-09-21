import { site } from "@packages/config/site"
import { RiDiscordFill, RiGithubFill, RiTwitterXFill } from "@remixicon/react"

import { Access } from "@/components/common/access"

const socials = [
  { href: site.social.github, icon: RiGithubFill, label: "GitHub" },
  { href: site.social.discord, icon: RiDiscordFill, label: "Discord" },
  { href: site.social.x, icon: RiTwitterXFill, label: "X" },
].filter((social) => social.href)

// In-page anchors only. Every learning surface is behind a session, so linking
// one from a public footer sends a first-time reader to a sign-in bounce rather
// than to what the link promised.
const jumpLinks = [
  { href: "#who-its-for", label: "Why this exists" },
  { href: "#what-you-get", label: "What is inside" },
  { href: "#listen", label: "The audiobook" },
  { href: "#how-it-works", label: "How a lesson goes" },
]

export function SiteFooter() {
  return (
    <footer className="border-border/70 relative border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 md:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="text-lg font-bold">{site.name}</p>
            <p className="text-muted-foreground mt-2 text-sm text-pretty">{site.tagline}.</p>
            {socials.length > 0 && (
              <div className="mt-4 flex items-center gap-3">
                {socials.map((social) => (
                  <a
                    aria-label={social.label}
                    className="text-foreground/60 hover:text-foreground transition-colors"
                    href={social.href}
                    key={social.label}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <social.icon aria-hidden="true" className="size-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-start gap-4">
            <nav aria-label="Footer" className="flex flex-col gap-2">
              {jumpLinks.map((link) => (
                <a
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <Access className="w-auto" label="Start learning" />
          </div>
        </div>

        <p className="text-muted-foreground text-xs">
          &copy; {new Date().getFullYear()} {site.name}. Built for people who learn out loud.
        </p>
      </div>
    </footer>
  )
}
