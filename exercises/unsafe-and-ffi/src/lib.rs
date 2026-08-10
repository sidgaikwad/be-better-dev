//! Unsafe Rust and FFI.
//!
//! Eight exercises across the section's six lessons. Run `cargo test -p
//! unsafe-and-ffi` to see what is red, then delete each `todo!()`, plus the one
//! deliberate wrong answer in [`payload_len`], and make the suite pass.
//!
//! One rule outranks the suite here. An exercise is not finished when it is
//! green, it is finished when you can write the `// SAFETY:` comment that says
//! why the block cannot be wrong for every input, not just the ones the test
//! passes in. Tests cannot argue soundness; that is your job in this section,
//! and it is why every block in `solutions/lib.rs` carries its proof in a
//! comment. Write yours before you read them.

/// Lesson: unsafe-superpowers
///
/// Read element `i` of `v` with no bounds check.
///
/// This is the lesson's own example, and the signature is the exercise: an
/// `unsafe fn` is a function whose preconditions the type system cannot state,
/// so they live under a `# Safety` heading and meeting them becomes the
/// caller's job. Since the 2024 edition the body of an `unsafe fn` is not
/// itself an unsafe block, so the one dangerous operation still has to be
/// marked at its exact site.
///
/// The unchecked read you want is `slice::get_unchecked`, which is `unsafe` for
/// precisely the reason this function is.
///
/// # Safety
///
/// `i` must be less than `v.len()`. Nothing in the body checks it, which is the
/// whole difference between this function and [`get`].
pub unsafe fn nth(_v: &[i32], _i: usize) -> i32 {
    todo!("one unchecked read, marked at its exact site")
}

/// Lesson: unsafe-superpowers
///
/// Push `a` and then `b` onto `v`, and return the new length.
///
/// The first attempt, written as though the keyword suspended the rules, does
/// not build. The compiler even points out that the block bought nothing:
///
/// ```text
/// warning: unnecessary `unsafe` block
///
/// error[E0499]: cannot borrow `*v` as mutable more than once at a time
///   |
/// 3 |         let first = &mut *v;
///   |                     ------- first mutable borrow occurs here
/// 4 |         let second = &mut *v;
///   |                      ^^^^^^^ second mutable borrow occurs here
/// 5 |         first.push(a);
///   |         ----- first borrow later used here
/// ```
///
/// COMPILE ERROR: paste this into the body to watch the block fail to save it.
///
/// ```ignore
/// unsafe {
///     let first = &mut *v;
///     let second = &mut *v;
///     first.push(a);
///     second.push(b);
/// }
/// ```
///
/// Then write the version that compiles. The block unlocks five operations, and
/// "two live `&mut` to one value" is not one of them: aliasing XOR mutation is
/// a rule about memory, not a check the keyword switches off.
pub fn append_two(_v: &mut Vec<i32>, _a: i32, _b: i32) -> usize {
    todo!("no keyword makes two exclusive borrows legal at once")
}

/// Lesson: unsafe-undefined-behavior
///
/// Turn a byte into a bool: zero is false, every other byte is true.
///
/// `std::mem::transmute::<u8, bool>(b)` is shorter and is undefined behavior
/// for 254 of the 256 inputs. `bool` has exactly two valid bit patterns, so a
/// transmuted 2 is not a wrong value, it is no value at all, and a compiler may
/// lower a branch on it into a jump table indexed past its own end.
///
/// Write the version with no `unsafe` in it. This one is a judgment exercise:
/// the answer worth keeping is that transmute is for the cases where no cast,
/// comparison, or `From` impl expresses the conversion, which is almost never.
pub fn byte_to_bool(_b: u8) -> bool {
    todo!("a comparison, not a reinterpretation of the bits")
}

/// Lesson: unsafe-undefined-behavior
///
/// Return the `i32` that `p` points at, or 0 when `p` is null.
///
/// The lesson's broken version reads first and checks second:
///
/// ```ignore
/// let v = unsafe { *p };
/// if p.is_null() {
///     return 0;
/// }
/// v
/// ```
///
/// The dereference asserts that `p` is valid, so the optimizer may prove
/// `is_null()` false and delete the branch. The guard is not weakened, it is
/// gone, and the C equivalent of this shape has produced real kernel
/// vulnerabilities. Order the two operations so the check actually guards the
/// read.
///
/// # Safety
///
/// `p` must be either null, or a pointer to a live, initialized, aligned `i32`
/// that nothing writes to for the duration of the call.
pub unsafe fn read_or_zero(_p: *const i32) -> i32 {
    todo!("a guard only guards what comes after it")
}

/// Lesson: unsafe-raw-pointers
///
/// Return `(start, end)` for `v`: a raw pointer to the first element, and the
/// one-past-the-end pointer that a slice iterator carries as its finish line.
///
/// Most of this needs no block at all. Creating a raw pointer touches no
/// memory, so it is safe even when the address is nonsense: `0xdead_beef as
/// *const i32` compiles without a keyword in sight. The line is drawn at the
/// dereference, and the test does that part.
///
/// The one operation that does need a block is `add`, whose contract is the
/// thing you are promising: the result must stay inside the allocation or land
/// exactly one element past its end, which `v.len()` does by construction.
/// Do not dereference `end`. That address is legal to hold, compare and print,
/// and never legal to read.
pub fn bounds(_v: &[i32]) -> (*const i32, *const i32) {
    todo!("creation is free; only the arithmetic needs the block")
}

