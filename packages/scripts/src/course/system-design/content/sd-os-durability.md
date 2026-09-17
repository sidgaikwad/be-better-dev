Six nines of durability means that of a million objects you would expect to lose one in a year. Disks fail at around 0.81% annually, so the entire second half of this design is about getting from one to the other.

## Replication

Three copies. With a 0.81% annual failure rate per drive, the chance of all three failing is `0.0081³`, which is about `5 × 10^-7`, so roughly six nines.

That arithmetic assumes independent failures, which this course has been consistent that they are not, so placement matters as much as count.

## Failure domains

A **failure domain** is a scope that fails together:

- **Node**: one server's motherboard, power supply and drives.
- **Rack**: servers sharing a switch and a power feed.
- **Availability zone**: independent power, cooling and network.

Three copies in one server survive a drive failure and not a power supply. Three in one rack survive a server and not the switch. Spread across availability zones, a data center losing power costs you one copy.

The precise statement is worth getting right, because it is easy to overclaim: spreading across failure domains does not raise the arithmetic durability at all. It makes the independence assumption true, and without it the number is a fiction.

## Erasure coding

The alternative to whole copies. Split the object into chunks and compute parity chunks so any sufficient subset reconstructs the original.

In a 4+2 scheme, data becomes `d1..d4` plus parities `p1, p2` from a formula like `p1 = d1 + 2*d2 - d3 + 4*d4`. Lose `d3` and `d4` and they reconstruct from the rest. An 8+4 scheme spreads 12 chunks across 12 failure domains and survives any 4 failing.

## The comparison

|                      | Replication (3x)                | Erasure coding (8+4)        |
| -------------------- | ------------------------------- | --------------------------- |
| Durability           | 6 nines                         | 11 nines                    |
| Storage overhead     | 200%                            | 50%                         |
| Compute              | None                            | Parity calculation on write |
| Write latency        | Lower                           | Higher: parities first      |
| Normal reads         | One replica                     | Multiple nodes              |
| Reads during failure | Unaffected: use another replica | Slower: reconstruct first   |

Erasure coding is better on the two headline numbers and worse on everything about latency and complexity.

Choose by workload, which is the answer rather than a number. Replication for latency-sensitive data, since a read is one node and a failure is invisible. Erasure coding for cold data, where 50% overhead instead of 200% on 100 PB is an enormous saving and nobody notices a slower read.

For this design, replication, because it keeps the data node simple. Say the erasure coding option exists and what it would buy, because "we store three copies" without that comparison sounds like the only idea you had.

## Corruption

A failed drive is detectable and handled. Silent corruption, a bit flipping in memory or on the wire, is not: the data is wrong and every system reports success.

The defense is checksums at every process boundary: compute one on write, store it with the data, verify on every read and transfer. A mismatch means that copy is corrupt, so discard and repair it from another.

The phrase to hold is at every boundary. A checksum computed and verified inside one process proves nothing about the network hop before it, and corruption in transit is exactly what you are defending against.

## Predict, then verify

You store three replicas and verify checksums on read. A read finds replica 1 corrupt. What do you do, and what if replica 2 is also corrupt but differently?

Answer: serve from a good replica and repair the bad one, which is the easy half. The second case is the interesting one, because with two of three corrupt you can tell that something is wrong and not which copy is right, since majority voting needs a majority and you have one clean copy against two differing corrupt ones. What resolves it is that a checksum is not a vote: it is stored with each copy and verifies that copy against itself, so a copy whose data does not match its own checksum is provably corrupt regardless of what the others say. So you discard both failing copies and rebuild from the one that verifies. That only works if the checksum itself is protected, which is why it is stored separately from the data and often replicated independently. The case with no correct answer is all three failing verification, which means the object is lost, and the honest response is to detect and report it rather than to serve corrupt bytes. That detection is what makes durability measurable at all: a system that cannot tell corrupt data from good data cannot claim any number of nines.
