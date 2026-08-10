//! Newsletter issues. Shipped complete: this is the tree below the exercise,
//! not the exercise.
//!
//! `slug` is private, so `crate::issues::slug::slugify` is a path nobody
//! outside this file can name. The two re-exports below are the module's entire
//! public surface, which means the file layout behind them is free to change:
//! split `slug.rs` in three, rename it, fold it into another file, and no
//! caller notices.

mod slug;

pub use slug::{slug_module_path, slugify};
