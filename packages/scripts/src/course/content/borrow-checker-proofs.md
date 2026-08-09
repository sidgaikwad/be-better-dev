The borrow checker is not a style critic. It is a prover with a narrow job: show that every reference is valid every time it is used. Knowing exactly what it proves, and what it cannot see, turns fighting it into negotiating with it.

## Borrows end at last use, not at scope end

Early Rust ended every borrow at the closing brace, which rejected reams of obviously fine code. Since 2018, borrows are _non-lexical_: they end at the last place they are used.

```rust
let mut s = String::from("hello");
let r = &s;
println!("{r}");        // r's last use: borrow ends here
s.push_str(" world");   // fine, no live borrows remain
println!("{s}");
```

Move the `println!("{r}")` below the `push_str` and the same program is rejected. When the checker surprises you, the first question is always: _where is the last use of each borrow?_ The error message draws exactly this map, one span per borrow, and is worth reading slowly.

## The checker reasons per function, from signatures

Inside a function body, the checker sees everything. Across function calls, it deliberately sees _only the signature_. A call like `helper(&mut self.items)` is judged by what `helper` declares, not by what its body actually touches.

This is a feature: your code cannot break when a dependency's internals change. But it explains the checker's best-known false positive:

```rust
struct Inventory {
    items: Vec<Item>,
    log: Vec<String>,
}

impl Inventory {
    fn add_log(&mut self, line: String) { self.log.push(line) }
}

let first = &inv.items[0];
inv.add_log("checked".into());   // error: inv is already borrowed
println!("{:?}", first);
```

`add_log` only touches `log`, never `items`. But its signature says `&mut self`, all of self, so the checker must assume the worst.

## Restructures that satisfy the proof

Every seasoned Rust developer carries a small toolkit for these moments:

- **Borrow fields, not the struct.** Within one function body the checker _does_ track fields separately: `let first = &inv.items[0]; inv.log.push(...)` is fine. Split borrows work; method calls hide them.
- **Narrow the method.** Change `add_log(&mut self)` to a free function or a method on a smaller struct (`self.log.add(...)` where `log` has its own type). This is API design guided by the checker, and it usually improves the design.
- **Reorder.** Finish reading before you start writing. Most conflicts are ordering accidents.
- **Copy the small thing out.** `let id = inv.items[0].id;` ends the borrow immediately. Cloning a tiny value to end a borrow is not a defeat.

## Predict, then verify

```rust
let mut v = vec![1, 2, 3];
let last = v.last();      // Option<&i32>, borrows v
if let Some(x) = last {
    println!("{x}");
}
v.clear();
```

Compiles or not?

Answer: compiles. `last`'s final use is inside the `if let`; the borrow ends there, and `v.clear()` runs unencumbered. Hoist the `v.clear()` above the `if let` and it is rejected. The checker's judgment moved with the last use, which is exactly the model to internalise.
