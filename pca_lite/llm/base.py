import asyncio
from abc import ABC, abstractmethod
from typing import Any

import httpx

from pca_lite.core.exceptions import LLMError, LLMTimeoutError


class BaseProvider(ABC):
    """LLM/Embedding/Reranker provider abstraction.

    All providers (OpenAI / Anthropic / Ollama) implement this interface.
    Shared retry-with-backoff is provided via _retry().
    """

    max_attempts: int = 3
    backoff: str = "exponential"
    initial_delay: float = 1.0
    max_delay: float = 30.0

    async def _retry(self, coro_fn, *args, **kwargs) -> Any:
        """Retry an async coroutine with exponential backoff.

        Args:
            coro_fn: Async callable to execute.
            *args, **kwargs: Passed through to coro_fn.

        Returns:
            Result of coro_fn on success.

        Raises:
            LLMTimeoutError: on timeout after retries.
            LLMError: on HTTP errors after retries.
        """
        delay = self.initial_delay
        last_exc: Exception | None = None
        for attempt in range(1, self.max_attempts + 1):
            try:
                return await coro_fn(*args, **kwargs)
            except httpx.TimeoutException as exc:
                last_exc = exc
                if attempt == self.max_attempts:
                    raise LLMTimeoutError(f"LLM request timed out after {self.max_attempts} attempts") from exc
            except httpx.HTTPStatusError as exc:
                last_exc = exc
                if exc.response.status_code >= 500:
                    if attempt == self.max_attempts:
                        raise LLMError(f"LLM server error: {exc.response.status_code}") from exc
                else:
                    raise LLMError(f"LLM request failed: {exc.response.status_code}") from exc
            except httpx.RequestError as exc:
                last_exc = exc
                if attempt == self.max_attempts:
                    raise LLMError(f"LLM request error: {exc}") from exc
            except Exception as exc:
                last_exc = exc
                if attempt == self.max_attempts:
                    raise LLMError(f"LLM unexpected error: {exc}") from exc
            await asyncio.sleep(delay)
            delay = min(delay * 2, self.max_delay) if self.backoff == "exponential" else delay
        raise LLMError("unreachable") from last_exc

    @abstractmethod
    async def chat(self, messages: list[dict[str, str]], **kwargs: Any) -> str:
        """Send a chat request, return the assistant's response text."""
        ...

    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch of texts, return list of vector arrays."""
        ...

    @abstractmethod
    async def rerank(self, query: str, docs: list[str]) -> list[float]:
        """Rerank documents against a query, return relevance scores."""
        ...
