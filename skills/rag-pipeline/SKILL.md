---
name: rag-pipeline
description: "Design and implement Retrieval-Augmented Generation (RAG) pipelines — chunking"
---
---

# RAG Pipeline

Design and implement Retrieval-Augmented Generation (RAG) pipelines — chunking
strategies, embedding models, vector databases, retrieval algorithms, and
response generation — connecting LLMs to external knowledge.

## What problem this solves
LLMs hallucinate on proprietary data they weren't trained on. RAG grounds
generation in retrieved documents — the LLM answers from your knowledge base,
not from its training data. This skill designs the full RAG stack from
document ingestion to citation-backed answers.

## When to use
When building Q&A over documentation, knowledge bases, or private data. When
the LLM needs domain-specific knowledge. When hallucinations must be eliminated
through source-backed answers.

## Input
Document corpus, query patterns, latency requirements, accuracy requirements.

## Output
A complete RAG pipeline with chunking, embedding, retrieval, and generation
configuration — ready for deployment.

## Steps
1. Analyze document corpus: format (PDF, Markdown, HTML), size, update frequency
2. Design chunking strategy:
   - Fixed-size (256-1024 tokens) for general text
   - Semantic (sentence/paragraph boundaries) for structured docs
   - Hierarchical (parent-child) for large documents with structure
3. Select embedding model: `all-MiniLM-L6-v2` (fast, 384d), `bge-large` (accurate, 1024d)
4. Choose vector database: Chroma (lightweight), Qdrant (performance), Pinecone (managed)
5. Design retrieval: keyword (BM25) + vector (cosine similarity) hybrid search
6. Add reranking: cross-encoder to score top-N results for relevance
7. Design prompt template: system prompt → retrieved context → user query → constraints
8. Evaluate: retrieval recall, answer correctness, hallucination rate

## Rules
- Retrieval first, generation second — fix retrieval quality before tuning prompts
- Hybrid search (keyword + vector) outperforms either alone in most cases
- Chunk size: 256-512 tokens for Q&A, 1024+ for summarization
- Include source citations in generated answers — provenance matters
- Re-rank top-N results with cross-encoder for 10-20% relevance improvement
- Evaluate with test queries — 80%+ retrieval recall before deployment
- Coordinate with María for LLM deployment and model selection
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
