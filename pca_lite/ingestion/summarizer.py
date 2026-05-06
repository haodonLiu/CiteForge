"""L1/L2 auto-summary generation using lightweight LLM."""
import asyncio

from pca_lite.core.exceptions import LLMError
from pca_lite.llm.base import BaseProvider


def _truncate(text: str, max_chars: int) -> str:
    """Truncate text by character count (not byte count), preserving CJK."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars]


class SummarizerModel:
    """Generate L1 (one-line summary) and L2 (paragraph summary) from text."""

    def __init__(self, llm_provider: BaseProvider, l1_model: str | None = None):
        self.llm = llm_provider
        self.l1_model = l1_model or "default"

    async def summarize(
        self,
        text: str,
        l1_max_tokens: int = 50,
        l2_max_tokens: int = 300,
    ) -> dict[str, str]:
        """Generate L1 and L2 summaries from raw text.

        Args:
            text: Input text (e.g., first page of PDF or abstract).
            l1_max_tokens: Max tokens for L1 summary.
            l2_max_tokens: Max tokens for L2 summary.

        Returns:
            Dict with "l1" (one-line summary) and "l2" (paragraph summary).
        """
        l1, l2 = await asyncio.gather(
            self._generate_l1(text, l1_max_tokens),
            self._generate_l2(text, l2_max_tokens),
        )
        return {"l1": l1, "l2": l2}

    async def _generate_l1(self, text: str, max_tokens: int) -> str:
        truncated = _truncate(text, 2000)
        prompt = f"""请用一句话概括以下文本的核心内容（不超过{max_tokens} tokens）：

{truncated}

一句话概括："""
        try:
            messages = [{"role": "user", "content": prompt}]
            result = await self.llm.chat(messages)
            return str(result).strip()
        except LLMError as e:
            print(f"[WARN] L1 summary failed: {e}")
            return "[summary generation failed]"

    async def _generate_l2(self, text: str, max_tokens: int) -> str:
        truncated = _truncate(text, 3000)
        prompt = f"""请用一段话（中文，{max_tokens} tokens 以内）概括以下文本的主要发现和方法：

{truncated}

段落摘要："""
        try:
            messages = [{"role": "user", "content": prompt}]
            result = await self.llm.chat(messages)
            return str(result).strip()
        except LLMError as e:
            print(f"[WARN] L2 summary failed: {e}")
            return "[summary generation failed]"

    async def batch_summarize(
        self, texts: list[str], l1_max_tokens: int = 50, l2_max_tokens: int = 300
    ) -> list[dict[str, str]]:
        """Batch summarize multiple texts in parallel."""
        tasks = [
            self.summarize(text, l1_max_tokens, l2_max_tokens)
            for text in texts
        ]
        return await asyncio.gather(*tasks)