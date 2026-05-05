# PCA-Lite Week 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Week 1 skeleton: CLI entry, config system, orchestrator state machine, shared workspace manager.

**Architecture:** Sequential per layer. Core models (T02-T04) → Workspace (T06-T08) → Orchestrator (T09-T11) → CLI (T12-T15). Each task produces working code validated before moving next.

**Tech Stack:** Python 3.10+, Pydantic v2, Typer, Rich, pydantic-settings, PyYAML. No LangChain/LangGraph.

---

## Task T01: Create Package Structure

**Files:**
- Create: `pca_lite/__init__.py`, `pca_lite/__main__.py`
- Create: `pca_lite/cli/__init__.py`, `pca_lite/core/__init__.py`, `pca_lite/orchestrator/__init__.py`, `pca_lite/workspace/__init__.py`

- [ ] **Step 1: Create directories**

```bash
cd /mnt/c/Users/10954/Desktop/Projects/PCA
mkdir -p pca_lite/cli pca_lite/core pca_lite/orchestrator pca_lite/workspace
```

- [ ] **Step 2: Create `pca_lite/__init__.py`**

```python
__version__ = "0.1.0"
```

- [ ] **Step 3: Create `pca_lite/__main__.py`**

```python
from pca_lite.cli.app import app

app()
```

- [ ] **Step 4: Create empty `__init__.py` files**

```bash
touch pca_lite/cli/__init__.py pca_lite/core/__init__.py pca_lite/orchestrator/__init__.py pca_lite/workspace/__init__.py
```

- [ ] **Step 5: Verify**

```bash
python -c "import pca_lite; print(pca_lite.__version__)"
python -c "from pca_lite.cli import app; print(type(app))"
```

- [ ] **Step 6: Commit**

```bash
git add pca_lite/
git commit -m "feat: create package skeleton (T01)"
```

---

## Task T02: Define Enums

**Files:**
- Create: `pca_lite/core/enums.py`

- [ ] **Step 1: Write failing test**

```python
# tests/core/test_enums.py
from pca_lite.core.enums import TaskStatus, AgentType, ReviewResult

def test_task_status_values():
    assert TaskStatus.COMPLETED.value == "completed"
    assert TaskStatus.COMPLETED == "completed"

def test_agent_type_values():
    assert AgentType.WRITER.value == "writer"

def test_review_result_values():
    assert ReviewResult.NEEDS_RETRY.value == "needs_retry"

def test_invalid_enum_value():
    import pytest
    with pytest.raises(ValueError):
        TaskStatus("invalid")
```

Run: `pytest tests/core/test_enums.py -v` — Expected: FAIL (enums not defined)

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/core/test_enums.py -v
```

- [ ] **Step 3: Implement enums**

```python
from enum import Enum

# Task execution status
class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"

# Agent role types
class AgentType(str, Enum):
    PREPROCESSOR = "preprocessor"
    RESEARCHER = "researcher"
    ANALYST = "analyst"
    WRITER = "writer"
    ORCHESTRATOR = "orchestrator"

# Validation result
class ReviewResult(str, Enum):
    PASS = "pass"
    FAIL = "fail"
    NEEDS_RETRY = "needs_retry"
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/core/test_enums.py -v
```

- [ ] **Step 5: Commit**

```bash
git add pca_lite/core/enums.py tests/
git commit -m "feat: define core enums T02/T03 (T02)"
```

---

## Task T03: Define Core Pydantic Models

**Files:**
- Create: `pca_lite/core/models.py`

- [ ] **Step 1: Write failing test**

```python
# tests/core/test_models.py
from pca_lite.core.models import TaskPlan, Step, LiteratureEntry, State
from pca_lite.core.enums import AgentType, TaskStatus

def test_literature_entry_index_validation():
    # Valid: index >= 1
    e = LiteratureEntry(index=1, title="test", source="local_pdf")
    assert e.index == 1

    # Invalid: index = 0 should fail
    import pytest
    with pytest.raises(Exception):
        LiteratureEntry(index=0, title="test", source="local_pdf")

def test_step_id_pattern():
    s = Step(id="step_0", agent=AgentType.RESEARCHER, task="test", output="x.json")
    assert s.id == "step_0"

    with pytest.raises(Exception):
        Step(id="invalid", agent=AgentType.RESEARCHER, task="test", output="x.json")

