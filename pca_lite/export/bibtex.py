"""Export literature pool to BibTeX format."""
import json
import re
from pathlib import Path
from typing import Any


def generate_bibtex(entries: list[dict[str, Any]], style: str = "plain") -> str:
    """Convert literature entries to BibTeX format.

    Args:
        entries: List of LiteratureEntry dicts (with index, title, authors, year, doi, url).
        style: "plain" (default) or "short".

    Returns:
        BibTeX string.
    """
    lines = []
    for entry in entries:
        idx = entry.get("index", 0)
        key = _to_bibkey(entry.get("title", f"paper{idx}"), idx)
        entry_type = _infer_type(entry)

        lines.append(f"@article{{{key},")
        if entry.get("title"):
            lines.append(f"  title = {{{entry['title']}}},")

        authors = entry.get("authors", [])
        if authors:
            author_str = " and ".join(authors)
            lines.append(f"  author = {{{author_str}}},")

        if entry.get("year"):
            lines.append(f"  year = {{{entry['year']}}},")

        if entry.get("doi"):
            lines.append(f"  doi = {{{entry['doi']}}},")

        if entry.get("url"):
            lines.append(f"  url = {{{entry['url']}}},")

        if entry.get("abstract"):
            abstract = entry["abstract"].replace("{", "\\{").replace("}", "\\}")
            lines.append(f"  abstract = {{{abstract[:500]}}},")

        if entry.get("venue"):
            lines.append(f"  journal = {{{entry['venue']}}},")

        lines.append("}")
        lines.append("")

    return "\n".join(lines)


def _to_bibkey(title: str, index: int) -> str:
    words = re.findall(r"[A-Za-z]+", title)
    suffix = words[0].lower() if words else f"p{index}"
    return f"pca{index}_{suffix}"


def _infer_type(entry: dict[str, Any]) -> str:
    url = entry.get("url", "")
    if "arxiv.org" in url.lower():
        return "article"
    doi = entry.get("doi", "")
    if doi:
        return "article"
    return "misc"


def export_literature_pool(pool_path: Path, output_path: Path | None = None) -> str:
    """Export a literature_pool.json to .bib file.

    Args:
        pool_path: Path to literature_pool.json.
        output_path: Path to output .bib file. If None, uses pool_path.stem + ".bib".

    Returns:
        BibTeX content string.
    """
    with open(pool_path, encoding="utf-8") as f:
        data = json.load(f)

    entries = data if isinstance(data, list) else data.get("entries", [])
    bibtex = generate_bibtex(entries)

    if output_path:
        output_path.write_text(bibtex, encoding="utf-8")

    return bibtex