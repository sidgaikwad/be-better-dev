An EVM contract owns its storage: calling it loads slots that belong to that contract and nothing else may write them. A Solana program owns no storage at all, and its native entrypoint says so out loud:

```rust
use solana_program::{
    account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, pubkey::Pubkey,
};

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo], // every account this call may touch
    instruction_data: &[u8],  // the arguments, as bytes
) -> ProgramResult {
    Ok(())
}
```

The program is code and nothing else. State arrives as an argument, and an account missing from that slice does not exist for this call.

## Everything is an account

One structure holds all of it:

```rust
struct Account {
    lamports: u64,    // balance; 10^9 lamports per SOL
    data: Vec<u8>,    // opaque state bytes
    owner: Pubkey,    // the one program allowed to change `data`
    executable: bool, // true when `data` is program bytecode
}
```

A program is an account with `executable: true`. Its state lives in separate accounts that name it as `owner`, and the runtime enforces that directly: only the owner may mutate an account's data or debit its lamports. Storage is bought with a deposit instead of per-write gas, since an account must hold a rent-exempt minimum proportional to its size, refunded when the account is closed.

Deterministic addresses come from program derived addresses. Hash some seeds together with the program id and keep the result only if it lands off the ed25519 curve, so no private key for it can exist. Nobody can ever sign for a PDA; the owning program acts on its behalf. That is how "the contract's own storage" is rebuilt inside a system that has none: seeds of `[b"counter", authority.key().as_ref()]` name one account per user, derivable by any client with no lookup table.

## Declaring accounts up front buys parallelism

Because a transaction lists every account it touches and whether each is writable, the runtime knows the read/write set before executing a single instruction. Transactions whose sets are disjoint run at the same time on different cores. The EVM cannot do this: storage access is discovered during execution, so a block executes serially.

The bill lands on the client. Before sending an instruction you must already know every account it will touch, including ones the program derives internally, so client code carries knowledge the EVM keeps behind a contract's interface. Parallelism in exchange for a stricter and leakier interface is a real trade, not a free win.

## Anchor moves the checks into types

Raw, you are handed `&[AccountInfo]`: an attacker-supplied list of byte blobs. Forget to check that an account is owned by your program, or that the "authority" actually signed, and you have shipped the classic Solana vulnerability. Anchor makes those checks declarative:

```rust
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod counter {
    use super::*;

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        ctx.accounts.counter.count += 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut, seeds = [b"counter", authority.key().as_ref()], bump, has_one = authority)]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Counter {
    pub authority: Pubkey,
    pub count: u64,
}
```

`Account<'info, Counter>` refuses to deserialize until it has verified that this program owns the account and that its data begins with the 8-byte discriminator Anchor derives from the type name. `Signer` verifies the signature bit. `has_one` and `seeds`/`bump` verify relationships. By the time your function body runs, the accounts are the ones you meant. The escape hatch, `UncheckedAccount`, will not compile without a `/// CHECK:` comment justifying it: deliberate friction on the dangerous path. Anchor also emits an IDL, a JSON description of instructions and layouts that clients encode against, playing the role `sol!` played for a Solidity signature.

## One level deeper: the budget you are spending

A program runs against a compute-unit meter, 200,000 units per instruction by default, with a fixed 32 KB heap that never grows. That budget is why program code reads like embedded Rust: avoid allocation, avoid copying whole accounts, and reach for `AccountLoader` to read large state zero-copy out of the account's byte buffer. It also explains toolchain churn worth knowing about: the monolithic `solana-program` crate is being split into smaller focused crates, and `pinocchio` exists as a zero-dependency entrypoint for programs squeezing the meter. Rust dominates here but not exclusively. Agave, the main validator, is Rust; Firedancer is a from-scratch C implementation, deliberately independent so one client's bug cannot stop the network.

## Predict, then verify

Two transactions arrive in the same slot. One calls your counter program writing account A; the other calls the same program writing account B. Do they execute in parallel?

Answer: yes. Conflicts are per account, not per program, and the program holds no mutable state of its own, so two calls into the same code with disjoint write sets never contend. Now change one thing: point both at the same account, as a single global counter or a popular pool would, and they serialize completely, because the runtime must pick an order for the writers. That is the hot-row contention from the database section with the lock moved into the scheduler, and it is why account layout, one PDA per user rather than one shared account, is a throughput decision on Solana rather than a naming preference.
