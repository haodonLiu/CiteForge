# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

```bash
cd src && npm run dev          # Pure frontend dev (Vite HMR, 90% of cases)
cargo tauri dev                # Full stack dev (Windows PowerShell)
cargo tauri build --debug      # Quick release verification (no installer)
cargo tauri build              # Final release (once a week max)
cargo test --workspace         # Run all tests
cargo check                    # Fast compile check before committing
```

## Build & Development Commands

- **Always use `cargo tauri dev`** for development/debugging. NEVER use `cargo tauri build` during iterative development — it's extremely slow (5-15 min).
- Pure frontend changes: `npm run dev` in WSL, browser at `http://localhost:5173`.
- Run `cargo check` before committing to catch compile errors early.
- Lint: `cargo fmt -- --check && cargo clippy --workspace -- -D warnings`

## Architecture

```
React/Vite Frontend (src/)
    │  Tauri IPC (invoke)
    ▼
AppContainer (DI container, src-tauri/src/application/container.rs)
    │
    ├── AppFacade (use-case orchestrator, facade.rs)
    ├── Commands (src-tauri/src/presentation/commands.rs)
    │   run_task, resume_task, get_task_status, get_agent_context, ...
    │
    ▼
Agent Pipeline (3-stage)
    ├── ResearcherAgent — verify PDFs, fetch metadata via Semantic Scholar
    ├── AnalystAgent — cluster papers into themes, find gaps
    └── WriterAgent — draft Markdown with citation-guaranteed references
    │
    ▼
Workspace (SQLite + JSON files)
    state.json (SHA-256 integrity), literature_pool.json, themes.json, draft.md
```

**Frontend ↔ Backend communication:**
- Commands: `#[tauri::command]` in `src-tauri/src/presentation/commands.rs`, injected via `State<AppContainer>`
- Events: `app_handle.emit("task-event", payload)` → frontend listens via `useTaskEvents` hook

**Cargo workspace** (`crates/`):
- `citeforge-core` — domain types, async traits, error handling (thiserror)
- `citeforge-llm` — LLM providers (OpenAI/Anthropic/Ollama) with retry
- `citeforge-search` — Semantic Scholar API client
- `citeforge-chroma` — ChromaDB vector store client
- `citeforge-pdf` — PDF text extraction
- `citeforge-retrieval` — hybrid search (BM25 + vector, RRF fusion)
- `citeforge-workspace` — workspace management, SHA-256 integrity
- `citeforge-theme` — CSS theme system
- `citeforge-memory` — context/memory management
- `citeforge-plugin` — WASM plugin system

## Code Style

- **Error handling**: Use `thiserror` with `#[error(...)]` for domain errors.
- **Async**: Tokio runtime. Use `#[async_trait]` for async trait methods.
- **Workspace I/O**: Agents communicate via shared workspace JSON files, not in-memory state.
- **Citations**: Writer Agent uses `[index]` format mapping to `literature_pool.json` (1-based). No hallucinated references.
- **Absolute imports**: `use citeforge_core::...` — no relative `crate::` imports outside the crate.
- **Config**: `config.yaml` at project root. Auto-generated with defaults if missing.

## Tech Stack (Locked)

Rust (2021), Tauri 2, Vite 8, React 18, React Router, TypeScript, SQLite (rusqlite bundled), ChromaDB. No Python/LangChain/LangGraph.
