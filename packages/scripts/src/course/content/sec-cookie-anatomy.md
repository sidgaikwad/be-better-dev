A failed login should put one line above the form: "Authentication failed". The requirements are stricter than they look: the user must see it once, after the redirect back to `GET /login`, and never again, not on refresh, not tomorrow. Chapter 10 builds this twice, and the failed first build is what makes cookies click.

## First build: the message in the URL

`POST /login` redirects on failure, and a redirect is a status code plus a `Location` header, which can carry query parameters:

```
Location: /login?error=Authentication%20failed.
```

`GET /login` reads the parameter and injects it into the HTML. Two attacks arrive immediately. Query parameters belong to whoever writes the URL: an attacker mails a link where `error` contains `<a href="https://attacker.example">here</a>`, luring victims to "resolve the issue" on a page your domain lends credibility to. This is cross-site scripting (XSS). HTML-escaping the value (`htmlescape::encode_minimal`) stops markup injection, but attacker-chosen _text_ still renders. What we need is provenance: only messages our server wrote may display. So the server appends a message authentication code, an HMAC tag keyed on a secret, as a second parameter:

```
/login?error=Authentication%20failed.&tag=71edc9163d7f8b78e1638e0b16fe70a3...
```

`GET /login` recomputes the tag over the query string; a mismatch means forged, log a warning and render nothing. Integrity: solved.

Then type `localhost:8000` into the address bar and watch autocomplete offer your failure URLs back. URLs are _records_: they land in browser history and suggestions, so a stale "Authentication failed" resurfaces days later. The message must be ephemeral, and no signature fixes a storage location that remembers. Wrong channel entirely.

## What a cookie actually is

MDN's definition is exact: a small piece of data a server sends to a browser, which the browser stores and sends back on later requests to the same server. The whole mechanism is two headers. The response says:

```
Set-Cookie: _flash=Authentication failed
```

and the browser files it in its cookie jar. Every later request to our origin automatically carries `Cookie: _flash=Authentication failed`. The flash flow becomes: `POST /login` sets the cookie and redirects; the browser follows to `GET /login` with the cookie attached; the handler reads it, renders the message, deletes it. The URL never changes and history stays clean. One-time notifications built this way are called **flash messages**.

Deletion is its own trick: there is no Unset-Cookie header. Attributes after the value control lifetime and reach. A bare `Set-Cookie` makes a _session cookie_, held in browser memory, gone when the browser closes. `Max-Age=5` (or an `Expires` date) makes it _persistent_: written to disk, sent for the next five seconds. `Max-Age=0` expires it immediately, which _is_ the deletion idiom; actix-web wraps it as `add_removal_cookie`.

Three more attributes carry the security story. `Secure`: attach only over HTTPS, so eavesdroppers never see it. `HttpOnly`: store and send it, but hide it from JavaScript, `document.cookie` cannot read it. `SameSite` (newer than the book: `Strict`, `Lax`, or `None`) controls whether cross-site requests carry it, the browser-level defense against request forgery; Chromium-family browsers now default unspecified cookies to `Lax`. None of these stop the _user_: your jar is yours to edit in devtools. Tamper-proofing is HMAC again, the value stored with its tag: a **signed cookie**. Rather than hand-roll it, the book plugs in `actix-web-flash-messages` (by the book's author): `CookieMessageStore` signs with a `Key` built from the HMAC secret, `FlashMessage::error(...).send()` on one side, the `IncomingFlashMessages` extractor on the other, creation, verification, and deletion all handled by middleware.

## One deeper: find it in the jar

Fail a login, then open devtools. The Network tab shows the 303 response carrying `Set-Cookie`. Under Application > Cookies (Chrome) or Storage > Cookies (Firefox) sits the jar itself: one row per cookie with Name, Value, Domain, Path, Expires/Max-Age, HttpOnly, Secure, SameSite, the header anatomy, tabulated. The jar is a real file, a SQLite database in your profile directory (Firefox's is literally `cookies.sqlite`): persistent cookies are rows that survive restarts; session cookies are never written. Edit the flash cookie's value in that panel and reload: the signature check fails and nothing renders, the signed-cookie guarantee doing its job.

## Predict, then verify

The flash cookie is set with no `Max-Age`. A user fails a login, sees the message, quits the browser, reopens it, and visits `/login`. Do they see "Authentication failed" again?

Answer: no, twice over. A cookie without `Max-Age` or `Expires` is a session cookie, memory only, so quitting destroyed it. And even without quitting they would not see it: `GET /login` attached a removal cookie (`Max-Age=0`) when it first rendered the message, consuming it. That is what "flash" means: one render, then gone.
