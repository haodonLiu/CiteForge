"""Semantic Scholar API web search provider."""
import httpx
from typing import Any


class SemanticScholarSearch:
    """Search provider backed by Semantic Scholar Graph API."""

    BASE_URL = "https://api.semanticscholar.org/graph/v1"

    def __init__(self, api_key: str | None = None, timeout: int = 30):
        self.api_key = api_key
        self.timeout = timeout

    async def search(self, query: str, max_results: int = 10) -> list[dict[str, Any]]:
        """Search Semantic Scholar for papers.

        Args:
            query: Search query string.
            max_results: Maximum number of results.

        Returns:
            List of paper metadata dicts.
        """
        fields = (
            "title,authors,name,year,abstract,"
            "citationCount,openAccessPdf,externalIds,url,"
            "venue,publicationVenue"
        )
        params = {
            "query": query,
            "limit": min(max_results, 100),
            "fields": fields,
        }
        headers = {}
        if self.api_key:
            headers["x-api-key"] = self.api_key

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(
                    f"{self.BASE_URL}/paper/search",
                    params=params,
                    headers=headers,
                )
                resp.raise_for_status()
                data = resp.json()

            papers = []
            for hit in data.get("data", []):
                paper = self._parse_paper(hit)
                papers.append(paper)
            return papers
        except Exception as e:
            print(f"[WARN] Semantic Scholar search failed: {e}")
            return []

    def _parse_paper(self, hit: dict) -> dict[str, Any]:
        author_names = [
            a.get("name", "Unknown") for a in hit.get("authors", [])
        ]
        external_ids = hit.get("externalIds", {}) or {}
        return {
            "title": hit.get("title", "Unknown"),
            "authors": author_names,
            "year": hit.get("year"),
            "abstract": hit.get("abstract", ""),
            "doi": external_ids.get("DOI", ""),
            "arxiv_id": external_ids.get("ArXiv", ""),
            "url": hit.get("url", ""),
            "open_access_pdf": (
                hit.get("openAccessPdf", {}).get("url", "")
                if hit.get("openAccessPdf")
                else ""
            ),
            "venue": hit.get("venue", ""),
            "citation_count": hit.get("citationCount", 0),
            "source": "semantic_scholar",
        }
