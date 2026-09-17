Strip away everything contentious and a blockchain is a data structure you already know: an append-only singly linked list in which the pointer in each node is a hash of the previous node.

## Blocks chain by hash

```rust
struct Header {
    parent_hash: [u8; 32], // hash of the previous block's header
    merkle_root: [u8; 32], // commitment to this block's transactions
    state_root: [u8; 32],  // commitment to the state after this block
    number: u64,
}
```

A block's identity is the hash of its header, and the header contains the previous block's hash. Flip one byte anywhere in history and that block's hash changes, which changes the next header's `parent_hash`, which changes its hash, and so on to the tip. Whoever holds the current tip hash holds a 32-byte commitment to every byte before it. You have used this structure for years: a git commit hash commits to the whole tree and the whole history in exactly the same way. What a blockchain adds is thousands of mutually distrusting machines agreeing on which tip is the tip.

## What a merkle proof proves

Headers stay small because transactions are committed, not listed. Hash each transaction, hash the results pairwise, and repeat up to a single root: a binary tree of hashes, with the root in the header. Proving one transaction is in the block then needs only the sibling hash at each level of the path:

```rust
enum Side { Left, Right }

/// hash_pair is SHA-256 over the two inputs concatenated.
fn verify(leaf: [u8; 32], path: &[(Side, [u8; 32])], root: [u8; 32]) -> bool {
    let mut acc = leaf;
    for (side, sibling) in path {
        acc = match side {
            Side::Left => hash_pair(sibling, &acc),
            Side::Right => hash_pair(&acc, sibling),
        };
    }
    acc == root
}
```

A merkle proof proves inclusion, nothing more: this exact leaf is in the set that root commits to. For n leaves the path holds log2(n) hashes, so a phone storing only headers can verify "my payment is in that block" against a short list of hashes instead of hundreds of gigabytes of chain.

## The ledger versus the state

The chain itself is a log of transactions: the ledger. "What is account X's balance" is state, and state is derived: replay the log from the first block and you rebuild every balance and every contract's storage from nothing. It is the write-ahead log and the tables from your Postgres work, with the log as the source of truth. Ethereum's header also carries `state_root`, a merkle commitment over the entire derived state, so a block commits to both the history and its outcome, and proofs work against state too: "account X held balance Y at block N" is checkable against one header.

## Consensus, one honest paragraph

The hard part is not the data structure. It is thousands of machines with no coordinator, some faulty or hostile, agreeing on one tip. Every scheme makes one history expensive to forge and cheap to verify: proof-of-work prices rewriting in energy, proof-of-stake prices it in locked capital that provable misbehavior destroys, and classical BFT protocols buy fast finality by fixing a known validator set. None escapes paying; they choose different currencies: energy, capital, trust assumptions, communication rounds. Which trade fits is an engineering judgment about a concrete system, not a loyalty question.

## Why this space runs on Rust

The software here is consensus-critical: two nodes computing different results for one transaction is a network split, so a rare edge case is a catastrophe, not a bug ticket. It parses attacker-supplied input full time, so memory unsafety is directly exploitable. And validators sit in latency-sensitive loops where a garbage collection pause means missed work. Correctness pressure, adversarial input, no tolerance for pauses: that is Rust's exact profile, and the ecosystem shows it. reth and Lighthouse (Ethereum execution and consensus clients), the Agave validator on Solana, the Polkadot SDK, the revm EVM implementation, and the Foundry toolchain are all Rust codebases, several worth reading purely as systems code.

## Predict, then verify

You store a 1,000-block chain locally and flip one byte in block 500. What is the minimum work to make your copy internally consistent again, and what does a peer notice?

Answer: block 500's hash changes, so block 501's `parent_hash` must change, so 501's hash changes, and the edit cascades: you re-hash blocks 500 through 999, about 500 headers. Your copy is now self-consistent, but its tip hash differs from every honest peer's, so anyone comparing one 32-byte value detects the edit instantly. Hash chaining makes history tamper-evident. Making the network accept your new tip anyway is precisely what consensus is designed to make expensive.
