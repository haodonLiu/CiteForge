from abc import ABC, abstractmethod
from typing import Any


class BaseProvider(ABC):
    """LLM/Embedding/Reranker provider abstraction.

    All providers (OpenAI / Anthropic / Ollama) implement this interface.
    """

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
