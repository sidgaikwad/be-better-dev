An Ethereum node is, from your program's point of view, a JSON-RPC server:

```bash
curl -s $RPC_URL -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
# {"jsonrpc":"2.0","id":1,"result":"0x162f4c1"}
```

You could drive this with reqwest and the chapter 7 client discipline, and some teams do. But every number is a hex string, every contract call must be ABI-encoded into a byte blob and decoded back, all by hand and without the compiler's help. alloy is the crate that makes the node a typed dependency. It is the successor to ethers-rs, from the same maintainer lineage; ethers-rs is deprecated and its own README points at alloy, so treat ethers tutorials as historical and translate as you read (the concepts carry over; `abigen!` became `sol!`).

```toml
[dependencies]
alloy = { version = "1", features = ["full"] }
```

## A provider is a connection

```rust
use alloy::primitives::address;
use alloy::providers::{Provider, ProviderBuilder};

let provider = ProviderBuilder::new()
    .connect("https://ethereum-rpc.publicnode.com")
    .await?;

let block = provider.get_block_number().await?;
let who = address!("d8da6bf26964af9d7eed9e03e53415d37aa96045");
let balance = provider.get_balance(who).await?; // U256, in wei
```

`connect` picks the transport from the URL scheme: `https` gives request/response over HTTP, `wss` gives a WebSocket that can also push subscriptions. Balances come back as `U256`, a 256-bit integer denominated in wei (10^18 per ether): the chain has no floating point anywhere, the same "money is integers" rule you would apply to billing.

## Typed contract calls with sol!

The `sol!` macro compiles Solidity signatures into Rust types at build time:

```rust
use alloy::sol;

sol! {
    #[sol(rpc)]
    contract IERC20 {
        function balanceOf(address account) external view returns (uint256);
        event Transfer(address indexed from, address indexed to, uint256 value);
    }
}

let usdc = address!("a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
let token = IERC20::new(usdc, &provider);
let held = token.balanceOf(who).call().await?;
```

This is the sqlx move from Part 3 aimed at a different foreign language: pull the external interface into the type system at compile time, so a wrong argument type is a build error instead of a runtime decoding surprise. A `view` call is an `eth_call`: the node executes the contract's EVM bytecode against current state, hands back the return value, and discards any writes. Nothing lands on chain and nothing is paid. It is a read, whatever the syntax suggests.

## Events as a Stream

Contracts emit logs, and logs are how you observe a chain without polling:

```rust
use alloy::rpc::types::Filter;
use futures_util::StreamExt;

let filter = Filter::new()
    .address(usdc)
    .event("Transfer(address,address,uint256)");

let sub = provider.subscribe_logs(&filter).await?; // needs a wss provider
let mut stream = sub.into_stream();

while let Some(log) = stream.next().await {
    let IERC20::Transfer { from, to, value } = log.log_decode()?.inner.data;
    // index it, aggregate it, alert on it
}
```

`into_stream` hands you exactly the `Stream` from Part 2, with everything you learned attached: it yields at your pace, `select!` can race it against shutdown, and a slow consumer does not slow the producer, it grows a buffer. Blocks arrive whether you keep up or not.

## One level deeper: reads race the chain

"Current state" is a moving target: a new block lands roughly every 12 seconds and rewrites it. Two reads in a row can straddle a block and disagree, which quietly corrupts any invariant you compute across them. The fix is a database move you already know: pin the snapshot. Read methods accept a block, as in `token.balanceOf(who).block(19_000_000u64.into()).call().await`, and reads pinned to the same number are mutually consistent, a repeatable-read transaction against the chain.

## Predict, then verify

Your indexer handles each `Transfer` log with a 300 ms database write, and a busy token emits about 20 transfers per second. What does the process look like after ten minutes?

Answer: you consume about 3 per second of a 20 per second feed, so roughly 10,000 unhandled logs accumulate in ten minutes, buffered in the subscription channel and the socket. Memory climbs, lag compounds, and eventually a buffer limit or the connection gives way. The producer is a blockchain; it will not slow down for you. This is Part 2's backpressure lesson with the producer outside your control, and the fixes are the same: batch the writes, fan out workers behind a bounded channel, or accept sampling.
