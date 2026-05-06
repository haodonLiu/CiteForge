# AGENTS.md

This file provides guidance to AI coding agents working with the CiteForge repository. Read this first before making any changes.

## Project Overview

CiteForge is a multi-agent collaboration framework for academic literature review writing. It orchestrates three specialized agents — Researcher, Analyst, and Writer — to produce structured literature reviews with reliable citations and human-in-the-loop checkpoints.

Core design goals:
- **Reliable citations**: All citations map to a `literature_pool.json` index (1-based). No hallucinated references.
- **Multi-agent division of labor**: Researcher (verify + search), Analyst (cluster + validate), Writer (draft + cite).
- **Human-in-the-loop**: CLI confirmation checkpoints at key stages; Web UI supports interactive monitoring.
- **Resume from breakpoint**: SHA-256 integrity checks on workspace files enable safe recovery after interruptions.

## Tech Stack

- **Python**: 3.10+
- **Core libraries**: Pydantic v2, pydantic-settings, Typer, Rich, httpx, PyYAML
- **PDF parsing**: PyMuPDF (fitz)
- **Vector DB**: ChromaDB
- **Embeddings**: sentence-transformers (local) or OpenAI-compatible API
- **Web UI**: Streamlit (monochrome theme, i18n zh/en)
- **Forbidden**: LangChain, LangGraph (any components). Do not introduce them.

## Architecture

```
CLI (Typer + Rich) / Web UI (Streamlit)
    ↓
OrchestratorEngine (state machine + parallel execution)
    ↓
┌─────────────┬─────────────┬─────────────┐
│  Researcher │   Analyst   │   Writer    │
└─────────────┴─────────────┴─────────────┘
    ↓
Tools (PDF Parser / Vector Store / Hybrid Search / Web Search / BibTeX Export)
```

Agents communicate via shared workspace JSON files, not in-memory state.

### Directory Structure

```
citeforge/
├── cli/              # Typer CLI entry point (run, config commands)
│   └── app.py
├── core/             # Pydantic models, enums, exceptions, constants
│   ├── consts.py     # Workspace file names and directory constants
│   ├── enums.py      # TaskStatus, AgentType, ReviewResult
│   ├── exceptions.py # PCAException hierarchy
│   └── models.py     # TaskPlan, Step, LiteratureEntry, State, Config, etc.
├── orchestrator/     # State machine engine
│   └── engine.py     # OrchestratorEngine (plan, execute, resume, parallel groups)
├── workspace/        # Workspace manager
│   └── manager.py    # init, read/write JSON, SHA-256 integrity
├── agents/           # Three agent implementations
│   ├── researcher.py # Verify literature + web search supplement
│   ├── analyst.py    # Theme clustering, trends, gaps
│   └── writer.py     # Draft generation with citation check
├── ingestion/        # Document preprocessing pipeline
│   ├── parser.py     # PDF text extraction (PyMuPDF → JSONL)
│   ├── metadata.py   # Metadata extraction
│   ├── splitter.py   # Recursive character text chunking
│   ├── summarizer.py # L1/L2 auto-summary via LLM
│   └── dedup.py      # DOI/title deduplication + clustering
├── retrieval/        # Search and ranking
│   ├── vector_store.py   # ChromaDB wrapper
│   ├── hybrid_search.py  # BM25 + vector fusion (RRF)
│   ├── reranker.py       # Cross-encoder reranking (local/API)
│   └── scorer.py         # Relevance scoring (vector + metadata + citations)
├── llm/              # LLM provider abstraction
│   ├── base.py           # BaseProvider ABC with retry/backoff
│   ├── embedding.py      # Embedding model wrapper (local/API)
│   └── providers/        # OpenAI, Anthropic, Ollama providers
│       ├── openai.py
│       ├── anthropic.py
│       └── ollama.py
├── search/           # Web search integration
│   └── semantic_scholar.py
├── export/           # Output formatting
│   └── bibtex.py     # Literature pool → BibTeX export
├── prompts/          # Agent system prompts (Markdown)
│   ├── researcher.md
│   ├── analyst.md
│   └── writer.md
└── web/              # Streamlit Web UI
    ├── app.py        # Entry point + navigation
    ├── theme.py      # Monochrome CSS (light/dark)
    ├── i18n.py       # Localization (zh/en YAML)
    ├── components.py # Reusable UI components
    ├── execution.py  # Real orchestrator runner for Web UI
    ├── locales/      # Translation YAML files
    └── pages/        # Page modules
        ├── home.py
        ├── config_page.py
        ├── documents.py
        ├── monitoring.py
        └── preview.py
```

## Build and Install

```bash
# Install in editable mode
pip install -e .

# Verify CLI entry points
pca --help
pca-web --help
python -m citeforge --help
```

Entry points defined in `pyproject.toml`:
- `pca` → `citeforge.cli.app:app`
- `pca-web` → `citeforge.web.app:__main__`

## Key Commands

### CLI

```bash
# Run a literature review task
pca run -t "Survey on LLM Agents" -f paper1.pdf -f paper2.pdf

# Resume from a saved workspace
pca run --resume ~/.pca/workspace

# Skip human confirmation (automation mode)
pca run -t "Topic" --yes

# Show current config (API keys masked)
pca config show

# Interactive first-time setup
pca config init
```

### Web UI

```bash
# Launch Streamlit app
pca-web
# or
streamlit run citeforge/web/app.py
```

### Tests

```bash
pytest                    # Run all tests
pytest tests/core/        # Core module tests
pytest tests/workspace/   # Workspace tests
pytest tests/test_bibtex.py -v
pytest tests/test_scorer.py -v
```

