Functions borrow for a moment. The tempting next step is a _struct_ that borrows, and this is where a design decision hides inside a language feature.

## A struct holding a reference must declare it

```rust
struct Excerpt<'a> {
    text: &'a str,
}
```

The `<'a>` says: any `Excerpt` value is tied to some region, and the `text` inside it must live at least that long. The struct is now _infectious_ in a precise way: it cannot outlive whatever it borrows from.

```rust
let novel = String::from("Call me Ishmael. Some years ago...");
let first = Excerpt { text: &novel[..16] };
println!("{}", first.text);    // fine: novel is alive
drop(novel);                    // error: novel is borrowed by `first`
```

Every function that touches `Excerpt` now carries the parameter too (`fn read(e: &Excerpt<'_>)`), and any struct that _contains_ an `Excerpt` inherits it. One borrowed field, and the lifetime threads through the whole data structure design.

## The practical default: functions borrow, structs own

That threading is not a flaw; it is the true cost of holding a borrow, made visible. But it leads to the most useful guideline in this section:

- **Functions should borrow.** A parameter lives for one call; `&str` in, result out, no ceremony.
- **Structs should own.** A struct lives for who-knows-how-long, crosses function boundaries, gets stored in collections, gets sent to other threads. A `String` field costs one allocation and buys total freedom.

Borrowing structs earn their complexity in specific places: parsers and views, where a short-lived structure indexes into a big buffer that demonstrably outlives it (`serde`'s zero-copy deserialization is the famous production example). If your struct is configuration, a domain entity, or anything stored, own the data. The book's newsletter service, Part 3, owns essentially everything in its structs, and that is representative of application Rust.

When you convert a borrowing design to an owning one, the change is mechanical: `&'a str` becomes `String`, the `<'a>` disappears everywhere, and constructors gain a `.to_owned()` or take `String` directly.

## Reading `<'a>` in the wild

Two forms you will meet constantly in other people's code:

- `impl<'a> Excerpt<'a> { ... }`: methods for the borrowing struct; rule 3 of elision usually keeps the methods themselves clean.
- `Excerpt<'_>` in signatures: "there is a lifetime here, the compiler can figure it out." The anonymous lifetime keeps noise down when the relationship is obvious.

If generics like `Vec<T>` already make sense to you, map the concepts across: `'a` is a parameter exactly like `T`, except it ranges over regions instead of types, and the compiler always infers it at use sites.

## Predict, then verify

```rust
struct Parser<'a> {
    input: &'a str,
    position: usize,
}

fn make_parser() -> Parser<'static> {
    let source = String::from("local data");
    Parser { input: &source, position: 0 }
}
```

What happens, and what are the two honest fixes?

Answer: E0597, `source` does not live long enough; the signature promises a `'static` borrow but `source` dies at the end of `make_parser`. Honest fix one: make the parser own its input (`input: String`), no lifetime parameter at all. Honest fix two: let the _caller_ own the data and pass it in, `fn make_parser(source: &str) -> Parser<'_>`, so the borrow points at something that outlives the parser. Which fix is right is the functions-borrow, structs-own question, answered for your specific data flow.
