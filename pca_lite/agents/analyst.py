"""Analyst Agent - analyze literature for themes, findings, and gaps."""
import asyncio
from pca_lite.core.models import LiteratureEntry
from pca_lite.llm.base import BaseProvider


class AnalystAgent:
    def __init__(self, llm_provider: BaseProvider):
        self.llm = llm_provider

    async def analyze_themes(
        self, entries: list[LiteratureEntry]
    ) -> dict:
        """Cluster entries into themes and extract key findings.

        Args:
            entries: List of LiteratureEntry objects from verified pool.

        Returns:
            Theme analysis report as dict.
        """
        if not entries:
            return {"agent": "analyst", "action": "analyze", "themes": []}

        theme_result = await self._cluster_themes(entries)
        return {
            "agent": "analyst",
            "action": "analyze",
            "themes": theme_result,
        }

    async def _cluster_themes(
        self, entries: list[LiteratureEntry]
    ) -> list[dict]:
        """Ask LLM to cluster entries into themes."""
        entry_summaries = "\n".join(
            f"[{i + 1}] {e.title} | {e.year or 'n.d.'} | "
            f"authors: {', '.join(e.authors[:3]) if e.authors else 'Unknown'}"
            for i, e in enumerate(entries)
        )
        prompt = (
            "You are an academic literature analyst. Cluster the following papers "
            "into themes based on their research topics, methods, and findings.\n\n"
            f"Papers:\n{entry_summaries}\n\n"
            "Respond in JSON format with a 'themes' key containing a list of theme "
            "objects, each with 'name', 'description', 'paper_indices' (list of "
            "1-based indices), 'key_findings' (list of strings), "
            "'consensus' (one of: strong, moderate, weak, mixed), "
            "'methodology_differences' (list), and 'contradictions' (list).\n"
            "Return only valid JSON."
        )
        try:
            messages = [{"role": "user", "content": prompt}]
            response = await self.llm.chat(messages)
            import json

            result = json.loads(response)
            return result.get("themes", [])
        except Exception as e:
            print(f"[WARN] Theme clustering failed: {e}")
            return []

    async def run(
        self, verified_entries: list[LiteratureEntry]
    ) -> dict:
        """Full analyst workflow.

        Args:
            verified_entries: Entries from Researcher Agent (verification_status=verified).

        Returns:
            Analysis report with themes, trends, and gaps.
        """
        results = await asyncio.gather(
            self.analyze_themes(verified_entries),
            self._extract_trends(verified_entries),
            self._identify_gaps(verified_entries),
        )
        return {
            "analysis": results[0],
            "trends": results[1],
            "gaps": results[2],
        }

    async def _extract_trends(self, entries: list[LiteratureEntry]) -> list[str]:
        """Identify research trends across the literature."""
        if len(entries) < 3:
            return []
        prompt = (
            "Based on the following papers, identify 3-5 major research trends. "
            "Return a JSON list of trend descriptions.\n\n"
            + "\n".join(f"[{i + 1}] {e.title}" for i, e in enumerate(entries))
        )
        try:
            messages = [{"role": "user", "content": prompt}]
            response = await self.llm.chat(messages)
            import json

            return json.loads(response)
        except Exception:
            return []

    async def _identify_gaps(self, entries: list[LiteratureEntry]) -> list[str]:
        """Identify research gaps."""
        if not entries:
            return []
        prompt = (
            "Based on the following papers, identify 2-4 research gaps or "
            "unresolved questions. Return a JSON list of gap descriptions.\n\n"
            + "\n".join(f"[{i + 1}] {e.title}" for i, e in enumerate(entries))
        )
        try:
            messages = [{"role": "user", "content": prompt}]
            response = await self.llm.chat(messages)
            import json

            return json.loads(response)
        except Exception:
            return []
