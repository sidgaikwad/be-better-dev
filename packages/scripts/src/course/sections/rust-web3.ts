import type { SectionSeed } from "../types"

export const rustWeb3: SectionSeed = {
  slug: "rust-web3",
  title: "Rust with Web3",
  description: "Chain data with alloy, contract calls, Solana and Anchor, sober engineering.",
  badgeIcon: "⛓️",
  badgeTitle: "Web3 × Rust",
  units: [
    {
      slug: "the-data-structure",
      title: "The data structure",
      description:
        "What a chain is before anyone argues about it: hash-chained blocks, merkle proofs, ledger versus state.",
      lessons: [
        {
          slug: "web3-chain-data-structure",
          title: "A blockchain is a data structure",
          summary:
            "Blocks chained by hash, what a merkle proof does and does not prove, derived state, and consensus without cheerleading.",
          contentFile: "web3-chain-data-structure.md",
          quiz: [
            {
              kind: "mcq",
              prompt: "A merkle proof for a transaction proves what, exactly?",
              options: [
                "That the transaction was valid and the sender could afford it",
                "That this exact leaf is in the set the root commits to, and nothing more",
                "That the block was produced by an honest validator",
                "That the transaction has been finalized and cannot be reverted",
              ],
              answer: 1,
              explanation:
                "Inclusion is the whole claim. Validity was decided by the rules that built the block, and whether that block stays canonical is a consensus question, so a proof against a root you obtained from a dishonest source proves membership in a set you should not trust.",
            },
            {
              kind: "predict",
              prompt:
                "You hold a 1,000-block chain locally and flip one byte inside block 500. What is the minimum work to make your copy internally consistent, and what does an honest peer notice?",
              options: [
                "Re-hash only block 500; peers cannot tell without downloading every block",
                "Re-hash blocks 500 through 999, about 500 headers; any peer comparing one 32-byte tip hash sees the mismatch instantly",
                "Nothing needs re-hashing, because hashes are recomputed on read",
                "The whole chain from block 0, and only a full re-download reveals it",
              ],
              answer: 1,
              explanation:
                "Each header holds the previous header's hash, so the edit cascades forward to the tip and stops there: earlier blocks are untouched. Your copy becomes self-consistent but its tip differs from everyone's, which is what tamper-evident means. Making others accept the new tip is the expensive part, and that is consensus, not hashing.",
            },
            {
              kind: "mcq",
              prompt:
                "What is the relationship between the chain's transaction log and an account balance?",
              options: [
                "Balances are stored on the chain and transactions are an audit trail derived from them",
                "The log is the source of truth and balances are derived state: replay from block 0 and you rebuild every balance and every contract's storage",
                "They are independent structures kept in sync by validators",
                "Balances live only in RPC providers' databases and are not part of the protocol",
              ],
              answer: 1,
              explanation:
                "It is the write-ahead log and the tables from your Postgres work, with the log authoritative. Ethereum's header additionally carries a state_root committing to the derived state, so one header lets you prove both what happened and what it produced.",
            },
          ],
        },
      ],
    },
    {
      slug: "reading-and-writing-evm",
      title: "Reading and writing an EVM chain",
      description:
        "alloy as a typed client: providers, view calls, event streams, then transactions, nonces, and keys.",
      lessons: [
        {
          slug: "web3-reading-with-alloy",
          title: "Reading chains with alloy",
          summary:
            "Providers over HTTP and WebSocket, typed contract bindings from the sol! macro, and logs as a Stream.",
          contentFile: "web3-reading-with-alloy.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "You find a tutorial building an indexer with ethers-rs and its `abigen!` macro. What is the current situation?",
              options: [
                "ethers-rs is the maintained standard; alloy is an experimental rewrite",
                "ethers-rs is deprecated in favor of alloy, from the same maintainer lineage; the concepts carry over and `abigen!` became `sol!`",
                "They are unrelated projects that solve different problems",
                "ethers-rs handles reads and alloy handles transactions, so real programs use both",
              ],
              answer: 1,
              explanation:
                "The ethers-rs README points at alloy itself. Treat ethers material as historical and translate as you read: providers, signers, and generated bindings all have direct successors, so the tutorial's ideas survive even though its imports do not.",
            },
            {
              kind: "predict",
              prompt:
                "Through a `sol!`-generated binding you run `token.balanceOf(who).call().await?`. What lands on chain, and what does it cost?",
              options: [
                "A transaction is submitted and you pay gas once it is mined",
                "Nothing lands on chain and nothing is paid: the node executes the contract's bytecode against current state, returns the value, and discards any writes",
                "A transaction is submitted but view functions are exempt from fees",
                "It reads a cached value from the RPC provider without executing anything",
              ],
              answer: 1,
              explanation:
                "`call()` is an `eth_call`: real EVM execution on one node, thrown away afterward. Nothing is broadcast, no signature is needed, and no state changes, so despite the syntax it is a read. `send_transaction` is the verb that costs money.",
            },
            {
              kind: "mcq",
              prompt:
                "Why compute a ratio from two balances pinned to the same block number instead of just calling twice?",
              options: [
                "Pinned reads are served from cache and are faster",
                "Because a new block can land between the two calls, so unpinned reads can straddle it and disagree; pinning gives the two reads one consistent snapshot",
                "Unpinned reads return values in a different unit",
                "The RPC provider charges less for historical reads",
              ],
              answer: 1,
              explanation:
                "Current state moves roughly every twelve seconds and any invariant computed across two reads can be silently corrupted by a block landing in between. Pinning both reads to a block number is the repeatable-read transaction from the database section, applied to a chain.",
            },
          ],
        },
        {
          slug: "web3-transactions-and-keys",
          title: "Transactions, nonces, and keys",
          summary:
            "Signing locally, why nonces order and stall everything, what gas buys, and key handling with no reset flow.",
          contentFile: "web3-transactions-and-keys.md",
          quiz: [
            {
              kind: "predict",
              prompt:
                "Two backend services share one signing key. Each fetches the account's next nonce, then signs and sends. Under load, what happens?",
              options: [
                "The node queues them and assigns distinct nonces automatically",
                "They read the same next nonce and collide: one transaction replaces or is rejected against the other, intermittently and under load only",
                "Both succeed; nonces only matter for ordering, not uniqueness",
                "The second signature is invalid because a key can sign only once per block",
              ],
              answer: 1,
              explanation:
                "Nonce allocation is a read-then-write race with no lock, the same shape as the queue-claim race that needed SKIP LOCKED. Nothing on the network arbitrates it. The fixes are structural: one signing process per key, or one key per service.",
            },
            {
              kind: "mcq",
              prompt:
                "A transaction runs out of gas mid-execution. What happens to its state changes and its fee?",
              options: [
                "State changes revert and the fee is refunded, since nothing happened",
                "State changes are kept up to the point of failure and the full fee is charged",
                "Every state change reverts, but the fee is still charged in full",
                "The transaction is dropped from the block as if it were never sent",
              ],
              answer: 2,
              explanation:
                "Gas pays for computation performed, not for computation that succeeded. The revert protects state integrity; the charge protects the network from free denial-of-service. You paid for the work that discovered the failure.",
            },
            {
              kind: "mcq",
              prompt:
                "Which posture matches the lesson for a signing key that controls real value in production?",
              options: [
                "Encrypted in the repository and decrypted at boot, so deploys stay self-contained",
                "Injected from a secrets manager into the environment at runtime, wrapped so it never reaches a log or panic message, and past a threshold of value held in a hardware signer or KMS that signs but never reveals it",
                "In a private repository with restricted access, which is equivalent to a secrets manager",
                "Hardcoded but split across several constants so a scanner cannot match it",
              ],
              answer: 1,
              explanation:
                "There is no reset flow for a leaked signing key, so the design goal is shrinking where the bytes can ever appear. Repository storage fails on git history alone, and obfuscation fails because anyone reading the binary or source reassembles it. Beyond a certain value the honest answer is that the key should not be in your process at all.",
            },
          ],
        },
      ],
    },
    {
      slug: "another-model-and-the-posture",
      title: "Another model, and the posture",
      description:
        "Solana's account model with Anchor, then how to engineer against a chain without fooling yourself.",
      lessons: [
        {
          slug: "web3-solana-and-anchor",
          title: "Solana: accounts, programs, Anchor",
          summary:
            "Stateless programs over passed-in accounts, PDAs, why declared access sets buy parallelism, and what Anchor checks for you.",
          contentFile: "web3-solana-and-anchor.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why can the Solana runtime execute some transactions in parallel when the EVM cannot?",
              options: [
                "Solana validators run on more cores",
                "Every transaction declares up front which accounts it reads and writes, so the runtime knows the conflict sets before executing; the EVM discovers storage access during execution and must therefore run a block serially",
                "Solana programs are compiled ahead of time instead of interpreted",
                "Solana skips conflict checks and resolves collisions afterwards",
              ],
              answer: 1,
              explanation:
                "The parallelism comes from the interface, not the hardware. Declaring the access set is also the cost: a client must know every account an instruction will touch, including program-derived ones, which pushes knowledge out of the program and into caller code.",
            },
            {
              kind: "predict",
              prompt:
                "Two transactions in the same slot call your program. One writes account A, the other writes account B. Do they run in parallel?",
              options: [
                "No: two calls into the same program always serialize",
                "Yes: conflicts are per account, and the program itself holds no mutable state, so disjoint write sets never contend",
                "Only if they were signed by different keys",
                "Only if the program is marked as parallel-safe at deploy time",
              ],
              answer: 1,
              explanation:
                "Code is stateless here, so two calls into it contend only through the accounts they touch. Point both at one shared account and they serialize completely, which is the hot-row contention from the database section with the lock living in the scheduler. That is why one PDA per user is a throughput decision, not a naming style.",
            },
            {
              kind: "mcq",
              prompt:
                "What does `Account<'info, Counter>` verify that a raw `AccountInfo` does not?",
              options: [
                "That the account holds enough lamports to pay for the transaction",
                "That this program owns the account and its data starts with the 8-byte discriminator for this type, deserializing only after both checks pass",
                "That the account was created by the same transaction",
                "Nothing extra: it is a typed alias for convenience",
              ],
              answer: 1,
              explanation:
                "A raw AccountInfo is attacker-supplied bytes at an attacker-chosen address. Missing owner and type checks are the classic Solana vulnerability, and Anchor's typed wrappers encode them, with Signer covering the signature bit and UncheckedAccount demanding a written justification before it will compile.",
            },
          ],
        },
        {
          slug: "web3-engineering-posture",
          title: "anvil, determinism, and honest judgment",
          summary:
            "Local forks pinned to a block, third-party RPC as an unreliable dependency, reorg-safe indexing, and when this domain is worth your time.",
          xp: 25,
          contentFile: "web3-engineering-posture.md",
          quiz: [
            {
              kind: "mcq",
              prompt:
                "Why does a forked anvil test need `--fork-block-number` rather than just `--fork-url`?",
              options: [
                "Without it anvil refuses to start",
                "Because an unpinned fork tracks the moving tip, so the same test code produces different results over time and a red run could mean your bug or a stranger's transaction; pinning fixes the upstream state and lets it cache",
                "It selects which chain to fork from",
                "It is only a performance flag; correctness is unaffected",
              ],
              answer: 1,
              explanation:
                "A test needs fixed inputs. Pinning turns live chain state into a constant, which also makes reruns offline because the fetched state caches. Unpinned, you have built a monitoring check that fails for reasons outside your repository.",
            },
            {
              kind: "predict",
              prompt:
                "Your indexer writes one row per log keyed on `(block_number, log_index)` and upserts. A reorg replaces a block you already indexed with one containing different transfers. What do you end up with?",
              options: [
                "A unique-constraint error that surfaces the problem immediately",
                "Silently wrong tables and no error: orphaned logs stay forever because nothing deletes them, replacement logs overwrite whatever shared their index, and derived totals become fiction",
                "Correct data, because the upsert overwrites the whole block",
                "Duplicate rows that a later dedupe pass can repair",
              ],
              answer: 1,
              explanation:
                "The replacement block carries the same number, so a number-keyed upsert cannot tell a correction from a new write and reports success either way. Only the block hash makes the divergence visible: store it, verify each new block's parent against your tip, roll back to the common ancestor, replay. Waiting for the `finalized` tag trades latency for not needing the rollback at all.",
            },
            {
              kind: "mcq",
              prompt:
                "What does re-executing every transaction on thousands of machines actually buy?",
              options: [
                "Higher throughput and lower cost per write than a conventional database",
                "Privacy for the participants",
                "The ability for mutually distrusting parties to agree on shared state with no operator anyone has to trust, paid for with enormous redundancy and irreversibility",
                "Automatic horizontal scaling of application logic",
              ],
              answer: 2,
              explanation:
                "It is one property, bought at a steep and specific price. If your system already has a trusted operator, as most do, you are paying that price for a guarantee you had for free. The engineering underneath stays interesting on its own terms; that is a separate judgment from whether your product needs it.",
            },
          ],
        },
      ],
    },
  ],
}
