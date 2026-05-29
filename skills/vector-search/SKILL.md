---
name: vector-search
description: "Implement vector similarity search — embedding strategies, index configuration,"
---
---

# Vector Search

Implement vector similarity search — embedding strategies, index configuration,
approximate nearest neighbor algorithms, and hybrid search — enabling semantic
search across unstructured data.

## What problem this solves
Keyword search fails on semantic meaning ("car" vs. "automobile" returns nothing).
Vector search finds semantically similar content — even when exact words don't
match — powering RAG, recommendation, and similarity applications.

## When to use
When keyword search returns poor results. When building RAG, recommendation,
or similarity features. When users ask "find things like this" not "find exact match."

## Input
Data to index, query patterns, latency requirements, accuracy requirements.

## Output
A vector search configuration with embedding model, index parameters, HNSW/IVF
settings, and query pipeline.

## Steps
1. Choose embedding model based on task (sentence, code, multilingual, multimodal)
2. Configure vector index:
   - HNSW (hierarchical navigable small world): fast, memory-heavy, great for < 10M vectors
   - IVF (inverted file): scalable, disk-friendly, great for > 10M vectors
3. Set index parameters: M (connections per node), ef_construction, ef_search
4. Implement indexing pipeline: chunk → embed → upsert with metadata
5. Design query: embed query → ANN search → filter by metadata → return top-K
6. Add hybrid search: combine BM25 scores + vector scores (weighted or reciprocal rank fusion)
7. Benchmark: recall@10 (accuracy) and QPS (throughput) at target volume

## Rules
- Cosine similarity for normalized embeddings, dot product otherwise
- HNSW for < 10M vectors (accuracy); IVF for > 10M (scalability)
- Metadata filtering: always add source, date, type for post-retrieval filtering
- Hybrid search (BM25 + vector) improves recall 15-30% over vector alone
- Benchmark with YOUR data — recall varies dramatically by domain
- Monitor: query latency distribution, recall@K trend, index size growth
- Coordinate with María for embedding model selection and RAG integration
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
