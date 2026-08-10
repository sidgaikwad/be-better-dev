`docker pull rust:1.85` prints half a dozen progress bars, not one. Each is a layer, and layers explain most of Docker's behavior that otherwise looks arbitrary: why images share disk, why deleting a file can fail to shrink anything, and why chapter 5's Dockerfile chained `apt-get clean` onto the install line.

## An image is a stack of tarballs

An image is a JSON manifest pointing at a config object and an ordered list of layers; each layer is a compressed tarball holding one instruction's filesystem changes. `docker history rust:1.85` shows the recipe with a size per line. Crucially, layers are content-addressed: their identity is the sha256 of their bytes. That buys deduplication everywhere. `rust:1.85` is built on Debian, so on a machine that already pulled `debian`, those base layers print `Already exists` and transfer nothing; on disk they are stored once no matter how many images stack on them. A registry is layer storage with tags on top.

## overlayfs assembles the stack

At `docker run`, the `overlay2` storage driver mounts all the image layers as a read-only stack plus one fresh writable directory on top:

```
mount -t overlay overlay -o lowerdir=L3:L2:L1,upperdir=containerRW,workdir=...
```

Reads fall through top-down until a layer supplies the file. Writes are copy-on-write: the first write to a file from a lower layer copies the whole file up to the writable layer, then modifies it (append one byte to a 1 GB file inherited from the image and you pay a 1 GB copy first). Deletes write a whiteout, a marker entry that masks the lower file without touching it. `docker diff <container>` lists exactly this upper layer: `A` added, `C` copied up and changed, `D` whited out.

The same mechanics apply between image layers, which produces the classic trap:

```dockerfile
RUN curl -LO https://example.com/dataset.tar.gz   # layer: +300MB
RUN rm dataset.tar.gz                             # layer: +one whiteout
```

The image still ships all 300MB; the second layer just hides it. Layers are append-only history, not a mutable filesystem. This is why chapter 5's runtime stage does `apt-get install ... && rm -rf /var/lib/apt/lists/*` in a single `RUN` (one layer, garbage never committed), and why multi-stage builds are the real diet: `COPY --from=builder` starts a new stack containing only what you carry across.

## The writable layer is disposable

The container's root filesystem is image layers plus that one upperdir, and `docker rm` deletes the upperdir. Run Postgres in a container with no volume and every row lives in the writable layer; remove the container and the data is gone. Named volumes exist for exactly this: a directory mounted into the merged view from outside the overlay, surviving the container, and skipping copy-up costs on hot write paths, which is why databases always get one. The compose lesson will give our newsletter's Postgres a `pgdata` volume for this reason.

One more consequence worth naming now: content addressing makes layers cache entries. Identical inputs produce identical digests produce reuse. The next lesson is entirely about what "identical inputs" means, because Rust compile times make the difference between hit and miss a fifteen-minute question.

## Predict, then verify

Two containers run from the same image. Container A writes a 1 GB temp file. What does container B see, and what happens to the gigabyte when A is removed?

Answer: B sees nothing. The image layers are shared read-only, but each container gets its own private upperdir, and A's gigabyte lives there; B's merged view stacks the same lower layers under a different, empty top. `docker rm a` deletes A's upperdir and the space returns. Sharing is at the image layer, isolation is at the writable layer, and nothing a container writes ever flows back down into the image.