/// Lesson: unsafe-sound-abstractions
///
/// The safe wrapper over [`nth`]: `Some(v[i])` when `i` is in bounds, `None`
/// when it is not.
///
/// The exercise is discharging `nth`'s `# Safety` contract once, here, so that
/// no caller ever has to. Check first, and call `nth` only on the branch where
/// the check has already proved the precondition.
///
/// An API is sound when no possible safe caller, however adversarial, can reach
/// undefined behavior through it. `usize::MAX` is a legal argument to a safe
/// function, so it has to come back `None` rather than a read.
pub fn get(_v: &[i32], _i: usize) -> Option<i32> {
    todo!("check, then call; the check is the proof")
}

/// Lesson: unsafe-sound-abstractions
///
/// Split `v` into `[..mid]` and `[mid..]`, two `&mut [i32]` alive at once.
///
/// Safe Rust cannot express this. `(&mut v[..mid], &mut v[mid..])` is rejected
/// with error[E0499], because the borrow checker reasons about variables rather
/// than index ranges and sees two `&mut` taken from one place. The ranges are
/// disjoint and the compiler cannot prove it, which is exactly the situation
/// the keyword exists for.
///
/// Build both halves from one `v.as_mut_ptr()` with
/// `std::slice::from_raw_parts_mut`, and panic when `mid > v.len()`. That
/// assertion is the first premise of the proof, not a courtesy: without it a
/// safe caller passing `len + 10` fabricates a slice running off the end of the
/// allocation, which is UB the moment it is created, before any element is
/// touched.
///
/// Note what the signature buys. Callers get two ordinary `&mut` halves, the
/// borrow checker governs them from there, and no caller can tell there is
/// `unsafe` inside.
pub fn split_at_mut(_v: &mut [i32], _mid: usize) -> (&mut [i32], &mut [i32]) {
    todo!("one pointer, two disjoint ranges, one assertion holding them up")
}

/// Lesson: unsafe-miri
///
/// Sum `v` by walking a raw pointer from the first element to the
/// one-past-the-end finish line, which is close to what a slice iterator
/// compiles to.
///
/// This is code Miri can audit and code that deserves it: `cargo +nightly miri
/// test` checks every read against the allocation it claims to be inside and
/// every pointer against the aliasing rules, deterministically, where
/// `cargo test` would pass a stale pointer most days.
///
/// Miri only checks the code your tests execute, so `tests/unsafe_miri.rs` runs
/// this on an empty slice too. Write the loop so that case dereferences
/// nothing: an empty slice's pointer is non-null and aligned and points at no
/// element at all.
pub fn sum_via_raw(_v: &[i32]) -> i32 {
    todo!("walk to the finish line, and stop before you read it")
}

/// Lesson: unsafe-ffi
///
/// A record C hands you: a one-byte tag, a four-byte length, a one-byte flag,
/// in that order.
///
/// As shipped this struct has Rust's default layout, which is unspecified. The
/// compiler currently sorts the `u32` to the front and packs the two bytes
/// behind it, fitting the whole thing in 8 bytes with `tag` at offset 4. C
/// would never lay it out that way, and two sides disagreeing about offsets is
/// a wrong answer with no error message attached, at either compile time or
/// link time.
///
/// Add the one attribute that opts into C's declaration-order layout. The test
/// asserts the exact offsets, padding included. Until you do, the compiler also
/// warns that [`payload_len`] below is an `extern "C"` function taking a type
/// with no defined layout.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Header {
    pub tag: u8,
    pub len: u32,
    pub flag: u8,
}

/// Lesson: unsafe-ffi
///
/// Return `h.len`, doubled when `h.flag` is nonzero and unchanged when it is
/// zero.
///
/// `extern "C"` on a definition changes the calling convention and nothing
/// else: which registers and stack slots carry the argument, and who cleans up
/// after. Rust's own ABI is deliberately unstable, so C's is the fixed meeting
/// point every OS and language speaks, and a function written this way is one C
/// could call directly with no bridge and no conversion layer.
///
/// Calling it from Rust needs no block. It is *declaring* a foreign function
/// that is unsafe, because nothing on either side checks that the declaration
/// matches the code the linker finds.
///
/// One more boundary rule shows up in the stub below: a panic cannot unwind out
/// of an `extern "C"` function, because C frames have no idea how to run Rust
/// destructors. Rust aborts the process instead.
pub extern "C" fn payload_len(_h: Header) -> u32 {
    // Deliberately a wrong answer rather than a `todo!()`. A panic here would
    // hit the rule above and abort the whole test binary with a backtrace,
    // taking the other three exercises in `tests/unsafe_ffi.rs` down with it.
    // Replace the 0.
    0
}

/// Lesson: unsafe-ffi
///
/// Call `f` with `h` and return what comes back.
///
/// The parameter type is the point. A function pointer carries its ABI in its
/// type, so `extern "C" fn(Header) -> u32` and `fn(Header) -> u32` are
/// different types that cannot be confused for one another. This is the shape
/// of a callback in both directions: how you hand a Rust function to C, and how
/// C hands one to you.
pub fn call_via_abi(_f: extern "C" fn(Header) -> u32, _h: Header) -> u32 {
    todo!("call it; the convention is already in the type")
}

/// Lesson: unsafe-ffi
///
/// Return the size in bytes of `Option<extern "C" fn(Header) -> u32>`.
///
/// C's nullable callback is a pointer that may be NULL, and Rust models it with
/// no tag byte at all: a function pointer is never null, so `None` takes the
/// null pattern. It is the same niche trick that makes `Option<&T>` pointer
/// sized, and here it is a documented guarantee rather than an optimization,
/// which is what makes `Option<extern "C" fn(..)>` the blessed way to receive a
/// callback C may not supply.
pub fn nullable_callback_size() -> usize {
    todo!("no tag is needed when a valid value can never be null")
}
