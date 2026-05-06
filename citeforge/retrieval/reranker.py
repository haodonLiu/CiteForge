"""Reranker backed by cross-encoder or local model."""
from citeforge.core.exceptions import LLMError
from citeforge.llm.providers.ollama import OllamaProvider
from citeforge.llm.providers.openai import OpenAIProvider


class RerankerModel:
    """Rerank documents against a query using a cross-encoder model.

    Supports local (Ollama) or API (OpenAI-compatible) backends.
    """

    def __init__(
        self,
        mode: str = "local",
        local_model: str = "cross-encoder",
        local_base_url: str = "http://localhost:11434",
        api_base_url: str = "",
        api_key: str = "",
        api_model: str = "",
    ):
        self.mode = mode
        if mode == "local":
            self.provider = OllamaProvider(
                base_url=local_base_url,
                model=local_model,
            )
        else:
            self.provider = OpenAIProvider(
                api_key=api_key,
                base_url=api_base_url.rstrip("/") + "/v1",
                model=api_model,
            )

    async def rerank(
        self, query: str, docs: list[str], top_k: int | None = None
    ) -> list[tuple[int, float]]:
        """Rerank documents and return (index, score) pairs sorted descending.

        Args:
            query: Search query string.
            docs: List of document texts to rerank.
            top_k: Return only top-k results. If None, return all.

        Returns:
            List of (doc_index, score) tuples sorted by score descending.
        """
        if not docs:
            return []

        prompt = self._build_rerank_prompt(query, docs)
        messages = [{"role": "user", "content": prompt}]

        try:
            response = await self.provider.chat(messages)
            # Parse scores from response — expected format: "1: 0.95\n2: 0.87\n..."
            scores = self._parse_scores(response, len(docs))
            ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
            if top_k is not None:
                ranked = ranked[:top_k]
            return ranked
        except LLMError as e:
            print(f"[WARN] Reranking failed, returning uniform scores: {e}")
            return [(i, 1.0 / max(len(docs), 1)) for i in range(len(docs))]

    def _build_rerank_prompt(self, query: str, docs: list[str]) -> str:
        doc_lines = "\n".join(
            f"[{i + 1}] {doc[:200]}" for i, doc in enumerate(docs)
        )
        return (
            f"Query: {query}\n\n"
            f"Documents:\n{doc_lines}\n\n"
            "Rate each document's relevance to the query on a scale of 0 to 1. "
            "Respond with one score per line in the format 'index: score'.\n"
        )

    def _parse_scores(self, response: str, n_docs: int) -> list[float]:
        scores = [0.0] * n_docs
        for line in response.strip().split("\n"):
            line = line.strip()
            if ":" in line:
                try:
                    idx_str, score_str = line.rsplit(":", 1)
                    idx = int(idx_str.strip().strip("[]")) - 1
                    score = float(score_str.strip())
                    if 0 <= idx < n_docs:
                        scores[idx] = score
                except (ValueError, IndexError):
                    continue
        return scores
