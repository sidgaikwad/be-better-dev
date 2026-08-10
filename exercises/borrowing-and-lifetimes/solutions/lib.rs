//! Reference solutions. Read these after you have something passing.

/// &str rather than &String: a String coerces to it, literals already are it,
/// and so are sub-slices. Same cost, strictly more callers.
pub fn text_len(text: &str) -> usize {
    text.len()
}

/// &mut String, because the caller keeps the value and wants it changed.
pub fn confirm_in_place(name: &mut String) {
    name.push_str(" (confirmed)");
}

/// `target` is borrowed exclusively and `extra` shared, and they are separate
/// parameters, so no aliasing rule is in play inside this function. The rule
/// bites at the call site: `append_all(&mut v, &v)` is rejected, which is why
/// the test clones first when appending a vector to itself.
pub fn append_all(target: &mut Vec<i32>, extra: &[i32]) {
    target.extend_from_slice(extra);
}

/// The fix is ordering, not cloning. `v.first()` borrows v; copying the value
/// out with `.copied()` ends that borrow immediately, so `clear()` is free to
/// take its exclusive borrow on the next line. Holding the reference across
/// the clear is what the checker rejects.
pub fn first_then_clear(v: &mut Vec<i32>) -> Option<i32> {
    let first = v.first().copied();
    v.clear();
    first
}

/// Returning String instead of &String. The move carries the buffer out to the
/// caller, so there is nothing to dangle and no lifetime to name.
pub fn build_greeting() -> String {
    String::from("hello")
}

/// Both inputs share one region 'a and the output lives in it. At each call
/// site the compiler picks 'a as the overlap of the two arguments, then holds
/// the caller to it.
pub fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() >= b.len() { a } else { b }
}

/// Only `a` carries 'a. `b` gets its own anonymous lifetime, so the result
/// stays valid even after `b` dies. Promising less buys the caller more.
pub fn first_of<'a>(a: &'a str, _b: &str) -> &'a str {
    a
}

pub struct Parser<'a> {
    pub input: &'a str,
    pub position: usize,
}

impl<'a> Parser<'a> {
    pub fn new(input: &'a str) -> Self {
        Self { input, position: 0 }
    }

    /// Returns &'a str rather than &str tied to &self: the slice borrows the
    /// original input, not the parser, so it outlives any particular borrow of
    /// the parser. That is what makes next_word usable in a loop.
    pub fn remaining(&self) -> &'a str {
        &self.input[self.position..]
    }

    pub fn next_word(&mut self) -> Option<&'a str> {
        let rest = self.remaining();
        if rest.is_empty() {
            return None;
        }
        match rest.find(' ') {
            Some(i) => {
                self.position += i + 1;
                Some(&rest[..i])
            }
            None => {
                self.position = self.input.len();
                Some(rest)
            }
        }
    }
}

/// Elision rule 2 fills in the lifetimes: one input reference, so the output
/// borrows from it. No annotation needed, and the caller cannot outlive the
/// text the slice points into.
pub fn first_word(text: &str) -> &str {
    match text.find(' ') {
        Some(i) => &text[..i],
        None => text,
    }
}

/// `get` returns Option instead of panicking the way `&values[start..end]`
/// would. It also rejects a backwards range, so both bad cases fall out of one
/// call rather than needing a hand-written bounds check.
pub fn window_sum(values: &[i32], start: usize, end: usize) -> Option<i32> {
    values.get(start..end).map(|w| w.iter().sum())
}
