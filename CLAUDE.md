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

## Development Workflow

### Daily Development Flow

```
1. Pull latest changes
   git pull origin main

2. Create feature branch
   git checkout -b feature/your-feature-name

3. Start development
   cargo tauri dev              # Full stack with hot reload
   # OR
   cd src && npm run dev        # Frontend only (90% of cases)

4. Make changes and test locally

5. Run quality checks before commit
   cargo fmt                   # Auto-format Rust code
   cargo clippy --workspace -- -D warnings  # Lint
   cargo test --workspace      # Run tests
   cd src && npx tsc --noEmit  # TypeScript check

6. Commit with conventional commits
   git commit -m "feat: add new feature"
   # OR
   git commit -m "fix: resolve issue"

7. Push and create PR
   git push origin feature/your-feature-name
   # Create PR on GitHub
```

### Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Examples:**
```bash
git commit -m "feat(pdf): add paper structure extraction"
git commit -m "fix(llm): handle Ollama connection timeout"
git commit -m "docs: update CLAUDE.md development workflow"
git commit -m "refactor(core): simplify error handling"
git commit -m "test(workspace): add SHA-256 integrity tests"
```

### Code Quality Gates

Before any commit, ALL of these must pass:

```bash
# 1. Format check
cargo fmt -- --check

# 2. Lint check
cargo clippy --workspace -- -D warnings

# 3. Test check
cargo test --workspace

# 4. TypeScript check (if frontend changed)
cd src && npx tsc --noEmit
```

**If any check fails:**
- Fix the issue before committing
- Never use `--no-verify` to skip hooks
- Never commit code that fails CI

### Feature Development Process

1. **Plan first**
   - Understand requirements
   - Check existing code for patterns
   - Design before implementing

2. **Implement in small steps**
   - Make one logical change at a time
   - Test after each change
   - Commit frequently with clear messages

3. **Follow existing patterns**
   - Check how similar features are implemented
   - Reuse existing utilities and components
   - Maintain consistency with codebase style

4. **Document as you go**
   - Add comments for complex logic
   - Update README if needed
   - Add/update tests

### Git Branch Strategy

```
main (production)
  ├── feature/new-feature
  ├── fix/bug-fix
  ├── docs/update-readme
  └── refactor/cleanup
```

- **main**: Production-ready code, protected branch
- **feature/**: New features, merged via PR
- **fix/**: Bug fixes, merged via PR
- **docs/**: Documentation updates
- **refactor/**: Code refactoring

### PR (Pull Request) Guidelines

1. **Title**: Use conventional commit format
2. **Description**: Explain what and why, not how
3. **Checklist**:
   - [ ] Code follows project style
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] No breaking changes (or clearly documented)
4. **Review**: At least 1 approval required
5. **CI**: All checks must pass

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

### Rust

- **Error handling**: Use `thiserror` with `#[error(...)]` for domain errors.
- **Async**: Tokio runtime. Use `#[async_trait]` for async trait methods.
- **Workspace I/O**: Agents communicate via shared workspace JSON files, not in-memory state.
- **Citations**: Writer Agent uses `[index]` format mapping to `literature_pool.json` (1-based). No hallucinated references.
- **Absolute imports**: `use citeforge_core::...` — no relative `crate::` imports outside the crate.
- **Config**: `config.yaml` at project root. Auto-generated with defaults if missing.
- **Naming**: snake_case for functions/variables, PascalCase for types, SCREAMING_SNAKE_CASE for constants.
- **Documentation**: Add `///` doc comments for public items, `//` for complex logic.
- **Error propagation**: Use `?` operator, avoid `.unwrap()` in production code.

### TypeScript/React

- **Components**: Functional components with hooks, named exports.
- **Types**: Use TypeScript strict mode, avoid `any`.
- **State**: Zustand for global state, React state for local.
- **Styling**: Tailwind CSS, follow existing theme variables.
- **Imports**: Use `@/` alias for absolute imports.

### General

- **No dead code**: Remove unused code immediately, don't comment it out.
- **No TODOs in production**: Complete features before merging.
- **Small functions**: Keep functions focused and under 50 lines.
- **Single responsibility**: Each module/function does one thing well.

## Testing Strategy

### Rust Tests

```bash
# Run all tests
cargo test --workspace

# Run specific crate tests
cargo test --package citeforge-core

# Run specific test
cargo test test_name

# Run with output
cargo test -- --nocapture
```

**Test placement:**
- Unit tests: `#[cfg(test)] mod tests` in same file
- Integration tests: `tests/` directory (when needed)
- Test naming: `test_<function>_<scenario>` or `test_<scenario>`

### Frontend Tests

```bash
cd src && npm test  # When test framework is added
```

**Test placement:**
- Component tests: `__tests__/` or `*.test.tsx` next to component
- Hook tests: `*.test.ts` next to hook
- Utility tests: `*.test.ts` next to utility

### Test Coverage

- Aim for 80%+ coverage on critical paths
- Test error cases, not just happy path
- Mock external services (LLM, ChromaDB, Semantic Scholar)

## CI/CD Integration

### GitHub Actions

**CI Workflow** (on push/PR to main):
1. Lint: `cargo fmt --check` + `cargo clippy` + `npx tsc`
2. Test: `cargo test --workspace`
3. Build: Frontend + Tauri (multi-platform)

**Release Workflow** (on tag `v*`):
1. Build for Ubuntu, macOS, Windows
2. Create GitHub Release with artifacts

### Quality Gates

**Before commit:**
```bash
cargo fmt
cargo clippy --workspace -- -D warnings
cargo test --workspace
cd src && npx tsc --noEmit
```

**Before PR:**
- All quality gates pass
- Tests added for new features
- Documentation updated
- No breaking changes (or documented)

**Before merge:**
- CI passes
- Code review approved
- No unresolved comments

## Tech Stack (Locked)

Rust (2021), Tauri 2, Vite 8, React 18, React Router, TypeScript, SQLite (rusqlite bundled), ChromaDB. No Python/LangChain/LangGraph.
