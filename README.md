# CiteForge

> **Multi-Agent Literature Review Engine** — Orchestrated Researcher, Analyst, and Writer agents that produce structured, citation-guaranteed academic surveys.

---

## Why CiteForge?

Writing a literature review is tedious: hundreds of papers, scattered notes, and the constant fear of misattributing a claim. CiteForge automates the heavy lifting while keeping you in control.

- **🔍 Researcher Agent** – Verifies PDF extracts against original text and auto-fills missing metadata via Semantic Scholar.
- **📊 Analyst Agent** – Clusters papers into themes, surfaces trends, and pinpoints research gaps.
- **✍️ Writer Agent** – Drafts structured Markdown (Abstract → Conclusion) with every `[index]` rigorously mapped to the literature pool.
- **👤 Human-in-the-Loop** – Confirm or override agent outputs at every major checkpoint.
- **⏯️ Resume Anywhere** – SHA-256 integrity checks on workspace files let you safely pause and resume long-running tasks.

---

## Architecture

```
┌─────────────┐     ┌─────────────┐
│  CLI/Typer  │     │ Streamlit   │
│   (Rich)    │     │    Web UI   │
└──────┬──────┘     └──────┬──────┘
       └──────────┬──────────┘
                  ▼
        ┌───────────────────┐
        │ OrchestratorEngine│
        │  (state machine)  │
        └─────────┬─────────┘
                  ▼
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌────────┐  ┌────────┐  ┌────────┐
│Research│  │Analyst │  │ Writer │
│  -er   │  │        │  │        │
└───┬────┘  └───┬────┘  └───┬────┘
    │           │           │
    └───────────┼───────────┘
                ▼
    ┌───────────────────────┐
    │   Shared Workspace    │
    │  (JSON state + SHA-256│
    │   integrity checks)   │
    └───────────────────────┘
```

---

## Quick Start

### 1. Install

```bash
pip install -e .
```

### 2. Configure

```bash
pca config init
```

Or manually create `~/.pca/config.yaml`:

```yaml
llm:
  provider: openai
  base_url: https://api.openai.com/v1
  api_key: ${OPENAI_API_KEY}
  model: gpt-4o

embedding:
  mode: local
```

### 3. Run a Review

```bash
# CLI
pca run -t "Survey on LLM Agents" -f paper1.pdf -f paper2.pdf

# Web UI
pca-web
```

---

## Usage

### CLI

| Command | Description |
|---------|-------------|
| `pca run -t <topic> -f <pdf> …` | Start a new review task |
| `pca run --resume <workspace>` | Resume from a saved workspace |
| `pca run -t <topic> --yes` | Skip confirmations (automation mode) |
| `pca config show` | Display current config (keys masked) |
| `pca config init` | Interactive first-time setup |

### Web UI

Launch the Streamlit dashboard:

```bash
pca-web
# or
streamlit run citeforge/web/app.py
```

Supports English and Chinese (`zh`/`en`) with a monochrome light/dark theme.

---

## Project Structure

```
citeforge/
├── cli/              # Typer CLI entry point
├── core/             # Pydantic models, enums, exceptions
├── orchestrator/     # State machine engine
├── workspace/        # Workspace manager (JSON + SHA-256)
├── agents/           # Researcher, Analyst, Writer
├── ingestion/        # PDF parsing, chunking, summarization
├── retrieval/        # ChromaDB, hybrid search, reranking
├── llm/              # Provider abstraction (OpenAI, Anthropic, Ollama)
├── search/           # Semantic Scholar integration
├── export/           # BibTeX export
├── prompts/          # Agent system prompts
└── web/              # Streamlit UI (i18n, theme, components)
```

---

## Tech Stack

- **Python** 3.10+
- **Models**: Pydantic v2, pydantic-settings
- **CLI**: Typer + Rich
- **LLM**: OpenAI-compatible / Anthropic / Ollama (async, with exponential backoff)
- **Embeddings**: sentence-transformers (local) or API
- **Vector DB**: ChromaDB
- **Search**: Self-contained BM25 + vector RRF fusion
- **PDF Parsing**: PyMuPDF (fitz)
- **Web UI**: Streamlit

---

## Testing

```bash
pytest                    # full suite
pytest tests/core/        # core models
pytest tests/test_bibtex.py -v
pytest tests/test_scorer.py -v
```

---

## License

MIT