## Configuration

Config is loaded from `~/.pca/config.yaml` by default. Supports environment variable interpolation: `${VAR_NAME}`.

Required fields:
- `llm.provider`: `openai` | `anthropic` | `ollama`
- `llm.base_url`: API endpoint
- `llm.api_key`: API key (supports `${ENV_VAR}`)
- `llm.model`: Model name
- `embedding.mode`: `local` | `api`

Optional fields have sensible defaults. See `config.yaml` in the project root for the full template.

## Code Style Guidelines

- **Absolute imports only**: Always use `from citeforge.module import ...`. No relative imports.
- **Type hints**: Use Python 3.10+ syntax (`str | None`, `list[str]`).
- **Pydantic v2**: All data models use `BaseModel` with `ConfigDict(strict=True)` and `Field(...)` validation.
- **Docstrings**: Google-style docstrings for public functions and classes.
- **Error handling**: Use the custom exception hierarchy in `citeforge.core.exceptions`. Never swallow unexpected errors silently.
- **Async**: LLM provider methods are async. Agent `run()` methods are async. Use `asyncio.run()` at sync boundaries.
- **Workspace I/O**: All agent state sharing goes through `WorkspaceManager` JSON files. Do not pass large objects between agents in memory.

## Testing Instructions

- Tests are in `tests/` using **pytest**.
- Current test coverage:
  - `tests/test_scorer.py` — `RelevanceScorer` unit tests
  - `tests/test_bibtex.py` — BibTeX export unit tests
- When adding new features, add corresponding tests.
- Run the full suite before committing: `pytest`

## Critical Constraints

1. **Citation integrity**: Writer Agent citations must use `[index]` format mapping to `literature_pool.json` (1-based). WriterAgent has `_check_citations()` to validate this.
2. **Absolute imports only**: Never use relative imports within `citeforge/`.
3. **SHA-256 integrity**: `state.json` records `sha256:<hash>` for every workspace file after each step. `verify_integrity()` detects tampering on resume.
4. **No LangChain/LangGraph**: The project explicitly forbids these dependencies.
5. **Workspace directories** (defined in `core/consts.py`):
   - `raw_pdfs/` — input PDFs
   - `preprocessed/` — extracted text (JSONL)
   - `vector_index/` — ChromaDB persistence
   - `state.json` — execution state + hashes
   - `literature_pool.json` — verified literature entries
   - `themes.json` — analyst output
   - `draft.md` — final review output

## Security Considerations

- API keys in config are stored with environment variable references (`${PCA_LLM_API_KEY}`) when possible. The CLI masks keys in `config show`.
- PDF file paths are sanitized before copying to workspace (`..`, `/`, `\` replaced with `_`).
- Temporary file + atomic replace pattern is used for all workspace JSON writes to prevent corruption.
- SHA-256 hashes verify workspace file integrity on resume.

## Module Details

### agents/
- **ResearcherAgent**: Verifies L2 abstracts against originals via LLM; supplements missing metadata via Semantic Scholar web search.
- **AnalystAgent**: Clusters literature into themes, extracts trends and research gaps. Uses async `asyncio.gather()` for parallel sub-tasks.
- **WriterAgent**: Generates structured Markdown drafts (Abstract, Introduction, Methodology, Findings, Discussion, Conclusion). Validates all citations against literature pool size.

### ingestion/
- **parser.py**: Extracts per-page text from PDFs to JSONL. Handles missing text gracefully.
- **splitter.py**: `RecursiveCharacterTextSplitter` with configurable separators, chunk size, and overlap.
- **summarizer.py**: `SummarizerModel` generates L1 (one-line) and L2 (paragraph) summaries via LLM prompts.
- **dedup.py**: `Deduplicator` deduplicates by normalized DOI and title. `Clusterer` supports K-Means or HDBSCAN with sklearn fallback.

### retrieval/
- **vector_store.py**: ChromaDB `PersistentClient` wrapper for add/search/reset.
- **hybrid_search.py**: Self-contained BM25 implementation + vector search fused with Reciprocal Rank Fusion (RRF).
- **reranker.py**: `RerankerModel` supports local (Ollama) and API (OpenAI-compatible) backends.
- **scorer.py**: `RelevanceScorer` computes weighted scores from vector similarity, metadata completeness, and citation count (log scale).

### llm/
- **base.py**: `BaseProvider` ABC defines `chat()`, `embed()`, `rerank()` with built-in exponential backoff retry logic via `_retry()`.
- **providers/**: Each provider implements the ABC. `OllamaProvider` is the unified local model backend (chat/embed/rerank endpoints). `OpenAIProvider` and `AnthropicProvider` are for remote APIs.
- **embedding.py**: `EmbeddingModel` batches texts and routes to local or API provider.

### web/
- **execution.py**: `ExecutionRunner` bridges Streamlit UI with the real OrchestratorEngine and agents. Runs async pipeline in a background thread.
- **i18n.py**: `T(key)` translation function. Locale precedence: config → `PCA_UI_LOCALE` env → default `zh`.
- **theme.py**: Monochrome black-and-white CSS with `prefers-color-scheme: dark` support.

## Current Status

Implementation is complete through Week 5-6 (CLI skeleton, preprocessing, all three agents, hybrid retrieval, Web UI). The remaining open item is end-to-end integration testing. See `TODO.md` for the full task checklist.

The detailed implementation plan lives at `docs/superpowers/plans/2026-05-06-week1-implementation.md`.
