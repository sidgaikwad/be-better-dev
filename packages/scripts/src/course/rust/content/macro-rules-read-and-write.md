The match-exhaustive lesson called `match` a proof obligation over the shapes of a value. `macro_rules!` reuses the idea one level up: a list of arms, each matching the _tokens_ of a call and rewriting them.

```rust
macro_rules! name {
    ( matcher ) => { transcriber };
    ( matcher ) => { transcriber };
}
```

Arms are tried top to bottom and the first matcher that fits wins. Unlike `match`, there is no exhaustiveness proof: a call that no arm matches is simply a compile error at the call site.

## Building one worth having

Confirmation emails need template values. The plain version works, but every call site repeats the same dance:

```rust
let mut map = HashMap::new();
map.insert("name", subscriber.name.as_str());
map.insert("confirm_link", link.as_str());
```

The call site we want:

```rust
let ctx = context! {
    "name" => subscriber.name.as_str(),
    "confirm_link" => link.as_str(),
};
```

Step one, a single pair:

```rust
macro_rules! context {
    ( $key:expr => $value:expr ) => {{
        let mut map = ::std::collections::HashMap::new();
        map.insert($key, $value);
        map
    }};
}
```

`$key:expr` declares a metavariable: match one expression here, name it `$key`. The `expr` part is a _fragment specifier_; others include `ident` (a name), `ty` (a type), `literal`, and `tt` (a single token tree, the wildcard). Two habits in the transcriber are deliberate. The full `::std::collections::HashMap` path keeps the expansion working even where the caller never imported `HashMap`. And the doubled braces matter: the outer pair delimits the transcriber, the inner pair emits a block, so the statements plus the trailing `map` become one expression that can sit on the right of a `let`.

Step two, repetition. `$( ... ),+` matches its contents one or more times, comma-separated:

```rust
macro_rules! context {
    ( $( $key:expr => $value:expr ),+ $(,)? ) => {{
        let mut map = ::std::collections::HashMap::new();
        $( map.insert($key, $value); )+
        map
    }};
}
```

In the matcher, the repetition captures every `key => value` pair; this arm subsumes the single-pair one, so the finished macro needs only it. In the transcriber, `$( ... )+` replays its body once per capture, in order: three pairs in, three `insert` calls out. `*` means zero or more, `?` means at most one, and the trailing `$(,)?` is the standard idiom for tolerating an optional final comma, which formatters like to add.

That is the whole macro, and it is real: the `maplit` crate has shipped this exact shape for years.

## Hygiene: your `map` is safe

The transcriber introduces a binding named `map`. What if the caller already has one?

```rust
let map = load_subscriber_map();
let ctx = context! { "name" => "Ada" };   // compiles; both maps intact
```

No collision. `macro_rules!` is hygienic: local bindings created by an expansion live in their own naming universe. The macro's `map` is invisible to your code, your `map` is invisible to the macro, and the macro could not read or shadow your locals if it tried; to touch a caller's binding, the caller must pass the name in as an `ident`. Hygiene covers `let` bindings and loop labels; items and types a macro defines are deliberately not hidden.

## What substitution substitutes

`$key:expr` does not capture text. At the call site, the compiler runs its real expression parser at that position, the capture is the parsed result, and substitution inserts it into the transcriber as one sealed unit, as if parenthesized. Together with hygiene, this is the line between `macro_rules!` and C's `#define`: one rewrites structure, the other rewrites characters.

## Predict, then verify

```rust
macro_rules! square {
    ($x:expr) => { $x * $x };
}

fn main() {
    println!("{}", square!(1 + 2));
}
```

A C programmer flinches here: `#define SQUARE(x) x * x` famously turns `SQUARE(1 + 2)` into `1 + 2 * 1 + 2`, which is 5. What does Rust print?

Answer: 9. `$x` captured `1 + 2` as one parsed expression, so the expansion multiplies the whole sum by itself; operator precedence cannot reach inside a substituted fragment. The entire C bug class, and the parenthesize-everything ritual that guards against it, does not exist in `macro_rules!`.
