Open the browser's network tab on any page with live updates and one request stands out: status 101, and it never finishes. That request is the entire HTTP career of a WebSocket. One round trip negotiates the switch; after it, the connection stops being HTTP at all.

## One last HTTP exchange

The client, say the newsletter admin's browser, sends a normal GET with unusual headers:

```
GET /admin/newsletters/progress HTTP/1.1
Host: newsletter.example
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

The server agrees, with a status code almost nothing else uses:

```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

`Sec-WebSocket-Key` looks like security and is not. It is sixteen random bytes in base64. The server appends a fixed GUID printed in RFC 6455, `258EAFA5-E914-47DA-95CA-C5AB0DC85B11`, hashes the concatenation with SHA-1, and returns the hash, base64 encoded, as `Sec-WebSocket-Accept`. Anyone can compute it, so it authenticates nobody. What it proves is narrower and still worth having: the other end genuinely implements WebSocket. A server that ignored the `Upgrade` header, or a cache replaying a stored response, cannot produce the matching `Accept`, and the client tears the connection down instead of pushing frames at software that will never understand them. Authentication remains your job. The handshake is a real HTTP request, so the admin session cookie rides along, and ordinary middleware can refuse the upgrade before it happens.

After the 101, the TCP connection stays and everything above it changes. No more requests or responses, no headers, no pairing of question to answer. Either side sends whenever it likes. That inversion is the reason the protocol exists: the server can push "1,204 sent" the moment it is true, instead of waiting to be polled.

## What travels instead: frames

Data now moves in frames: a header of 2 to 14 bytes, then payload. The header packs a FIN bit (is this the last fragment of its message), a 4-bit opcode, a mask bit, and the payload length: 7 bits normally, with 126 meaning "length in the next 2 bytes" and 127 meaning "in the next 8". A small JSON progress event from the server costs two bytes of framing.

Opcodes split into data and control. Data: `0x1` text, whose payload must be valid UTF-8 (tungstenite closes the connection over a bad byte), `0x2` binary, any bytes at all, and `0x0` continuation for the later fragments of a fragmented message. Control: `0x8` close, `0x9` ping, `0xA` pong. Control frames carry at most 125 bytes, are never fragmented, and may appear between the fragments of a data message, so a liveness check never queues behind a large upload. The liveness lesson leans on exactly that guarantee.

## One level deeper: why clients mask

The one asymmetry: every client-to-server frame must be masked, XORed with a fresh random 4-byte key carried in the same header, while server-to-client frames must not be. A key shipped beside the data is plainly not encryption. The threat is middleboxes: transparent proxies that speak HTTP but have never heard of WebSockets. Hostile JavaScript could open a "WebSocket" to a cooperating server and emit bytes shaped exactly like an HTTP request for some victim URL; a careless proxy watching the stream could parse those bytes as a real request and cache the attacker's chosen response for every user behind it. Masking makes the bytes on the wire unpredictable, so attacker-controlled payloads cannot impersonate HTTP to anything on the path. Servers do not run attacker-supplied code, so their direction is exempt, and the XOR costs almost nothing.

## Predict, then verify

A client sends the five-byte text "hello"; the server echoes the same five bytes back. One direction costs 11 bytes on the wire, the other 7. Which is which?

Answer: client to server is 11: a 2-byte header, the 4-byte masking key, then 5 masked payload bytes. Server to client is 7: the same 2-byte header and the payload, no mask. The masking rule is the only difference, and it is visible in any packet capture of a plain `ws://` connection: one direction reads as JSON, the other as noise, even though nothing is encrypted.