def test_taskplan_construction():
    plan = TaskPlan(
        topic="test",
        created_at="2026-05-05",
        sources=Sources(),
        steps=[Step(id="step_0", agent=AgentType.ORCHESTRATOR, task="test", output="x.json")]
    )
    assert plan.topic == "test"
    assert len(plan.steps) == 1
```

Run: `pytest tests/core/test_models.py -v` — Expected: FAIL (models not defined)

- [ ] **Step 2: Implement models**

```python
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from pca_lite.core.enums import AgentType

class Step(BaseModel):
    model_config = ConfigDict(strict=True)

    id: str = Field(..., pattern=r"^step_\w+$", examples=["step_0"])
    agent: AgentType
    task: str = Field(..., min_length=1, max_length=500)
    tools: list[str] = Field(default_factory=list)
    input_from: list[str] = Field(default_factory=list)
    output: str = Field(...)
    parallel_group: str | None = None

class Constraints(BaseModel):
    model_config = ConfigDict(strict=True)

    max_retry: int = Field(default=1, ge=0, le=10)
    max_total_tokens: int = Field(default=50000, gt=0)
    max_step_tokens: int = Field(default=8000, gt=0)
    consensus_threshold: float = Field(default=0.67, ge=0.0, le=1.0)

class Sources(BaseModel):
    model_config = ConfigDict(strict=True)

    local_files: list[Path] = Field(default_factory=list)
    search_queries: list[str] = Field(default_factory=list)

class TaskPlan(BaseModel):
    model_config = ConfigDict(strict=True)

    topic: str = Field(..., min_length=1, max_length=500)
    created_at: str = Field(...)
    review_type: str = Field(default="default", pattern=r"^(default|comparison|timeline|meta_analysis)$")
    sources: Sources
    steps: list[Step] = Field(..., min_length=1)
    constraints: Constraints = Field(default_factory=Constraints)

class LiteratureEntry(BaseModel):
    model_config = ConfigDict(strict=True)

    index: int = Field(..., ge=1)
    title: str = Field(..., min_length=1, max_length=1000)
    authors: list[str] = Field(default_factory=list)
    year: int | None = None
    source: str = Field(..., pattern=r"^(local_pdf|web_search)$")
    file_path: Path | None = None
    page_range: list[int] | None = None
    doi: str | None = None
    url: str | None = None
    abstract: str | None = None
    key_findings: list[str] = Field(default_factory=list)
    l1_summary: str | None = None
    figures: list[Path] = Field(default_factory=list)
    relevance_score: float = Field(default=0.0, ge=0.0, le=1.0)
    preliminary_cluster: str | None = None
    vector_chunk_ids: list[str] = Field(default_factory=list)

class State(BaseModel):
    model_config = ConfigDict(strict=True)

    plan_version: str = Field(default="1.0")
    current_step: str = Field(...)
    completed_steps: list[str] = Field(default_factory=list)
    retry_counts: dict[str, int] = Field(default_factory=dict)
    workspace_files: dict[str, str] = Field(default_factory=dict)
    vector_index_hash: str = Field(default="")
    timestamp: str = Field(...)

class ValidationIssue(BaseModel):
    model_config = ConfigDict(strict=True)

    location: str = Field(...)
    problem: str = Field(..., min_length=1)
    suggestion: str = Field(default="")
    severity: str = Field(default="medium", pattern=r"^(low|medium|high)$")

class ValidationReport(BaseModel):
    model_config = ConfigDict(strict=True)

    pass_: bool = Field(..., alias="pass")
    issues: list[ValidationIssue] = Field(default_factory=list)
    severity: str = Field(default="medium", pattern=r"^(low|medium|high)$")
```

- [ ] **Step 3: Run test to verify it passes**

```bash
pytest tests/core/test_models.py -v
```

- [ ] **Step 4: Commit**

```bash
git add pca_lite/core/models.py tests/
git commit -m "feat: define core Pydantic models (T03)"
```

---

## Task T04: Define Config Models

**Files:**
- Modify: `pca_lite/core/models.py` (append at end)

- [ ] **Step 1: Write failing test**

```python
# tests/core/test_config.py
from pca_lite.core.models import Config, LLMConfig, EmbeddingConfig

