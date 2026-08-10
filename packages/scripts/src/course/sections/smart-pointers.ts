import type { SectionSeed } from "../types"

export const smartPointers: SectionSeed = {
  slug: "smart-pointers",
  title: "Smart pointers and interior mutability",
  description: "Box, Rc, Arc, Cell, RefCell: when each exists and why.",
  badgeIcon: "📌",
  badgeTitle: "Smart pointers",
  units: [
    {
      slug: "one-owner-on-the-heap",
      title: "One owner, on the heap",
      description: "Box for placement, and the two traits that make pointers feel native.",
      lessons: [
        {
          slug: "ptr-box",
          title: "Box: one owner, on the heap",
          summary: "Heap placement, recursive types, trait objects, and a one-word price.",
          contentFile: "ptr-box.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "Why does `enum Expr { Number(f64), Neg(Expr) }` fail to compile?",
              options: [
                "Enums may not contain other enums",
                "The enum's size would have to be infinite; `Box<Expr>` fixes it by being one word regardless of target",
                "Recursive types require a lifetime annotation",
                "f64 and Expr cannot share an enum",
              ],
              answer: 1,
              explanation:
                "An enum's size is its largest variant, and `Neg(Expr)` makes that size depend on itself. Indirection through a fixed-size pointer closes the equation.",
            },
            {
              kind: "predict",
              prompt:
                '```rust\nlet a = Box::new([0u8; 4096]);\nlet b = a;\nprintln!("{}", a.len());\n```\nWhat happens?',
              options: [
                "Prints 4096; Box is Copy",
                "Compile error: borrow of moved value `a`",
                "Runtime panic: double free",
                "Prints 4096; the array was cloned",
              ],
              answer: 1,
              explanation:
                "A Box moves like a String does: the pointer word transfers to `b` and `a` is dead. Nothing about Box changes the ownership rules from the moves lesson.",
            },
            {
              kind: "mcq",
              prompt: "How wide are `Box<Config>` and `Box<dyn EmailClient>` respectively?",
              options: [
                "One word and one word",
                "One word, and two words (data pointer plus vtable pointer)",
                "Two words and two words",
                "Both depend on the size of the pointed-to value",
              ],
              answer: 1,
              explanation:
                "A Box of a sized type is a single pointer. A trait object needs a second word pointing at the method table, since the concrete type is only known at runtime.",
            },
          ],
        },
        {
          slug: "ptr-deref-drop",
          title: "Deref and Drop: what makes a pointer smart",
          summary: "The two traits that let library types behave like built-in references.",
          contentFile: "ptr-deref-drop.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "`fn greet(name: &str)` accepts `&b` where `b: Box<String>`. What makes that compile?",
              options: [
                "The compiler special-cases Box and String",
                "Deref coercion, applied transitively at compile time: &Box<String> to &String to &str",
                "An implicit clone into a &str",
                "A runtime conversion inserted by Box",
              ],
              answer: 1,
              explanation:
                "Each hop is a `deref` call the compiler inserts while type-checking; the chain costs zero instructions at runtime. Only the coercion rules are built in, not the types.",
            },
            {
              kind: "mcq",
              prompt: "In practice, a smart pointer is a struct implementing which pair of traits?",
              options: [
                "Clone and Copy",
                "Send and Sync",
                "Deref, to stand in for the target, and Drop, to release a resource at scope end",
                "From and Into",
              ],
              answer: 2,
              explanation:
                "Deref provides the acts-like-the-value ergonomics; Drop provides deterministic release: freeing memory, decrementing a count, unlocking a mutex.",
            },
            {
              kind: "predict",
              prompt:
                "`let _ = mutex.lock().unwrap();` followed by more work in the same scope. Is the mutex still locked during that work?",
              options: [
                "Yes, until scope end",
                "No: the pattern `_` binds nothing, so the guard dropped and unlocked immediately",
                "Yes, until the next .lock() call",
                "It deadlocks",
              ],
              answer: 1,
              explanation:
                "`_` discards the value, so its Drop runs at the end of that statement. Binding to `_guard` instead holds the lock to scope end; one underscore changes the meaning.",
            },
          ],
        },
      ],
    },
    {
      slug: "shared-ownership",
      title: "Shared ownership",
      description: "Rc and Arc: many owners, counted, on one thread or many.",
      lessons: [
        {
          slug: "ptr-rc-weak",
          title: "Rc: ownership by counting",
          summary: "Shared ownership on one thread, cheap clones, and cycles broken by Weak.",
          contentFile: "ptr-rc-weak.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "`Rc::clone(&template)` on an `Rc<Template>` holding a large html String does what?",
              options: [
                "Deep-copies the Template, html included",
                "Copies one pointer and increments the strong count; the Template is untouched",
                "Moves the Template to a new allocation",
                "Creates a &Template with a longer lifetime",
              ],
              answer: 1,
              explanation:
                "Rc's Clone is the cheap kind from the clone-judgment lesson: a count bump in the shared header. Writing `Rc::clone(&x)` instead of `x.clone()` signals exactly that.",
            },
            {
              kind: "predict",
              prompt:
                "Two nodes hold `Rc`s to each other (a cycle), and both stack bindings are dropped. Is the memory freed?",
              options: [
                "Yes, the compiler detects cycles at compile time",
                "Yes, a cycle collector runs at program exit",
                "No: each count sticks at 1, the nodes leak; a Weak back-pointer is the fix",
                "No, and the program panics",
              ],
              answer: 2,
              explanation:
                "Rust prevents dangling and double frees, not leaks. Weak references do not own, so pointing one direction of the cycle through Weak lets the counts reach zero.",
            },
            {
              kind: "mcq",
              prompt: "Why does the compiler refuse to let an `Rc<T>` move to another thread?",
              options: [
                "Rc's count is a plain integer; concurrent bumps could lose an update and free the value early, so Rc is not Send",
                "Rc values are always too large to send",
                "Threads may only receive Copy types",
                "It is allowed, but only inside unsafe blocks",
              ],
              answer: 0,
              explanation:
                "A lost increment means a premature free, a use-after-free. Rc trades thread-safety for cheap nonatomic counting, and the Send check makes that trade safe to offer.",
            },
          ],
        },
        {
          slug: "ptr-arc",
          title: "Arc: counting across threads",
          summary: "Atomic refcounts, what they cost, and the Arc<Mutex<T>> shape ahead.",
          contentFile: "ptr-arc.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "What is the difference between `Rc<T>` and `Arc<T>`?",
              options: [
                "Arc stores the value on a special thread-safe heap",
                "Arc adds a Mutex around the value",
                "Only the counts: Arc's are atomic, which is what makes it safe to send across threads",
                "Arc hands out &mut T while Rc hands out &T",
              ],
              answer: 2,
              explanation:
                "Same API, same layout, same read-only sharing. The atomic operations on the counts are the entire difference, and the entire extra cost.",
            },
            {
              kind: "predict",
              prompt:
                "```rust\nlet v = Arc::new(vec![1]);\nlet v2 = Arc::clone(&v);\nthread::spawn(move || v2.push(2));\n```\nWhat happens?",
              options: [
                "Compiles; the vec becomes [1, 2]",
                "Compile error: cannot borrow data in an `Arc` as mutable",
                "Runtime panic: concurrent mutation",
                "Deadlock waiting for the other Arc",
              ],
              answer: 1,
              explanation:
                "Arc derefs to &T only; push needs &mut. Threads do not relax aliasing XOR mutation. Shared mutation is spelled Arc<Mutex<Vec<_>>>, Part 2's subject.",
            },
            {
              kind: "mcq",
              prompt:
                "The newsletter API clones its `web::Data` app state (an Arc holding the db pool) once per request. That clone costs:",
              options: [
                "A copy of the connection pool",
                "One atomic increment; the pool itself is never copied",
                "A heap allocation per request",
                "A lock acquisition on the pool",
              ],
              answer: 1,
              explanation:
                "web::Data<T> is an Arc<T> inside, so per-request clones are count bumps. This is the cheap-clone family doing its everyday production job.",
            },
          ],
        },
      ],
    },
    {
      slug: "interior-mutability",
      title: "Interior mutability, and choosing",
      description: "Cell and RefCell honestly, then the ten-second decision table.",
      lessons: [
        {
          slug: "ptr-cell-refcell",
          title: "Cell and RefCell: borrow rules at runtime",
          summary:
            "Mutation through &self, what a BorrowMutError means, and when the scalpel is right.",
          contentFile: "ptr-cell-refcell.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "How can `Cell<u64>` allow mutation through &self with no runtime check at all?",
              options: [
                "It uses an atomic integer",
                "It never hands out references to its interior: values are copied out whole and replaced whole, so no reference can be invalidated",
                "It checks a borrow flag, but the branch is usually predicted",
                "It is only allowed in single-expression functions",
              ],
              answer: 1,
              explanation:
                "Aliasing XOR mutation is about references observing a value while it changes. Cell removes the references, so there is nothing left to violate, and nothing to check.",
            },
            {
              kind: "predict",
              prompt:
                "```rust\nlet log = RefCell::new(Vec::new());\nlet r = log.borrow();\nlog.borrow_mut().push(1);\n```\n`r` is never used. What happens?",
              options: [
                "Compile error: log is already borrowed",
                "Works fine: unused borrows are optimized away",
                "Panics at runtime: already borrowed, BorrowMutError",
                "The push silently waits for r to drop",
              ],
              answer: 2,
              explanation:
                "Compile-time borrows end at last use, but Ref is a value, so its borrow ends at drop, scope end here. The guard is still alive when borrow_mut checks the flag.",
            },
            {
              kind: "mcq",
              prompt:
                "A production service panics with `already borrowed: BorrowMutError`. What does that tell you?",
              options: [
                "The RefCell's value was corrupted by another thread",
                "The program hit an out-of-memory condition",
                "A reader and writer overlapped at runtime: the same aliasing XOR mutation bug the compiler catches free, deferred to a runtime panic by using RefCell",
                "A Weak reference was upgraded after its value dropped",
              ],
              answer: 2,
              explanation:
                "RefCell does not weaken the borrow rules, it moves their enforcement to runtime. The panic is the runtime checker firing where a compile error would have been.",
            },
          ],
        },
        {
          slug: "ptr-choosing",
          title: "Choosing a pointer in ten seconds",
          summary: "Owned T, &T, Box, Rc, Arc, RefCell: three questions and a table.",
          contentFile: "ptr-choosing.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "A single-threaded interpreter: AST nodes are shared by several views and occasionally annotated (mutated) during analysis. Which type?",
              options: ["Box<Node>", "Rc<Node>", "Rc<RefCell<Node>>", "Arc<Mutex<Node>>"],
              answer: 2,
              explanation:
                "Many owners on one thread: Rc. Mutation through shared handles on one thread: RefCell. Arc<Mutex> answers the same questions for threads that this program does not have, at atomic-and-lock prices.",
            },
            {
              kind: "mcq",
              prompt:
                "A function only needs to read the text of a subscriber's name. Its parameter should be:",
              options: [
                "String",
                "&str: no ownership is needed, so no smart pointer is either",
                "Box<String>",
                "Rc<String>",
              ],
              answer: 1,
              explanation:
                "Question zero comes first: reading someone else's value is what plain borrows are for. Every pointer in the table exists for shapes ownership alone cannot express.",
            },
            {
              kind: "mcq",
              prompt: "`Rc<RefCell<T>>` is the single-threaded twin of which multi-threaded shape?",
              options: ["Arc<Cell<T>>", "Box<Mutex<T>>", "Arc<Mutex<T>>", "Rc<RwLock<T>>"],
              answer: 2,
              explanation:
                "Same two answers, thread question flipped: counted shared ownership plus interior mutability. Rc/RefCell enforce with nonatomic counts and a flag; Arc/Mutex with atomics and a lock.",
            },
          ],
        },
      ],
    },
  ],
}
