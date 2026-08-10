import type { SectionSeed } from "../types"

export const z2pTypeDriven: SectionSeed = {
  slug: "z2p-type-driven",
  title: "Type-driven validation (ch. 6)",
  description: "Ownership meets invariants, panics versus Result, property tests.",
  badgeIcon: "🛡️",
  badgeTitle: "Type-driven",
  units: [
    {
      slug: "parse-dont-validate",
      title: "Parse, don't validate",
      description: "Why edge checks decay, and the newtype that stores the proof.",
      lessons: [
        {
          slug: "tdv-leaky-cauldron",
          title: "Validation is a leaky cauldron",
          summary: "Edge checks decay as call sites multiply; a bool stores nothing.",
          contentFile: "tdv-leaky-cauldron.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "The chapter says `is_valid_name` gives a false sense of safety. What exactly is the flaw?",
              options: [
                "Grapheme counting makes it too slow for a request path",
                "It proves the conditions held at one point, then discards the proof: the fact is stored nowhere, so downstream code cannot rely on it",
                "It misses some dangerous characters",
                "A bool cannot distinguish the three failure reasons",
              ],
              answer: 1,
              explanation:
                "A validation function's finding evaporates with the returned bool. Nothing about the String's type records that it was checked, so every consumer must re-derive the fact.",
            },
            {
              kind: "predict",
              prompt:
                "insert_subscriber splits into two helpers, each needing the non-empty invariant. Under the is_valid_name design, what must each helper do to be certain?",
              options: [
                "Nothing; the handler's check covers all downstream code",
                "Validate the name again itself",
                "Trust the doc comment on insert_subscriber",
                "Switch its parameter from String to &str",
              ],
              answer: 1,
              explanation:
                "Certainty from a String parameter requires re-checking, in every function that needs the invariant. That duplication is the leak: the check's result was never stored anywhere types can carry it.",
            },
            {
              kind: "mcq",
              prompt:
                "Why cap names at 256 graphemes when the chapter admits names have no natural length limit?",
              options: [
                "Postgres TEXT columns require a declared maximum",
                "The column is effectively unbounded, and unbounded attacker-controlled input is a denial-of-service surface: the cap is a security layer",
                "Longer names break URL encoding",
                "The Unicode standard defines 256 as the maximum grapheme count",
              ],
              answer: 1,
              explanation:
                "The bound is defense in depth against abuse, not a claim about real names. The same posture motivates rejecting characters common in SQL and HTML fragments.",
            },
          ],
        },
        {
          slug: "tdv-parse-dont-validate",
          title: "Parse, don't validate: SubscriberName",
          summary: "A private field and one constructor make invalid names unrepresentable.",
          contentFile: "tdv-parse-dont-validate.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "What makes parse the only way to build a SubscriberName outside the domain module?",
              options: [
                "parse registers every instance in a runtime table",
                "Field visibility: with a private field, the tuple struct constructor is private too",
                "SubscriberName does not implement Clone",
                "A #[non_exhaustive] attribute on the struct",
              ],
              answer: 1,
              explanation:
                "A tuple struct's constructor is a function whose visibility follows its fields, so `SubscriberName(...)` outside the module is E0603. The compiler enforces the single door; no runtime machinery exists.",
            },
            {
              kind: "predict",
              prompt:
                'Outside the domain module: `let mut n = SubscriberName::parse("Ursula".to_string()); n.0 = String::new();` What does the compiler say?',
              options: [
                "It compiles, and the invariant is silently broken",
                "Error: field `0` of struct `SubscriberName` is private",
                "It compiles with a lint warning about direct field access",
                "Error: cannot borrow `n` as mutable",
              ],
              answer: 1,
              explanation:
                "Privacy guards reads and writes alike, so a value that passed parse cannot be rotted afterward. Bypassing parse and mutating after parse are both closed off by the same visibility rule.",
            },
            {
              kind: "mcq",
              prompt:
                "insert_subscriber takes &NewSubscriber and is certain the name is valid. What is the source of that certainty?",
              options: [
                "Its doc comment states the precondition",
                "The signature alone: every SubscriberName in existence came through parse, so the argument's type carries the proof",
                "tracing spans record that validation ran earlier in the request",
                "A CHECK constraint on the subscriptions table",
              ],
              answer: 1,
              explanation:
                "This is the local judgment the boolean design could not offer: no call-site audit, just a type that cannot hold an unvalidated value. Incorrect usage does not fail at runtime; it fails to compile.",
            },
          ],
        },
      ],
    },
    {
      slug: "enforcing-the-invariant",
      title: "Enforcing the invariant",
      description: "Reading the value without breaking it, and the panic versus Result line.",
      lessons: [
        {
          slug: "tdv-asref-inner",
          title: "AsRef<str>: reading without unsealing",
          summary: "Consume, mutate, or borrow: only one exposure keeps the guarantee.",
          contentFile: "tdv-asref-inner.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why is inner_mut(&mut self) -> &mut str rejected for SubscriberName?",
              options: [
                "&mut str is not a legal type",
                "It grants callers the power to rewrite the value after validation, equivalent to making the field pub",
                "It would force SubscriberName to be Copy",
                "Mutable borrows cannot cross module boundaries",
              ],
              answer: 1,
              explanation:
                "The whole guarantee is that nothing after parse can change the value. A leaked &mut hands that control away, so the invariant would hold only by politeness.",
            },
            {
              kind: "mcq",
              prompt:
                "What does implementing AsRef<str> buy over keeping a bespoke inner_ref method?",
              options: [
                "It removes the need for a private field",
                "Interop: generic functions bounded on T: AsRef<str>, in std and third-party crates, accept SubscriberName directly",
                "as_ref is faster than inner_ref at runtime",
                "It automatically derives Debug and Display",
              ],
              answer: 1,
              explanation:
                "Both methods compile to the same field borrow. The standard trait is shared ecosystem vocabulary, the same way std::fs::create_dir takes any P: AsRef<Path> without callers learning conversions.",
            },
            {
              kind: "predict",
              prompt:
                'fn greet<T: AsRef<str>>(t: T) exists. Which calls compile: greet(subscriber_name), greet(String::from("hi")), greet("hi")?',
              options: [
                "Only greet(subscriber_name)",
                "All three: our impl covers SubscriberName, and std provides AsRef<str> for String and &str",
                "Only the String and &str calls",
                "None without writing .as_ref() at each call site",
              ],
              answer: 1,
              explanation:
                "That is the ergonomics payoff: one trait bound admits every string-shaped type, and each call monomorphizes to a plain field or pointer borrow.",
            },
          ],
        },
        {
          slug: "tdv-panics-vs-result",
          title: "Panics are for bugs, Result is for failure",
          summary:
            "The book's line between the two, and claim's assertion errors that explain themselves.",
          contentFile: "tdv-panics-vs-result.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "By the book's line, which failure legitimately belongs to panic! rather than Result?",
              options: [
                "A subscriber submits a 300-grapheme name",
                "The database refuses a connection during insert",
                "An internal state the code just proved impossible is observed anyway: the program has a bug",
                "An email address fails validation",
              ],
              answer: 2,
              explanation:
                "Panics mark unrecoverable situations and programmer errors. Bad user input and flaky infrastructure are expected failures of expected operations, which belong in return types as values.",
            },
            {
              kind: "predict",
              prompt:
                "parse still panics, and a request with an empty name arrives in production. What happens to the actix-web process?",
              options: [
                "The whole process exits with the panic",
                "The worker handling that request dies and is replaced; the client's connection drops with no response",
                "actix-web catches the panic and returns a 500",
                "actix-web catches the panic and returns a 400",
              ],
              answer: 1,
              explanation:
                "actix-web runs multiple workers and survives one panicking by spawning a replacement, which is why the client observes an IncompleteMessage error instead of a status code. Resilience machinery is for bugs, not for routine rejection.",
            },
            {
              kind: "mcq",
              prompt:
                "Why did adopting claim's assert_ok!/assert_err! force #[derive(Debug)] on SubscriberName?",
              options: [
                "claim only supports standard library types",
                "The macros print the unexpected variant's contents with {:?}, and that formatting is what Debug provides",
                "Debug is required for stack unwinding",
                "Result<T, E> itself requires Debug on T",
              ],
              answer: 1,
              explanation:
                "The entire value of the crate is showing the payload it did not expect, so the type must be formattable. Without Debug, the macro cannot render `got Err(...)` and compilation fails.",
            },
          ],
        },
      ],
    },
    {
      slug: "emails-and-the-request-path",
      title: "Emails and the request path",
      description: "SubscriberEmail under property tests, and TryFrom at the boundary.",
      lessons: [
        {
          slug: "tdv-subscriber-email",
          title: "SubscriberEmail and property-based testing",
          summary: "validator checks the string; fake and quickcheck hunt the inputs you forgot.",
          xp: 25,
          contentFile: "tdv-subscriber-email.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why route generation through a ValidEmailFixture instead of writing the property over String?",
              options: [
                "String does not implement quickcheck's Arbitrary trait",
                "Random Strings are almost never valid emails, so the property would fail for the wrong reason; the fixture confines generation to the valid space",
                "quickcheck properties only accept tuple structs",
                "String cannot derive Clone, which quickcheck requires",
              ],
              answer: 1,
              explanation:
                "String does implement Arbitrary; that is the trap option. The property under test is 'no valid email is rejected', so the generator must produce valid emails, which is exactly what SafeEmail inside the fixture's arbitrary provides.",
            },
            {
              kind: "predict",
              prompt:
                "A quickcheck property over Vec<u32> returns false for some 40-element vector. What does quickcheck report?",
              options: [
                "The original 40-element failing vector",
                "A smaller failing vector found by shrinking, as close to minimal as it can get",
                "Every failing vector it encountered across all iterations",
                "Only the iteration number that failed",
              ],
              answer: 1,
              explanation:
                "On failure quickcheck calls Arbitrary::shrink repeatedly, hunting for the smallest input that still fails. Vec ships a real shrinker; our email fixture keeps the default empty one, so it would report the raw input instead.",
            },
            {
              kind: "mcq",
              prompt: "After 100 generated emails pass, what has the property test established?",
              options: [
                "The parser is proven correct for all valid emails",
                "Confidence rose sharply, but not proof: random sampling does not exhaustively explore the input space",
                "The parser rejects all invalid emails",
                "validator and fake agree on the RFC grammar, so the test is redundant",
              ],
              answer: 1,
              explanation:
                "The book states the caveat directly: property testing widens the tested input range and catches over-strict rules examples miss, but only an exhaustive sweep could prove the property outright.",
            },
          ],
        },
        {
          slug: "tdv-tryfrom-request-path",
          title: "TryFrom: parse at the boundary",
          summary:
            "FormData to NewSubscriber as a fallible conversion; the endpoint returns 400 and moves on.",
          contentFile: "tdv-tryfrom-request-path.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why is TryFrom the right std trait for FormData to NewSubscriber, rather than AsRef or From?",
              options: [
                "It is the only conversion trait in the prelude",
                "The conversion can fail and consumes its input: exactly TryFrom's contract, where AsRef is an infallible borrow and From cannot fail",
                "TryFrom conversions are optimized better by the compiler",
                "actix-web's Form extractor requires a TryFrom implementation",
              ],
              answer: 1,
              explanation:
                "Matching the trait to the conversion's shape is the point: fallible plus consuming is TryFrom. Picking the standard trait with the right contract is what makes the intent legible to other Rust developers.",
            },
            {
              kind: "mcq",
              prompt:
                "We implemented TryFrom, yet the handler calls form.0.try_into(). Where does that method come from?",
              options: [
                "A derive macro expands it from the TryFrom impl",
                "A blanket impl in std: TryInto<U> is implemented for T wherever U: TryFrom<T>",
                "actix-web adds try_into to all extracted payloads",
                "We also implemented TryInto by hand",
              ],
              answer: 1,
              explanation:
                "Implement TryFrom once and the mirror-image try_into arrives free via the blanket implementation, which is why you always implement TryFrom and never TryInto directly.",
            },
            {
              kind: "predict",
              prompt:
                "POST name=Ursula&email=definitely-not-an-email hits the finished endpoint. What response, and does the database see anything?",
              options: [
                "200 OK; the row is inserted for later cleanup",
                "400 Bad Request from the try_into match; insert_subscriber is never called",
                "500 Internal Server Error from the insert failing",
                "The connection drops with no response, as in the panic days",
              ],
              answer: 1,
              explanation:
                "The endpoint is parse-then-act: SubscriberEmail::parse fails inside try_from, the match returns 400 immediately, and no database work happens. A 500 is reserved for failures that are our fault, like a failed insert.",
            },
          ],
        },
      ],
    },
  ],
}
