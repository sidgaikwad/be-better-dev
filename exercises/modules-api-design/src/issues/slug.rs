//! Shipped complete. Nothing in this file is an exercise.
//!
//! Until `src/lib.rs` mounts the directory above it, the compiler never opens
//! this file: `cargo check` is clean and every line in here could be nonsense.
//! That is the module-tree lesson in one artifact.

/// Turn an issue title into a URL slug: lowercase, alphanumerics kept, every
/// run of anything else collapsed to a single `-`, no leading or trailing `-`.
pub fn slugify(title: &str) -> String {
    let mut slug = String::with_capacity(title.len());
    for ch in title.chars() {
        if ch.is_ascii_alphanumeric() {
            slug.push(ch.to_ascii_lowercase());
        } else if !slug.ends_with('-') {
            slug.push('-');
        }
    }
    slug.trim_matches('-').to_string()
}

/// Report the canonical path of the module this function is written in.
///
/// `module_path!()` expands at compile time to the full path from the crate
/// root, so the answer is decided by the `mod` declaration that mounted this
/// file, not by the file itself. Move the declaration and the same source
/// answers differently.
pub fn slug_module_path() -> &'static str {
    module_path!()
}
