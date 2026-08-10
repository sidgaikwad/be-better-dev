//! Reference solutions. Read these after you have something passing.
//!
//! Where a solution had a choice to make, the comment says which way it went
//! and why, since that judgment is the part worth copying.

/// `move` forces every capture in by value, so the closure owns the `String`
/// and no longer points at a caller's local. It still only reads that capture,
/// which is why the return type can promise `Fn` rather than `FnOnce`: owning
/// your state and promising shared-access calls is the standard shape for a
/// closure that outlives its birth scope.
pub fn make_greeter(name: String) -> impl Fn() -> String {
    move || format!("hello, {name}")
}

/// Two closures over the same two variables, differing only in how the captures
/// get in.
pub fn capture_sizes() -> (usize, usize) {
    let id = 42u64;
    let name = String::from("newsletter");

    // The body only reads both, so the compiler picks the least demanding mode
    // it can: a shared borrow of each. The struct is two pointers.
    let by_ref = || format!("{id}: {name}");
    let by_ref_size = std::mem::size_of_val(&by_ref);

    // `move` stores the values themselves: 8 bytes of u64 beside the String's
    // three-word header. The heap text behind `name` never moves either way,
    // only the header does. Measuring after the last use of `by_ref` matters,
    // since that borrow has to end before `name` can move.
    let by_val = move || format!("{id}: {name}");
    let by_val_size = std::mem::size_of_val(&by_val);

    (by_ref_size, by_val_size)
}

/// `FnMut` is the least this can demand: the loop calls `op` repeatedly, which
/// rules out `FnOnce`, but `Fn` would also reject every closure that keeps a
/// tally. `mut op` is the other half, because calling an `FnMut` is a
/// `&mut self` call on the closure's hidden struct. Widening the bound costs
/// nothing: every `Fn` closure, and every plain `fn`, satisfies `FnMut` too.
pub fn retry<F: FnMut() -> bool>(attempts: u32, mut op: F) -> bool {
    for _ in 0..attempts {
        if op() {
            return true;
        }
    }
    false
}

/// The suffix is built once here rather than inside the closure, so calling the
/// matcher a million times allocates nothing. `move` hands the closure the only
/// copy; the body just reads it, so this is `Fn` and stays callable forever.
pub fn domain_matcher(domain: String) -> Box<dyn Fn(&str) -> bool> {
    let suffix = format!("@{domain}");
    Box::new(move |email| email.ends_with(&suffix))
}

pub struct Fibonacci {
    pub current: u64,
    pub upcoming: u64,
}

impl Fibonacci {
    pub fn new() -> Self {
        Self { current: 0, upcoming: 1 }
    }
}

/// One associated type and one method is the entire obligation. `next` takes
/// `&mut self` because an iterator is a cursor: each call hands back the current
/// value and advances the two words of state. It never returns `None`, and that
/// is deliberate. The sequence cannot know how much of itself the caller wants,
/// so bounding it belongs to `take`.
impl Iterator for Fibonacci {
    type Item = u64;

