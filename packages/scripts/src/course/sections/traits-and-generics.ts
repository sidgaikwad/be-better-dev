import type { SectionSeed } from "../types"

export const traitsAndGenerics: SectionSeed = {
  slug: "traits-and-generics",
  title: "Traits and generics",
  description: "Shared behavior, monomorphization versus trait objects, and what each costs.",
  badgeIcon: "🎭",
  badgeTitle: "Traits",
  units: [
    {
      slug: "defining-behavior",
      title: "Defining behavior",
      description: "Traits as contracts a type opts into, and generics that require them.",
      lessons: [
        {
          slug: "traits-capability-contracts",
          title: "Traits: capability as a contract",
          summary: "Defining a trait, opting types in, and default methods.",
          contentFile: "traits-capability-contracts.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "A default method in a trait:",
              options: [
                "Must be overridden by every implementor",
                "Provides a body implementors inherit and may override",
                "Can only call inherent methods, never trait methods",
                "Exists only for testing",
              ],
              answer: 1,
              explanation:
                "Defaults are written against the required methods (`send_to_all` loops over `send`), so one impl of the required method buys the whole surface, and any implementor may still replace the default.",
            },
            {
              kind: "mcq",
              prompt:
                "A struct has a method textually identical to `EmailClient::send`, but no `impl EmailClient for` block. Where an `EmailClient` is required, the struct:",
              options: [
                "Qualifies automatically, like a TypeScript interface",
                "Qualifies only if it lives in the same crate as the trait",
                "Does not qualify until the impl block exists",
                "Qualifies, but only at runtime",
              ],
              answer: 2,
              explanation:
                "Rust traits are nominal, not structural: the impl block is the opt-in. A matching signature alone earns nothing, which is why nothing is ever accidentally an email client.",
            },
            {
              kind: "predict",
              prompt: "Adding `impl EmailClient for Postmark` changes `size_of::<Postmark>()` by:",
              options: [
                "8 bytes, for a vtable pointer",
                "16 bytes, for a fat pointer",
                "0 bytes",
                "It depends on the number of methods",
              ],
              answer: 2,
              explanation:
                "Trait impls live in the compiler's tables, not in the value; a struct's memory stays exactly its fields. Vtables only enter the picture with `dyn`, in the dispatch unit.",
            },
          ],
        },
        {
          slug: "traits-bounds-and-where",
          title: "Trait bounds and where clauses",
          summary: "What a generic function may do is exactly what its bounds promise.",
          contentFile: "traits-bounds-and-where.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "You write `fn largest<T>(list: &[T]) -> &T` comparing elements with `>` and no bounds. When does the compiler reject it?",
              options: [
                "Only when it is called with a non-comparable type",
                "At the function definition, before any caller exists",
                "It compiles but panics at runtime",
                "Only in release builds",
              ],
              answer: 1,
              explanation:
                "Generic bodies are checked against their bounds at the definition. With no `PartialOrd` bound, `>` on `&T` is `error[E0369]` immediately, unlike C++ templates, which fail at instantiation.",
            },
            {
              kind: "mcq",
              prompt: "A `where` clause:",
              options: [
                "Means exactly the same as inline bounds, in a more readable position",
                "Applies its bounds at runtime instead of compile time",
                "Is only for lifetime bounds",
                "Makes the bounds optional for callers",
              ],
              answer: 0,
              explanation:
                "`<C: EmailClient + Debug>` and `where C: EmailClient + Debug` are the same contract; `where` just keeps signatures readable once bounds multiply.",
            },
            {
              kind: "mcq",
              prompt: "Inside `fn f<C: EmailClient>(c: &C)`, the body may call on `c`:",
              options: [
                "Any method `Postmark` has, since a `Postmark` might be passed",
                "Exactly `EmailClient`'s methods, nothing else",
                "Any method, checked when the program runs",
                "Only methods that take `self` by value",
              ],
              answer: 1,
              explanation:
                "The body must hold for every possible `C`, so its capability list is exactly the bounds. Even if every caller passes `Postmark`, Postmark-specific methods are out of reach without a bound naming them.",
            },
          ],
        },
      ],
    },
    {
      slug: "two-dispatches",
      title: "Two kinds of dispatch",
      description: "What the compiler emits for a generic call, and what dyn changes.",
      lessons: [
        {
          slug: "traits-monomorphization",
          title: "Monomorphization and impl Trait",
          summary: "Static dispatch: stamped per-type copies, their speed, and their bill.",
          xp: 25,
          contentFile: "traits-monomorphization.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Monomorphization means the compiler:",
              options: [
                "Keeps one generic function and checks types at runtime",
                "Stamps one specialized copy per concrete type the generic is used with",
                "Routes every trait method through a vtable",
                "Erases generics to a base type, like Java",
              ],
              answer: 1,
              explanation:
                "Java erases and compiles one method with casts; Rust emits real per-type code with direct, inlinable calls, which is why generic Rust optimizes like hand-written code.",
            },
            {
              kind: "predict",
              prompt:
                "`fn log_all<T: Debug>(items: &[T])` is called from four places: twice with `&[i32]`, twice with `&[String]`. Before inlining, how many compiled copies exist?",
              options: ["1, generics share code", "2", "4, one per call site", "0"],
              answer: 1,
              explanation:
                "Copies are stamped per concrete type, not per call: one for `i32`, one for `String`. All four call sites jump into one of those two.",
            },
            {
              kind: "mcq",
              prompt: "The costs monomorphization actually imposes are:",
              options: [
                "Slower method calls",
                "Runtime type checks",
                "Longer compile times and larger binaries",
                "A heap allocation per generic call",
              ],
              answer: 2,
              explanation:
                "The runtime cost is zero extra; the copies are paid for in backend compile time and executable size. That bill is exactly what trait objects exist to renegotiate.",
            },
          ],
        },
        {
          slug: "traits-trait-objects",
          title: "Trait objects and the vtable",
          summary: "dyn Trait, the fat pointer, and what dynamic dispatch buys and costs.",
          contentFile: "traits-trait-objects.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "A vtable contains:",
              options: [
                "A copy of the struct's fields",
                "Function pointers for the trait's methods, plus the type's drop, size, and alignment",
                "Method names, for lookup by string at runtime",
                "The source of the impl block",
              ],
              answer: 1,
              explanation:
                "It is built at compile time, one per concrete-type-and-trait pair. A dynamic call indexes a fixed slot and jumps; no name lookup ever happens, unlike a JS property access.",
            },
            {
              kind: "predict",
              prompt:
                "A program has six types implementing `EmailClient` and a function `fn confirm(client: &dyn EmailClient, email: &str)`. How many compiled copies of `confirm` exist?",
              options: ["6", "1", "7, one per type plus a fallback", "0, it is inlined away"],
              answer: 1,
              explanation:
                "`&dyn EmailClient` is one concrete fat-pointer type, so `confirm` is not generic: one copy serves every client. That is the code-size trade against monomorphized stamping.",
            },
            {
              kind: "mcq",
              prompt: "`dyn EmailClient` must live behind `Box`, `&`, or `Arc` because:",
              options: [
                "Trait objects are garbage collected",
                "Implementors have different sizes, so the unsized `dyn` type needs a known-size pointer carrying a vtable",
                "The vtable is stored on the heap",
                "It makes the value mutable",
              ],
              answer: 1,
              explanation:
                "`Postmark` is 24 bytes and `FakeClient` is zero, so `dyn EmailClient` itself has no compile-time size. The 16-byte fat pointer does, the same move that gives us `&str` instead of a bare `str`.",
            },
          ],
        },
      ],
    },
    {
      slug: "everyday-traits",
      title: "The everyday traits",
      description: "The std traits every crate leans on, and the coherence rules around them.",
      lessons: [
        {
          slug: "traits-std-tour",
          title: "A working tour of the standard traits",
          summary:
            "Debug, Display, PartialEq, Eq, Hash, and Default, and when each earns a derive.",
          contentFile: "traits-std-tour.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is there `#[derive(Debug)]` but no `#[derive(Display)]`?",
              options: [
                "An oversight; use Debug everywhere",
                "Display would require heap allocation",
                "User-facing text is a presentation decision std refuses to guess, while Debug's mechanical dump can be generated",
                "Display requires unsafe code",
              ],
              answer: 2,
              explanation:
                "Debug has one obvious mechanical answer, so it derives. What a `Subscriber` should look like in a log line is a choice, so `Display` must be written, as the lesson does for `SubscribeError`.",
            },
            {
              kind: "mcq",
              prompt: "The law `HashMap` keys must obey is:",
              options: [
                "Keys must be Copy",
                "Equal values must hash equally, which deriving Eq and Hash together guarantees",
                "Every key must produce a unique hash",
                "Keys must implement Display for error messages",
              ],
              answer: 1,
              explanation:
                "If `a == b` but their hashes differ, an inserted key can become unfindable: the map looks in the wrong bucket. Collisions are fine and handled; inconsistency is the silent bug.",
            },
            {
              kind: "predict",
              prompt:
                '`#[derive(Debug, Default)] struct Flags { verbose: bool, retries: u32, tag: String }` and `println!("{:?}", Flags::default())` prints:',
              options: [
                'Flags { verbose: false, retries: 0, tag: "" }',
                "A compile error: String has no default",
                "Whatever memory happened to contain",
                "Flags { .. }",
              ],
              answer: 0,
              explanation:
                "Derived Default calls each field's own default: false, zero, and the empty String. There is no null and no uninitialized memory in safe Rust, as the Option lesson established.",
            },
          ],
        },
        {
          slug: "traits-from-into-newtypes",
          title: "From, Into, and the newtype pattern",
          summary: "Conversions, how ? uses From, TryFrom validation, and the orphan rule.",
          xp: 25,
          contentFile: "traits-from-into-newtypes.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Inside `fn subscribe() -> Result<(), SubscribeError>`, a `?` on a call returning `Result<_, std::io::Error>` compiles because:",
              options: [
                "`?` performs an unchecked cast between error types",
                "`SubscribeError` implements `From<std::io::Error>`, which `?` invokes on the error path",
                "`io::Error` implements Into<String>",
                "Error types are dynamically typed",
              ],
              answer: 1,
              explanation:
                "`expr?` desugars to a match whose Err arm is `return Err(From::from(e))`. One `From` impl per source error is the whole mechanism, and what `thiserror`'s `#[from]` generates.",
            },
            {
              kind: "mcq",
              prompt: "Which impl does the orphan rule reject in your crate?",
              options: [
                "`impl EmailClient for Vec<String>`",
                "`impl std::fmt::Display for SubscriberEmail`",
                "`impl std::fmt::Display for Vec<String>`",
                "All three",
              ],
              answer: 2,
              explanation:
                "An impl is legal when the trait or the type is local. `EmailClient` is your trait and `SubscriberEmail` is your type, so those pass; `Display` for `Vec<String>` is foreign-for-foreign, which coherence forbids.",
            },
            {
              kind: "predict",
              prompt: "`size_of::<SubscriberEmail>()` compared to `size_of::<String>()` is:",
              options: [
                "Equal: 24 bytes on a 64-bit machine",
                "8 bytes larger, for the wrapper's pointer",
                "32 bytes, because of an enum-style tag",
                "It depends on the length of the email",
              ],
              answer: 0,
              explanation:
                "A newtype adds no header, tag, or indirection: its memory is exactly its one field, the String's three-word header from the one-owner lesson. The buffer, and the length, live on the heap either way.",
            },
          ],
        },
      ],
    },
  ],
}
