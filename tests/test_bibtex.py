"""Unit tests for citeforge/export/bibtex.py"""
import pytest

from citeforge.export.bibtex import generate_bibtex, _to_bibkey, _infer_type


def test_generate_bibtex_basic():
    entries = [
        {
            "index": 1,
            "title": "Building Effective Agents",
            "authors": ["John Doe", "Jane Smith"],
            "year": 2024,
            "doi": "10.1234/test",
            "source": "local_pdf",
        }
    ]
    result = generate_bibtex(entries)
    assert "@article{pca1_building," in result
    assert "title = {Building Effective Agents}" in result
    assert "author = {John Doe and Jane Smith}" in result
    assert "year = {2024}" in result
    assert "doi = {10.1234/test}" in result


def test_generate_bibtex_multiple():
    entries = [
        {"index": 1, "title": "Paper A", "authors": ["A"], "year": 2023},
        {"index": 2, "title": "Paper B", "authors": ["B"], "year": 2024, "doi": "10.x/y"},
    ]
    result = generate_bibtex(entries)
    assert "@article{pca1_paper" in result
    assert "@article{pca2_paper" in result
    assert "year = {2024}" in result


def test_to_bibkey():
    assert _to_bibkey("Hello World Example", 5) == "pca5_hello"
    assert _to_bibkey("123 Numbers", 10) == "pca10_123"
    assert _to_bibkey("", 99) == "pca99_p99"


def test_infer_type():
    assert _infer_type({"url": "https://arxiv.org/abs/1234"}) == "article"
    assert _infer_type({"doi": "10.1234/abc"}) == "article"
    assert _infer_type({}) == "misc"


def test_arxiv_key():
    entries = [
        {
            "index": 3,
            "title": "ArXiv Paper",
            "authors": ["Author Name"],
            "year": 2025,
            "url": "https://arxiv.org/abs/2501.12345",
        }
    ]
    result = generate_bibtex(entries)
    assert "@article{pca3_arxiv," in result