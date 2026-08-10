//! Lesson: cost-of-allocation

use ownership_and_moves::*;

#[test]
fn one_allocation_for_a_known_size() {
    let v = preallocated_range(1000);
    assert_eq!(v.len(), 1000);
    assert_eq!(v[0], 0);
    assert_eq!(v[999], 999);
    // Growth by doubling would overshoot to 1024. Landing exactly on 1000 is
    // the observable proof that a single up-front allocation happened.
    assert_eq!(v.capacity(), 1000, "growing by doubling would leave slack here");
}
