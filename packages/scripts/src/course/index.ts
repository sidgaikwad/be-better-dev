import { rustCourse } from "./rust"
import type { CourseSeed } from "./types"

// Every course the platform ships. A course's slug is also its folder name
// under course/, which is how the seeder finds its markdown. Order here is the
// order the course switcher lists them in.
export const courses: CourseSeed[] = [rustCourse]
