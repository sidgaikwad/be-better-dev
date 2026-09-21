// What the landing page is allowed to claim about the course library.
//
// Counted from the seed data (packages/scripts/src/course), not queried from the
// database: the landing page is public, static, and rendered before anyone has a
// session, and a marketing number is not worth a round trip. packages/scripts is
// build-only tooling and is deliberately not a dependency of the web app, so the
// counts are copied here rather than imported.
//
// Recount after a content change:
//   bun -e 'const {courses}=await import("./packages/scripts/src/course/index.ts");let s=0,l=0,q=0;for(const c of courses)for(const p of c.parts)for(const x of p.sections){s++;for(const u of x.units)for(const n of u.lessons){l++;q+=n.quiz.length}}console.log({courses:courses.length,sections:s,lessons:l,quiz:q})'
//
// Last counted 2026-09-22.
export const courseStats = {
  courses: 2,
  lessons: 390,
  quizQuestions: 1170,
  sections: 75,
} as const
