# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

```bash
pip install -e .                      # Install package
python -m citeforge --help            # CLI help
start.bat                             # Launch GUI launcher
```

## Key Commands

```bash
pca run -t "topic" -f file.pdf        # Run task
pca run --resume ~/.pca/workspace      # Resume from breakpoint
pca config show                        # Show config
pca config init                        # Interactive setup
pytest                                # Run all tests
```

## Documentation

- **AGENTS.md** — Complete agent framework guidance (read first)
- **README.md** — Project overview and features

## Tech Stack (Locked)

Python 3.10+, Pydantic v2, Typer+Rich, httpx, Chroma, PyMuPDF. No LangChain/LangGraph.