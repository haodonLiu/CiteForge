# CiteForge

> **Multi-Agent Literature Review Engine** — Orchestrated Researcher, Analyst, and Writer agents that produce structured, citation-guaranteed academic surveys.

---

## Why CiteForge?

Writing a literature review is tedious: hundreds of papers, scattered notes, and the constant fear of misattributing a claim. CiteForge automates the heavy lifting while keeping you in control.

- **Researcher Agent** - Verifies PDF extracts against original text and auto-fills missing metadata via Semantic Scholar.
- **Analyst Agent** - Clusters papers into themes, surfaces trends, and pinpoints research gaps.
- **Writer Agent** - Drafts structured Markdown (Abstract to Conclusion) with every citation rigorously mapped to the literature pool.
- **Human-in-the-Loop** - Confirm or override agent outputs at every major checkpoint.
- **Resume Anywhere** - SHA-256 integrity checks on workspace files let you safely pause and resume long-running tasks.

---

## Architecture

```
+------------------+
|  Vite Frontend    |   (React + TypeScript)
+--------+---------+
         │
         ▼
+------------------+
|  Tauri Backend    |   (Rust + IPC Commands)
+--------+---------+
         │
         ▼
+------------------+
| Orchestrator      |   (Async state machine)
+--------+---------+
         │
         ▼
+----+---+---+----+
│Research│Analyst│Writer│
+--------+-------+------+
         │
         ▼
+------------------+
| Shared Workspace  |
| (SQLite + SHA-256)│
+------------------+
```

---

## Tech Stack

- **Backend**: Rust, Tauri 2
- **Frontend**: Vite, React, TypeScript
- **Database**: SQLite (workspace), ChromaDB (vectors)
- **PDF Parsing**: pdf-extract (Rust)
- **LLM**: OpenAI-compatible / Anthropic / Ollama

---

## Quick Start

### Prerequisites

- Rust 1.70+
- Node.js 20+
- SQLite3

### Build

```bash
# Install frontend dependencies
cd src && npm install

# Development mode
cargo tauri dev           # Full stack with hot reload

# Build release
cargo tauri build         # Produces Windows installer
```

### CLI Commands

```bash
cargo run -- --help       # Show CLI help
cargo run -- run -t "Survey on LLM Agents" -f paper1.pdf -f paper2.pdf
cargo run -- resume ~/.citeforge/workspace
cargo run -- config show
```

---

## Project Structure

```
src/                  # Vite/React frontend
│   ├── pages/            # Route pages (React Router)
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Shared utilities
src-tauri/            # Tauri backend
│   └── src/
│       ├── main.rs       # Entry point
│       ├── lib.rs        # Library exports
│       └── commands/     # IPC command handlers
crates/               # Rust workspace crates
│   ├── citeforge-core/   # Core types and state machine
│   ├── citeforge-llm/    # LLM provider abstraction
│   ├── citeforge-retrieval/  # Hybrid search and reranking
│   ├── citeforge-pdf/    # PDF parsing and text extraction
│   ├── citeforge-search/ # Semantic Scholar integration
│   ├── citeforge-workspace/  # Workspace management
│   └── citeforge-chroma/ # ChromaDB integration
```

---

## Testing

```bash
cargo test --workspace    # Run all Rust tests
cd src && npm test        # Run frontend tests
```

---

## License

MIT