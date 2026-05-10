# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
cd src && npm run dev          # Pure frontend dev (Vite HMR, port 5173)
cargo tauri dev                # Full stack dev with hot reload
cargo tauri build --debug      # Quick release verification (no installer)
cargo tauri build              # Final release (once a week max, 5-15 min)
cargo check                    # Fast compile check before committing
cargo test --workspace         # All Rust tests
cargo test --package citeforge-core  # Single crate tests
cd src && npx tsc --noEmit     # TypeScript type check
cargo fmt -- --check && cargo clippy --workspace -- -D warnings  # Lint
```

**Never use `cargo tauri build` during iterative development** — it takes 5-15 minutes. Use `cargo tauri dev` or `npm run dev` instead.

## Architecture

```
React/Vite Frontend (src/)
    │  Tauri IPC (invoke)
    ▼
AppContainer (DI container, src-tauri/src/application/container.rs)
    │  Holds: Arc<dyn ChatProvider>, Arc<dyn SearchEngine>,
    │         Arc<dyn VectorStore>, Arc<dyn DocumentParser>
    │
    ├── Commands (src-tauri/src/presentation/commands.rs)
    │   #[tauri::command] handlers, injected via State<AppContainer>
    │
    ├── AppFacade (src-tauri/src/application/facade.rs)
    │   Use-case orchestrator
    │
    ▼
TaskActor (src-tauri/src/domain/task_actor.rs)
    │  Async state machine: Pending → Researching → AnalyzingAndWriting → Completed/Failed
    │  Phase 2 runs Analyst + Writer concurrently via tokio::join!
    │  Analyst output piped to Writer via mpsc channel
    │
    ▼
Agent Pipeline
    ├── ResearcherAgent — verify PDFs, fetch metadata via Semantic Scholar
    ├── AnalystAgent — cluster papers into themes, find gaps
    └── WriterAgent — draft Markdown with citation-guaranteed references
    │
    ▼
Workspace (SQLite + JSON files)
    state.json (SHA-256 integrity), literature_pool.json, themes.json, draft.md
```

### Hexagonal Architecture (Ports & Adapters)

Core interfaces live in `citeforge-core/src/ports/`: `ChatProvider`, `EmbedProvider`, `SearchEngine`, `VectorStore`, `DocumentParser`. Implementations are in separate crates:
- `citeforge-llm` → `ChatProvider`, `EmbedProvider`
- `citeforge-search` → `SearchEngine` (Semantic Scholar)
- `citeforge-chroma` → `VectorStore`
- `citeforge-pdf` → `DocumentParser`

Stub implementations exist in `AppContainer` for when services are unavailable.

### Event System

Two broadcast channels:
- `broadcast::Sender<TaskEvent>` — task-level events, forwarded to frontend via `app_handle.emit("task-event", payload)`
- `broadcast::Sender<AgentEvent>` — detailed agent events, persisted to `EventLog` SQLite table, polled by frontend

Frontend listens via `useTaskEvents` hook in `src/hooks/`.

### Frontend Architecture

**Routing** (React Router v6, two-level):
- Global: `/` (Home), `/library` (Library), `/settings` (Settings)
- Task-scoped: `/task/:taskId/` — overview, literature, reader/:docId, editor, agent
- `TaskLayout` component provides nested tab navigation within a task

**State**: Zustand store (`src/lib/store.ts`) — tasks, current task, activities, theme. Updated from backend events.

**Tauri API mocking**: Vite aliases redirect `@tauri-apps/api/*` to mock modules in `src/lib/tauri-mocks/` during browser dev mode, so `npm run dev` works without Tauri.

**Theme system**: CSS custom properties via `data-theme` attribute on `<html>`. Four themes in `src/styles/themes.css`: ivory_press (default), midnight_scholar, green_garden, high_contrast.

### Cargo Workspace Crates

| Crate | Purpose |
|---|---|
| `citeforge-core` | Domain types, ports (async traits), error handling (thiserror) |
| `citeforge-llm` | LLM providers (OpenAI/Anthropic/Ollama) with retry (backoff) |
| `citeforge-search` | Semantic Scholar API client |
| `citeforge-chroma` | ChromaDB vector store client |
| `citeforge-pdf` | PDF text extraction (lopdf + pdf-extract) |
| `citeforge-retrieval` | Hybrid search (BM25 + vector, RRF fusion) |
| `citeforge-workspace` | Workspace management, SQLite, SHA-256 integrity |
| `citeforge-theme` | CSS theme system |
| `citeforge-memory` | Context/memory management |
| `citeforge-plugin` | WASM plugin system |

## Code Style

### Rust

- **Error handling**: `thiserror` with `#[error(...)]` for domain errors. Use `?` operator, never `.unwrap()` in production.
- **Async**: Tokio runtime. `#[async_trait]` for async trait methods.
- **Imports**: Absolute only — `use citeforge_core::...`, no relative `crate::` outside the crate.
- **Workspace I/O**: Agents communicate via shared workspace JSON files, not in-memory state.
- **Citations**: Writer Agent uses `[index]` format mapping to `literature_pool.json` (1-based). No hallucinated references.
- **Config**: `config.yaml` at project root. Auto-generated with defaults if missing.

### TypeScript/React

- Functional components with hooks, named exports. TypeScript strict mode, avoid `any`.
- Zustand for global state, React state for local.
- Tailwind CSS, follow existing theme variables in `src/styles/themes.css`.
- `@/` alias for absolute imports.

## Testing

```bash
cargo test --workspace                          # All tests
cargo test --package citeforge-core             # Single crate
cargo test test_name                            # Specific test
cargo test -- --nocapture                       # With output
```

- Unit tests: `#[cfg(test)] mod tests` in same file
- Integration tests: `tests/` directory at workspace root
- Test naming: `test_<function>_<scenario>`

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <description>`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`

Scopes: `pdf`, `llm`, `core`, `workspace`, `search`, `chroma`, `retrieval`, `memory`, `plugin`, `theme`

## Tech Stack (Locked)

Rust (2021), Tauri 2, Vite 8, React 18, React Router, TypeScript, SQLite (rusqlite bundled), ChromaDB. No Python/LangChain/LangGraph.
