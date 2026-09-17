The newsletter API and its delivery worker never call each other. They coordinate through a Postgres table: the API inserts rows into `issue_delivery_queue`, the worker polls for them, and the contract between two deployed services is whatever that table's columns happen to be this week. Nothing enforces the agreement, so drift surfaces at runtime, as a worker that cannot read what the API wrote. gRPC's first move has nothing to do with networking: write the contract in a file, and make both sides compile against it.

## The schema

```proto
syntax = "proto3";
package newsletter;

message NewsletterIssue {
  string issue_id = 1;
  string title = 2;
  string html_content = 3;
  uint32 subscriber_count = 4;
}

message EnqueueReply {
  bool accepted = 1;
}

service Delivery {
  rpc EnqueueIssue(NewsletterIssue) returns (EnqueueReply);
}
```

This is proto3, the current protobuf dialect. `message` declares a record type, `service` declares callable RPCs, and the `protoc` compiler turns the file into structs and stubs for any language (the Rust side is the next lesson). The number is the part newcomers misread: `title = 2` assigns no default. It is the field number, the field's permanent identity on the wire.

## What actually crosses the wire

Serialize a `NewsletterIssue` with `title: "Launch"` and `subscriber_count: 812`, other fields unset:

```
12 06 4c 61 75 6e 63 68    field 2, wire type 2: length 6, then "Launch"
20 ac 06                   field 4, wire type 0: varint 812
```

Eleven bytes. The JSON equivalent, `{"title":"Launch","subscriber_count":812}`, is 41, and most of the difference is the keys: protobuf never writes a field's name. Each field opens with a tag byte, the field number shifted left three bits, with the low three bits naming a wire type: 0 for varints (integers packed seven bits per byte, low bits first, which is why 812 becomes `ac 06`), 2 for length-delimited data like strings and nested messages, 1 and 5 for fixed 64- and 32-bit values. So `0x12` reads as "field 2, length-delimited" and `0x20` as "field 4, varint".

Two consequences follow. First, absent fields cost zero bytes, and proto3 treats zero values (`0`, `""`, `false`) as absent. Second, a decoder that has never heard of field 4 can still get past it, because the wire type alone says how many bytes to skip. That skippability is not trivia; it is the entire compatibility model.

## Field numbers are the evolution rules

Because names never cross the wire and unknown numbers are skippable:

- Renaming a field is wire-safe. Generated code changes; bytes do not.
- Adding a field is safe in both directions: an old reader skips the unknown number (forward compatibility), and a new reader of old bytes sees the zero value (backward compatibility).
- Deleting a field means retiring its number forever: write `reserved 4;` (and reserve the old name) so `protoc` rejects reuse.
- Changing a number, or reusing a retired one, is the disaster case: old bytes decode cleanly into the wrong field, with no error anywhere.

Numbers 1 through 15 fit the whole tag in one byte; spend them on the fields you send most.

## Discipline you already practice

You have deployed under this constraint before. The zero-downtime deployment lesson had versions N and N+1 of the app sharing a database mid-rollout, which forced migrations into add, migrate, then drop. Protobuf mechanizes the same discipline for messages: every change must leave the previous reader and the previous writer working, because during a rollout both are live. One proto3 footgun deserves respect: since zero values are not encoded, a reader cannot tell "subscriber_count is 0" from "nobody set it". When that distinction matters, mark the field `optional`, which restores explicit presence tracking and generates `Option<u32>` in Rust instead of a bare `u32`.

## Predict, then verify

Two proposed edits to `NewsletterIssue`: (a) rename `html_content` to `body`, keeping `= 3`; (b) swap the numbers of `title` and `html_content` because "the order reads better". Old binaries stay live during the rollout. What does each change do?

Answer: (a) is invisible on the wire. Names exist only in source and generated code, so old and new binaries interoperate; your Rust code needs a mechanical rename and nothing else. (b) breaks silently and completely: both fields are strings, so an old writer's title decodes, without any error, into a new reader's `html_content`, and subscribers get an email whose body is the subject line. Compiler, `protoc`, and runtime all stay quiet, which is exactly why the numbering rules are law rather than advice.
