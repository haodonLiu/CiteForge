# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

```bash
./build.sh                     # Build exe (release)
./build.sh --debug             # Build exe (debug)
cd src && npm run dev          # Frontend dev server (Vite)
cargo test --workspace         # Run all tests
```

## Key Commands

```bash
cargo run -- run -t "topic" -f file.pdf     # Run task
cargo run -- resume ~/.citeforge/workspace  # Resume from breakpoint
cargo run -- config show                    # Show config
cargo run -- config init                    # Interactive setup
cargo test --workspace                      # Run all tests
```

## Documentation

- **AGENTS.md** — Complete agent framework guidance (read first)
- **README.md** — Project overview and features

## Tech Stack (Locked)

Rust (2021), Tauri 2, Vite, React 18, React Router, TypeScript, SQLite, ChromaDB. No Python/LangChain/LangGraph.