def test_llm_config_validation():
    c = LLMConfig(provider="openai", base_url="https://api.openai.com", api_key="sk-test", model="gpt-4o")
    assert c.provider == "openai"

    with pytest.raises(Exception):
        LLMConfig(provider="invalid", base_url="x", api_key="x", model="x")

def test_retry_config_defaults():
    from pca_lite.core.models import RetryConfig
    r = RetryConfig()
    assert r.max_attempts == 3
    assert r.backoff == "exponential"
```

- [ ] **Step 2: Implement config models**

Append to `pca_lite/core/models.py`:

```python
from pydantic_settings import BaseSettings

class RetryConfig(BaseModel):
    model_config = ConfigDict(strict=True)
    max_attempts: int = Field(default=3, ge=1)
    backoff: str = Field(default="exponential", pattern=r"^(fixed|exponential)$")
    initial_delay: float = Field(default=1.0, ge=0)
    max_delay: float = Field(default=30.0, ge=0)

class LLMConfig(BaseModel):
    model_config = ConfigDict(strict=True)
    provider: str = Field(..., pattern=r"^(openai|anthropic|ollama)$")
    base_url: str = Field(..., min_length=1)
    api_key: str = Field(..., min_length=1)
    model: str = Field(..., min_length=1)
    temperature: float = Field(default=0.3, ge=0.0, le=2.0)
    max_tokens: int = Field(default=4096, gt=0)
    timeout: int = Field(default=120, gt=0)
    retry: RetryConfig = Field(default_factory=RetryConfig)

class EmbeddingConfig(BaseModel):
    model_config = ConfigDict(strict=True)
    mode: str = Field(..., pattern=r"^(local|api)$")
    api_base_url: str = Field(default="")
    api_key: str = Field(default="")
    api_model: str = Field(default="")
    local_model: str = Field(default="")
    local_device: str = Field(default="cpu", pattern=r"^(cpu|cuda|mps)$")
    dimensions: int | None = None
    batch_size: int = Field(default=64, gt=0)
    mrl_enabled: bool = Field(default=False)
    mrl_dimensions: list[int] = Field(default_factory=list)

class RerankerConfig(BaseModel):
    model_config = ConfigDict(strict=True)
    mode: str = Field(default="", pattern=r"^(local|api|)$")
    local_model: str = Field(default="")
    local_device: str = Field(default="cpu")
    api_provider: str = Field(default="")
    api_base_url: str = Field(default="")
    api_key: str = Field(default="")
    api_model: str = Field(default="")
    top_k: int = Field(default=5, gt=0)
    recall_multiplier: int = Field(default=4, gt=0)

class VectorDBConfig(BaseModel):
    model_config = ConfigDict(strict=True)
    engine: str = Field(default="chroma", pattern=r"^(chroma|milvus_lite|faiss)$")
    persist_dir: str = Field(default="./workspace/vector_index")
    collection_name: str = Field(default="papers")

class SearchConfig(BaseModel):
    model_config = ConfigDict(strict=True)
    provider: str = Field(default="")
    api_key: str = Field(default="")
    base_url: str = Field(default="")
    max_results: int = Field(default=15, gt=0)

class ParserConfig(BaseModel):
    model_config = ConfigDict(strict=True)
    pdf_engine: str = Field(default="pymupdf", pattern=r"^(pymupdf|pdfplumber)$")
    chunk_size: int = Field(default=512, gt=0)
    chunk_overlap: int = Field(default=50, ge=0)
    extract_images: bool = Field(default=True)
    image_dir: str = Field(default="./workspace/images")

class OrchestratorConfig(BaseModel):
    model_config = ConfigDict(strict=True)
    max_retry: int = Field(default=1, ge=0)
    max_total_tokens: int = Field(default=50000, gt=0)
    max_step_tokens: int = Field(default=8000, gt=0)
    consensus_threshold: float = Field(default=0.67, ge=0.0, le=1.0)

class PersistenceConfig(BaseModel):
    model_config = ConfigDict(strict=True)
    state_file: str = Field(default="./workspace/state.json")
    hash_algorithm: str = Field(default="sha256")

class LoggingConfig(BaseModel):
    model_config = ConfigDict(strict=True)
    level: str = Field(default="INFO", pattern=r"^(DEBUG|INFO|WARNING|ERROR)$")
    file: str = Field(default="./workspace/pca.log")

