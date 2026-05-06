import asyncio
from abc import ABC, abstractmethod
from typing import Any


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
            Last exception if all retries are exhausted.
        """
        delay = self.initial_delay
        last_exc: Exception | None = None
        for attempt in range(1, self.max_attempts + 1):
            try:
                return await coro_fn(*args, **kwargs)
            except Exception as exc:
                last_exc = exc
                if attempt == self.max_attempts:
                    raise
            await asyncio.sleep(delay)
            delay = min(delay * 2, self.max_delay) if self.backoff == "exponential" else delay
        raise last_exc if last_exc else RuntimeError("unreachable")

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
