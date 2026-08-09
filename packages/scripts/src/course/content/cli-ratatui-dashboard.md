Web instinct says build the UI once, then mutate it: retained mode, a DOM. ratatui, the crate behind most modern Rust terminal UIs (it began as the community fork of the unmaintained tui-rs), works the other way. Immediate mode: every frame, you rebuild the entire screen description from your state, and the library works out what actually changed. If you have written React, the shape is familiar: the UI is a function of state, and the diffing is someone else's problem.

## The loop

A stats dashboard for `bbd` needs state, a draw function, and a loop:

```rust
use crossterm::event::{self, Event, KeyCode};
use std::time::Duration;

struct App {
    stats: Stats, // xp, level, streak, reviews_due, level_into, level_next
}

fn main() -> anyhow::Result<()> {
    let mut terminal = ratatui::init(); // raw mode + alternate screen
    let mut app = App { stats: fetch_stats()? };
    loop {
        terminal.draw(|frame| draw(frame, &app))?;
        if event::poll(Duration::from_millis(250))? {
            if let Event::Key(key) = event::read()? {
                match key.code {
                    KeyCode::Char('q') => break,
                    KeyCode::Char('r') => app.stats = fetch_stats()?,
                    _ => {}
                }
            }
        }
    }
    ratatui::restore();
    Ok(())
}
```

`ratatui::init()` does two things worth understanding. It enables raw mode: normally the terminal driver runs in cooked mode, buffering input line by line and translating Ctrl+C into a SIGINT signal; raw mode delivers every keypress immediately and stops translating, which is why quitting on `q` is your job. And it switches to the alternate screen, the second buffer that vim and less use, so exiting restores the user's scrollback intact. It also installs a panic hook that undoes both, because a panic that skips `restore()` leaves the shell in raw mode, printing stairs of misaligned text until the user blindly types `reset`.

The loop polls with a 250ms timeout instead of blocking on `read()`. A blocked read would freeze the UI between keypresses; the timeout gives you a tick, a natural place to refresh data or animate, at four frames per second, plenty for a dashboard.

## Drawing

```rust
use ratatui::{prelude::*, widgets::*};

fn draw(frame: &mut Frame, app: &App) {
    let [header, body] = Layout::vertical([Constraint::Length(3), Constraint::Min(0)])
        .areas(frame.area());
    frame.render_widget(
        Paragraph::new(format!(
            "{} XP   level {}   {} day streak   {} reviews due",
            app.stats.xp, app.stats.level, app.stats.streak, app.stats.reviews_due
        ))
        .block(Block::bordered().title("be-better-dev")),
        header,
    );
    frame.render_widget(
        Gauge::default()
            .ratio(app.stats.level_into as f64 / app.stats.level_next.max(1) as f64)
            .label("progress to next level"),
        body,
    );
}
```

`Layout` splits a rectangle by constraints; widgets are cheap values, built fresh each frame and rendered into their `Rect`. No widget survives the frame, and there is no `header.set_text(...)` anywhere, because there is no retained header to mutate: the next frame rebuilds everything from `app.stats`, so state lives in exactly one place, your struct.

## Two buffers and a diff

Underneath, ratatui keeps two `Buffer`s: grids of cells, each a character plus its style. Your draw closure fills the back buffer; the library diffs it against the front buffer from the previous frame and emits the minimal stream of ANSI escape sequences, cursor moves and color codes, to patch the difference on the real terminal. Rebuilding the description every frame sounds wasteful and is not: the description is a handful of structs on the stack, and the expensive part, terminal writes, is capped by the diff to what changed on screen.

## Predict, then verify

The dashboard is running and you press Ctrl+C. No arm of the `match` mentions it. What happens?

Answer: nothing exits. In raw mode the driver no longer converts Ctrl+C into SIGINT; it arrives as an ordinary key event, `KeyCode::Char('c')` with the control modifier set, and falls into the `_ => {}` arm. The app keeps drawing. This is why every ratatui application wires an explicit quit key, and why a considerate one also matches Ctrl+C to `break` so the universal reflex still works.
