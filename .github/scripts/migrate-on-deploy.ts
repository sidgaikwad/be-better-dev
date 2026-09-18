import { $ } from "bun"

const env = process.env.VERCEL_ENV ?? "unset"
const ref = process.env.VERCEL_GIT_COMMIT_REF ?? "unset"

// Apply pending migrations only on deploy branches (production + canary), never on PR previews (unmerged migrations against a shared DB).
if (env !== "production" && ref !== "canary") {
  console.log(`[migrate-on-deploy] skip, VERCEL_ENV=${env}, ref=${ref}`)
  process.exit(0)
}

console.log(`[migrate-on-deploy] applying pending migrations, VERCEL_ENV=${env}, ref=${ref}`)
await $`bun run db:migrate`
console.log("[migrate-on-deploy] migrations applied")

// Course content lives in the repo, so a deploy that ships a new course without
// seeding leaves the app reading rows that do not exist: the switcher appears with
// nothing to switch to, which reads as a broken deploy. Seeding here keeps the
// content tables in step with the commit being deployed, on the same gate as
// migrations, using the POSTGRES_URL this build already has.
//
// The seeder writes content tables only. It also deletes content rows that left the
// seed, and lesson_progress cascades on lesson delete, so removing or renaming a
// lesson slug discards progress for it. That is why slugs are treated as permanent.
console.log("[migrate-on-deploy] seeding course content")
await $`bun run db:seed`
console.log("[migrate-on-deploy] done")
