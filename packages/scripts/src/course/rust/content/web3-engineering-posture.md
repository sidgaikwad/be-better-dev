The test passed yesterday. Nobody touched the code.

```bash
$ cargo test --test indexer
test reads_transfer_logs ... FAILED
  assertion failed: `(left == right)`
    left: 0
   right: 3
```

It reads a public RPC endpoint, and today that endpoint rate-limited you, or the node behind the load balancer is forty blocks behind, or somebody else's test drained the shared testnet account. A public chain is a mutable global that strangers write to, and a hosted RPC is a network dependency with no obligation to you. Neither belongs inside a test loop.

## anvil: the chain on localhost

anvil ships with Foundry, the Rust toolchain built on the revm EVM implementation:

```bash
anvil --fork-url $MAINNET_RPC --fork-block-number 19000000
# 10 prefunded accounts with fixed keys from a published mnemonic
# Listening on 127.0.0.1:8545
```

It mines a block per transaction instantly, prefunds deterministic accounts, and exposes controls no real chain has: `evm_mine`, `evm_increaseTime` to jump a timelock, `anvil_setBalance`, and `anvil_impersonateAccount` to send transactions as an address whose key you do not hold. Forking fetches upstream state lazily and caches it, so you get real deployed contracts with local write access.

From a test, alloy will spawn and wire it for you:

```rust
use alloy::providers::ProviderBuilder;

#[tokio::test]
async fn transfer_moves_balance() -> eyre::Result<()> {
    // requires alloy's node-bindings feature and anvil on PATH
    let provider = ProviderBuilder::new().connect_anvil_with_wallet();
    // deploy, call, assert; the process dies with the test
    Ok(())
}
```

This is the wiremock lesson with a different kind of fake. Not a stubbed HTTP response, but a real EVM executing your real bytecode, in-process, in milliseconds.

## Pinning is what makes a fork test a test

`--fork-block-number` is the load-bearing flag. Unpinned, the fork tracks the moving tip, so identical test code gives different answers tomorrow and a red run could mean your bug or a stranger's transaction. Pinned, the upstream state is a fixed input: the assertions hold forever and cached state makes reruns offline. A fork test without a pinned block is a monitoring check wearing a test's clothes.

## Third-party RPC is an unreliable dependency

Treat a hosted RPC the way Part 3 taught you to treat any external API, then add one hazard those lessons never had: it is not deterministic about the past.

- Rate limits and quotas differ per provider and bite hardest during the traffic spike you care about.
- Behavior differs: `eth_getLogs` block-range caps vary, and state older than roughly 128 blocks needs an archive node, which a pruned one cannot serve.
- A provider is a load balancer over many nodes at different heights, so consecutive calls can move backwards in block number.
- Reorgs replace blocks you already read. That data did not go stale, it un-happened.

Timeouts, retry with backoff (alloy ships a `RetryBackoffLayer` for the transport), and a fallback provider cover the first three, unchanged from the fault-tolerance section. The fourth needs its own design.

## One level deeper: the only correct reorg handling

Store the block hash beside every row you index, and check parentage as blocks arrive:

```rust
if new_block.parent_hash != db.tip_hash().await? {
    // walk back until stored hashes match the canonical chain,
    // delete everything above that height, then replay forward
    db.rollback_to(common_ancestor).await?;
}
```

Keying on block number alone cannot see this, because the replacement block carries the same number. The alternative to rolling back is waiting: Ethereum's `finalized` block tag marks state whose reversal would cost an attacker slashed capital, roughly thirteen minutes behind the tip. Index the tip for responsiveness, settle on `finalized` for anything you would not want to undo. That is a latency decision made on purpose, which is strictly better than a correctness gamble made by accident.

## An honest read on the domain

Re-executing every transaction on thousands of machines is a spectacularly expensive way to write a row. It buys one property: mutually distrusting parties agreeing on shared state with no operator anyone has to trust. If your system has a trusted operator, and most do, that redundancy is paying for a guarantee you already had. The attached costs are real too: irreversibility with no rollback, and deployed code you cannot hotfix unless you add an upgrade admin, which puts the trusted party back.

The engineering is a separate question from the markets, and on its own terms it is good work: deterministic state machines, parsers hardened against hostile input, peer-to-peer networking, applied cryptography, storage engines under sustained write load. reth, revm, Lighthouse, and the Foundry tools reward reading as systems code no matter what you think of the assets, and those skills move directly to databases, compilers, and anything else where a rare edge case is a catastrophe rather than a ticket.

## Predict, then verify

Your indexer writes one row per log, keyed on `(block_number, log_index)`, and upserts. A minute after you index block 19,000,000, a reorg replaces it with a block containing a different set of transfers. What do your tables hold, and what does your process log?

Answer: wrong data, and nothing. Logs that existed only in the orphaned block sit in your table forever, since nothing ever deletes them; logs from the replacement block overwrite whichever rows shared their index; any total computed from the table is now fiction. The upsert did exactly what it was told. Only the block hash makes the divergence visible, which is why store-the-hash, verify-the-parent, roll-back is not defensive extra credit but the minimum correct design for reading a chain.
