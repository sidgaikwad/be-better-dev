This signature made it into a pull request on the newsletter service:

```rust
pub fn normalize_name(name: String) -> String {
    name.trim().to_string()
}
```

It only reads `name`, yet takes ownership, so every caller that still needs the value clones first: `normalize_name(form.name.clone())`. The clone-judgment lesson named this pattern: clones compensating for a wrong signature. Public signatures are where the last few sections stop being rules and become style. Here are the conventions.

## Borrow in

For inputs you only read, take the widest borrowed view: `&str`, not `&String` or `String`; `&[T]`, not `&Vec<T>`. The shared-references lesson showed why: deref coercion lets `&String`, literals, and slices all flow into `&str` at zero cost, and the slices lesson made `&[T]` the universal front door for contiguous data.

```rust
pub fn normalize_name(name: &str) -> String
```

The exception is deliberate consumption. A constructor that stores the value takes it owned, so the handover is visible at the call site (functions-take-ownership); `SubscriberName::parse(s: String)` in the next lesson does exactly this.

## Own out

Return owned values from functions that produce data: `String`, `Vec<T>`, your own types. A returned `&str` is for views into something the caller already holds, usually `&self`:

```rust
impl SubscriberName {
    pub fn as_str(&self) -> &str { &self.0 }      // view: borrows self
    pub fn into_inner(self) -> String { self.0 }  // handover: consumes self
}
```

Both are honest; they promise different things. The receiver conventions from the structs lesson carry the meaning: `&self` reads, `&mut self` edits in place, `self` consumes, and the `as_`/`to_`/`into_` prefixes telegraph which one you got. Remember that a view keeps `self` borrowed for as long as it lives (borrow-checker-proofs), so an API built around long-lived references chains callers to your struct. When in doubt, return owned.

## impl AsRef for the front door

`std::fs::File::open` accepts `&str`, `String`, `&Path`, and `PathBuf` through one signature:

```rust
pub fn open<P: AsRef<Path>>(path: P) -> io::Result<File>
```

`AsRef<T>` means "can lend a `&T`". A bound like `impl AsRef<str>` earns its keep on boundary functions called with many input shapes; inside the crate, plain `&str` is simpler. The trait machinery arrives in the traits section; the design guidance stands on its own.

## #[must_use]

When a function's entire point is its return value, ask the compiler to catch discarded results:

```rust
#[must_use]
pub fn sanitize(input: &str) -> String { /* ... */ }
```

```rust
sanitize(&form.name);
// warning: unused return value of `sanitize` that must be used
```

`Result` carries `#[must_use]` already, which is why an ignored fallible call warns (result-basics). Add it to pure transforms and builder methods, where dropping the return is always a bug.

## One level deeper

Why does std bother with the `AsRef` plumbing? Generics monomorphize: each concrete `P` stamps out a fresh copy of the function, and for a large body that means binary bloat and slower builds. std uses a shim:

```rust
pub fn read<P: AsRef<Path>>(path: P) -> io::Result<Vec<u8>> {
    fn inner(path: &Path) -> io::Result<Vec<u8>> { /* real body */ }
    inner(path.as_ref())
}
```

One tiny generic wrapper per caller type, one shared body. You offer the ergonomic surface and pay for a single implementation.

## Predict, then verify

```rust
fn domain_of(email: &SubscriberEmail) -> &str {
    email.as_ref().rsplit('@').next().unwrap()
}

let email = SubscriberEmail::parse("ursula@domain.com".to_string()).unwrap();
let domain = domain_of(&email);
drop(email);
println!("{domain}");
```

Does it compile?

Answer: no: `error[E0505]: cannot move out of 'email' because it is borrowed`. Lifetime elision tied the returned `&str` to the input borrow (lifetime-annotations), so `domain` keeps `email` borrowed at the `drop`. Returning `String` from `domain_of` would trade one allocation for the caller's freedom, exactly the own-out judgment call this lesson is about.
