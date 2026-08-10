You have now spent most of a course talking to Postgres. Time to stand on the other side of the counter. In this lesson and the next you will build a persistent key-value store in about 80 lines of std-only Rust: real files, real seeks, no crates. The design is not a toy of our invention; it is the shape of Bitcask, the storage engine that shipped inside the Riak database, and it rests on two decisions:

1. Never modify the file. Every write appends a record to the end.
2. Keep an in-memory `HashMap` from key to the byte offset of that key's newest record. Bitcask calls this the keydir.

A record is length-prefixed, nothing more:

```
[key_len: u32][val_len: u32][key bytes][value bytes]
```

## The store, the write path

```rust
use std::collections::HashMap;
use std::fs::{File, OpenOptions};
use std::io::{self, BufReader, BufWriter, Read, Seek, SeekFrom, Write};
use std::path::Path;

pub struct Store {
    log: BufWriter<File>,
    read: BufReader<File>,
    index: HashMap<String, u64>,
    end: u64, // where the next record will land
}

impl Store {
    pub fn open(path: &Path) -> io::Result<Self> {
        let log = OpenOptions::new().create(true).append(true).open(path)?;
        let end = log.metadata()?.len();
        Ok(Store {
            log: BufWriter::new(log),
            read: BufReader::new(File::open(path)?),
            index: HashMap::new(), // next lesson rebuilds this from the log
            end,
        })
    }

    pub fn put(&mut self, key: &str, value: &[u8]) -> io::Result<()> {
        let at = self.end;
        self.log.write_all(&(key.len() as u32).to_le_bytes())?;
        self.log.write_all(&(value.len() as u32).to_le_bytes())?;
        self.log.write_all(key.as_bytes())?;
        self.log.write_all(value)?;
        self.log.flush()?;
        self.end += 8 + key.len() as u64 + value.len() as u64;
        self.index.insert(key.to_owned(), at);
        Ok(())
    }
}
```

Note the order: bytes reach the file first, the index is updated last. An overwrite is just another append plus a repoint of the index entry; the old record's bytes stay in the file as dead weight. The log is the history, the index is the present.

## The read path

```rust
impl Store {
    pub fn get(&mut self, key: &str) -> io::Result<Option<Vec<u8>>> {
        let Some(&at) = self.index.get(key) else {
            return Ok(None);
        };
        self.read.seek(SeekFrom::Start(at))?;
        let mut header = [0u8; 8];
        self.read.read_exact(&mut header)?;
        let key_len = u32::from_le_bytes(header[0..4].try_into().unwrap());
        let val_len = u32::from_le_bytes(header[4..8].try_into().unwrap());
        self.read.seek(SeekFrom::Current(key_len as i64))?;
        let mut value = vec![0u8; val_len as usize];
        self.read.read_exact(&mut value)?;
        Ok(Some(value))
    }
}
```

Every `get` is one HashMap lookup, one seek, two reads: constant disk work no matter how much history the log holds, because the index stores the exact offset. This is also why the design is fast to write: appends are sequential IO, the friendliest pattern a disk or SSD can receive, with no read-modify-write of existing data anywhere on the hot path. The trade hiding in plain sight: every key lives in RAM. Values can be terabytes on disk, but the key population is bounded by memory, and a `HashMap` cannot answer range queries. Both limits are real in Bitcask too.

## How durable is `flush`?

Honesty check from the cost-of-allocation lesson's playbook: `flush()` moves bytes from `BufWriter`'s buffer into the kernel's page cache. The OS will write them to disk eventually; a process crash loses nothing, but a power cut can. The real barrier is `fsync` (`File::sync_all`), which costs anywhere from hundreds of microseconds to milliseconds. Calling it per `put` would cap the store near a thousand writes per second, so real engines batch: accumulate a few writes, one `fsync` covers them all. Postgres's WAL group commit is exactly this bargain, and knobs like `synchronous_commit` are it being made adjustable.

## Predict, then verify

Run `put("a", b"1")`, `put("b", b"2")`, `put("a", b"3")`, then restart the process and call `get("a")`. What does the file contain, and what does `get` return?

Answer: the file holds all three records; the first `a` record is dead bytes nothing points to. Before the restart, `get("a")` returns `b"3"` because the index was repointed. After the restart it returns `None`: `open` starts with an empty index, and nothing yet reads the log to rebuild it. The data is safe on disk and the store cannot see it. That amnesia, and the dead bytes, are the next lesson.
