"""PDF text extraction using PyMuPDF (fitz)."""
import json
from pathlib import Path

from citeforge.core.exceptions import ExtractionError


def extract_pdf_text(pdf_path: Path, output_dir: Path) -> Path:
    """Extract text from a PDF file, output as JSON Lines.

    Args:
        pdf_path: Path to input PDF file.
        output_dir: Directory to write output JSONL file.

    Returns:
        Path to the output JSON Lines file.

    Raises:
        FileNotFoundError: If pdf_path does not exist.
    """
    import fitz

    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{pdf_path.stem}_raw.jsonl"

    with fitz.open(pdf_path) as doc:
        with open(output_path, "w", encoding="utf-8") as f:
            for page_num in range(doc.page_count):
                page = doc[page_num]
                text = page.get_text()
                has_text = bool(text and text.strip())
                record = {
                    "page_num": page_num + 1,  # 1-based
                    "text": text,
                    "has_text": has_text,
                }
                f.write(json.dumps(record, ensure_ascii=False) + "\n")

    return output_path


def extract_all_pdfs(pdf_dir: Path, output_dir: Path) -> list[Path]:
    """Batch-extract text from all PDFs in a directory.

    Args:
        pdf_dir: Directory containing PDF files.
        output_dir: Directory to write output JSONL files.

    Returns:
        List of output file paths.
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    outputs = []

    for pdf_path in sorted(Path(pdf_dir).glob("*.pdf")):
        try:
            out = extract_pdf_text(pdf_path, output_dir)
            outputs.append(out)
        except (ExtractionError, OSError) as e:
            print(f"[WARN] Failed to extract {pdf_path.name}: {e}")

    return outputs
