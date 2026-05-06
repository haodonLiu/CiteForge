from typing import Any

import httpx

from citeforge.llm.base import BaseProvider


class AnthropicProvider(BaseProvider):
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.anthropic.com/v1",
        model: str = "claude-sonnet-4-7",
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
        url = f"{self.base_url}/messages"
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }

        system_msg = next((m["content"] for m in messages if m["role"] == "system"), None)
        filtered = [m for m in messages if m["role"] != "system"]
        anthropic_messages = [{"role": m["role"], "content": m["content"]} for m in filtered]

        body: dict[str, Any] = {
            "model": self.model,
            "messages": anthropic_messages,
            **kwargs,
        }
        if system_msg:
            body["system"] = system_msg

        async def _request() -> str:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(url, headers=headers, json=body)
                resp.raise_for_status()
                data = resp.json()
                return data["content"][0]["text"]

        return await self._retry(_request)

    async def embed(self, texts: list[str]) -> list[list[float]]:
        raise NotImplementedError("Anthropic does not provide embedding endpoints. Use OpenAI or local embeddings.")

    async def rerank(self, query: str, docs: list[str]) -> list[float]:
        raise NotImplementedError("Anthropic does not provide a rerank endpoint.")
