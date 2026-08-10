import type { SectionSeed } from "../types"

export const modulesApiDesign: SectionSeed = {
  slug: "modules-api-design",
  title: "Modules, visibility, API design",
  description: "What a good Rust public interface looks like.",
  badgeIcon: "🏗️",
  badgeTitle: "API design",
  units: [
    {
      slug: "module-tree",
      title: "The module tree",
      description: "mod, file layout, paths, and who can see what.",
      lessons: [
        {
          slug: "mod-module-tree",
          title: "Modules: a tree you declare",
          summary: "mod and file layout, paths and use, and why files are inert until mounted.",
          contentFile: "mod-module-tree.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "You create `src/metrics.rs` full of invalid syntax but never declare it with `mod`. What does `cargo check` do?",
              options: [
                "Fails with a syntax error",
                "Succeeds; files nothing declares are never read by the compiler",
                "Warns about an orphaned file",
                "Fails only in release mode",
              ],
              answer: 1,
              explanation:
                "The module tree is built from `mod` declarations starting at the crate root; an undeclared file is not part of the crate. Editors flag it, the compiler ignores it.",
            },
            {
              kind: "mcq",
              prompt: "What does `use crate::domain::SubscriberEmail;` actually do?",
              options: [
                "Loads and executes src/domain at that point",
                "Binds a scope-local name for an item already compiled into the crate",
                "Copies the type's code into the current file",
                "Adds domain to the module tree",
              ],
              answer: 1,
              explanation:
                "`use` is a rename, not a load. `mod` builds the tree; `use` only shortens paths, and replacing every `use` with full paths would produce an identical binary.",
            },
            {
              kind: "predict",
              prompt:
                "Module `a` calls a `pub(crate)` function in module `b`, and `b` calls one in `a`, both in the same crate. What happens?",
              options: [
                "Compile error: circular module dependency",
                "It compiles; the crate is one compilation unit, so in-crate cycles are fine",
                "It compiles, but with undefined initialization order, as in TypeScript",
                "It needs forward declarations at the crate root",
              ],
              answer: 1,
              explanation:
                "The cycle ban applies between crates, where cargo enforces it. Modules have no top-level code to initialize, so within a crate mutual references are a non-event.",
            },
          ],
        },
        {
          slug: "mod-visibility",
          title: "Private by default, public on purpose",
          summary: "pub, pub(crate), and pub use facades that hide the file layout.",
          contentFile: "mod-visibility.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does `pub` on an item guarantee?",
              options: [
                "The item is visible to every crate, unconditionally",
                "The item is as visible as its containing module, so reachability depends on the whole path",
                "The item is visible only within its own file",
                "The item will be inlined across crates",
              ],
              answer: 1,
              explanation:
                "`pub` lifts an item to its module's visibility. If the module itself is private, outsiders still cannot reach the item without a re-export, which is what makes facades possible.",
            },
            {
              kind: "predict",
              prompt:
                "`pub struct SubscriberName(String);` lives in src/domain. From src/routes you write `name.0.len()`. What does the compiler say?",
              options: [
                "Compiles; the struct is pub",
                "error[E0616]: field `0` of struct `SubscriberName` is private",
                "Compiles, but only for reads, not writes",
                "error[E0603]: struct `SubscriberName` is private",
              ],
              answer: 1,
              explanation:
                "Type and field visibility are separate decisions. The pub struct exports the name; the private field keeps construction and mutation inside the module, the lever the newtype lesson pulls.",
            },
            {
              kind: "mcq",
              prompt:
                "The point of `pub use subscriber_email::SubscriberEmail;` in domain/mod.rs is:",
              options: [
                "Faster compilation of the domain module",
                "Publishing the type at a stable path while the file layout stays private and free to change",
                "Making the type visible to child modules",
                "Avoiding a name clash with std",
              ],
              answer: 1,
              explanation:
                "The submodule stays private; the re-export is the public path. The book split domain.rs into four files and no consumer changed, because the facade held the API constant.",
            },
          ],
        },
      ],
    },
    {
      slug: "signatures-as-contracts",
      title: "Signatures as contracts",
      description: "What parameter, return, and wrapper types promise at the boundary.",
      lessons: [
        {
          slug: "mod-signatures",
          title: "Signatures at the boundary",
          summary: "Borrow in, own out, impl AsRef front doors, and #[must_use].",
          contentFile: "mod-signatures.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "A public function only reads its string input. The idiomatic parameter type is:",
              options: ["String", "&String", "&str", "Box<str>"],
              answer: 2,
              explanation:
                "&str accepts &String via deref coercion, plus literals and slices, at zero cost. Take String by value only when you store it; &String adds a layer that buys nothing.",
            },
            {
              kind: "predict",
              prompt:
                "`sanitize` is #[must_use] and returns String. A caller writes `sanitize(&name);` as a bare statement. What happens?",
              options: [
                "A hard type error",
                "It compiles, with a warning that the return value is unused",
                "Nothing; #[must_use] only applies to Result",
                "The result is bound to _ automatically",
              ],
              answer: 1,
              explanation:
                "#[must_use] is a lint, not a type error: the build succeeds and the compiler points out the pointless call. Result ships with the same attribute, which is why ignored fallible calls warn.",
            },
            {
              kind: "mcq",
              prompt: "When is returning `&str` from a public method the right call?",
              options: [
                "Whenever possible, to avoid allocation",
                "When it is a view into self, accepting that self stays borrowed while the view lives",
                "Never; public APIs must return owned values",
                "Only for 'static strings",
              ],
              answer: 1,
              explanation:
                "as_str-style getters are idiomatic views. The price is a live borrow of self, enforced by the borrow checker, so functions that produce new data return owned values instead.",
            },
          ],
        },
        {
          slug: "mod-newtypes",
          title: "Newtypes: parse, don't validate",
          summary: "SubscriberEmail: validate once at the edge, prove it by possession.",
          contentFile: "mod-newtypes.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What makes every `SubscriberEmail` in the program valid?",
              options: [
                "It re-validates on each access",
                "The only constructor reachable from outside its module is a parse that validates, so possession proves the check ran",
                "The database rejects bad rows",
                "Debug builds assert validity on use",
              ],
              answer: 1,
              explanation:
                "Smart constructor plus private field: no other origin for a value exists. Downstream code can delete its defensive re-checks because the type itself carries the proof.",
            },
            {
              kind: "predict",
              prompt: "size_of::<SubscriberEmail>() compared to size_of::<String>() is:",
              options: [
                "8 bytes larger, for the wrapper tag",
                "Identical; a single-field newtype adds no layout",
                "Twice as large",
                "Unspecified until runtime",
              ],
              answer: 1,
              explanation:
                "A newtype with one field has exactly that field's layout: three words on the stack, same heap buffer. The distinction exists only in the type checker and vanishes from the binary.",
            },
            {
              kind: "mcq",
              prompt: "Why does `parse` return `Result` instead of panicking on bad input?",
              options: [
                "Panics cannot cross module boundaries",
                "Invalid user input is an expected outcome the caller must handle, like answering 400; panics are reserved for bugs",
                "Result compiles to faster code than panic",
                "So the function can be called from tests",
              ],
              answer: 1,
              explanation:
                "From the Result lesson: expected failure belongs in the return type. The subscribe handler matches on it and returns 400 Bad Request; a panic would turn ordinary garbage input into an outage.",
            },
          ],
        },
      ],
    },
    {
      slug: "construction-and-docs",
      title: "Construction and documentation",
      description: "Builders for growing constructors, and docs that compile.",
      lessons: [
        {
          slug: "mod-builders",
          title: "Builders: when new outgrows its arguments",
          summary: "Config structs, consuming and mutable builders, and when plain new wins.",
          contentFile: "mod-builders.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "A config struct with pub fields and Default beats a builder when:",
              options: [
                "There are more than five fields",
                "Every field has a real default and public fields cannot violate an invariant",
                "The type contains secrets",
                "The type is Copy",
              ],
              answer: 1,
              explanation:
                "Struct update syntax needs a total Default and open fields. A required sender with no default, or an invariant that demands private fields, pushes you to a builder.",
            },
            {
              kind: "predict",
              prompt:
                '`let cmd = Command::new("cargo"); cmd.arg("check");` where Command\'s builder methods take &mut self. What does the compiler say?',
              options: [
                "Compiles fine",
                "cannot borrow `cmd` as mutable, as it is not declared as mutable",
                "error[E0382]: use of moved value: `cmd`",
                "warning: unused return value",
              ],
              answer: 1,
              explanation:
                "&mut self methods need a mut binding. A consuming (self) builder would fail differently, moving cmd and hitting E0382 on reuse; each convention has its own failure mode when misused.",
            },
            {
              kind: "mcq",
              prompt:
                "The practical trade between consuming (self) and mutable (&mut self) builders:",
              options: [
                "Consuming chains as one expression but conditional setup needs rebinding; mutable makes conditionals easy but needs a mut binding",
                "Consuming builders run faster",
                "Mutable builders cannot validate in build()",
                "There is no observable difference",
              ],
              answer: 0,
              explanation:
                "Both are idiomatic: reqwest consumes, Command mutates. Moves make stale consuming builders unusable, which is a feature; mutable builders suit if-driven setup. Runtime cost is identical either way.",
            },
          ],
        },
        {
          slug: "mod-doc-tests",
          title: "Documentation that compiles",
          summary: "Doc tests, docs.rs conventions, and the semver promise around pub.",
          contentFile: "mod-doc-tests.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What does `cargo test` do with the fenced code in a /// # Examples block?",
              options: [
                "Syntax-highlights it for the docs site",
                "Extracts it, compiles it as a small external crate against your library, and runs it",
                "Runs it only if #[test] is added inside",
                "Type-checks it but never runs it",
              ],
              answer: 1,
              explanation:
                "Doc tests are real tests built as an outside consumer of your crate, so examples fail the build the moment the public API drifts, which is exactly the alarm you want.",
            },
            {
              kind: "predict",
              prompt:
                "You add a variant to a pub enum without #[non_exhaustive], and downstream crates match on it exhaustively. Semver says this release is:",
              options: [
                "A patch release",
                "A minor release; additions are additive",
                "A major release; downstream exhaustive matches stop compiling",
                "Outside semver's scope",
              ],
              answer: 2,
              explanation:
                "The match-exhaustive lesson showed every non-wildcard match failing when a variant lands. #[non_exhaustive] trades that break for a forced wildcard arm, making future additions minor.",
            },
            {
              kind: "mcq",
              prompt: "Why can a doc example not call a pub(crate) function?",
              options: [
                "rustdoc strips pub(crate) items from the binary",
                "The example compiles as a separate crate, and pub(crate) items are invisible outside the crate by definition",
                "It can, if marked #[doc(hidden)]",
                "Doc tests run in release mode",
              ],
              answer: 1,
              explanation:
                "pub(crate) means crate-internal, and the doc test is not your crate. E0603 inside a doc test is the visibility lesson enforcing itself on your documentation.",
            },
          ],
        },
      ],
    },
  ],
}
