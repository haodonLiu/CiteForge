# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PCA-Lite is a multi-agent collaboration framework for academic literature review writing. CLI-first, Web UI later. Core goals: reliable citations (no hallucination), multi-agent division of labor, human-in-the-loop checkpoints, and resume-from-breakpoint.

## Tech Stack (Locked - Do Not Change)

- Python 3.10+, Pydantic v2, Typer+Rich, httpx, Chroma, PyMuPDF, Jinja2, Pydantic-Settings
- Forbidden: LangChain, LangGraph (any components)
- Local models via HTTP (Qwen3-Embedding, Qwen3-Reranker)

## Architecture

```
CLI (Typer+Rich)
    ↓
Orchestrator (state machine)
    ↓
┌───────────┬───────────┬───────────┐
│ Researcher│ Analyst  │ Writer    │
└───────────┴───────────┴───────────┘
    ↓
Tools (PDF/Vector/Http)
```

Three agent roles: Researcher (verify + search), Analyst (cluster + validate), Writer (draft + cite).

Communication: Shared workspace via JSON files.

## Key Commands

```bash
pip install -e .                      # Install package
python -m pca_lite --help              # CLI help
python -m pca_lite run -t "topic" -f file.pdf  # Run task
python -m pca_lite config show         # Show config (API key masked)
python -m pca_lite config init         # Interactive config setup
```

## Directory Structure

```
pca_lite/
├── cli/           # Typer entry
├── core/          # Pydantic models + enums
├── orchestrator/  # State machine
├── workspace/     # Shared workspace manager
config.yaml       # Config template
pyproject.toml
prompts/           # Design docs
docs/             # Specs + plans
```

## Critical Constraints

1. Citations map to `literature_pool.json` (1-based index)
2. Absolute imports only
3. SHA-256 hashes in `state.json` after each step
4. No LangChain/LangGraph

## Current Status

Implementation plan at `docs/superpowers/plans/2026-05-06-week1-implementation.md`. Execute T01→T15 in order.
