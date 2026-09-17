With ownership and borrowing in hand, Rust's data modelling starts here: structs bundle data, `impl` blocks attach behavior, and the receiver type of every method is an ownership decision you already know how to read.

## Structs are just the fields

```rust
struct Subscriber {
    email: String,
    name: String,
    confirmed: bool,
}

let sub = Subscriber {
    email: String::from("user@example.com"),
    name: String::from("Ada"),
    confirmed: false,
};
```

A struct's memory is its fields laid out together, no header, no vtable, no hidden allocation. `Subscriber` is two 24-byte String headers plus a bool, and the compiler may reorder fields to pack them tighter (which is why you never assume field order matches memory order without asking, `#[repr(C)]` exists for when layout is a contract).

Field init shorthand and update syntax carry most construction:

```rust
fn new_subscriber(email: String, name: String) -> Subscriber {
    Subscriber { email, name, confirmed: false }
}

let confirmed = Subscriber { confirmed: true, ..sub };  // moves the Strings out of sub
```

That `..sub` is a _move_ of the remaining fields, the ownership rules do not pause for syntax sugar: `sub` is unusable afterward unless every moved field was `Copy`.

## impl blocks and the three receivers

```rust
impl Subscriber {
    fn domain(&self) -> &str {
        self.email.split('@').next_back().unwrap_or("")
    }

    fn confirm(&mut self) {
        self.confirmed = true;
    }

    fn into_email(self) -> String {
        self.email
    }
}
```

The receiver is the signature-as-contract idea from the ownership section, applied to methods:

- `&self`: reads. Call it on anything you can reach.
- `&mut self`: mutates in place. Requires exclusive access; all the borrow rules apply.
- `self`: consumes. The value is gone after the call; `into_email` gives the email away and takes the whole `Subscriber` with it. The `into_` prefix is the ecosystem's naming convention for exactly this.

Associated functions with no receiver, `Subscriber::new(...)`, are Rust's constructors by convention; `new` is a name, not a keyword.

## Derives: behavior for free

```rust
#[derive(Debug, Clone, PartialEq)]
struct Subscriber { /* ... */ }
```

`Debug` unlocks `{:?}` printing (and honest test failure messages), `Clone` opts into explicit deep copies, `PartialEq` gives `==` field-by-field. You met `Copy`'s rules already; the compiler enforces every derive structurally, so a struct with a `String` can be `Clone` but never `Copy`. Deriving `Debug` on nearly everything is normal Rust hygiene; the book's chapter 6 leans on these derives for its type-driven domain modelling.

## Predict, then verify

```rust
let sub = new_subscriber("a@b.com".into(), "Ada".into());
let email = sub.into_email();
println!("{}", sub.name);
```

What does the compiler say, and which earlier lesson predicted it?

Answer: `borrow of moved value: sub`, pointing at `into_email` as the move site, because a `self` receiver consumes the struct exactly like any by-value function parameter. This is the functions-take-ownership lesson resurfacing as method syntax. If you only needed the email text, a `fn email(&self) -> &str` borrow would have left `sub` alive; choosing receivers _is_ choosing your API's ownership story.
