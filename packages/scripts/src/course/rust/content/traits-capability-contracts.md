The newsletter service needs to send email two ways: in production through Postmark's HTTP API, and in tests through a fake that only records what would have been sent. Two types, one capability. This lesson gives that capability a name the compiler can check.

## A trait is the contract

```rust
struct SendError;

trait EmailClient {
    fn send(&self, to: &str, subject: &str, body: &str) -> Result<(), SendError>;
}
```

The trait declares what an email client must be able to do, and nothing about how. `&self` is the same receiver decision you read in the structs lesson: `send` borrows the client, it does not consume it.

Types opt in with an `impl Trait for Type` block:

```rust
struct Postmark { token: String }
struct FakeClient;

impl EmailClient for Postmark {
    fn send(&self, to: &str, subject: &str, body: &str) -> Result<(), SendError> {
        println!("POST /email to={to} subject={subject} ({} bytes) token={}", body.len(), self.token);
        Ok(()) // part 2 swaps this println for a real HTTP client
    }
}

impl EmailClient for FakeClient {
    fn send(&self, to: &str, subject: &str, _body: &str) -> Result<(), SendError> {
        println!("[fake] to {to}: {subject}");
        Ok(())
    }
}
```

Here is the first sharp difference from TypeScript. A TS interface is structural: any object with a matching `send` satisfies it automatically. A Rust trait is nominal: `FakeClient` is an `EmailClient` because that impl block exists, and for no other reason. A type with a textually identical method but no impl block does not qualify. Nothing is ever accidentally an email client.

## Default methods

A trait method may carry a body. Implementors inherit it and may override it.

```rust
trait EmailClient {
    fn send(&self, to: &str, subject: &str, body: &str) -> Result<(), SendError>;

    fn send_to_all(&self, recipients: &[String], subject: &str, body: &str) -> Result<(), SendError> {
        for to in recipients {
            self.send(to, subject, body)?;
        }
        Ok(())
    }
}
```

`send_to_all` is written entirely against the required method, so one `impl` of `send` buys the whole surface. Note `?` doing its job from the Result lesson, inside a trait body like anywhere else. When Postmark grows a batch endpoint, its impl can override `send_to_all` with a single API call while `FakeClient` keeps the loop, and callers never know.

## What the trait costs the value: nothing

The structs lesson said a struct's memory is its fields laid out together, no header, no vtable. Implementing a trait changes none of that: `size_of::<Postmark>()` is 24 bytes (one String header) before and after the impl, and `FakeClient` stays zero-sized. The link between a type and its impls lives in the compiler's tables, not in the bytes of the value. Contrast a Java object or a JS object, which carry a class pointer or a prototype chain at runtime whether anyone asks or not.

Which raises the real question: if the value carries no method table, how does a call through the trait find the right `send`? That is decided at each call site, and there are exactly two mechanisms with very different bills. They are the next unit.

## Predict, then verify

```rust
struct Postcard;

impl Postcard {
    fn send(&self, to: &str, subject: &str, body: &str) -> Result<(), SendError> {
        Ok(())
    }
}

let recipients = vec![String::from("ada@example.com")];
Postcard.send_to_all(&recipients, "Welcome", "You are in");
```

`Postcard` has a `send` with exactly the trait's signature. Does the `send_to_all` call compile?

Answer: no. `` error[E0599]: no method named `send_to_all` found for struct `Postcard` ``. The default method belongs to `EmailClient`, and `Postcard` never wrote `impl EmailClient for Postcard`, so it gets neither the contract nor the freebies. The identical inherent `send` counts for nothing; opting in is the only door. Add the impl block (its `send` may even delegate to the inherent one) and the call compiles.
