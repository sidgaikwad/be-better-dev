The dashboard reads "1,204 sent" and stops. The worker is fine, the queue is draining, the server still holds that connection in its hub and still writes progress events into it without an error. The admin closed the laptop lid twenty minutes ago on a train.

Nothing is broken, and nothing will report anything either.

## TCP will not tell you

A polite death is easy: the tab closes, the OS sends a FIN, tungstenite surfaces a `Close`, your reader task exits, and the hub entry is gone in milliseconds. Last lesson's code already handles that.

The impolite death is the common one: power loss, Wi-Fi gone, a phone in a tunnel, a NAT mapping expired on a middlebox. Consider what TCP is at that moment. An established connection with nothing to send emits no packets at all, so there is nothing to fail. Your socket sits in `ESTABLISHED` forever, because forever is how long an idle connection takes to produce evidence.

Writing does not fix it quickly. `send` copies into the kernel's send buffer and returns success long before anything is acknowledged, so the first several events succeed against a machine that no longer exists. Only when retransmissions exhaust does the socket error, and Linux's `tcp_retries2` defaults to 15: 13 to 30 minutes of backoff. `SO_KEEPALIVE` exists but is off by default, and `tcp_keepalive_time` defaults to 7200 seconds. Two hours is not a dashboard's idea of dead.

## Heartbeats on the frames you already have

The frames lesson supplied the mechanism: opcode `0x9` ping, `0xA` pong, at most 125 bytes, never fragmented, legal between the fragments of a large data message. A heartbeat can never queue behind an upload.

```rust
use axum::body::Bytes;
use tokio::time::{interval, Duration, Instant};

let mut beat = interval(Duration::from_secs(25));
let mut last_pong = Instant::now();

loop {
    tokio::select! {
        _ = beat.tick() => {
            if last_pong.elapsed() > Duration::from_secs(60) {
                break;                       // two missed pongs: assume dead
            }
            if sink.send(Message::Ping(Bytes::new())).await.is_err() {
                break;
            }
        }
        incoming = stream.next() => match incoming {
            Some(Ok(Message::Pong(_))) => last_pong = Instant::now(),
            Some(Ok(_)) => {}
            Some(Err(_)) | None => break,
        },
    }
}
```

You send pings; you do not answer them. tungstenite queues the pong for an inbound ping automatically, and axum documents that you can ignore `Message::Ping`. The caveat is sharp: that pong only goes out while some task is polling the socket, so a wedged task answers nothing. That is a feature, because a heartbeat should test that the task is alive, not merely the descriptor.

Twenty-five seconds is not arbitrary. Proxies and load balancers close idle TCP connections on their own schedule (AWS ALB's default idle timeout is 60 seconds, reset by traffic in either direction), so one interval buys detection and keeps the path open.

## What a pong does not prove

The browser `WebSocket` API cannot send a ping, cannot observe one, and never surfaces a pong to your JavaScript; the browser's stack answers server pings itself. So a healthy ping/pong proves the browser process is running and the path works, and nothing about the page: an exception in `onmessage` leaves a socket that pongs perfectly and renders nothing. To test the page, send an application-level message it must answer.

Detection is half the design. WebSocket has no resumption: no message ids, no replay, no "send me what I missed". A reconnecting client gets a brand new stream, so it fetches a snapshot (`GET /admin/newsletters/{id}/progress`), then applies live events on top, backing off with jitter. Without jitter, one restart brings every dashboard back on the same millisecond, each re-running auth and the snapshot query.

Hence a design rule for the next two lessons: make every event self-contained. Send absolute counts (`{"sent": 18500, "total": 50000}`), never deltas (`+1`). A dropped delta leaves the number permanently wrong and undetectably so; a dropped absolute is one stale frame, corrected by the next.

## One level deeper

Ten thousand connections pinged every 25 seconds is 400 pings per second, two bytes out and six back. The bandwidth is nothing; the cost is ten thousand timers. Tokio's wheel handles that, but stagger each interval's start by a random fraction of the period so they do not all fire on one tick.

## Predict, then verify

An admin's laptop sleeps. The server runs no heartbeat, but pushes a progress event every second into that socket. How long until it notices, and how does the answer change if the server is only reading?

Answer: minutes, and only because it is writing. The events fill the kernel send buffer, the window closes as acknowledgements stop, and TCP retransmits with exponential backoff until `tcp_retries2` gives up 13 to 30 minutes later, at which point the socket errors and the task exits. Reading only, it would wait forever: an idle connection emits no packets, so nothing can time out. The heartbeat's real job is converting "we might be writing" into "we are writing, every 25 seconds", the only condition under which a timeout can exist at all.
