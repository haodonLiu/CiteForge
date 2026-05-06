"""Metadata extraction from PDF text using regex patterns."""
import re
from dataclasses import dataclass
from datetime import datetime


@dataclass
class PaperMetadata:
    title: str = ""
    authors: list[str] = None
    year: int | None = None
    doi: str = ""
    arxiv_id: str = ""
    venue: str = ""

    def __post_init__(self):
        if self.authors is None:
            self.authors = []


class MetadataExtractor:
    """Extract metadata from raw PDF text (first page mostly)."""

    # ArXiv ID pattern:2303.17525
    ARXIV_PATTERN = re.compile(r"(?:arXiv:?\s*)?(\d{4}\.\d{4,})(?:v\d+)?", re.IGNORECASE)
    # DOI pattern: 10.xxxx/xxxxx
    DOI_PATTERN = re.compile(r"10\.\d{4,}/[^\s\]\)}]+")
    # Year pattern: (2024), 2024, © 2024
    YEAR_PATTERN = re.compile(r"(?:©?\s*|@copyright\s*|proc\.?\s*)(\d{4})")
    # Author patterns
    AUTHOR_LINE_PATTERN = re.compile(
        r"(?:^|\n)([A-Z][A-Za-zÀ-ÿ\-\s']+(?:,\s*(?:and\s+)?[A-Z][A-Za-zÀ-ÿ\-\s']+)+)",
        re.MULTILINE,
    )
    EMAIL_PATTERN = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")

    def extract_from_text(self, text: str) -> PaperMetadata:
        """Extract metadata from raw text.

        Args:
            text: Raw PDF text (or first-page text for best results).

        Returns:
            PaperMetadata instance.
        """
        meta = PaperMetadata()

        lines = text.split("\n")
        if lines:
            meta.title = self._extract_title(lines)

        meta.year = self._extract_year(text)
        meta.doi = self._extract_doi(text)
        meta.arxiv_id = self._extract_arxiv(text)
        meta.authors = self._extract_authors(text)

        return meta

    def _extract_title(self, lines: list[str]) -> str:
        first_lines = [l.strip() for l in lines[:5] if l.strip()]
        for line in first_lines:
            if len(line) > 10 and len(line) < 300:
                return line
        return ""

    def _extract_year(self, text: str) -> int | None:
        match = self.YEAR_PATTERN.search(text[:2000])
        if match:
            year = int(match.group(1))
            max_year = datetime.now().year + 1
            if 1990 <= year <= max_year:
                return year
        return None

    def _extract_doi(self, text: str) -> str:
        match = self.DOI_PATTERN.search(text[:2000])
        return match.group(0) if match else ""

    def _extract_arxiv(self, text: str) -> str:
        match = self.ARXIV_PATTERN.search(text[:2000])
        return match.group(1) if match else ""

    def _extract_authors(self, text: str) -> list[str]:
        authors = []
        email_match = self.EMAIL_PATTERN.search(text[:3000])
        if email_match:
            context = text[
                max(0, email_match.start() - 500) : email_match.end() + 200
            ]
            author_block = context.replace(email_match.group(0), "")
            names = re.findall(r"([A-Z][a-zÀ-ÿ]+(?:\s+[A-Z][a-zÀ-ÿ]+)+)", author_block)
            authors = [n.strip() for n in names[:10]]
        if not authors:
            for line in text.split("\n")[:15]:
                stripped = line.strip()
                if len(stripped) > 3 and len(stripped) < 100:
                    parts = re.split(r"[,\t]+", stripped)
                    for part in parts:
                        part = part.strip()
                        if (
                            2 <= len(part.split()) <= 4
                            and re.match(r"^[A-Z][a-zÀ-ÿ\-\s']+$", part)
                            and not self.EMAIL_PATTERN.match(part)
                        ):
                            authors.append(part)
                if len(authors) >= 10:
                    break
        return list(dict.fromkeys(authors))[:10]
