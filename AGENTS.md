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

- **Backend**: Rust (2021 edition), Tauri 2
- **Frontend**: Next.js 14, React 18, TypeScript
- **Database**: SQLite (rusqlite), ChromaDB (vector store)
- **PDF Parsing**: pdf-extract crate
- **LLM**: Async providers with retry logic (OpenAI-compatible, Anthropic, Ollama)
- **Concurrency**: Tokio async runtime
- **Forbidden**: No LangChain, LangGraph, or Python dependencies

## Architecture

```
Next.js Frontend (React)
         │
         ▼
Tauri IPC Commands
         │
         ▼
OrchestratorEngine (async state machine)
         │
         ▼
┌────────────┬────────────┬────────────┐
│ Researcher │  Analyst   │  Writer    │
└────────────┴────────────┴────────────┘
         │
         ▼
Tools (PDF Parser / Vector Store / Hybrid Search / Web Search / BibTeX Export)
```

Agents communicate via shared workspace JSON files, not in-memory state.

### Directory Structure

```
citeforge/
├── src/                      # Next.js frontend
│   ├── app/                  # App router pages
│   │   ├── page.tsx          # Home page
│   │   ├── documents/        # Document upload page
│   │   ├── monitoring/       # Task monitoring page
│   │   └── preview/          # Preview page
│   ├── components/           # React components
│   ├── hooks/                # Custom hooks
│   └── lib/                  # Shared utilities
├── src-tauri/                # Tauri application
│   ├── src/
│   │   ├── main.rs           # Entry point
│   │   ├── lib.rs            # Library exports
│   │   ├── commands/         # IPC command handlers
│   │   └── state.rs          # Application state
│   └── Cargo.toml
├── crates/                   # Rust workspace crates
│   ├── citeforge-core/       # Core types, state machine
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── models.rs     # Data models (Pydantic-equivalent in Rust)
│   │   │   ├── orchestrator.rs
│   │   │   └── errors.rs     # Error types
│   ├── citeforge-llm/        # LLM provider abstraction
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── providers/    # OpenAI, Anthropic, Ollama
│   │       └── embedding.rs
│   ├── citeforge-retrieval/  # Hybrid search and reranking
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── hybrid_search.rs
│   │       └── reranker.rs
│   ├── citeforge-pdf/        # PDF parsing
│   │   └── src/
│   │       ├── lib.rs
│   │       └── parser.rs
│   ├── citeforge-search/     # Semantic Scholar API
│   │   └── src/
│   │       └── lib.rs
│   ├── citeforge-workspace/  # Workspace management
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── manager.rs
│   │       └── integrity.rs  # SHA-256 verification
│   └── citeforge-chroma/     # ChromaDB integration
│       └── src/
│           └── lib.rs
```

## Build and Install

```bash
# Build Tauri application
cargo build --release

# Run in development mode
cargo run -- --dev

# Run tests
cargo test --workspace

# Lint
cargo fmt -- --check
cargo clippy --workspace -- -D warnings
```

## Key Commands

### CLI

```bash
# Run a literature review task
cargo run -- run -t "Survey on LLM Agents" -f paper1.pdf -f paper2.pdf

# Resume from a saved workspace
cargo run -- resume ~/.citeforge/workspace

# Show current config (API keys masked)
cargo run -- config show

# Interactive first-time setup
cargo run -- config init
```

### Frontend Development

```bash
cd src
npm install
npm run dev      # Development server on http://localhost:3000
npm run build    # Production build
```

### Tests

```bash
cargo test --workspace        # Run all Rust tests
cargo test -p citeforge-core  # Run core crate tests
```

## Configuration

Config is loaded from `~/.citeforge/config.yaml` by default. Supports environment variable interpolation: `${VAR_NAME}`.

Required fields:
- `llm.provider`: `openai` | `anthropic` | `ollama`
- `llm.base_url`: API endpoint
- `llm.api_key`: API key (supports `${ENV_VAR}`)
- `llm.model`: Model name
- `embedding.mode`: `local` | `api`

Optional fields have sensible defaults. See `config.yaml` in the project root for the full template.

## Code Style Guidelines

- **Absolute imports only**: Use `use citeforge_core::...`. No relative crate imports like `use crate::...` outside the crate.
- **Error handling**: Use `thiserror` for error types with `#[error(...)]` annotations.
- **Async**: All agent operations are async using Tokio. Use `#[tokio::async_trait]` for async traits.
- **Workspace I/O**: All agent state sharing goes through `WorkspaceManager` JSON files. Do not pass large objects between agents in memory.
- **Documentation**: Use Rustdoc comments (`///`) for public API documentation.

## Testing Instructions

- Rust tests use the built-in `#[test]` attribute with `cargo test`.
- Integration tests live in `tests/` directory at workspace root.
- Run the full suite before committing: `cargo test --workspace`

## Critical Constraints

1. **Citation integrity**: Writer Agent citations must use `[index]` format mapping to `literature_pool.json` (1-based).
2. **SHA-256 integrity**: `state.json` records `sha256:<hash>` for every workspace file after each step. `verify_integrity()` detects tampering on resume.
3. **No Python/LangChain**: The project is a pure Rust/Tauri application. Do not introduce Python or LangChain dependencies.
4. **Workspace directories** (defined in `citeforge-workspace`):
   - `raw_pdfs/` — input PDFs
   - `preprocessed/` — extracted text (JSON)
   - `vector_index/` — ChromaDB persistence
   - `state.json` — execution state + hashes
   - `literature_pool.json` — verified literature entries
   - `themes.json` — analyst output
   - `draft.md` — final review output

## Security Considerations

- API keys in config are stored with environment variable references (`${LLM_API_KEY}`) when possible.
- PDF file paths are sanitized before copying to workspace (`..`, `/`, `\` replaced with `_`).
- SHA-256 hashes verify workspace file integrity on resume.

## Module Details

### citeforge-core/
- **Orchestrator**: State machine managing agent execution pipeline with checkpoint support.
- **Models**: Core data structures for tasks, literature entries, and agent state.

### citeforge-llm/
- **Providers**: OpenAI, Anthropic, and Ollama provider implementations.
- **Retry logic**: Built-in exponential backoff via `backoff` crate.

### citeforge-retrieval/
- **Hybrid search**: Combines BM25 keyword search with vector similarity via Reciprocal Rank Fusion (RRF).
- **Reranker**: Cross-encoder reranking for improved result quality.

### citeforge-pdf/
- **Parser**: Extracts text from PDFs with page-level granularity.
- **Metadata**: Extracts title, authors, DOI from PDF when available.

### citeforge-workspace/
- **Manager**: Handles workspace creation, state persistence, and resume.
- **Integrity**: SHA-256 hash verification for safe resume capability.

## Current Status

Implementation is complete. The project uses a Rust/Tauri backend with Next.js frontend. End-to-end integration testing is in progress.