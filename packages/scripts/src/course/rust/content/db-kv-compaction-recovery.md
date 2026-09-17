The last lesson ended with a store that forgets its index on restart and a file that grows forever. Both flaws have the same cure, because the log is the source of truth and everything else is derived from it.

## Recovery is replay

If the log holds the whole history, the index is reconstructible: scan from offset zero, insert each key with the offset where its record starts, and let later records overwrite earlier index entries. Last write wins, by construction.

```rust
const TOMBSTONE: u32 = u32::MAX;

impl Store {
    fn replay(&mut self) -> io::Result<()> {
        let len = self.read.get_ref().metadata()?.len();
        self.read.seek(SeekFrom::Start(0))?;
        let (mut at, mut header) = (0u64, [0u8; 8]);
        while at + 8 <= len {
            self.read.read_exact(&mut header)?;
            let key_len = u32::from_le_bytes(header[0..4].try_into().unwrap()) as u64;
            let val_raw = u32::from_le_bytes(header[4..8].try_into().unwrap());
            let val_len = if val_raw == TOMBSTONE { 0 } else { val_raw as u64 };
            let record = 8 + key_len + val_len;
            if at + record > len {
                break; // torn tail: a crash cut this record short
            }
            let mut key = vec![0u8; key_len as usize];
            self.read.read_exact(&mut key)?;
            self.read.seek(SeekFrom::Current(val_len as i64))?;
            let key = String::from_utf8(key).map_err(|_| io::ErrorKind::InvalidData)?;
            if val_raw == TOMBSTONE {
                self.index.remove(&key);
            } else {
                self.index.insert(key, at);
            }
            at += record;
        }
        self.log.get_ref().set_len(at)?; // physically drop the torn tail
        self.end = at;
        Ok(())
    }
}
```

Add `store.replay()?` to `open` and the amnesia is gone. The torn-tail check is crash recovery in miniature: a process killed mid-append leaves a half-record at the end, replay detects it because the lengths overrun the file, and truncating it discards an update that was never acknowledged, the same contract an uncommitted transaction gets. Real Bitcask also puts a CRC in each record, catching corruption inside a record rather than only truncation at the end.

Deletion rides the same machinery: `delete` appends a record with `val_len = TOMBSTONE` and no value bytes, then removes the key from the index. Replay handles tombstones by removing, so deletes survive restarts without ever modifying old bytes.

## Compaction: rewrite the present, drop the history

Dead records and tombstones accumulate. Reclaiming them is a rewrite of only what the index can still see:

```rust
impl Store {
    pub fn compact(&mut self, path: &Path) -> io::Result<()> {
        let tmp = path.with_extension("compacting");
        let mut out = BufWriter::new(File::create(&tmp)?);
        let (mut fresh, mut at) = (HashMap::new(), 0u64);
        for key in self.index.keys().cloned().collect::<Vec<_>>() {
            let value = self.get(&key)?.expect("indexed key");
            out.write_all(&(key.len() as u32).to_le_bytes())?;
            out.write_all(&(value.len() as u32).to_le_bytes())?;
            out.write_all(key.as_bytes())?;
            out.write_all(&value)?;
            let len = 8 + key.len() as u64 + value.len() as u64;
            fresh.insert(key, at);
            at += len;
        }
        out.into_inner()?.sync_all()?;
        std::fs::rename(&tmp, path)?; // the atomic moment
        self.log = BufWriter::new(OpenOptions::new().append(true).open(path)?);
        self.read = BufReader::new(File::open(path)?);
        self.index = fresh;
        self.end = at;
        Ok(())
    }
}
```

The safety of the whole operation hangs on one POSIX guarantee: `rename` atomically replaces the target. Until that syscall returns, the old log is untouched and authoritative; after it, the new file is complete and already fsynced. There is no in-between state to recover from. (The truly meticulous also fsync the directory, so the rename itself survives power loss.) Bitcask does this with generations of segment files merged in the background; ours is the one-file version of the same move.

## What real engines layer on

Postgres separates the two jobs our one file does: tables and B-tree indexes live in 8 KB pages updated in place, and durability comes from a separate append-only file, the write-ahead log. Crash recovery replays the WAL: our loop, at scale, with checkpoints bounding how far back replay starts. B-trees buy cheap point reads and range scans, which our HashMap index cannot offer, and pay with random IO on writes. LSM engines (RocksDB, Cassandra) make the opposite bet and are our design's direct descendants: writes land in a memtable, flush as sorted runs, and background compaction merges runs, sequential writes like ours plus sorted order, billed as compaction work and reads that may check several runs. Log for durability, index for finding, compaction for space: every database you will ever use is an arrangement of those three, and you have now built each one.

## Predict, then verify

The process is killed halfway through `compact`, before the rename. What survives a restart?

Answer: everything. Compaction only reads the old log; the temp file absorbs all the writes, and until `rename` the old file is still the one `open` reads and replays. The half-written `.compacting` file is simply ignored (the next compaction's `File::create` truncates it). Kill the process a moment later, after the rename, and the new file is complete and fsynced, so everything survives that way too. Crash safety here is not careful locking; it is having designed the states so that every crash lands in a good one.
