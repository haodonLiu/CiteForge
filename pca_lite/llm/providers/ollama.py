from typing import Any

import httpx

from pca_lite.llm.base import BaseProvider


class OllamaProvider(BaseProvider):
    """Unified provider for all local models (Qwen3-Embedding, Qwen3-Reranker, etc.)
    via Ollama/vLLM HTTP API."""

    def __init__(
        self,
        base_url: str,
        model: str,
        timeout: int = 120,
        max_attempts: int = 3,
        backoff: str = "exponential",
        initial_delay: float = 1.0,
        max_delay: float = 30.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout
        self.max_attempts = max_attempts
        self.backoff = backoff
        self.initial_delay = initial_delay
        self.max_delay = max_delay

    async def chat(self, messages: list[dict[str, str]], **kwargs: Any) -> str:
        url = f"{self.base_url}/api/chat"
        body = {"model": self.model, "messages": messages, **kwargs}

        async def _request() -> str:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(url, json=body)
                resp.raise_for_status()
                data = resp.json()
                return data["message"]["content"]

        return await self._retry(_request)

    async def embed(self, texts: list[str]) -> list[list[float]]:
        url = f"{self.base_url}/api/embeddings"
        embeddings = []
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for text in texts:
                resp = await client.post(url, json={"model": self.model, "prompt": text})
                resp.raise_for_status()
                data = resp.json()
                embeddings.append(data["embedding"])
        return embeddings

    async def rerank(self, query: str, docs: list[str]) -> list[float]:
        url = f"{self.base_url}/api/rerank"
        body = {"model": self.model, "query": query, "documents": docs}

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, json=body)
            resp.raise_for_status()
            data = resp.json()
            return [item["relevance_score"] for item in data["results"]]