class Config(BaseSettings):
    model_config = ConfigDict(yaml_file="config.yaml", env_prefix="PCA_")
    llm: LLMConfig
    llm_lite: LLMConfig | None = None
    embedding: EmbeddingConfig
    reranker: RerankerConfig = Field(default_factory=RerankerConfig)
    vector_db: VectorDBConfig = Field(default_factory=VectorDBConfig)
    search: SearchConfig = Field(default_factory=SearchConfig)
    parser: ParserConfig = Field(default_factory=ParserConfig)
    orchestrator: OrchestratorConfig = Field(default_factory=OrchestratorConfig)
    persistence: PersistenceConfig = Field(default_factory=PersistenceConfig)
    logging: LoggingConfig = Field(default_factory=LoggingConfig)
```

- [ ] **Step 3: Run test to verify it passes**

```bash
pytest tests/core/test_config.py -v
```

- [ ] **Step 4: Commit**

```bash
git add pca_lite/core/models.py tests/
git commit -m "feat: define config models (T04)"
```

---

## Task T05: Create config.yaml + pyproject.toml

**Files:**
- Create: `config.yaml`, `pyproject.toml`

- [ ] **Step 1: Create `config.yaml` template**

```yaml
# ============================================================
# PCA-Lite Configuration Template
# ============================================================

# ---------- LLM (main model) [core] ----------
llm:
  provider: ""
  base_url: ""
  api_key: ""
  model: ""
  temperature: 0.3
  max_tokens: 4096
  timeout: 120
  retry:
    max_attempts: 3
    backoff: "exponential"
    initial_delay: 1.0
    max_delay: 30.0

# ---------- LLM (lite model) [optional] ----------
llm_lite:
  provider: ""
  base_url: ""
  api_key: ""
  model: ""
  temperature: 0.3
  max_tokens: 1024
  timeout: 60
  retry:
    max_attempts: 3
    backoff: "exponential"
    initial_delay: 1.0
    max_delay: 30.0

# ---------- Embedding model [core] ----------
embedding:
  mode: ""
  api_base_url: ""
  api_key: ""
  api_model: ""
  local_model: ""
  local_device: "cpu"
  dimensions:
  batch_size: 64
  mrl_enabled: false
  mrl_dimensions: []

# ---------- Reranker [optional] ----------
reranker:
  mode: ""
  local_model: ""
  local_device: "cpu"
  api_provider: ""
  api_base_url: ""
  api_key: ""
  api_model: ""
  top_k: 5
  recall_multiplier: 4

# ---------- Vector DB [optional] ----------
vector_db:
  engine: "chroma"
  persist_dir: "./workspace/vector_index"
  collection_name: "papers"

# ---------- Search [optional] ----------
search:
  provider: ""
  api_key: ""
  base_url: ""
  max_results: 15

# ---------- Parser [optional] ----------
parser:
  pdf_engine: "pymupdf"
  chunk_size: 512
  chunk_overlap: 50
  extract_images: true
  image_dir: "./workspace/images"

# ---------- Orchestrator [optional] ----------
orchestrator:
  max_retry: 1
  max_total_tokens: 50000
  max_step_tokens: 8000
  consensus_threshold: 0.67

# ---------- Persistence [optional] ----------
persistence:
  state_file: "./workspace/state.json"
  hash_algorithm: "sha256"

# ---------- Logging [optional] ----------
logging:
  level: "INFO"
  file: "./workspace/pca.log"
```

- [ ] **Step 2: Create `pyproject.toml`**

```toml
[build-system]
requires = ["setuptools>=68.0", "wheel"]
build-backend = "setuptools.backends._legacy:_Backend"

[project]
name = "pca-lite"
version = "0.1.0"
description = "面向论文综述的多 Agent 协作框架"
requires-python = ">=3.10"
dependencies = [
    "pydantic>=2.0",
    "pydantic-settings>=2.0",
    "typer>=0.9",
    "rich>=13.0",
    "httpx>=0.25",
    "pyyaml>=6.0",
    "pymupdf>=1.23",
    "chromadb>=0.4",
    "sentence-transformers>=2.2",
]

[project.scripts]
pca = "pca_lite.cli.app:app"

