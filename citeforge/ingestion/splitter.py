"""Text chunking using recursive character splitting."""
from typing import Protocol


class TextSplitter(Protocol):
    """Protocol for text splitters."""

    def split_text(self, text: str) -> list[str]:
        ...


class RecursiveCharacterTextSplitter:
    """Split text by recursively trying different separators."""

    def __init__(
        self,
        separators: list[str] | None = None,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
    ):
        if separators is None:
            separators = ["\n\n", "\n", ". ", " "]
        self.separators = separators
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split_text(self, text: str) -> list[str]:
        chunks = []
        for sep in self.separators:
            if not text:
                break
            chunks = self._split_with_separator(text, sep)
            if len(chunks) > 1:
                break
        if not chunks:
            chunks = [text]
        return chunks

    def _split_with_separator(
        self, text: str, separator: str
    ) -> list[str]:
        parts = text.split(separator)
        result = []
        current = ""
        current_size = 0

        for part in parts:
            part_size = len(part) + len(separator)
            if current_size + part_size > self.chunk_size and current:
                result.append(current.strip())
                overlap_text = current[-self.chunk_overlap :] if self.chunk_overlap > 0 else ""
                current = (overlap_text + separator + part) if overlap_text else part
                current_size = len(current)
            else:
                current += separator + part if current else part
                current_size += part_size

        if current:
            result.append(current.strip())
        return result
