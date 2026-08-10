//! Lesson: tokio-echo-server

use std::net::SocketAddr;
use std::time::Duration;

use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::mpsc;

use tokio_exercises::*;

/// Bind an ephemeral port. Port 0 asks the kernel for a free one, so these
/// tests never collide with each other or with anything already running.
async fn bind() -> (TcpListener, SocketAddr) {
    let listener = TcpListener::bind("127.0.0.1:0").await.expect("bind");
    let addr = listener.local_addr().expect("local_addr");
    (listener, addr)
}

#[tokio::test]
async fn a_chunk_that_arrives_wins_the_race() {
    let (listener, addr) = bind().await;
    let mut client = TcpStream::connect(addr).await.expect("connect");
    client.write_all(b"ping").await.expect("write");

    let (mut socket, _) = listener.accept().await.expect("accept");
    let mut buf = vec![0u8; 64];

    // A five second deadline that never fires: the read finishes first.
    assert_eq!(read_chunk(&mut socket, &mut buf, Duration::from_secs(5)).await, Some(4));
    assert_eq!(&buf[..4], b"ping");
}

#[tokio::test]
async fn a_quiet_peer_loses_the_race_with_the_clock() {
    let (listener, addr) = bind().await;
    // Connected and holding the socket open, but never writing a byte.
    let _client = TcpStream::connect(addr).await.expect("connect");

    let (mut socket, _) = listener.accept().await.expect("accept");
    let mut buf = vec![0u8; 64];

    let started = std::time::Instant::now();
    assert_eq!(
        read_chunk(&mut socket, &mut buf, Duration::from_millis(30)).await,
        None,
        "timeout drops the read and answers Elapsed; an idle connection has to be hung up, not held forever"
    );
    assert!(started.elapsed() >= Duration::from_millis(30), "the deadline is what fired");
}

#[tokio::test]
async fn a_peer_that_hangs_up_ends_the_connection_too() {
    let (listener, addr) = bind().await;
    let client = TcpStream::connect(addr).await.expect("connect");
    let (mut socket, _) = listener.accept().await.expect("accept");
    drop(client);

    let mut buf = vec![0u8; 64];
    assert_eq!(
        read_chunk(&mut socket, &mut buf, Duration::from_secs(5)).await,
        None,
        "a read of zero bytes is end of stream, not an empty chunk; treating it as one is how echo loops become spin loops"
    );
}

#[tokio::test]
async fn the_server_echoes_every_connection() {
    let (listener, addr) = bind().await;
    let (stats, mut reports) = mpsc::channel::<usize>(16);
    let server = tokio::spawn(serve(listener, stats, Duration::from_secs(5)));

    let mut first = TcpStream::connect(addr).await.expect("connect");
    first.write_all(b"hello").await.expect("write");
    let mut echoed = [0u8; 5];
    first.read_exact(&mut echoed).await.expect("read");
    assert_eq!(&echoed, b"hello", "every chunk comes straight back");

    let mut second = TcpStream::connect(addr).await.expect("connect");
    second.write_all(b"world!").await.expect("write");
    let mut echoed = [0u8; 6];
    second.read_exact(&mut echoed).await.expect("read");
    assert_eq!(&echoed, b"world!", "one task per connection, so two clients do not queue behind each other");

    // One report per echoed chunk. Awaiting them is exact, where sleeping and
    // then reading a total would only be a guess.
    let total = reports.recv().await.expect("report") + reports.recv().await.expect("report");
    assert_eq!(total, 11, "the stats task owns the total: there is no mutex anywhere in this program");

    server.abort();
}

#[tokio::test]
async fn the_server_hangs_up_on_an_idle_connection() {
    let (listener, addr) = bind().await;
    let (stats, _reports) = mpsc::channel::<usize>(16);
    let server = tokio::spawn(serve(listener, stats, Duration::from_millis(30)));

    let mut client = TcpStream::connect(addr).await.expect("connect");
    // The client never writes. The server's deadline fires, its connection
    // task ends, the socket drops, and this read sees the hang-up as end of
    // stream. Waiting for the real event beats sleeping and hoping.
    let mut buf = [0u8; 8];
    let read = tokio::time::timeout(Duration::from_secs(2), client.read(&mut buf)).await;
    let bytes = read.expect("the server never hung up: is the idle deadline wired in?").expect("read");

    assert_eq!(bytes, 0, "an idle connection is closed, which is the entire point of giving reads a deadline");

    server.abort();
}