[tool.setuptools.packages.find]
include = ["pca_lite*"]
```

- [ ] **Step 3: Create `.gitignore`**

```gitignore
__pycache__/
*.py[cod]
venv/
.venv/
.idea/
.vscode/
workspace/
*.log
.pca/
.env
```

- [ ] **Step 4: Verify pyproject.toml is valid**

```bash
pip install -e /mnt/c/Users/10954/Desktop/Projects/PCA 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add config.yaml pyproject.toml .gitignore
git commit -m "feat: add config template and pyproject.toml (T05)"
```

---

## Task T06: Workspace Init

**Files:**
- Create: `pca_lite/workspace/manager.py`

- [ ] **Step 1: Write failing test**

```python
# tests/workspace/test_manager.py
import tempfile, shutil
from pathlib import Path
from pca_lite.workspace.manager import WorkspaceManager

def test_init_workspace():
    with tempfile.TemporaryDirectory() as tmpdir:
        ws = WorkspaceManager(Path(tmpdir))
        ws.init_workspace()
        assert (Path(tmpdir) / "raw_pdfs").exists()
        assert (Path(tmpdir) / "preprocessed").exists()
        assert (Path(tmpdir) / "vector_index").exists()
        assert (Path(tmpdir) / "state.json").exists()

def test_init_idempotent():
    with tempfile.TemporaryDirectory() as tmpdir:
        ws = WorkspaceManager(Path(tmpdir))
        ws.init_workspace()
        ws.init_workspace()  # no error
```

Run: `pytest tests/workspace/test_manager.py::test_init_workspace -v` — Expected: FAIL

- [ ] **Step 2: Implement WorkspaceManager.init_workspace**

```python
import json
from pathlib import Path
from datetime import datetime
from pca_lite.core.models import State

class WorkspaceManager:
    def __init__(self, workspace_dir: Path):
        self.workspace_dir = Path(workspace_dir)

    def init_workspace(self) -> None:
        self.workspace_dir.mkdir(parents=True, exist_ok=True)
        (self.workspace_dir / "raw_pdfs").mkdir(parents=True, exist_ok=True)
        (self.workspace_dir / "preprocessed").mkdir(parents=True, exist_ok=True)
        (self.workspace_dir / "vector_index").mkdir(parents=True, exist_ok=True)

        state_path = self.workspace_dir / "state.json"
        if not state_path.exists():
            state = State(
                current_step="",
                timestamp=datetime.now().isoformat()
            )
            with open(state_path, "w", encoding="utf-8") as f:
                f.write(state.model_dump_json(indent=2))
```

- [ ] **Step 3: Run test**

```bash
pytest tests/workspace/test_manager.py -v
```

- [ ] **Step 4: Commit**

```bash
git add pca_lite/workspace/manager.py tests/
git commit -m "feat: implement workspace init (T06)"
```

---

## Task T07: JSON Read/Write

- [ ] **Step 1: Add tests + implement read_json, write_json**

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: implement JSON read/write (T07)"
```

---

## Task T08: SHA-256 Integrity

- [ ] **Step 1: Add tests + implement compute_hash, verify_integrity**

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: implement SHA-256 integrity check (T08)"
```

---

## Task T09: Plan Generation

- [ ] **Step 1: Implement OrchestratorEngine.load_or_create_plan**

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: implement plan generation (T09)"
```

---

## Task T10: Execute Plan + State Machine

- [ ] **Step 1: Implement execute_plan, execute_step with retry logic**

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: implement state machine execution (T10)"
```

---

## Task T11: Resume from Breakpoint

- [ ] **Step 1: Implement resume method**

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: implement resume from breakpoint (T11)"
```

---

## Task T12: Config Loading

- [ ] **Step 1: Implement load_config, validate_config**

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: implement config loading (T12)"
```

---

## Task T13: Interactive Setup

- [ ] **Step 1: Implement interactive_setup with Rich prompts**

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: implement interactive setup (T13)"
```

---

## Task T14: CLI Entry (Typer)

- [ ] **Step 1: Implement run command, config subcommand**

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: implement CLI entry with Typer (T14)"
```

---

## Task T15: Verify __main__.py

- [ ] **Step 1: Verify `python -m pca_lite --help` works**

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: verify CLI entry point (T15)"
```
