"""Hybrid search combining BM25 keyword matching with vector similarity."""
import math
from collections import Counter
from re import split as re_split

from pca_lite.retrieval.vector_store import VectorStore


class BM25:
    """Lightweight BM25 implementation (no external dependencies)."""

    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self._index: dict[str, list[tuple[int, float]]] = {}
        self._doc_lengths: list[int] = []
        self._doc_freqs: dict[str, int] = {}
        self._N: int = 0
        self._avgdl: float = 0.0

    def index(self, texts: list[str]) -> None:
        """Build inverted index from documents."""
        self._N = len(texts)
        self._doc_lengths = []
        self._doc_freqs = Counter()
        self._index.clear()

        for doc_id, text in enumerate(texts):
            tokens = self._tokenize(text)
            self._doc_lengths.append(len(tokens))
            for term, tf in Counter(tokens).items():
                if term not in self._index:
                    self._index[term] = []
                self._index[term].append((doc_id, float(tf)))
                self._doc_freqs[term] += 1

        self._avgdl = sum(self._doc_lengths) / max(self._N, 1)

    def _tokenize(self, text: str) -> list[str]:
        tokens = re_split(r"\W+", text.lower())
        return [t for t in tokens if t]

    def search(self, query: str, top_k: int = 20) -> list[tuple[int, float]]:
        """Search index, return (doc_index, score) sorted descending."""
        if not self._index:
            return []

        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        scores: dict[int, float] = {}
        for term in query_tokens:
            if term not in self._index:
                continue
            df = self._doc_freqs[term]
            idf = math.log((self._N - df + 0.5) / (df + 0.5) + 1)
            for doc_id, tf in self._index[term]:
                score = idf * (tf * (self.k1 + 1)) / (
                    tf + self.k1 * (1 - self.b + self.b * self._doc_lengths[doc_id] / self._avgdl)
                )
                scores[doc_id] = scores.get(doc_id, 0.0) + score

        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_scores[:top_k]


class HybridSearch:
    """Fuse BM25 keyword search with vector similarity using RRF."""

    def __init__(
        self,
        vector_store: VectorStore,
        alpha: float = 0.5,
        rrf_k: int = 60,
    ):
        self.vector_store = vector_store
        self.alpha = alpha
        self.rrf_k = rrf_k
        self._bm25: BM25 | None = None

    def index_chunks(self, texts: list[str]) -> None:
        """Index texts for BM25 search."""
        self._bm25 = BM25()
        self._bm25.index(texts)

    def search(
        self,
        query_text: str,
        query_embedding: list[float],
        top_k: int = 10,
    ) -> list[dict]:
        """Fused BM25 + vector search using RRF.

        Args:
            query_text: Text query for BM25.
            query_embedding: Embedding for vector search.
            top_k: Number of results to return.

        Returns:
            List of result dicts with doc_id, text, score, metadata.
        """
        bm25_results = self._bm25.search(query_text, top_k * 2) if self._bm25 else []
        vector_results = self.vector_store.search(query_embedding, top_k * 2)

        bm25_scores = {idx: score for idx, score in bm25_results}
        vector_lookup: dict[int, dict] = {}
        vector_scores: dict[int, float] = {}
        for r in vector_results:
            try:
                doc_idx = int(r["id"].split("_")[-1])
                vector_lookup[doc_idx] = r
                vector_scores[doc_idx] = r["distance"]
            except (ValueError, IndexError, KeyError):
                continue

        all_docs: set[int] = set(bm25_scores) | set(vector_scores)

        # Precompute ranks once — O(n log n) total, not O(n²) per doc
        bm25_rank_map = {
            doc_id: rank + 1
            for rank, (doc_id, _) in enumerate(
                sorted(bm25_scores.items(), key=lambda x: x[1], reverse=True)
            )
        }
        vector_rank_map = {
            doc_id: rank + 1
            for rank, (doc_id, _) in enumerate(
                sorted(vector_scores.items(), key=lambda x: x[1], reverse=True)
            )
        }

        rrf_scores: dict[int, float] = {}
        for doc_id in all_docs:
            bm25_rank = bm25_rank_map.get(doc_id, 0)
            vector_rank = vector_rank_map.get(doc_id, 0)
            if bm25_rank > 0:
                rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + self.alpha / (self.rrf_k + bm25_rank)
            if vector_rank > 0:
                rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1 - self.alpha) / (self.rrf_k + vector_rank)

        ranked = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]

        results = []
        for doc_id, score in ranked:
            vec_result = vector_lookup.get(doc_id, {})
            results.append({
                "doc_id": doc_id,
                "text": vec_result.get("text", ""),
                "score": round(score, 4),
                "metadata": vec_result.get("metadata", {}),
            })
        return results