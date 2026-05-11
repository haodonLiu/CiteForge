# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
CLAUDE.md
Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

Tradeoff: These guidelines bias toward caution over speed. For trivial tasks, use judgment.

1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

State your assumptions explicitly. If uncertain, ask.
If multiple interpretations exist, present them - don't pick silently.
If a simpler approach exists, say so. Push back when warranted.
If something is unclear, stop. Name what's confusing. Ask.
2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

No features beyond what was asked.
No abstractions for single-use code.
No "flexibility" or "configurability" that wasn't requested.
No error handling for impossible scenarios.
If you write 200 lines and it could be 50, rewrite it.
Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

3. Surgical Changes
Touch only what you must. Clean up only your own mess.

When editing existing code:

Don't "improve" adjacent code, comments, or formatting.
Don't refactor things that aren't broken.
Match existing style, even if you'd do it differently.
If you notice unrelated dead code, mention it - don't delete it.
When your changes create orphans:

Remove imports/variables/functions that YOUR changes made unused.
Don't remove pre-existing dead code unless asked.
The test: Every changed line should trace directly to the user's request.

4. Goal-Driven Execution
Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

"Add validation" → "Write tests for invalid inputs, then make them pass"
"Fix the bug" → "Write a test that reproduces it, then make it pass"
"Refactor X" → "Ensure tests pass before and after"
For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Commands

```bash
cd src && npm run dev          # Frontend only (Vite HMR, port 5173)
cargo tauri dev                # Full stack dev with hot reload
cargo tauri build --debug      # Quick release build (no installer)
cargo tauri build              # Final release (5-15 min, use sparingly)
cargo check                    # Fast compile check before commits
cargo test --workspace         # All Rust tests
cargo test --package citeforge-core  # Single crate
cargo tauri build --debug      # Quick verification build
cd src && npx tsc --noEmit     # TypeScript type check
cargo fmt -- --check && cargo clippy --workspace -- -D warnings  # Lint
```

**Never use `cargo tauri build` during iterative development** — it takes 5-15 minutes. Use `cargo tauri dev` instead.

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

### Frontend Type System

**Type boundaries**: `src/lib/types/` is split into two layers:
- `types/api.ts` — API response types from Rust backend (snake_case, matching Rust JSON)
- `types/domain.ts` — Frontend domain types (camelCase, internal use)

**Conversion**: All API responses must be converted via mapper functions (`mapApi*`) before use in components/hooks. This ensures the frontend uses consistent camelCase while remaining compatible with the snake_case Rust API.

Example:
```typescript
// API (snake_case)
const apiData = await invoke<ApiLiterature[]>('get_literature', { task_id });
// Convert to domain (camelCase)
const literature = apiData.map(mapApiLiterature);
```

### Frontend Architecture

**Routing** (React Router v6, two-level):
- Global: `/` (Home), `/library` (Library), `/settings` (Settings)
- Task-scoped: `/task/:taskId/` — overview, literature, reader/:docId, editor, agent
- `TaskLayout` component provides nested tab navigation within a task

**State**: Zustand store (`src/lib/store.ts`) — tasks, current task, activities, theme. Updated from backend events via `useTaskEvents` hook.

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
- **Type boundary**: Always use domain types (camelCase) in components/hooks. Convert API responses via mappers from `types/domain.ts`.

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
