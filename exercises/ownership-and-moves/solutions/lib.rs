//! Reference solutions. Read these after you have something passing.
//!
//! Where a solution had a choice to make, the comment says which way it went
//! and why, since that judgment is the part worth copying.

/// Three machine words on a 64-bit target: pointer, length, capacity. The text
/// itself is elsewhere, on the heap.
pub fn string_stack_size() -> usize {
    std::mem::size_of::<String>()
}

/// A literal's bytes are baked into the executable's static data. Binding one
/// produces a &str, a pointer and a length, and never calls the allocator.
pub fn literal_allocates(_text: &'static str) -> bool {
    false
}

/// with_capacity performs the single allocation up front, so no push triggers
/// a grow-and-copy. `collect` on a sized range would also do the right thing
/// here (ExactSizeIterator lets it reserve exactly), but doing it by hand is
/// what makes the capacity assertion meaningful.
pub fn preallocated_range(n: usize) -> Vec<i32> {
    let mut v = Vec::with_capacity(n);
    for i in 0..n {
        v.push(i as i32);
    }
    v
}

/// Taking String by value moves the caller's buffer in. Pushing onto it reuses
/// that buffer when capacity allows, so this is usually zero new allocations.
pub fn shout(mut s: String) -> String {
    s.push('!');
    s
}

/// Two f64 fields and no pointer, so bitwise duplication is honest and Copy is
/// allowed. Copy requires Clone, which is why both derives are here.
#[derive(Debug, PartialEq, Clone, Copy)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

/// Taking &[Point] borrows the caller's vector for the duration of the call.
/// It also accepts arrays and sub-slices, which &Vec<Point> would not.
pub fn total_x(points: &[Point]) -> f64 {
    points.iter().map(|p| p.x).sum()
}

pub struct Tracker {
    pub name: &'static str,
    pub log: std::rc::Rc<std::cell::RefCell<Vec<&'static str>>>,
}

/// Drop is the hook that runs at scope end, on every path out. Recording the
/// name here is what lets the test observe ordering.
impl Drop for Tracker {
    fn drop(&mut self) {
        self.log.borrow_mut().push(self.name);
    }
}

pub struct Subscriber {
    pub email: String,
    pub name: String,
}

impl Subscriber {
    pub fn new(email: &str, name: &str) -> Self {
        Self { email: email.to_string(), name: name.to_string() }
    }

    /// Returns a slice into the email the subscriber already owns. No
    /// allocation, and the lifetime ties the result to &self, so the compiler
    /// stops anyone using it after the subscriber dies.
    pub fn domain(&self) -> &str {
        match self.email.find('@') {
            Some(i) => &self.email[i + 1..],
            None => "",
        }
    }

    /// A self receiver consumes the struct. Returning the field moves it out
    /// rather than copying, and `name` is dropped as the rest of self goes.
    pub fn into_email(self) -> String {
        self.email
    }
}

/// The signature forces exactly one owned copy per surviving name: the input
/// is borrowed &str, the output is owned String. Sorting and deduping before
/// allocating means the clones that happen are only the ones kept.
pub fn sorted_unique(names: &[&str]) -> Vec<String> {
    let mut seen: Vec<&str> = names.to_vec();
    seen.sort_unstable();
    seen.dedup();
    seen.into_iter().map(str::to_string).collect()
}
