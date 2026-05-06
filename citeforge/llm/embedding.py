"""Embedding model wrapper supporting local (Ollama) and API modes."""
from typing import Literal

from citeforge.llm.providers.ollama import OllamaProvider


class EmbeddingModel:
    def __init__(
        self,
        mode: Literal["local", "api"],
        # local mode
        local_model: str = "",
        local_base_url: str = "http://localhost:11434",
        # api mode
        api_base_url: str = "",
        api_key: str = "",
        api_model: str = "",
        dimensions: int | None = None,
        batch_size: int = 64,
    ):
        self.mode = mode
        self.dimensions = dimensions
        self.batch_size = batch_size

        if mode == "local":
            self.provider = OllamaProvider(
                base_url=local_base_url,
                model=local_model,
            )
        elif mode == "api":
            # For API mode, use OpenAI-compatible embedding API
            from citeforge.llm.providers.openai import OpenAIProvider
            self.provider = OpenAIProvider(
                api_key=api_key,
                base_url=api_base_url.rstrip("/") + "/v1",
                model=api_model,
            )
        else:
            raise ValueError(f"Unknown embedding mode: {mode}")

    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch of texts."""
        results = []
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i : i + self.batch_size]
            batch_results = await self.provider.embed(batch)
            results.extend(batch_results)
        return results
