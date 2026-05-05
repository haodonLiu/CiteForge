import time
from typing import Any

import httpx

from pca_lite.llm.base import BaseProvider


class OpenAIProvider(BaseProvider):
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.openai.com/v1",
        model: str = "gpt-4o",
        timeout: int = 120,
        max_attempts: int = 3,
        backoff: str = "exponential",
        initial_delay: float = 1.0,
        max_delay: float = 30.0,
    ):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout
        self.max_attempts = max_attempts
        self.backoff = backoff
        self.initial_delay = initial_delay
        self.max_delay = max_delay

    async def chat(self, messages: list[dict[str, str]], **kwargs: Any) -> str:
        url = f"{self.base_url}/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        body = {"model": self.model, "messages": messages, **kwargs}

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            delay = self.initial_delay
            for attempt in range(1, self.max_attempts + 1):
                try:
                    resp = await client.post(url, headers=headers, json=body)
                    resp.raise_for_status()
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
                except httpx.HTTPStatusError as e:
                    if e.response.status_code < 500:
                        raise
                    if attempt == self.max_attempts:
                        raise
                except httpx.RequestError as e:
                    if attempt == self.max_attempts:
                        raise

                await self._sleep(delay)
                delay = min(delay * 2, self.max_delay) if self.backoff == "exponential" else delay

    async def embed(self, texts: list[str]) -> list[list[float]]:
        url = f"{self.base_url}/embeddings"
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        body = {"model": self.model, "input": texts}

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, headers=headers, json=body)
            resp.raise_for_status()
            data = resp.json()
            return [item["embedding"] for item in data["data"]]

    async def rerank(self, query: str, docs: list[str]) -> list[float]:
        raise NotImplementedError("OpenAI does not provide a rerank endpoint. Use Cohere or local reranker.")

    async def _sleep(self, delay: float) -> None:
        time.sleep(delay)
