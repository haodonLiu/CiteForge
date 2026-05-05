"""Writer Agent - write structured literature review drafts."""
from pca_lite.core.models import LiteratureEntry
from pca_lite.llm.base import BaseProvider


class WriterAgent:
    def __init__(self, llm_provider: BaseProvider):
        self.llm = llm_provider

    async def write_draft(
        self,
        themes: list[dict],
        literature_pool: list[LiteratureEntry],
        topics: list[str],
    ) -> dict:
        """Write a literature review draft from theme analysis.

        Args:
            themes: Theme analysis from Analyst Agent.
            literature_pool: Full literature pool for citation.
            topics: Topic keywords from config.

        Returns:
            Draft report dict with markdown content.
        """
        pool_indexed = self._build_indexed_pool(literature_pool)
        prompt = self._build_draft_prompt(themes, pool_indexed, topics)

        try:
            messages = [{"role": "user", "content": prompt}]
            draft_md = await self.llm.chat(messages)

            return {
                "agent": "writer",
                "action": "draft",
                "content": draft_md,
                "status": "draft",
            }
        except Exception as e:
            return {
                "agent": "writer",
                "action": "draft",
                "content": "",
                "status": "failed",
                "error": str(e),
            }

    def _build_indexed_pool(self, pool: list[LiteratureEntry]) -> str:
        return "\n".join(
            f"[{i + 1}] {e.title} | {e.year or 'n.d.'} | "
            f"{', '.join(e.authors[:3]) if e.authors else 'Unknown'} "
            f"| abstract: {e.abstract[:100] if e.abstract else 'N/A'}..."
            for i, e in enumerate(pool)
        )

    def _build_draft_prompt(
        self, themes: list[dict], pool: str, topics: list[str]
    ) -> str:
        theme_summaries = []
        for t in themes:
            paper_list = ", ".join(f"[{p}]" for p in t.get("paper_indices", []))
            theme_summaries.append(
                f"- Theme: {t.get('name', 'Unknown')}\n"
                f"  Description: {t.get('description', '')}\n"
                f"  Papers: {paper_list}\n"
                f"  Key Findings: {', '.join(t.get('key_findings', [])[:3])}\n"
                f"  Consensus: {t.get('consensus', 'unknown')}"
            )
        themes_text = "\n".join(theme_summaries)
        topics_text = ", ".join(topics[:5])

        return (
            f"Write a structured literature review on the following topics: {topics_text}\n\n"
            f"Literature Pool (use [index] to cite):\n{pool}\n\n"
            f"Theme Analysis:\n{themes_text}\n\n"
            "Write a literature review in Markdown format with sections: "
            "Abstract, 1. Introduction, 2. Methodology, 3. Findings (per theme), "
            "4. Discussion, 5. Conclusion. "
            "Use [index] citations only for papers in the literature pool above. "
            "Do not invent citations outside this pool."
        )

    async def run(
        self,
        themes: list[dict],
        literature_pool: list[LiteratureEntry],
        topics: list[str],
    ) -> dict:
        """Full writer workflow.

        Args:
            themes: Theme analysis from Analyst Agent.
            literature_pool: Full literature pool.
            topics: Topic keywords.

        Returns:
            Draft report.
        """
        draft = await self.write_draft(themes, literature_pool, topics)
        citation_check = self._check_citations(draft.get("content", ""), len(literature_pool))
        draft["citation_check"] = citation_check
        return draft

    def _check_citations(self, content: str, pool_size: int) -> dict:
        import re

        citation_pattern = re.compile(r"\[(\d+(?:-\d+)?)\]")
        citations = citation_pattern.findall(content)
        invalid = []
        for c in citations:
            if "-" in c:
                parts = c.split("-")
                try:
                    start, end = int(parts[0]), int(parts[1])
                    for idx in range(start, end + 1):
                        if idx < 1 or idx > pool_size:
                            invalid.append(f"{idx}")
                except ValueError:
                    invalid.append(c)
            else:
                try:
                    idx = int(c)
                    if idx < 1 or idx > pool_size:
                        invalid.append(c)
                except ValueError:
                    invalid.append(c)

        return {
            "valid": len(invalid) == 0,
            "invalid_citations": invalid,
        }
