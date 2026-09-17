By chapter 7 the newsletter needs an email client, and its constructor is at the limit of politeness:

```rust
let email_client = EmailClient::new(
    configuration.email_client.base_url,
    sender_email,
    configuration.email_client.authorization_token,
    timeout,
);
```

Four positional arguments; the next requirement (retry count, pool size) makes it five, and nothing at the call site labels which value is which. Rust has no named arguments and no default arguments, on purpose: a call that silently accepts defaults hides information. The language expects you to design your way out, and there are two standard shapes.

## A config struct, when defaults are total

```rust
pub struct EmailClientSettings {
    pub base_url: String,
    pub timeout: Duration,
    pub retries: u32,
}

impl Default for EmailClientSettings { /* sensible values */ }

let settings = EmailClientSettings {
    base_url: "https://api.postmarkapp.com".into(),
    ..Default::default()
};
```

Struct update syntax fills the unnamed rest from `Default`. This is the closest Rust gets to a TypeScript options object, and it is right when every field has a usable default and public fields cannot break an invariant. It fails on both counts here: there is no default sender address, and the newtype lesson just argued that fields with invariants must stay private.

## The builder, when construction has rules

Required inputs go up front, options become methods, `build` finishes the job:

```rust
pub struct EmailClientBuilder {
    base_url: String,
    sender: SubscriberEmail,
    timeout: Duration,
}

impl EmailClient {
    pub fn builder(base_url: String, sender: SubscriberEmail) -> EmailClientBuilder {
        EmailClientBuilder { base_url, sender, timeout: Duration::from_secs(10) }
    }
}

impl EmailClientBuilder {
    #[must_use]
    pub fn timeout(mut self, timeout: Duration) -> Self {
        self.timeout = timeout;
        self
    }

    pub fn build(self) -> EmailClient { /* assemble */ }
}

let client = EmailClient::builder(base_url, sender)
    .timeout(Duration::from_millis(200))
    .build();
```

Every optional gains a name at the call site, defaults live in one place, and required fields cannot be forgotten because they are ordinary parameters. When construction can fail, `build` returns `Result`. You have already used this exact shape: the book's `EmailClient` wraps `reqwest::Client::builder().timeout(...).build()`.

## self or &mut self

That builder consumes: each method takes `self` and returns `Self`, so calls chain and the moves (one-owner lesson) make stale builders unusable. `std::process::Command` chose the other convention, `&mut self`:

```rust
let mut cmd = Command::new("cargo");
cmd.arg("check");
if verbose { cmd.arg("--verbose"); }
```

Mutable builders shine when configuration is conditional; consuming builders shine as a single expression. With a consuming builder the conditional needs a rebind, `b = b.arg(...)`: receivers as contracts, playing out in API design. Ecosystem crates (`derive_builder`, `bon`) can generate the boilerplate; hand-roll one first so the generated code holds no mystery. And skip the pattern entirely for two or three required parameters: `new` is not a failure of imagination, it is the simpler API.

## One level deeper

The chain looks allocation-happy and is not. Each `self -> Self` step moves the builder, a shallow copy of a few stack words, exactly the move mechanics from the ownership section, and the optimizer routinely eliminates even those, constructing the struct in place. A fluent chain compiles to roughly the same machine code as one struct literal. The advanced form, where the builder's type changes as required fields are supplied so that `build` only exists once the sender is set, needs generics; it returns in the traits-and-generics section as the typestate pattern.

## Predict, then verify

```rust
let b = EmailClient::builder(base_url, sender);
b.timeout(Duration::from_secs(30));
let client = b.build();
```

Two problems. Which two?

Answer: `b.timeout(...)` takes `self`, so `b` moves into the call and `let client = b.build()` fails with `error[E0382]: use of moved value: 'b'`. The discarded return value also trips the `#[must_use]` warning from the signatures lesson: a configured builder was thrown away. Chain the calls or rebind with `let b = b.timeout(...)`. Under a `&mut self` builder the snippet would compile as written, which is precisely the trade between the two conventions.
