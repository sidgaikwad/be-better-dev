//! Lesson: mod-visibility

use modules_api_design::*;

#[test]
fn the_public_function_does_the_work_the_helper_stays_in() {
    // The masking rule is asserted here, through the one function that was
    // published. Nothing in this file can reach the helper that implements it,
    // which is what makes that helper free to change.
    assert_eq!(settings_summary("postmark", "tok-9x8y"), "postmark: ****9x8y");
}

#[test]
fn a_short_token_is_hidden_completely() {
    assert_eq!(settings_summary("dev", "abc"), "dev: ***", "four characters or fewer reveal nothing");
    assert_eq!(settings_summary("dev", "abcd"), "dev: ****");
    assert_eq!(settings_summary("dev", "abcde"), "dev: *bcde", "the fifth character is where the tail starts");
}

// COMPILE ERROR: error[E0603]: module `secrets` is private
//
// An integration test compiles as its own crate, so it sees exactly what a user
// of the library sees. `mask_token` is `pub(crate)` inside a private module:
// this crate may call it, nobody outside can, and it is therefore not part of
// any promise you have to keep. Uncomment to watch the compiler enforce that.
//
// #[test]
// fn the_helper_is_reachable_from_out_here() {
//     assert_eq!(modules_api_design::secrets::mask_token("tok-9x8y"), "****9x8y");
// }
