// Brand identity for this app: the single source a fork edits to rebrand. web reads it via lib/config.ts.
export const site = {
  name: "Be-better-dev",
  description:
    "A full Rust and system design curriculum built for people who stall on page one. Every lesson is cut into steps you can finish, read aloud by your own device, and remembered for you with spaced review and notes that stay where you put them.",
  tagline: "Learn to code on the days reading is hard",
  social: {
    discord: "",
    github: "",
    x: "",
  },
  // Local-only dev agent identity (api/hono agents router).
  agent: {
    name: "LocalAgent",
    email: "agent@local.host",
  },
  // Injectable long-form text blocks. A product sets its own, or leaves them empty.
  apiReferenceDescription: "",
  llmsFullPreamble: "",
} as const

export type Site = typeof site

// Optional surfaces a fork enables or disables. Typed boolean (not `as const`) so a fork can flip them and the runtime gates are not dead code. Off means the routes 404 and the links, nav, sitemap, llms, and search drop the surface. waitlist off makes the home a plain landing page.
export const features = {
  allowlist: false,
  apiDocs: false,
  blog: false,
  docs: false,
  internalDocs: true,
  waitlist: false,
}

export type Feature = keyof typeof features
