With the harness in place, the first real user story: a blog visitor submits a name and an email, the page fires `POST /subscriptions`, the API answers 200. HTML forms submit as `application/x-www-form-urlencoded`: key=value pairs joined by `&`, everything non-alphanumeric percent-encoded. For Le Guin the body is:

```
name=le%20guin&email=ursula_le_guin%40gmail.com
```

The contract goes down as tests before any handler exists: a valid name and email pair returns `200 OK`; a missing field returns `400 BAD REQUEST`. The 400 test is table-driven: a `vec!` of `(invalid_body, error_message)` pairs, one loop, one assert carrying a custom message, because when a parametrised test fails you want to know which row ("The API did not fail with 400 Bad Request when the payload was missing the email.").

First implementation, honestly minimal: a `subscribe` handler that unconditionally returns `HttpResponse::Ok().finish()`, registered with `.route("/subscriptions", web::post().to(subscribe))`. The happy-path test goes green; the table stays red. Time to actually parse.

## Extractors

actix-web's answer to "give me a piece of the request, typed" is the extractor: `Path` for dynamic path segments, `Query` for the query string, `Json` for JSON bodies, and for us, `Form`. Usage is startling the first time: declare it as a handler argument.

```rust
#[derive(serde::Deserialize)]
pub struct FormData {
    email: String,
    name: String,
}

async fn subscribe(_form: web::Form<FormData>) -> HttpResponse {
    HttpResponse::Ok().finish()
}
```

All three tests pass. The missing-field 400 now comes from code we never wrote.

## FromRequest, conceptually

Every handler argument must implement the `FromRequest` trait, whose heart is one async method: given the request head and the payload bytes, return `Result<Self, Error>`. Before invoking `subscribe`, actix-web runs `from_request` for each declared argument. All succeed: the handler runs with fully typed values. Any fails: the error is converted into a response (Form's default is a 400) and the handler is never invoked. This is the trick behind the flexible signatures from the health-check lesson, and it is dependency resolution by type: the signature declares what the handler needs, the framework assembles it or refuses the request.

`Form<T>` itself is a one-field wrapper, `pub struct Form<T>(pub T)`. Its `FromRequest` impl requires `T: DeserializeOwned`, buffers the body (chunked arrival, compression, size limits all handled), then calls `serde_urlencoded::from_bytes::<T>` on the result.

## serde's split

Why did one derive line do all the work? serde is a framework in the literal sense: it defines a data model (structs, sequences, strings, 29 kinds of thing in all) and trait vocabularies on both sides of it. Format crates like `serde_urlencoded` and `serde_json` turn bytes into that model; `#[derive(serde::Deserialize)]` writes the other half once, mapping the model onto `FormData`'s fields by name. Your type then composes with every format crate, no per-format code anywhere.

And it costs what hand-written parsing costs. Monomorphization, the same mechanism from the traits-and-generics section, generates a concrete FormData-from-urlencoded function at compile time: no runtime reflection, no field-name lookup table consulted per request. That is the structural difference from deserialize-then-validate in TypeScript: here the schema is the struct, and it was compiled.

## Predict, then verify

Two requests against the finished endpoint. A: `email=ursula_le_guin%40gmail.com&name=le%20guin` (fields reversed). B: `name=le%20guin&email=` (key present, value empty). What statuses come back?

Answer: A is 200: urlencoded bodies are key-value maps and serde matches struct fields by name, never by position. B is also 200, which should bother you: an empty string satisfies `String`, because presence is all the type demands. `FormData` proves shape, not validity, and nothing stops `email=definitely-not-an-email` either. The type-driven section (chapter 6 of the book) closes exactly this gap by making invalid subscriber data unrepresentable.
