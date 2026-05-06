"""Researcher Agent - verify preprocessed results and supplement via web search."""
import json
from pathlib import Path
from typing import Any

from citeforge.core.exceptions import LLMError, SearchError
from citeforge.core.models import LiteratureEntry
from citeforge.llm.base import BaseProvider


class ResearcherAgent:
    def __init__(self, llm_provider: BaseProvider, search_provider: Any = None):
        self.llm = llm_provider
        self.search = search_provider

    async def verify_literature_pool(self, pool: list[LiteratureEntry]) -> dict[str, Any]:
        """Verify L2 abstracts and supplement missing metadata.

        Args:
            pool: List of LiteratureEntry objects from preprocessor.

        Returns:
            Verification report as dict.
        """
        verified = []
        pending = []
        failed = []

        for entry in pool:
            if entry.abstract and entry.abstract != "pending":
                # Spot-check: use LLM to verify abstract
                verdict = await self._verify_abstract(entry)
                entry_dict = entry.model_dump()
                entry_dict["verification_status"] = verdict
                if verdict == "verified":
                    verified.append(entry_dict)
                elif verdict == "pending":
                    pending.append(entry_dict)
                else:
                    failed.append(entry_dict)
            else:
                # Missing abstract — mark for supplementation
                entry_dict = entry.model_dump()
                entry_dict["verification_status"] = "pending"
                pending.append(entry_dict)

        return {
            "agent": "researcher",
            "action": "verify",
            "verified": verified,
            "pending": pending,
            "failed": failed,
        }

    async def _verify_abstract(self, entry: LiteratureEntry) -> str:
        """Ask LLM whether the abstract accurately reflects the paper."""
        prompt = f"""请校验以下文献的 L2 摘要是否准确反映了原文核心内容：

标题：{entry.title}
摘要：{entry.abstract}

请回答 verified（准确）/ pending（需人工确认）/ failed（不准确），只输出一个词。"""
        try:
            messages = [{"role": "user", "content": prompt}]
            response = await self.llm.chat(messages)
            response = response.strip().lower()
            if "verified" in response:
                return "verified"
            elif "failed" in response:
                return "failed"
            else:
                return "pending"
        except LLMError:
            return "pending"

    async def supplement_from_web(self, query: str, max_results: int = 10) -> list[dict]:
        """Search the web for supplementary papers.

        Args:
            query: Search query string.
            max_results: Maximum number of results.

        Returns:
            List of paper metadata dicts.
        """
        if self.search is None:
            return []

        try:
            results = await self.search.search(query, max_results=max_results)
            return results
        except SearchError as e:
            print(f"[WARN] Web search failed: {e}")
            return []

    async def run(self, literature_pool: list[LiteratureEntry], topics: list[str]) -> dict[str, Any]:
        """Full researcher workflow.

        Args:
            literature_pool: Preprocessed literature entries.
            topics: Topic keywords for search guidance.

        Returns:
            Research report with verified + supplemented entries.
        """
        # Step 1: Verify existing entries
        verification = await self.verify_literature_pool(literature_pool)

        # Step 2: Search for supplementary papers based on topics
        web_entries = []
        for topic in topics[:3]:  # Limit search to top 3 topics
            results = await self.supplement_from_web(topic, max_results=5)
            web_entries.extend(results)

        return {
            "verification": verification,
            "web_entries": web_entries,
        }
