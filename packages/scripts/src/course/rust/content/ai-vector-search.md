"Have we already sent an issue about this?" is not a keyword question. An issue titled "Why we stopped doing sprint planning" and one titled "Cadence over ceremony" can be the same article with no words in common, and `WHERE body LIKE '%planning%'` will never connect them. Embeddings do: the two drafts land near each other in 384-dimensional space. What you need is something that finds the nearest vectors quickly, and only among the issues you actually sent.

## What a vector store stores

qdrant is a vector database written in Rust, which makes it a nice thing to read as well as to run. Three nouns. A **collection** is a named set of points with a fixed vector size and distance metric. A **point** is an id, a vector, and a **payload**: arbitrary JSON you can filter on.

```rust
// qdrant-client = "1"  (gRPC on 6334, REST on 6333)
let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("issues")
            .vectors_config(VectorParamsBuilder::new(384, Distance::Cosine)),
    )
    .await?;

let payload: Payload = [("status", "sent".into()), ("issue_no", 217.into())].into();
client
    .upsert_points(UpsertPointsBuilder::new("issues", vec![
        PointStruct::new(217, embedding, payload),
    ]))
    .await?;

let hits = client
    .query(
        QueryPointsBuilder::new("issues")
            .query(draft_embedding)
            .limit(5)
            .filter(Filter::must([Condition::matches("status", "sent".to_string())]))
            .with_payload(true),
    )
    .await?;
```

Version note, because this is a fast-moving corner: the Rust client was reshaped around 1.10 into these builders, `QdrantClient` became `Qdrant`, and the separate search, recommend, and scroll calls were unified behind `query`. Older snippets you find will use `SearchPoints { .. }` structs and will not compile against a current client.

## Approximate, and on purpose

The index underneath is HNSW: a layered graph where each point links to near neighbours, sparse at the top and dense at the bottom. A search enters at the top layer, greedily walks toward the query, drops a layer, repeats. It visits a few hundred points instead of a million, and it can miss a true nearest neighbour. `hnsw_ef` sets how many candidates the walk keeps, trading recall for latency.

Say that plainly: vector search is approximate by default. Recall at k is a number you measure against a brute-force baseline on a sample, not a property you assume.

## Filters are where the design shows

Filtering sounds trivial and is the hard part. Search first and filter after, and a selective filter leaves you two results when you asked for five, or none. Filter first and you have thrown away the index.

qdrant pushes the filter into the graph walk and uses a cardinality estimate from **payload indexes** to pick a plan: for a loose filter it walks the graph, which carries extra links built for indexed payload values; for a very selective one it abandons the graph and scans the matching set exactly. That requires the index to exist:

```rust
client.create_field_index(
    CreateFieldIndexCollectionBuilder::new("issues", "status", FieldType::Keyword),
).await?;
```

Skip it and filtered queries degrade quietly, which is the failure mode that gets blamed on "the model".

## qdrant or pgvector, honestly

You already run Postgres. pgvector adds a `vector` column type with HNSW or IVFFlat indexes, and for this newsletter it is the correct answer:

- The embedding is written in the same transaction as the issue row. No dual write, no outbox, no drift between two systems.
- Filters are ordinary SQL over columns the planner has statistics for, and you can join to subscriber data in the same query.
- One system to run, back up, and page someone about.
- pgvector 0.8 added iterative index scans, fixing the worst of the old behaviour where a filtered HNSW query returned far fewer rows than requested.

Reach for qdrant when you can name the number that broke that. Usually it is memory: 9 million vectors at 384 dimensions and 4 bytes per float is about 14 GB before the graph, competing with your OLTP buffer cache. qdrant's answers are the ones only a dedicated engine makes: scalar quantisation to int8 (a quarter of the memory), binary quantisation with rescoring, on-disk vectors with mmap, sharding and replication designed around vectors, payload-based multitenancy, and hybrid sparse-plus-dense search fused server side. Real advantages at tens of millions of vectors, irrelevant at 900.

## Predict, then verify

A collection holds a million points. You search with `limit(5)` and a filter on `status = "sent"` that matches only 200 of them. You never created a payload index on `status`. Predict the outcome.

Answer: the query still returns correct-ish results, and it is slow. Without a payload index there is no cheap cardinality estimate, so the engine cannot know the filter is that selective and plans as if the graph walk will work. The walk then visits mostly points that fail the filter, burning distance computations on candidates it must discard, and recall suffers because the reachable matching points are scattered across a graph built for the whole collection. Creating the index is what lets the planner see 200 out of a million and switch to an exact scan of those 200, which is both faster and exactly correct.
