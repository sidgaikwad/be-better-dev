import type { SectionSeed } from "../types"

// Part 2, section "pinning". Builds on "One owner per value" (Part 1: a move
// is a memcpy) and the state-machine lesson in Async from scratch (an async fn
// compiles to a state machine). Aim: make Pin unscary for API consumers.

export const pinningSection: SectionSeed = {
  slug: "pinning",
  title: "Pinning",
  description: "Why Pin exists and what self-referential state machines need.",
  badgeIcon: "📍",
  badgeTitle: "Pinning",
  units: [
    {
      slug: "the-problem-and-the-promise",
      title: "The problem and the promise",
      description:
        "Self-referential state machines, the contract Pin makes, and the Unpin opt-out.",
      lessons: [
        {
          slug: "pin-self-referential",
          title: "The future that points into itself",
          summary:
            "A borrow across an await turns the state machine self-referential; a memcpy move would break it.",
          contentFile: "pin-self-referential.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "A future from an `async fn` is created and immediately moved into `tokio::spawn`, before ever being polled. Is anything dangerous about that move?",
              options: [
                "Yes: its internal self-references now dangle",
                "No: self-references only exist once a poll has run the body to an await, and this future was never polled",
                "Yes, but only if the future holds a `String`",
                "No: `tokio::spawn` copies the heap as well",
              ],
              answer: 1,
              explanation:
                "In its start state the machine's locals are not initialized yet, so there is nothing to dangle; every future is freely movable until it is first polled.",
            },
            {
              kind: "mcq",
              prompt:
                "The machine at `0x1000` holds `excerpt: 0x1008`, the address of its own `body` field. After the machine is moved to `0x2000`, what does the new copy's `excerpt` contain?",
              options: [
                "`0x2008`, updated to the new location",
                "`0x1008`, unchanged, still aiming into the old memory",
                "A null pointer, cleared by the move",
                "A fresh deep copy of `body`",
              ],
              answer: 1,
              explanation:
                "A move is a memcpy, and pointer fields are just bytes: they are copied verbatim, so the new machine points into memory it no longer owns.",
            },
            {
              kind: "mcq",
              prompt: "Why does rustc not rewrite the internal pointer while moving the struct?",
              options: [
                "Pointer rewriting is only available on nightly compilers",
                "Rust defines a move as a plain byte copy with no hooks, for every type: that definition is what keeps moves uniformly cheap",
                "It does rewrite pointers, but only in release builds",
                "The borrow checker deletes the pointer field instead",
              ],
              answer: 1,
              explanation:
                "Rust has no move constructors by design, so a move can never run fix-up code; since the pointer cannot be patched, the only remaining option is to forbid the move, which is Pin's job.",
            },
          ],
        },
        {
          slug: "pin-contract",
          title: "Pin is a promise about a place",
          summary:
            "Pin<&mut T> promises the pointee never moves again; the contract lives on the pointer, not the value.",
          contentFile: "pin-contract.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "At runtime, what changes about a value the moment a `Pin<&mut T>` pointing at it is created?",
              options: [
                "A pinned flag is set inside the value",
                "The value is copied into a dedicated stable region of memory",
                "Nothing: Pin is a transparent wrapper, and the promise exists only in the type system",
                "The OS locks the value's memory page",
              ],
              answer: 2,
              explanation:
                "`Pin<P>` is `repr(transparent)`: at runtime it is exactly the pointer it wraps. What changes is which programs still type-check, not anything in memory.",
            },
            {
              kind: "predict",
              prompt:
                "`Box::pin(fut)` moves `fut` from the stack into a heap allocation. Is that move a violation of the pin contract?",
              options: [
                "Yes: futures may never be moved",
                "No: the promise starts only when the Pin is created, and this move happens on the way in",
                "No, but only because `Box::pin` patches the internal pointers",
                "Yes, which is why tokio avoids `Box::pin`",
              ],
              answer: 1,
              explanation:
                "Pinning has a start time; every move before it is ordinary Rust, and a never-polled machine has no self-references to break anyway. After it, the box never gives the value back.",
            },
            {
              kind: "mcq",
              prompt:
                "Why is refusing to hand out `&mut T` enough to prevent every move in safe code?",
              options: [
                "Every safe operation that moves a value out of a place it does not own, like `mem::swap`, `mem::replace`, and overwriting assignment, requires `&mut` to that place",
                "`&mut T` stores the value's move table",
                "It is not enough: Pin also performs a runtime check",
                "Because moving a value requires it to be `Copy`",
              ],
              answer: 0,
              explanation:
                "`&mut` is the moving permission: withhold it and `swap`, `replace`, `take`, and assignment all become unwritable, so the value stays put until Drop.",
            },
          ],
        },
        {
          slug: "pin-unpin",
          title: "Unpin: nearly everything opts out",
          summary:
            "Why Pin<&mut T> collapses to &mut T for ordinary types, and why the runtime pins so you don't.",
          contentFile: "pin-unpin.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "You hold `s: Pin<&mut Vec<u8>>`. Can you call `s.get_mut().push(1)` without any `unsafe`?",
              options: [
                "No: Pin forbids all mutation",
                "Yes: `Vec<u8>` is Unpin, so `get_mut` is safe and the pin contract asks nothing of it",
                "Only if the Vec has spare capacity",
                "Only by wrapping it in `Box::pin` first",
              ],
              answer: 1,
              explanation:
                "Pin restricts moving, not mutating, and for Unpin types it does not even restrict that: `Pin<&mut T>` where `T: Unpin` is just `&mut T` with paperwork.",
            },
            {
              kind: "mcq",
              prompt: "What exactly does a type claim by implementing `Unpin`?",
              options: [
                "It can never be moved",
                "It is always pinned",
                "Moving it after it has been pinned breaks nothing",
                "It contains no pointers at all",
              ],
              answer: 2,
              explanation:
                "Unpin is a shrug, not a restriction: a `String` contains a pointer, but that pointer targets a heap buffer rather than the value's own location, so moving the header is always harmless.",
            },
            {
              kind: "mcq",
              prompt: "Why does typical application async code never mention `Pin`?",
              options: [
                "Pin was replaced by Unpin in modern Rust",
                "The runtime pins each task's root future and `.await` pins children transitively, so the contract is produced and upheld by machinery",
                "Application futures are never self-referential",
                "tokio disables the pin contract in release builds",
              ],
              answer: 1,
              explanation:
                "Application futures are routinely self-referential; you never see Pin because tokio pins the root and the compiler pins every awaited child, signing the contract for you.",
            },
          ],
        },
      ],
    },
    {
      slug: "pin-in-practice",
      title: "Pin in practice",
      description: "Where working code meets Pin, and the mental model to keep afterward.",
      lessons: [
        {
          slug: "pin-in-the-wild",
          title: "Where working code meets Pin",
          summary:
            "select! loops, pin!, Box::pin, streams, and how to read a cannot-be-unpinned error.",
          contentFile: "pin-in-the-wild.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "The compiler says `impl Future<Output = ()> cannot be unpinned`. What is it actually asking you to do?",
              options: [
                "Derive Unpin for the future",
                "Pin the future to a stable address first, with `pin!` or `Box::pin`, then lend it by reference",
                "Wrap the future in `Arc<Mutex<_>>`",
                "Call `.await` on it sooner",
              ],
              answer: 1,
              explanation:
                "You cannot make an async machine Unpin, and there is no derive; the fix is always to park it somewhere stable and pass the resulting pinned handle around instead.",
            },
            {
              kind: "predict",
              prompt:
                "`tokio::select!` receives a future by value, as in `issue = queue.next_issue() => ...`. Does that branch need manual pinning?",
              options: [
                "Yes: select! demands pinned futures in every position",
                "No: the macro pins by-value branches itself; manual pinning is only needed when you pass `&mut` to keep a future alive across iterations",
                "Yes, unless the future is `'static`",
                "No, because by-value futures cannot be self-referential",
              ],
              answer: 1,
              explanation:
                "A by-value branch is created, pinned by the macro, and dropped each iteration; a shutdown future must survive iterations instead, so you pin it once outside the loop and lend `&mut`.",
            },
            {
              kind: "mcq",
              prompt: "Why is `Pin<Box<F>>` itself Unpin even when `F` is not?",
              options: [
                "Because Box turns the contract off",
                "Because moving the pinned box moves only the box's pointer; the pinned bytes stay at the same heap address",
                "Because heap memory cannot hold self-references",
                "It is not Unpin; only `Pin<&mut F>` is",
              ],
              answer: 1,
              explanation:
                "Same shape as the String from One owner per value: the handle moves, the allocation stays, so the promise about the pinned contents is never broken.",
            },
          ],
        },
        {
          slug: "pin-mental-model",
          title: "The mental model to keep",
          summary:
            "Six sentences that hold the whole story: you consume pins, runtimes and combinators produce them.",
          contentFile: "pin-mental-model.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "In one sentence, why does `Pin` exist?",
              options: [
                "Futures are too large to copy efficiently",
                "Compiler-generated state machines can contain pointers into themselves, and Rust moves are byte copies that cannot fix those pointers up",
                "The kernel requires stable buffers for all IO",
                "Async code may migrate between threads",
              ],
              answer: 1,
              explanation:
                "Pinning is the language's answer to self-referential state machines under memcpy moves: since the pointer cannot be patched, the move is forbidden instead.",
            },
            {
              kind: "predict",
              prompt:
                "Your service's source code contains zero mentions of `Pin`. Is the pin contract in effect anywhere in the running program?",
              options: [
                "No: no Pin in source means no pinning at runtime",
                "Yes: every spawned task's future is pinned by the runtime, and every `.await` pins a child machine, so the contract runs through the whole program",
                "Only if a dependency uses `PhantomPinned`",
                "Only while the IO driver is blocked",
              ],
              answer: 1,
              explanation:
                "You consume pinning invisibly: tokio pins each task at its heap address and the compiler pins every awaited child inside its parent, whether or not your code names the type.",
            },
            {
              kind: "mcq",
              prompt: "Which of these actually requires you to write `Pin` yourself?",
              options: [
                "Awaiting a child future inside an `async fn`",
                "Spawning a task with `tokio::spawn`",
                "Storing a not-yet-awaited future in a struct field",
                "Calling an `async fn` to create a future",
              ],
              answer: 2,
              explanation:
                "A stored future needs a stable home and a nameable type, which is `Pin<Box<dyn Future + Send>>`; the other three are handled by the runtime and the compiler.",
            },
          ],
        },
      ],
    },
  ],
}
