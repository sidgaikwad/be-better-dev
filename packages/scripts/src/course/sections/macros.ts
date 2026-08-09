import type { SectionSeed } from "../types"

export const macrosSection: SectionSeed = {
  slug: "macros",
  title: "Macros",
  description: "Declarative and procedural macros: reading them before writing them.",
  badgeIcon: "🪄",
  badgeTitle: "Macros",
  units: [
    {
      slug: "how-macros-work",
      title: "How macros work",
      description: "Compile-time code generation, and macro_rules! as pattern matching on tokens.",
      lessons: [
        {
          slug: "macro-why-they-exist",
          title: "Why macros exist",
          summary:
            "What println! does that no function could, and where expansion fits in the compile.",
          contentFile: "macro-why-they-exist.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why can `println!` not be an ordinary function?",
              options: [
                "Functions cannot write to stdout without unsafe code",
                "It takes any number of arguments, of mixed types, and must validate the format string before the program runs",
                "Macros execute faster than functions at runtime",
                "The ! suffix is required for anything that can panic",
              ],
              answer: 1,
              explanation:
                "Functions have fixed arity and receive runtime values; a macro sees the call site's tokens at compile time, so it can accept any argument list and reject a bad format string by failing the build.",
            },
            {
              kind: "predict",
              prompt: 'What happens to a program containing `println!("{} unconfirmed", 3, 4);`?',
              options: [
                "Prints `3 unconfirmed` and ignores the 4",
                "Prints `3 unconfirmed 4`",
                "Fails to compile: argument never used",
                "Compiles, then panics at runtime",
              ],
              answer: 2,
              explanation:
                "The macro compares placeholders against arguments during expansion, so the extra argument is a build failure. C's printf would silently ignore it; JavaScript's console.log would print it.",
            },
            {
              kind: "mcq",
              prompt: "What does a macro receive as its input?",
              options: [
                "The runtime values of its arguments",
                "The tokens written at the call site",
                "The types of its arguments after inference",
                "The compiled machine code of the enclosing function",
              ],
              answer: 1,
              explanation:
                "Expansion runs before type checking, so no types or values exist yet. A macro turns source tokens into more source, which the compiler then checks like handwritten code.",
            },
          ],
        },
        {
          slug: "macro-rules-read-and-write",
          title: "macro_rules!: pattern matching on code",
          summary:
            "Matchers, transcribers, repetition, and hygiene, built into one small useful macro.",
          xp: 25,
          contentFile: "macro-rules-read-and-write.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In a matcher, what does `$( $item:expr ),*` accept?",
              options: [
                "Exactly one expression",
                "One or more expressions separated by commas",
                "Zero or more expressions separated by commas",
                "A comma-separated list of identifiers",
              ],
              answer: 2,
              explanation:
                "`*` means zero or more and `+` means one or more; `expr` is the fragment specifier, so each repetition must parse as an expression.",
            },
            {
              kind: "predict",
              prompt:
                'A macro `reset!` has the transcriber `let count = 0;`. The caller writes `let count = 7; reset!(); println!("{count}");`. What prints?',
              options: [
                "0",
                "7",
                "A compile error: `count` is defined twice",
                "A compile error: cannot find value `count`",
              ],
              answer: 1,
              explanation:
                "Hygiene puts the macro's `count` in its own naming universe: it neither shadows nor collides with the caller's binding, so the caller's 7 is untouched.",
            },
            {
              kind: "mcq",
              prompt: "Why do transcribers so often begin `=> {{` with doubled braces?",
              options: [
                "The outer braces delimit the transcriber; the inner braces make the expansion a single block expression",
                "Both pairs are required by the macro_rules! grammar",
                "Doubled braces disable hygiene inside the expansion",
                "They mark the macro as returning a value at runtime",
              ],
              answer: 0,
              explanation:
                "Only the outer pair belongs to the arm syntax. The inner pair emits a real block, letting a multi-statement expansion with a tail value sit anywhere an expression can, such as the right side of a `let`.",
            },
          ],
        },
      ],
    },
    {
      slug: "macros-in-the-wild",
      title: "Macros in the wild",
      description:
        "Procedural macros as a consumer, the expansion x-ray, and when to write none at all.",
      lessons: [
        {
          slug: "macro-proc-consumer-side",
          title: "Procedural macros from the consumer side",
          summary: "What derive, attribute, and function-like macros generate at build time.",
          contentFile: "macro-proc-consumer-side.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Which kind of procedural macro is `#[tokio::main]`?",
              options: [
                "A custom derive",
                "An attribute macro",
                "A function-like macro",
                "A declarative macro_rules! macro",
              ],
              answer: 1,
              explanation:
                "It receives the entire item beneath it and returns a replacement: the async fn is rewritten into a synchronous main that builds a runtime. Derives can only append code next to an item.",
            },
            {
              kind: "predict",
              prompt:
                "You misspell a column as `emial` inside `sqlx::query!`. When do you find out?",
              options: [
                "At runtime, when the first request returns a 500",
                "During `cargo build`, as a compile error",
                "Only when an integration test exercises that query",
                "Never; SQL strings are not checked",
              ],
              answer: 1,
              explanation:
                "query! asks the real schema, a live DATABASE_URL or the offline cache, to describe the query at build time, so a bad column name fails compilation like a bad format string.",
            },
            {
              kind: "mcq",
              prompt: "What does `#[derive(serde::Deserialize)]` do to `FormData`?",
              options: [
                "Registers it in a runtime reflection table for the deserializer to walk",
                "Adds hidden metadata fields to the struct",
                "Generates an `impl Deserialize` next to the unchanged struct at build time",
                "Tells the compiler to relax field privacy for serde",
              ],
              answer: 2,
              explanation:
                "Derives append generated code and never alter the item. Rust has no runtime reflection, so the field knowledge a validator would gather at runtime is compiled into the impl instead.",
            },
          ],
        },
        {
          slug: "macro-cargo-expand",
          title: "cargo expand: the x-ray machine",
          summary: "Seeing generated code, reading macro errors, and knowing what expansion costs.",
          contentFile: "macro-cargo-expand.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does `cargo expand` show you?",
              options: [
                "The macro definitions your crate depends on",
                "Your crate's source after all macros have expanded: the code the type checker actually sees",
                "The optimized assembly for each function",
                "A diff between your code and the macro output",
              ],
              answer: 1,
              explanation:
                "Expansion happens before type checking, so the expanded source is the ground truth behind every later error; cargo expand prints it via a nightly pretty-printing mode.",
            },
            {
              kind: "predict",
              prompt:
                "CI has no database and the repo has no `.sqlx/` directory. A crate with thirty `sqlx::query!` calls runs `cargo build`. What happens?",
              options: [
                "It builds; queries are checked on first execution instead",
                "It builds, with thirty warnings",
                "Compilation fails: each query! needs DATABASE_URL or offline data",
                "Only the test profile fails",
              ],
              answer: 2,
              explanation:
                "The macro's whole job is compile-time verification against real schema truth, so with neither a live database nor the cache from `cargo sqlx prepare`, expansion itself errors.",
            },
            {
              kind: "mcq",
              prompt: "Which of these is NOT a cost of procedural macros?",
              options: [
                "Compiling syn and the macro crate on a cold build",
                "Running every expansion on every build",
                "Type-checking the generated code",
                "Reflection overhead each time the program runs",
              ],
              answer: 3,
              explanation:
                "The first three are real build-time bills. At runtime nothing of the macro remains: the generated code is ordinary Rust, which is why a derive costs nothing per request.",
            },
          ],
        },
        {
          slug: "macro-when-not-to-write",
          title: "When not to write a macro",
          summary: "Function first, generics second, macro last: the honest decision list.",
          contentFile: "macro-when-not-to-write.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "You need the same largest-of logic for both i32 and f64. Which tool do you reach for first?",
              options: [
                "A macro_rules! macro that stamps out both functions",
                "A generic function with a PartialOrd bound",
                "A build script that generates the second copy",
                "Two copies, kept in sync by code review",
              ],
              answer: 1,
              explanation:
                "Same logic across types is exactly what generics solve: one checked definition with one signature. The ladder is function first, generics second, macro last.",
            },
            {
              kind: "mcq",
              prompt: "Which requirement genuinely needs a macro?",
              options: [
                "A constructor that fills in default fields",
                "Accepting any number of `key => value` pairs and rejecting malformed ones at compile time",
                "Timing how long the subscribe handler takes and logging it",
                "Sharing validation logic between two newtype wrappers",
              ],
              answer: 1,
              explanation:
                "Variable arity plus compile-time checking of written syntax is structurally out of reach for functions and generics. The other three are a function, a function, and a generic.",
            },
            {
              kind: "predict",
              prompt:
                "`add_one_m!` expands to `$x + 1`, and `add_one` is a `fn(i32) -> i32`. Both are called with a `String`. How do the two errors differ?",
              options: [
                "They produce the same error",
                "The function reports expected `i32`, found `String` at the call; the macro reports cannot add `{integer}` to `String` from inside its expansion",
                "The macro catches it earlier, at its definition",
                "The macro version compiles and panics at runtime",
              ],
              answer: 1,
              explanation:
                "A macro has no signature to check against, so the failure surfaces from generated code with a macro note attached. The function states its contract in one line at the call site, which is much of why it comes first.",
            },
          ],
        },
      ],
    },
  ],
}
