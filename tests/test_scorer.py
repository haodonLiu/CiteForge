"""Unit tests for citeforge/retrieval/scorer.py"""
import pytest

from citeforge.core.models import LiteratureEntry
from citeforge.retrieval.scorer import RelevanceScorer, ScoreResult


def test_weight_sum_must_equal_one():
    with pytest.raises(ValueError, match="must sum to 1"):
        RelevanceScorer(vector_weight=0.5, metadata_weight=0.5, citation_weight=0.5)


def test_score_entry_metadata_only():
    entry = LiteratureEntry(index=1, title="Test Paper", source="local_pdf")
    scorer = RelevanceScorer()

    result = scorer.score_entry(entry, avg_vector_similarity=0.0, citation_count=0)
    assert isinstance(result, ScoreResult)
    assert result.entry_index == 1
    assert result.metadata_score == pytest.approx(0.0)


def test_score_entry_full_metadata():
    entry = LiteratureEntry(
        index=2,
        title="Full Paper",
        source="local_pdf",
        doi="10.1234/test",
        year=2024,
        authors=["Alice", "Bob"],
        abstract="This is an abstract.",
        key_findings=["Finding 1"],
        l1_summary="One line summary",
    )
    scorer = RelevanceScorer()
    result = scorer.score_entry(entry, avg_vector_similarity=0.8, citation_count=50)

    assert result.vector_score == pytest.approx(0.8)
    assert result.metadata_score > 0.7
    assert 0.0 <= result.total_score <= 1.0


def test_score_batch_sorted():
    entries = [
        LiteratureEntry(index=i, title=f"Paper {i}", source="local_pdf")
        for i in range(1, 4)
    ]
    scorer = RelevanceScorer()
    results = scorer.score_batch(
        entries,
        vector_similarities={1: 0.5, 2: 0.9, 3: 0.3},
        citation_counts={1: 10, 2: 200, 3: 0},
    )
    assert results[0].total_score >= results[1].total_score
    assert results[1].total_score >= results[2].total_score


def test_citation_log_scale():
    scorer = RelevanceScorer()
    entry = LiteratureEntry(index=1, title="Test", source="local_pdf")

    r0 = scorer.score_entry(entry, citation_count=0)
    r100 = scorer.score_entry(entry, citation_count=100)
    r1000 = scorer.score_entry(entry, citation_count=1000)

    assert r0.citation_score == pytest.approx(0.0)
    assert r100.citation_score > r0.citation_score
    assert r1000.citation_score > r100.citation_score
    assert r1000.citation_score <= 1.0