    fn next(&mut self) -> Option<u64> {
        let value = self.current;
        self.current = self.upcoming;
        self.upcoming = value + self.upcoming;
        Some(value)
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Subscriber {
    pub email: String,
    pub confirmed: bool,
}

impl Subscriber {
    pub fn new(email: &str, confirmed: bool) -> Self {
        Self { email: email.to_string(), confirmed }
    }
}

/// `enumerate` comes first so the indices count the input; moving it below
/// `filter` would silently renumber the survivors 0, 1, 2 and the test would
/// catch it. `filter_map` then does the drop-and-transform in one pass, since
/// `split('@').nth(1)` already answers with an `Option`. Nothing runs until
/// `collect`, and `take(2)` means the subscribers past the second hit are never
/// looked at.
pub fn confirmed_domains(subs: &[Subscriber], limit: usize) -> Vec<(usize, &str)> {
    subs.iter()
        .enumerate()
        .filter(|(_, s)| s.confirmed)
        .filter_map(|(i, s)| s.email.split('@').nth(1).map(|domain| (i, domain)))
        .take(limit)
        .collect()
}

/// `Result` implements `FromIterator` with short-circuit semantics, so an
/// iterator of `Result<String, String>` collects into one
/// `Result<Vec<String>, String>`: the first `Err` ends the iteration and becomes
/// the whole answer. It is the spirit of `?`, applied across a batch, and it is
/// why the annotation on the return type is doing real work here.
///
/// `.copied()` turns the `&&str` that `iter()` yields into a plain `&str`, which
/// keeps the closure readable.
pub fn parse_emails(lines: &[&str]) -> Result<Vec<String>, String> {
    lines
        .iter()
        .copied()
        .map(|line| match line.split_once('@') {
            Some((user, domain))
                if !user.is_empty() && !domain.is_empty() && !domain.contains('@') =>
            {
                Ok(line.to_string())
            }
            _ => Err(format!("invalid email: {line}")),
        })
        .collect()
}

/// The counter has to outlive the chain, so it is declared outside it and the
/// closure captures `&mut tested`. That borrow runs from the closure's
/// definition to the end of the statement that consumes the chain, which is why
/// reading `tested` on the next line is allowed.
///
/// `sum` is what pulls. Each request travels down to the range and one number
/// bubbles back up, so `filter` sees exactly as many numbers as `take` asks for
/// and not one more.
pub fn tested_while_summing(limit: u32) -> (u32, u32) {
    let mut tested = 0;
    let sum: u32 = (1..=limit)
        .filter(|n| {
            tested += 1;
            n % 2 == 0
        })
        .take(2)
        .sum();
    (sum, tested)
}

/// `iter_mut` yields `&mut Subscriber`, the exclusive borrow that lets the body
/// write through it. Taking `&mut [Subscriber]` rather than `&mut Vec<..>` also
/// lets a caller confirm a sub-slice, the same widening that favours `&[T]` over
/// `&Vec<T>`.
pub fn confirm_all(subs: &mut [Subscriber], confirmed: &[&str]) {
    for sub in subs.iter_mut() {
        if confirmed.contains(&sub.email.as_str()) {
            sub.confirmed = true;
        }
    }
}

/// `iter` yields `&Subscriber`, so the `String` cannot be moved out and the
/// clone is forced by the signature rather than chosen: the output owns its
/// data and the input was only borrowed. One allocation per element, and the
/// caller's vector survives the call whole.
pub fn cloned_emails(subs: &[Subscriber]) -> Vec<String> {
    subs.iter().map(|s| s.email.clone()).collect()
}

/// `into_iter` hands the closure a whole `Subscriber`, so moving its `email`
/// field out is legal: the value being gutted is one nobody else can name
/// afterward. Each 24-byte header moves into the new vector and the heap text
/// is never touched, so this costs nothing per element while `cloned_emails`
/// costs an allocation. The `confirmed` flag is dropped along with the rest of
/// each subscriber as the loop walks past it.
pub fn into_emails(subs: Vec<Subscriber>) -> Vec<String> {
    subs.into_iter().map(|s| s.email).collect()
}

/// The index loop, for comparison. `values[i]` is a checked index: at
/// `opt-level=3` the optimizer proves `i < values.len()` and deletes the check,
/// but it only manages that because the range and the slice are so obviously the
/// same length. Index with anything less obvious and the checks survive.
pub fn sum_index(values: &[u64]) -> u64 {
    let mut total = 0;
    for i in 0..values.len() {
        total += values[i];
    }
    total
}

/// Three structs at compile time (`Sum` over the slice iterator over the slice)
/// and none at runtime: `next` is small enough to inline, monomorphization hands
/// LLVM every layer in one piece, and what is left is the same loop as above
/// without the bounds check to remove.
pub fn sum_iter(values: &[u64]) -> u64 {
    values.iter().sum()
}
