The last upgrade makes `NewSubscriber` honest about both fields:

```rust
pub struct NewSubscriber {
    pub email: SubscriberEmail,
    pub name: SubscriberName,
}
```

`cargo check` erupts, and every error is the compiler pointing at a spot that still handles raw strings. The handler mimics for email what it already does for name, answering rejection with a `400`:

```rust
pub async fn subscribe(form: web::Form<FormData>, pool: web::Data<PgPool>) -> HttpResponse {
    let name = match SubscriberName::parse(form.0.name) {
        Ok(name) => name,
        Err(_) => return HttpResponse::BadRequest().finish(),
    };
    let email = match SubscriberEmail::parse(form.0.email) {
        Ok(email) => email,
        Err(_) => return HttpResponse::BadRequest().finish(),
    };
    let new_subscriber = NewSubscriber { email, name };
    match insert_subscriber(&pool, &new_subscriber).await {
        Ok(_) => HttpResponse::Ok().finish(),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}
```

(`insert_subscriber` now binds `new_subscriber.email.as_ref()`, the `AsRef` lesson paying rent.) `cargo test`: all four integration tests green, including the troublesome-payload test that opened this section.

## Naming the conversion

The first two statements are one job: turn the wire format (URL-decoded form fields) into the domain model. Extract it, with `?` from Part 1's Result lesson doing the propagation:

```rust
pub fn parse_subscriber(form: FormData) -> Result<NewSubscriber, String> {
    let name = SubscriberName::parse(form.name)?;
    let email = SubscriberEmail::parse(form.email)?;
    Ok(NewSubscriber { email, name })
}
```

`subscribe` now matches once and owns nothing but HTTP concerns. And `std::convert` already has a name for this exact shape, a fallible conversion that consumes its input:

```rust
pub trait TryFrom<T>: Sized {
    type Error;
    fn try_from(value: T) -> Result<Self, Self::Error>;
}
```

Substitute `T = FormData`, `Self = NewSubscriber`, `Error = String`: that is `parse_subscriber`'s signature. (`AsRef` was the wrong trait for this job: infallible, and borrowing rather than consuming.) So the free function becomes an impl, no import required since `TryFrom` joined the prelude in the 2021 edition:

```rust
impl TryFrom<FormData> for NewSubscriber {
    type Error = String;

    fn try_from(value: FormData) -> Result<Self, Self::Error> {
        let name = SubscriberName::parse(value.name)?;
        let email = SubscriberEmail::parse(value.email)?;
        Ok(Self { email, name })
    }
}
```

We implemented `TryFrom`, yet the handler calls `form.0.try_into()`. The standard library provides a blanket implementation, roughly `impl<T, U> TryInto<U> for T where U: TryFrom<T>`, so every `TryFrom` you write grants the mirror-image method for free. `form.0.try_into()` and `NewSubscriber::try_from(form.0)` are the same call spelled from either end; taste decides.

What did the trait buy over a bespoke `parse_subscriber`? No new functionality at all. Intent. `try_from` is shared vocabulary: the next Rust developer to open this codebase sees it and knows the shape without reading the body, a type conversion, fallible, `Result` out. It is this section's third conversion-trait dividend, after `AsRef<str>` and the `rand` traits under quickcheck.

## The endpoint, read aloud

```rust
let new_subscriber = match form.0.try_into() {
    Ok(form) => form,
    Err(_) => return HttpResponse::BadRequest().finish(),
};
match insert_subscriber(&pool, &new_subscriber).await {
    Ok(_) => HttpResponse::Ok().finish(),
    Err(_) => HttpResponse::InternalServerError().finish(),
}
```

Parse, then act. One boundary where untrusted input either becomes typed truth or leaves with a `400` (the client's fault); past it, the code holds a `NewSubscriber` and never re-checks anything. A failed insert is a `500`: our fault, different status. The chapter closes on the limit of this power: the email is now syntactically valid, but no amount of string inspection can establish that the inbox exists and is read. Proving that requires sending an actual email with a confirmation link, which is the next section's chapter.

## Predict, then verify

`?` would tighten the handler further:

```rust
let new_subscriber: NewSubscriber = form.0.try_into()?;
```

`subscribe` returns `HttpResponse`. Does this compile?

Answer: no. `?` desugars to an early `return Err(...)`, so it is only legal inside functions returning `Result` (or `Option`); here the compiler rejects it with `error[E0277]`. The book says `subscribe` does not qualify "yet" on purpose: in the error-handling chapter the handler starts returning `Result<HttpResponse, E>` with a real error type, and `?` finally moves in.
