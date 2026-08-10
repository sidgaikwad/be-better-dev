//! Reference solutions. Read these after you have something passing.
//!
//! Every `unsafe` block below carries the `// SAFETY:` comment that is its
//! actual proof, in the form the standard library uses and clippy's
//! `undocumented_unsafe_blocks` lint enforces. The comment is the deliverable.
//! A block whose proof you cannot write down is a block you have not finished,
//! however green the suite is.

/// Reads without a bounds check.
///
/// The body passes the obligation straight through: `get_unchecked` requires
/// `i < v.len()` and this function's contract demands the same thing of its
/// caller. The explicit block inside is required in the 2024 edition, where an
/// `unsafe fn` signature no longer blesses its whole body, so the dangerous
/// line is marked at its exact site instead of wholesale.
///
/// # Safety
///
/// `i` must be less than `v.len()`.
pub unsafe fn nth(v: &[i32], i: usize) -> i32 {
    // SAFETY: the caller promised i < v.len(), which is exactly and only what
    // get_unchecked asks for.
    unsafe { *v.get_unchecked(i) }
}

/// No `unsafe` at all, which is the answer to the exercise. The rejected
/// version does not need a better block, it needs one borrow at a time: the
/// keyword unlocks five operations, and aliasing XOR mutation is not on the
/// list. Sequencing the pushes gives each one an exclusive borrow that ends
/// before the next begins, so the compiler proves what the block could not.
pub fn append_two(v: &mut Vec<i32>, a: i32, b: i32) -> usize {
    v.push(a);
    v.push(b);
    v.len()
}

/// A comparison, not a reinterpretation. Every one of the 256 inputs has a
/// defined answer here, where `transmute` would produce a `bool` outside its
/// two valid bit patterns for 254 of them and hand the optimizer a false
/// premise to build on.
pub fn byte_to_bool(b: u8) -> bool {
    b != 0
}

/// Check first, read second. The order is the whole exercise: a dereference
/// asserts that its pointer is valid, so a null test placed after one is
/// provably false and may be deleted, taking the guard with it.
///
/// # Safety
///
/// `p` must be either null, or a pointer to a live, initialized, aligned `i32`
/// that nothing writes to for the duration of the call.
pub unsafe fn read_or_zero(p: *const i32) -> i32 {
    if p.is_null() {
        return 0;
    }
    // SAFETY: the branch above rules out null, and the caller's contract covers
    // the rest of the dereference conditions: live, initialized, aligned, and
    // not being written to while this read happens.
    unsafe { *p }
}

/// Two pointers, one block, no memory touched. `as_ptr` needs nothing: making
/// an address is safe even when the address is garbage. `add` needs the block
/// because its contract is what is being promised, and the promise here is
/// discharged by construction, since an offset of exactly `len` is the
/// one-past-the-end position the contract explicitly permits.
pub fn bounds(v: &[i32]) -> (*const i32, *const i32) {
    let start = v.as_ptr();
    // SAFETY: v.len() is the largest offset add allows for this allocation, and
    // landing one past the end is legal precisely because nothing reads it.
    // An empty slice makes end == start, which is also fine: an offset of zero
    // is defined for any pointer.
    let end = unsafe { start.add(v.len()) };
    (start, end)
}

/// The safe half of the pair. The bounds check is not defensive programming, it
/// is the proof that `nth`'s precondition holds, discharged once here so that
/// every caller in the program gets it for free. Returning `None` on the other
/// branch is what makes the API sound for `usize::MAX` and every other input a
/// hostile safe caller might pass.
pub fn get(v: &[i32], i: usize) -> Option<i32> {
    if i >= v.len() {
        return None;
    }
    // SAFETY: i < v.len() on this branch, which is nth's entire contract.
    Some(unsafe { nth(v, i) })
}

/// The canonical sound abstraction. Note the order: the assertion runs before
/// the block, because it is the premise the block's argument rests on. Reversed
/// or deleted, this function becomes unsound without looking any different.
pub fn split_at_mut(v: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = v.len();
    let ptr = v.as_mut_ptr();
    assert!(mid <= len, "cannot split a slice of length {len} at {mid}");
    // SAFETY: mid <= len, so the two ranges are [0, mid) and [mid, len). They
    // are disjoint, so every location still has exactly one writer and aliasing
    // XOR mutation holds. Both live inside one allocation whose elements are
    // all initialized, ptr.add(mid) is at worst one past the end, and len - mid
    // cannot underflow. The elided lifetimes tie both halves to `v`, so the
    // borrow checker takes over from here and neither half can outlive it.
    unsafe {
        (
            std::slice::from_raw_parts_mut(ptr, mid),
            std::slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}

/// A pointer walk of the kind Miri exists to check. The loop condition is what
/// keeps it sound on an empty slice: `end` is computed but the body never runs,
/// so the dangling-but-aligned pointer an empty slice carries is never read.
pub fn sum_via_raw(v: &[i32]) -> i32 {
    let mut total = 0;
    let mut p = v.as_ptr();
    // SAFETY: end is one past the last element, the largest offset add permits,
    // and the loop stops on it rather than reading it. Inside the body p is
    // strictly before end, so it points at an initialized, aligned i32 inside a
    // single live allocation, kept alive and unwritten for the whole walk by
    // the shared borrow of v. The final add(1) lands exactly on end.
    unsafe {
        let end = p.add(v.len());
        while p != end {
            total += *p;
            p = p.add(1);
        }
    }
    total
}

/// `#[repr(C)]` is the entire exercise. It replaces Rust's unspecified layout,
/// which reorders fields by alignment and would pack this into 8 bytes, with
/// C's rule: declaration order, each field at the next offset its alignment
/// allows, and tail padding out to the struct's own alignment. That gives
/// 0, 4, 8 and a size of 12, which is what the C compiler on the other side
/// computes from the same declaration.
#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(C)]
pub struct Header {
    pub tag: u8,
    pub len: u32,
    pub flag: u8,
}

/// An ordinary Rust body behind a C calling convention. The `extern "C"` is
/// invisible from inside: it decides how the argument arrives and how the
/// result leaves, which is the only thing the two sides have to agree on
/// besides the layout of `Header`. The body carries one extra obligation: it
/// must not panic, since unwinding cannot cross the boundary and a panic here
/// aborts the process instead of propagating.
pub extern "C" fn payload_len(h: Header) -> u32 {
    if h.flag == 0 { h.len } else { h.len * 2 }
}

/// Calling a function pointer is just calling it. The ABI rode in on the type,
/// which is why `extern "C" fn(Header) -> u32` cannot be swapped for a plain
/// `fn(Header) -> u32` by accident: mixing the two up is a compile error here,
/// rather than the silent register mismatch a hand-written declaration with the
/// wrong signature produces.
pub fn call_via_abi(f: extern "C" fn(Header) -> u32, h: Header) -> u32 {
    f(h)
}

/// One pointer's worth, with no tag byte, because a function pointer is never
/// null and `None` can take that pattern for itself. The guarantee is what
/// makes the type usable at an ABI boundary: it is layout-compatible with the
/// nullable function pointer C is passing.
pub fn nullable_callback_size() -> usize {
    std::mem::size_of::<Option<extern "C" fn(Header) -> u32>>()
}
