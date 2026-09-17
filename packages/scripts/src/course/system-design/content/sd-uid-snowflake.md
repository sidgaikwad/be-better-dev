Stop generating a number and start assembling one. Divide 64 bits into fields, give each field a job, and the properties you need fall out of the layout instead of out of coordination.

## The layout

```text
| 1 bit  | 41 bits   | 5 bits     | 5 bits  | 12 bits  |
| sign   | timestamp | datacenter | machine | sequence |
```

- **Sign bit**, 1 bit, always 0. Reserved, and it keeps the value positive in languages whose 64-bit integers are signed.
- **Timestamp**, 41 bits. Milliseconds since a custom epoch. Twitter's is 1288834974657, which is 4 November 2010.
- **Datacenter id**, 5 bits, so 32 data centers.
- **Machine id**, 5 bits, so 32 machines per data center.
- **Sequence**, 12 bits, so 4096 ids per millisecond per machine, reset every millisecond.

## Why each field is that size

**41 bits of milliseconds** is `2^41 - 1` milliseconds, which is about 69 years. Work it: 2,199,023,255,551 ms divided by 1000, by 86,400, by 365 gives roughly 69.7 years.

The custom epoch is what makes that useful. Counting from 1970 would have spent 40 of those years before the system was switched on. Counting from the day you deploy gives you the full 69.

**5 and 5 bits** encode 32 data centers and 32 machines each, so 1,024 generators. Fixed at startup, and the most dangerous numbers in the design: two machines configured with the same pair will produce identical ids the moment they generate in the same millisecond, silently.

**12 bits of sequence** gives 4,096 per millisecond per machine, which is 4.096 million per second per machine. Against the requirement of 10,000 per second, that is four hundred times the headroom on one machine.

## What the layout buys

**Time ordering, for free.** The timestamp occupies the high bits, so comparing two ids numerically compares their timestamps first. Sorting by id sorts by creation time, with no index on a separate column.

**Uniqueness with no coordination.** Two ids differ if they differ in any field. Different machines differ in the machine bits. The same machine in the same millisecond differs in the sequence. The same machine in different milliseconds differs in the timestamp. No generator ever talks to another one.

**Meaning you can read.** Given an id, you can extract when it was created and which machine made it, which is genuinely useful when debugging.

## Tuning the fields

The split is not sacred, it is a budget of 63 bits you allocate against your own numbers.

Low write rate and a long lifetime: take bits from the sequence and give them to the timestamp. Dropping the sequence to 10 bits still allows 1,024 per millisecond per machine, and the two bits extend the lifetime fourfold, to roughly 278 years.

More machines than 1,024: take from the sequence again. Two more bits gives 4,096 generators and still leaves 1,024 ids per millisecond each.

Say this out loud in an interview. Reciting Twitter's split is recall; deriving a split from the stated write rate and machine count is design.

## Predict, then verify

A snowflake generator gets its machine id from an environment variable. An autoscaling group launches instances from one template. What happens, and how do you fix it?

Answer: every instance gets the same machine id, and the generators collide as soon as two of them produce an id in the same millisecond with the same sequence counter, which at any real rate is immediately. The failure is quiet, which is the dangerous part: no exception, no log line, just duplicate primary keys surfacing later as constraint violations or, worse, as one record silently overwriting another. Fixing it means machine ids that are assigned rather than baked in. The usual approaches are a coordination service like ZooKeeper handing out a lease on a free id at startup, or deriving one from something already unique to the instance such as its private IP's low bits, or a registration step against a small table that refuses to start if no id is free. All of them share a property worth stating: the generator should fail to start rather than start with a duplicate, because an id generator that is down is an outage you notice and one that collides is corruption you find months later.
