Duplicate detection needs an embedding for every issue the newsletter has ever sent: 900 today, and more every week. Sending them to a hosted endpoint means 900 round trips, an API key in one more place, and a bill, for a model that is 90 MB on disk and runs on a laptop CPU in single-digit milliseconds. This is the case where running the model yourself is the simple option, not the heroic one.

## What the model actually does

`all-MiniLM-L6-v2` is a good default: six transformer layers, about 22M parameters, and a 384-dimensional output. Token ids go in, one vector per token comes out, you average those vectors into one vector per text (mean pooling) and scale it to unit length. After normalisation, cosine similarity is just a dot product, and "how similar are these two issues" becomes one multiply-accumulate over 384 floats.

Two crates will run it in your process, and they take opposite routes.

## candle: the model, rewritten in Rust

candle is Hugging Face's minimal ML framework in Rust: tensors, autograd, and CPU, CUDA, and Metal backends. Its companion crate `candle-transformers` contains architectures ported to Rust (BERT, Llama, Whisper, Stable Diffusion and more), so you load weights from a `safetensors` file and run a forward pass written in Rust.

```rust
use candle_core::{DType, Device, Tensor};
use candle_nn::VarBuilder;
use candle_transformers::models::bert::{BertModel, Config};

let device = Device::Cpu;                       // or Device::new_cuda(0)? / Device::new_metal(0)?
let vb = unsafe { VarBuilder::from_mmaped_safetensors(&[weights], DType::F32, &device)? };
let model = BertModel::load(vb, &config)?;

let ids = Tensor::new(token_ids, &device)?.unsqueeze(0)?;   // [1, seq]
let type_ids = ids.zeros_like()?;
let hidden = model.forward(&ids, &type_ids, None)?;         // [1, seq, 384]

let pooled = (hidden.sum(1)? / (seq_len as f64))?;          // mean pooling -> [1, 384]
let norm = pooled.sqr()?.sum_keepdim(1)?.sqrt()?;
let embedding = pooled.broadcast_div(&norm)?;               // unit length
```

`unsafe` on `from_mmaped_safetensors` is honest bookkeeping: the weights are memory-mapped, so another process truncating the file underneath you is undefined behaviour. A real mean pool also multiplies by the attention mask first, so padding positions do not drag the average toward nothing.

The deployment story is the point: no Python, no libtorch, one binary plus a weights file. The price is that a model exists in candle only if somebody ported its forward pass, and candle is pre-1.0, so signatures move between minor versions. `forward` gained its attention-mask argument in one such move. Pin the version.

## ort: the graph, run by ONNX Runtime

`ort` takes the other route. Export the model once from Python to ONNX, a portable graph format, and let ONNX Runtime (Microsoft's C++ engine) execute it. You never describe the architecture in Rust at all.

```rust
let session = Session::builder()?
    .with_optimization_level(GraphOptimizationLevel::Level3)?
    .with_intra_threads(4)?
    .commit_from_file("all-MiniLM-L6-v2.onnx")?;

let outputs = session.run(ort::inputs![
    "input_ids" => ids,
    "attention_mask" => mask,
])?;
```

You get mature GPU support (CUDA, TensorRT, CoreML, DirectML and WebGPU as execution providers) and int8 quantisation, at the cost of linking a C++ library and shipping the ONNX file. Fair warning: `ort` 2.0 spent a long time in release candidates and its API shifted between them (`with_model_from_file` became `commit_from_file`, tensor extraction changed shape), so read the docs for the version you pinned rather than a blog post.

If you want a vector today and no opinions, `fastembed` wraps `ort`, `tokenizers`, and model downloads into three lines. Start there and drop down when you need control.

## Where the time goes

Loading dominates. Reading and laying out 90 MB of weights takes tens or hundreds of milliseconds; inference on a short sentence takes single-digit milliseconds. Loading belongs at startup, into an `Arc` in app state, never in a handler.

The other trap: a forward pass is dense matrix multiplication that saturates every core it is given, and both engines run their own thread pools. On a tokio worker thread that blocks the worker completely and every other task on it waits, which is the cooperative-scheduling hazard from Part 2. `spawn_blocking` is the minimum; a dedicated service is better, which is the next lesson.

## Predict, then verify

You put `BertModel::load` inside the axum handler. It passes a smoke test. Then production sends 50 requests per second. Predict what happens.

Answer: each request re-reads and re-lays-out 90 MB of weights and constructs another engine with its own thread pool. Resident memory climbs with concurrency, the CPU spends its time in page faults and context switches between dozens of competing thread pools rather than in matrix multiplies, and latency collapses long before you run out of cores. The fix is one line of structure: load once at startup, share the model, and let the request path only push tensors through it.
