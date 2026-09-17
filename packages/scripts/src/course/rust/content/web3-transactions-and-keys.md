Reading was free because nothing changed. Writing means a transaction, a transaction means a signature, and a signature means your process now holds a secret with a property most secrets lack: there is no reset flow. A leaked database password is an incident and a rotation. A leaked signing key is the end; whatever it controls is gone, and there is nobody to file a ticket with.

## What a transaction is

A transaction is a small signed struct: a nonce, a recipient, a value in wei, optional calldata (the ABI-encoded function call), gas parameters, and a chain id. The signature is the entire authorization: any node relays a validly signed transaction via `eth_sendRawTransaction`, no session, no login. So you sign locally and send only finished bytes. The older `eth_sendTransaction`, which asks the node to sign for you, requires the node to hold your key and has no place in production.

```rust
use alloy::network::TransactionBuilder;
use alloy::primitives::U256;
use alloy::providers::{Provider, ProviderBuilder};
use alloy::rpc::types::TransactionRequest;
use alloy::signers::local::PrivateKeySigner;

let signer: PrivateKeySigner = std::env::var("SIGNER_KEY")?.parse()?;

let provider = ProviderBuilder::new()
    .wallet(signer) // signs locally, in-process
    .connect(rpc_url)
    .await?;

let tx = TransactionRequest::default()
    .with_to(recipient)
    .with_value(U256::from(1_000_000_000_000_000u64)); // 0.001 ether

let receipt = provider.send_transaction(tx).await?.get_receipt().await?;
```

The builder's default fillers did quiet work before signing: fetched the account's next nonce, estimated gas, fetched current fees, stamped the chain id. Each is worth understanding, because each is a failure mode.

## Nonces and gas

The nonce is a strict per-account counter: transaction n+1 cannot execute until n has. That buys replay protection and ordering, with two sharp edges. A gap stalls everything behind it: if nonce 5 is priced too low to be mined, nonces 6 through 40 wait in the mempool indefinitely, and the escape is resubmitting nonce 5 with a meaningfully higher fee. Replacement by same nonce is also the only way to "cancel". And a shared key is a race: two services that each fetch "next nonce" and sign will collide, one transaction replacing or rejecting the other, intermittently. It is chapter 11's queue-claim race without `SKIP LOCKED`; the fix is one signing process per key, or one key per service.

Gas is a compute budget. The limit caps execution; the EIP-1559 fields say what you pay per unit: a protocol-set base fee that is burned, plus a tip. Running out of gas reverts every state change but still charges the fee. You paid for the compute that discovered the failure.

## Keys, done seriously

The rules are short, and each is written in someone's postmortem:

- Never in source, never in git. Scanners watch public commits and drain exposed keys in under a minute, and git history survives force-pushes.
- Environment at runtime, injected from a secrets manager; `.env` stays gitignored. The book's secrecy wrapper applies verbatim: a key must never reach a `Debug` print, a trace, or a panic message.
- Separate keys per environment, and dev keys hold nothing. anvil's published test accounts are radioactive on any real network; bots sweep them continuously.
- Past a certain value at stake, the key should not be in your process at all. Hardware signers and cloud KMS/HSM services hold the material and sign on request, and alloy's `Signer` trait makes swapping `PrivateKeySigner` for a KMS-backed signer a type change, not a redesign.

## One level deeper: the key in memory

A `PrivateKeySigner` is ultimately 32 bytes in your address space, which means it can appear in core dumps, be swapped to disk, and linger after drop unless scrubbed. The `zeroize` crate overwrites secrets on drop (the destructor discipline from the Drop lesson, aimed at secrecy), and alloy's key types use it. That is mitigation, not immunity, which is the honest argument for hardware and KMS signing: the strongest place for a key is a device that will sign for you but never reveal it.

## Predict, then verify

During congestion you send transaction A with nonce 5 and a low max fee, then B with nonce 6 priced generously. Ten minutes later, what has confirmed?

Answer: nothing. B cannot execute before A no matter what it pays, because nonces are strictly ordered; both sit in the mempool with B parked behind an underpriced A. It is head-of-line blocking, exactly as in an ordered queue. You resolve it by replacing A: same nonce 5 at a higher fee (nodes demand a real bump to accept a replacement), either the original transaction repriced or a zero-value transfer to yourself, the idiom for "cancel".
