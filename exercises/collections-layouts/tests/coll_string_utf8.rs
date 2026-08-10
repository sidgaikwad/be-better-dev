//! Lesson: coll-string-utf8

use collections_layouts::*;

#[test]
fn bytes_and_chars_answer_different_questions() {
    // The lesson's claims, checked against std before the exercise relies on
    // them. Five scalar values, six bytes, because ï encodes as two.
    assert_eq!("naïve".len(), 6);
    assert_eq!("naïve".chars().count(), 5);
    assert!(!"naïve".is_char_boundary(3), "byte 3 is inside ï, which occupies bytes 2..4");
}

#[test]
fn a_cut_lands_on_a_boundary_or_walks_back_to_one() {
    assert_eq!(fit_subject("naïve", 100), ("naïve", 5), "a budget larger than the text is not an error");
    assert_eq!(fit_subject("naïve", 6), ("naïve", 5), "the whole subject already fits");
    assert_eq!(fit_subject("naïve", 4), ("naï", 3), "byte 4 is a boundary, so the cut lands there");
    assert_eq!(fit_subject("naïve", 3), ("na", 2), "byte 3 splits ï, so the cut retreats to byte 2");
    assert_eq!(fit_subject("naïve", 0), ("", 0), "an empty result, not a panic");
}

#[test]
fn ascii_is_the_case_where_the_two_counts_agree() {
    assert_eq!(fit_subject("weekly digest", 6), ("weekly", 6), "one byte per character, so the budget is the count");
}

#[test]
fn wider_scalars_walk_back_further() {
    // Z, o and the space are one byte each, ë is two, 🎉 is four: nine bytes,
    // five characters.
    let subject = "Zoë 🎉";
    assert_eq!(subject.len(), 9);
    assert_eq!(subject.chars().count(), 5);

    assert_eq!(fit_subject(subject, 9), ("Zoë 🎉", 5));
    assert_eq!(fit_subject(subject, 7), ("Zoë ", 4), "a seven byte budget cuts into the emoji, so it retreats to byte 5");
    assert_eq!(fit_subject(subject, 3), ("Zo", 2), "and again for ë");
}
