"""Relevance scoring for literature entries."""
import math
from dataclasses import dataclass

from citeforge.core.models import LiteratureEntry


@dataclass
class ScoreResult:
    """Score breakdown for a single LiteratureEntry."""

    entry_index: int
    total_score: float
    vector_score: float
    metadata_score: float
    citation_score: float


class RelevanceScorer:
    """Compute relevance_score per LiteratureEntry from three weighted components."""

    def __init__(
        self,
        vector_weight: float = 0.5,
        metadata_weight: float = 0.25,
        citation_weight: float = 0.25,
        # metadata component weights
        doi_weight: float = 0.2,
        year_weight: float = 0.15,
        authors_weight: float = 0.15,
        abstract_weight: float = 0.25,
        key_findings_weight: float = 0.15,
        l1_summary_weight: float = 0.1,
    ):
        total = vector_weight + metadata_weight + citation_weight
        if abs(total - 1.0) > 1e-6:
            raise ValueError(f"Weights must sum to 1.0, got {total:.4f}")
        self.vector_weight = vector_weight
        self.metadata_weight = metadata_weight
        self.citation_weight = citation_weight
        self._doi_w = doi_weight
        self._year_w = year_weight
        self._authors_w = authors_weight
        self._abstract_w = abstract_weight
        self._findings_w = key_findings_weight
        self._l1_w = l1_summary_weight

    def score_entry(
        self,
        entry: LiteratureEntry,
        avg_vector_similarity: float = 0.0,
        citation_count: int = 0,
    ) -> ScoreResult:
        """Score a single literature entry.

        Args:
            entry: LiteratureEntry to score.
            avg_vector_similarity: Average vector similarity score (0–1).
            citation_count: Number of citations for this paper.

        Returns:
            ScoreResult with weighted total and component breakdown.
        """
        vector_score = min(avg_vector_similarity, 1.0)
        metadata_score = self._metadata_completeness(entry)
        citation_score = self._normalize_citations(citation_count)

        total = (
            self.vector_weight * vector_score
            + self.metadata_weight * metadata_score
            + self.citation_weight * citation_score
        )

        return ScoreResult(
            entry_index=entry.index,
            total_score=round(total, 4),
            vector_score=round(vector_score, 4),
            metadata_score=round(metadata_score, 4),
            citation_score=round(citation_score, 4),
        )

    def score_batch(
        self,
        entries: list[LiteratureEntry],
        vector_similarities: dict[int, float],
        citation_counts: dict[int, int],
    ) -> list[ScoreResult]:
        """Score a batch of entries.

        Args:
            entries: List of LiteratureEntry objects.
            vector_similarities: Map of entry.index -> avg vector similarity.
            citation_counts: Map of entry.index -> citation count.

        Returns:
            List of ScoreResult sorted by total_score descending.
        """
        results = []
        for entry in entries:
            sim = vector_similarities.get(entry.index, 0.0)
            cites = citation_counts.get(entry.index, 0)
            results.append(self.score_entry(entry, sim, cites))

        results.sort(key=lambda x: x.total_score, reverse=True)
        return results

    def _metadata_completeness(self, entry: LiteratureEntry) -> float:
        """Score metadata completeness (0–1)."""
        score = 0.0
        if entry.doi:
            score += self._doi_w
        if entry.year:
            score += self._year_w
        if entry.authors:
            score += self._authors_w
        if entry.abstract:
            score += self._abstract_w
        if entry.key_findings:
            score += self._findings_w
        if entry.l1_summary:
            score += self._l1_w
        return score

    def _normalize_citations(self, count: int) -> float:
        """Normalize citation count to 0–1 using log scale."""
        if count <= 0:
            return 0.0
        # Log scale: 0 citations=0, ~100 citations≈0.5, ~1000+≈1.0
        return min(math.log1p(count) / 10.0, 1.0)