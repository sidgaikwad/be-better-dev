The assist button sends the issue draft to a provider and asks for five subject lines. It works for months, then someone pastes a conference transcript into the draft and the call returns `400 context_length_exceeded` after four seconds of waiting. Nothing in that failure needed a round trip to discover: the request was too big before it left the process.

## Text goes in, integers come out

A model never sees your characters. It sees a sequence of integers, one per token, produced by a tokenizer that was frozen when the model was trained. `Ship faster on Fridays` is a handful of tokens; a base64 blob of the same length is many times more.

BPE (byte pair encoding), the scheme behind the GPT-family tokenizers, is less clever than its reputation. Start with raw bytes as the vocabulary. Count every adjacent pair of symbols across a training corpus, merge the most frequent pair into a new symbol, write the merge down, repeat until the vocabulary hits its target size. Encoding replays those recorded merges over your text, in the order they were learned. That is the whole algorithm. The consequences are the useful part: frequent words survive as one token, rare words shatter into fragments, the leading space is part of the token (`" the"` and `"the"` are different ids), and because the base vocabulary is bytes, nothing is unencodable. English prose lands near four characters per token. Code, JSON, and non-Latin scripts land much worse, sometimes near one token per character.

BPE is not the only scheme. BERT-family models, including the embedding model in the next lesson, use WordPiece; some models use Unigram. The `tokenizers` crate implements all three, so the API below is the same whichever your model was trained with.

## The tokenizers crate is the original

```toml
tokenizers = "0.21"   # pre-1.0 and moving; pin it and read that version's docs
```

```rust
use tokenizers::Tokenizer;

let tokenizer = Tokenizer::from_file("tokenizer.json")?;
let enc = tokenizer.encode("Ship faster on Fridays", true)?;

println!("{} tokens", enc.len());
println!("{:?}", enc.get_tokens());
let ids: &[u32] = enc.get_ids();
```

Worth knowing where this crate came from: it is Hugging Face's, and the "fast tokenizer" in Python `transformers` is a PyO3 binding around this exact Rust code. You are not using a port.

The second argument is `add_special_tokens`. For an embedding model it must be `true`: the model was trained with `[CLS]` and `[SEP]` in place, and its output vector changes without them. For estimating the cost of a chat request it barely matters.

`Encoding` also carries offsets. `enc.get_offsets()` maps each token back to a byte range in your input, which is how you cut at a token boundary instead of slicing a string in half:

```rust
let budget = 6_000;
let enc = tokenizer.encode(draft.as_str(), false)?;
if enc.len() > budget {
    let (_, end) = enc.get_offsets()[budget - 1];   // byte offset past the last kept token
    draft.truncate(end);
}
```

## Counting what a hosted provider will charge you

Hosted models are the awkward case, because you often do not have their tokenizer file. OpenAI publishes tiktoken and `tiktoken-rs` ports it to Rust (`o200k_base` for current model generations, `cl100k_base` for older ones). Anthropic does not publish a tokenizer file; it exposes a count-tokens endpoint you call before sending.

Treat any local count as an estimate. System prompts, tool schemas, and images add tokens you cannot see, and encodings change between model generations. The authoritative number is the `usage` object in the response, which is what you log per request and bill against.

## The part that bites in production

`encode` is CPU work on the calling thread. Tokenizing a megabyte of pasted transcript inside an axum handler blocks a tokio worker for the duration, and every other task on that thread waits. Use `spawn_blocking` for large inputs, or push the work into the inference service in the next lesson.

Load the tokenizer once. It is `Send + Sync`, so build it at startup and share an `Arc<Tokenizer>`. Reading `tokenizer.json` per request re-parses several megabytes of JSON to answer a question about one paragraph.

## Predict, then verify

Which text costs more tokens: `Ship faster on Fridays`, or `ShipFasterOnFridays`?

Answer: the second, despite being three characters shorter. Merges were learned over ordinary text where words are preceded by spaces, so `" faster"` and `" Fridays"` exist as single learned symbols while nothing in the merge table joins `p` to `F` across a case boundary. The concatenated version falls back to smaller fragments and costs more. Price tracks tokens, not characters, which is why "compressing" a prompt by stripping whitespace can raise the bill.
