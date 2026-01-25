# ADR 002: FAISS vs Pinecone for Vector Store

**Status:** Accepted  
**Date:** 2026-01-10  
**Deciders:** Platform Architecture Team

## Context

We needed a vector database for RAG (Retrieval-Augmented Generation) to store and search travel policy documents.

Requirements:
- Fast similarity search (<100ms for k=3)
- Support for 1000+ documents
- Cost-effective for demo/development
- Easy local development
- Production scalability

## Decision

We chose **FAISS** (Facebook AI Similarity Search) over **Pinecone** for our vector store.

## Rationale

### Why FAISS?

1. **Zero Cost**
   - Open source, no API fees
   - Run locally or in containers
   - No vendor lock-in

2. **Local Development**
   - Works in docker-compose
   - No internet required
   - Fast iteration

3. **Performance**
   - Sub-millisecond search for our scale
   - Efficient memory usage
   - Multiple index types (Flat, IVF, HNSW)

4. **Control**
   - Full control over indexing
   - Custom distance metrics
   - No rate limits

5. **Production Ready**
   - Used by Meta, Spotify, others
   - Battle-tested at scale
   - Good Python bindings

### Why Not Pinecone?

**Pinecone (Managed Vector DB):**
- ❌ Cost: $70+/month for production
- ❌ Requires internet for local dev
- ❌ API rate limits
- ✅ Easier scaling (managed)
- ✅ Built-in monitoring
- ✅ Multi-region replication

**Trade-off:** We chose FAISS for cost and local dev, with option to migrate to Pinecone if scale demands it.

### Migration Path

If we outgrow FAISS (>1M documents, multi-region):
1. Abstract vector store interface
2. Implement Pinecone adapter
3. Migrate data with zero downtime
4. A/B test performance

## Consequences

### Positive
- $0 cost for development and demo
- Fast local development
- No external dependencies
- Full control over indexing

### Negative
- Need to manage our own scaling
- No built-in monitoring
- Manual backup/restore
- Single-region by default

### Neutral
- Need to implement our own persistence
- Responsible for index optimization

## Implementation

```python
import faiss
import numpy as np

# Create index
dimension = 384  # sentence-transformers/all-MiniLM-L6-v2
index = faiss.IndexFlatL2(dimension)

# Add vectors
vectors = np.array([...])  # shape: (n, 384)
index.add(vectors)

# Search
query_vector = np.array([...])  # shape: (1, 384)
distances, indices = index.search(query_vector, k=3)
```

## Performance Benchmarks

| Operation | FAISS | Pinecone |
|-----------|-------|----------|
| Index 1000 docs | 2s | 5s (API) |
| Search (k=3) | 5ms | 50ms (network) |
| Cost (1M queries/mo) | $0 | $70+ |

## References

- [FAISS GitHub](https://github.com/facebookresearch/faiss)
- [Pinecone Pricing](https://www.pinecone.io/pricing/)
- Internal: `services/vector-store-service/src/vector_db.py`
