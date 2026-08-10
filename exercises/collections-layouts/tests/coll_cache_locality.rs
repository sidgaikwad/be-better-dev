//! Lesson: coll-cache-locality

use collections_layouts::*;

#[test]
fn one_buffer_not_one_per_row() {
    let grid = Grid::new(3, 4);

    assert_eq!(grid.as_row_major().len(), 12, "rows * cols cells in a single run of memory");
    assert!(grid.as_row_major().iter().all(|&cell| cell == 0), "a new grid starts zeroed");
    assert_eq!(
        std::mem::size_of_val(grid.as_row_major()),
        96,
        "twelve i64s, so one 64 byte cache line covers eight of them"
    );
}

#[test]
fn the_layout_is_row_major() {
    let mut grid = Grid::new(2, 3);
    let mut next = 1;
    for row in 0..2 {
        for col in 0..3 {
            grid.set(row, col, next);
            next += 1;
        }
    }

    assert_eq!(grid.get(0, 0), 1);
    assert_eq!(grid.get(1, 2), 6);
    assert_eq!(
        grid.as_row_major(),
        [1, 2, 3, 4, 5, 6],
        "row 0 then row 1, which is what makes the inner loop a sequential walk"
    );
    assert_eq!(grid.row(1), [4, 5, 6], "a row is a window into the one buffer, with no per-row pointer to chase");
    assert_eq!(grid.total(), 21);
}

#[test]
fn a_column_walk_visits_the_same_cells_at_a_worse_stride() {
    let mut grid = Grid::new(3, 3);
    for row in 0..3 {
        for col in 0..3 {
            grid.set(row, col, (row * 3 + col) as i64);
        }
    }

    let row_order: i64 = (0..3).flat_map(|row| (0..3).map(move |col| (row, col))).map(|(r, c)| grid.get(r, c)).sum();
    let col_order: i64 = (0..3).flat_map(|col| (0..3).map(move |row| (row, col))).map(|(r, c)| grid.get(r, c)).sum();

    // Same cells, same additions, same answer. The only difference is the order
    // the addresses are touched in, which big-O cannot see and the memory system
    // charges for. Timing it belongs in the Performance section; here the point
    // is that the layout, not the loop, is what decides the stride.
    assert_eq!(row_order, col_order);
    assert_eq!(row_order, grid.total());
}
