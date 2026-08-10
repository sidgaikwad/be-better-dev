The first cut of `validate_credentials` runs `SELECT user_id FROM users WHERE username = $1 AND password = $2`. Every password sits in Postgres in cleartext. An attacker does not even need to compromise the live database: one unencrypted backup impersonates every user. Chapter 10 climbs out of that hole one rung at a time, and each rung teaches why the next one exists.

## Rung 1: store a transformation, not the password

We never need the password back, only an equality check at login. So store `f(password)` and compare it against `f(candidate)`. For that to help, `f` must be practically impossible to invert, and similar inputs must produce unrelated outputs (the avalanche effect), or an attacker can recover properties like length and mount a targeted search. That is the job description of a cryptographic hash function: SHA-2, SHA-3, and friends map any input to a fixed-length digest.

```rust
let password_hash = sha3::Sha3_256::digest(password.as_bytes());
let password_hash = format!("{:x}", password_hash); // hex, to fit a TEXT column
```

## Rung 2: fast hashes lose to dictionaries

Is SHA3-256 enough? Against inverting a specific hash (a preimage attack), yes: that is a `2^n` search, unfeasible for `n > 128`. Against blind brute force, mostly: all alphanumeric passwords under 17 characters is roughly `8 * 10^24` candidates, about 30 years even with a million GPUs.

But attackers do not enumerate; they use what people actually type. Take the 10 million most common passwords from public breach datasets, hash them all, minutes of work, because SHA-3 is _designed_ to be fast, then scan the stolen table for matches. This is a dictionary attack, and rainbow tables are the same idea industrialized: precompute once, look up forever. The speed that makes SHA-3 great for checksums is precisely the flaw here.

## Rung 3: salt, then make hashing expensive

Salting breaks precomputation: generate a random string per user, prepend it to the password before hashing, store the salt next to the hash. The attacker can still run their dictionary, but per user, `dictionary_size * n_users` hashes, and nothing computed before the breach helps. You have bought time to detect the breach and force resets.

Then make each hash _cost_ something. Argon2, bcrypt, scrypt, and PBKDF2 are deliberately expensive, with tunable knobs so defenders can keep pace with hardware. OWASP's pick: Argon2id with at least 15 MiB of memory, iteration count 2, parallelism 1, which maps directly onto the `argon2` crate:

```rust
let hasher = Argon2::new(
    Algorithm::Argon2id,
    Version::V0x13,
    Params::new(15000, 2, 1, None)?, // m_cost in KiB, t_cost, p_cost, output length (None = 32 bytes)
);
```

(The book pins `argon2 0.3`; the crate is at 0.5 today with the same shape.)

## The PHC string: parameters travel with the hash

Verification must replay the exact salt and load parameters that produced a hash. Storing those in ad hoc columns collapses the moment you raise costs or switch algorithms. The PHC string format packs everything into one value:

```
$argon2id$v=19$m=15000,t=2,p=1${salt}${hash}
```

`PasswordHash::new` parses it, and `Argon2::default().verify_password(candidate, &parsed)` reads the algorithm, version, params, and salt from the string itself. Old hashes keep verifying under old parameters, and you can transparently rehash at a user's next login. The comparison runs in constant time, one timing leak closed at zero cost. (Passwords travel through these signatures as secrecy's `Secret<String>`, so a stray `Debug` log prints a redaction; newer secrecy versions call it `SecretString`.)

## One deeper: the login that leaks usernames

The book measures two failed logins: unknown username, about 1ms; known username with a wrong password, about 10ms. The difference is argon2 running or not, and with enough samples it is detectable across a network: a timing attack. An attacker holding a candidate list (scraped employee names, predictable corporate email formats) can confirm which usernames exist, user enumeration, a stepping stone to targeted attacks. The fix is to do the same work on both paths: when the username is unknown, verify the candidate against a hardcoded fallback PHC hash, and only ever return a user id for genuine matches. Rate limiting failed attempts is the complementary defense, but it needs state we have not built yet.

## Predict, then verify

Your `users` table leaks. Hashes are salted SHA3-256, your dictionary-wielding attacker has `10^7` entries, and you have `10^4` users. Roughly how many hashes must they compute, and is that a real obstacle?

Answer: `dictionary_size * n_users = 10^11`. At the `~10^9` SHA-3 hashes per second one GPU manages, that is under two minutes: salting without a slow hash only inconveniences. With argon2id at OWASP parameters, each guess costs tens of milliseconds and 15 MiB of RAM, and the same attack stops being economical. You need both rungs, which is why the crate's API forces salt and cost parameters together.
