# PCA-Lite Week 1 编码任务拆分（详细版）

> 由 TaskArchitect 生成，遵循 task_architect.md 规范。
> 每个任务的 description 假设执行者完全不知道项目背景，只看到当前任务描述即可独立完成。

---

## 主体框架设计

PCA-Lite 是一个 CLI 工具，用于论文综述的多 Agent 协作撰写。四层架构：

1. **CLI 入口层**：Typer + Rich，接收用户命令
2. **调度层 (Orchestrator)**：状态机驱动 TaskPlan 执行，维护共享工作区
3. **Agent 层**（Week 2+ 实现）：Researcher / Analyst / Writer 三个角色
4. **工具层**（Week 2+ 实现）：PDF 解析、向量检索、LLM API 调用

Week 1 聚焦骨架：CLI + 配置系统 + 调度层顺序执行 + 共享工作区读写。Agent 和工具层在 Week 2 实现，Week 1 的 execute_step 为 stub（打印日志 + 返回空 dict）。

模块间数据流：
```
用户 CLI 输入 → load_config() → OrchestratorEngine.execute_plan(plan)
  → 遍历 plan.steps，每步调用 execute_step()（Week 1: stub）
  → 每步执行后 WorkspaceManager.write_json() 持久化 state.json
  → 最终 State 返回给 CLI 层输出结果
```

---

## 目录结构

```
pca_lite/
├── __init__.py              # 包声明，包含 __version__
├── __main__.py              # python -m pca_lite 入口，调用 app()
├── cli/
│   ├── __init__.py          # 空文件
│   └── app.py               # Typer 应用定义 + Rich 渲染
├── core/
│   ├── __init__.py          # 空文件
│   ├── enums.py             # 枚举定义：TaskStatus, AgentType, ReviewResult
│   └── models.py            # 所有 Pydantic 数据模型
├── orchestrator/
│   ├── __init__.py          # 空文件
│   └── engine.py            # 调度层状态机
├── workspace/
│   ├── __init__.py          # 空文件
│   └── manager.py           # 共享工作区读写
├── config.yaml              # 配置模板（项目根目录）
└── pyproject.toml           # 项目元数据与依赖
```

tests/ 目录在 Week 1 暂不创建，等各模块实现稳定后再补。

---

## 核心数据结构（完整定义，所有任务共享）

以下是所有 Pydantic 模型和枚举的完整定义。每个模型使用 `ConfigDict(strict=True)`。Config 使用 `pydantic_settings.BaseSettings`。

```python
# ========== pca_lite/core/enums.py ==========

from enum import Enum

class TaskStatus(str, Enum):
    """步骤执行状态"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"

class AgentType(str, Enum):
    """Agent 角色类型"""
    PREPROCESSOR = "preprocessor"
    RESEARCHER = "researcher"
    ANALYST = "analyst"
    WRITER = "writer"
    ORCHESTRATOR = "orchestrator"

class ReviewResult(str, Enum):
    """校验结果"""
    PASS = "pass"
    FAIL = "fail"
    NEEDS_RETRY = "needs_retry"


# ========== pca_lite/core/models.py ==========

from enum import Enum
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from pydantic_settings import BaseSettings


# ----- 执行计划相关 -----

class Step(BaseModel):
    """TaskPlan 中的单个步骤"""
    model_config = ConfigDict(strict=True)

    id: str = Field(..., pattern=r"^step_\w+$", examples=["step_0", "step_1a"])
    agent: AgentType
    task: str = Field(..., min_length=1, max_length=500, examples=["文档预处理与索引构建"])
    tools: list[str] = Field(default_factory=list, examples=[["pdf_parser", "vector_indexer"]])
    input_from: list[str] = Field(default_factory=list, examples=[["step_0"]])
    output: str = Field(..., examples=["literature_pool.json"])
    parallel_group: str | None = Field(default=None, examples=["fetch"])

class Constraints(BaseModel):
    """执行约束参数"""
    model_config = ConfigDict(strict=True)

    max_retry: int = Field(default=1, ge=0, le=10, examples=[1])
    max_total_tokens: int = Field(default=50000, gt=0, examples=[50000])
    max_step_tokens: int = Field(default=8000, gt=0, examples=[8000])
    consensus_threshold: float = Field(default=0.67, ge=0.0, le=1.0, examples=[0.67])

class Sources(BaseModel):
    """文献来源配置"""
    model_config = ConfigDict(strict=True)

    local_files: list[Path] = Field(default_factory=list, examples=[["paper1.pdf"]])
    search_queries: list[str] = Field(default_factory=list, examples=[["multi-agent LLM"]])

class TaskPlan(BaseModel):
    """完整执行计划，调度层的核心数据结构"""
    model_config = ConfigDict(strict=True)

    topic: str = Field(..., min_length=1, max_length=500, examples=["LLM Agent 协作架构综述"])
    created_at: str = Field(..., examples=["2026-05-05T10:00:00"])
    review_type: str = Field(
        default="default",
        pattern=r"^(default|comparison|timeline|meta_analysis)$",
        examples=["default"]
    )
    sources: Sources
    steps: list[Step] = Field(..., min_length=1)
    constraints: Constraints = Field(default_factory=Constraints)


# ----- 文献条目 -----

class LiteratureEntry(BaseModel):
    """单篇文献的完整信息，有序数组格式，index 从 1 开始"""
    model_config = ConfigDict(strict=True)

    index: int = Field(..., ge=1, examples=[1])
    title: str = Field(..., min_length=1, max_length=1000, examples=["Building Effective Autonomous Agents"])
    authors: list[str] = Field(default_factory=list, examples=[["Andrew Karpathy"]])
    year: int | None = Field(default=None, ge=1900, le=2100, examples=[2025])
    source: str = Field(..., pattern=r"^(local_pdf|web_search)$", examples=["local_pdf"])
    file_path: Path | None = Field(default=None, examples=["paper1.pdf"])
    page_range: list[int] | None = Field(default=None, examples=[[1, 15]])
    doi: str | None = Field(default=None, examples=["10.xxxx/xxxxx"])
    url: str | None = Field(default=None, examples=["https://arxiv.org/abs/xxxx"])
    abstract: str | None = Field(default=None)
    key_findings: list[str] = Field(default_factory=list)
    l1_summary: str | None = Field(default=None)
    figures: list[Path] = Field(default_factory=list)
    relevance_score: float = Field(default=0.0, ge=0.0, le=1.0, examples=[0.92])
    preliminary_cluster: str | None = Field(default=None, examples=["agent_architecture"])
    vector_chunk_ids: list[str] = Field(default_factory=list)


# ----- 断点续作状态 -----

class State(BaseModel):
    """执行状态，每步完成后写入 state.json"""
    model_config = ConfigDict(strict=True)

    plan_version: str = Field(default="1.0", examples=["1.0"])
    current_step: str = Field(..., examples=["step_3"])
    completed_steps: list[str] = Field(default_factory=list, examples=[["step_0", "step_1a"]])
    retry_counts: dict[str, int] = Field(default_factory=dict, examples=[{"step_3": 0}])
    workspace_files: dict[str, str] = Field(
        default_factory=dict,
        description="filename -> sha256 hash",
        examples=[{"literature_pool.json": "sha256:abcdef1234567890"}]
    )
    vector_index_hash: str = Field(default="", examples=["sha256:1122334455667788"])
    timestamp: str = Field(..., examples=["2026-05-05T10:30:00"])


# ----- 校验报告 -----

class ValidationIssue(BaseModel):
    """单个校验问题"""
    model_config = ConfigDict(strict=True)

    location: str = Field(..., examples=["第2段"])
    problem: str = Field(..., min_length=1, examples=["缺少文献引用支撑"])
    suggestion: str = Field(default="", examples=["添加 [3] 引用"])
    severity: str = Field(default="medium", pattern=r"^(low|medium|high)$")

class ValidationReport(BaseModel):
    """校验报告，由 Analyst Agent 生成"""
    model_config = ConfigDict(strict=True)

    pass_: bool = Field(..., alias="pass")
    issues: list[ValidationIssue] = Field(default_factory=list)
    severity: str = Field(default="medium", pattern=r"^(low|medium|high)$")


# ----- 配置（嵌套结构） -----

class RetryConfig(BaseModel):
    """API 调用失败重试策略"""
    model_config = ConfigDict(strict=True)

    max_attempts: int = Field(default=3, ge=1, examples=[3])
    backoff: str = Field(default="exponential", pattern=r"^(fixed|exponential)$")
    initial_delay: float = Field(default=1.0, ge=0, examples=[1.0])
    max_delay: float = Field(default=30.0, ge=0, examples=[30.0])

class LLMConfig(BaseModel):
    """LLM 模型配置"""
    model_config = ConfigDict(strict=True)

    provider: str = Field(..., pattern=r"^(openai|anthropic|ollama)$", examples=["openai"])
    base_url: str = Field(..., min_length=1, examples=["https://api.openai.com/v1"])
    api_key: str = Field(..., min_length=1, examples=["sk-xxx"])
    model: str = Field(..., min_length=1, examples=["gpt-4o"])
    temperature: float = Field(default=0.3, ge=0.0, le=2.0, examples=[0.3])
    max_tokens: int = Field(default=4096, gt=0, examples=[4096])
    timeout: int = Field(default=120, gt=0, examples=[120])
    retry: RetryConfig = Field(default_factory=RetryConfig)

class EmbeddingConfig(BaseModel):
    """嵌入模型配置"""
    model_config = ConfigDict(strict=True)

    mode: str = Field(..., pattern=r"^(local|api)$", examples=["api"])
    api_base_url: str = Field(default="", examples=["https://api.openai.com/v1"])
    api_key: str = Field(default="", examples=["sk-xxx"])
    api_model: str = Field(default="", examples=["text-embedding-3-small"])
    local_model: str = Field(default="", examples=["/home/user/models/bge-small-en"])
    local_device: str = Field(default="cpu", pattern=r"^(cpu|cuda|mps)$")
    dimensions: int | None = Field(default=None, gt=0, examples=[1536])
    batch_size: int = Field(default=64, gt=0, examples=[64])
    mrl_enabled: bool = Field(default=False)
    mrl_dimensions: list[int] = Field(default_factory=list, examples=[[256, 512, 1024]])

class RerankerConfig(BaseModel):
    """重排序模型配置，可选"""
    model_config = ConfigDict(strict=True)

    mode: str = Field(default="", pattern=r"^(local|api|)$", examples=["local"])
    local_model: str = Field(default="", examples=["/home/user/models/ms-marco-MiniLM-L-6-v2"])
    local_device: str = Field(default="cpu", pattern=r"^(cpu|cuda|mps)$")
    api_provider: str = Field(default="", examples=["cohere"])
    api_base_url: str = Field(default="")
    api_key: str = Field(default="")
    api_model: str = Field(default="")
    top_k: int = Field(default=5, gt=0, examples=[5])
    recall_multiplier: int = Field(default=4, gt=0, examples=[4])

class VectorDBConfig(BaseModel):
    """向量数据库配置"""
    model_config = ConfigDict(strict=True)

    engine: str = Field(default="chroma", pattern=r"^(chroma|milvus_lite|faiss)$")
    persist_dir: str = Field(default="./workspace/vector_index")
    collection_name: str = Field(default="papers")

class SearchConfig(BaseModel):
    """网络搜索配置"""
    model_config = ConfigDict(strict=True)

    provider: str = Field(default="", examples=["semantic_scholar"])
    api_key: str = Field(default="")
    base_url: str = Field(default="")
    max_results: int = Field(default=15, gt=0, examples=[15])

class ParserConfig(BaseModel):
    """文档解析配置"""
    model_config = ConfigDict(strict=True)

    pdf_engine: str = Field(default="pymupdf", pattern=r"^(pymupdf|pdfplumber)$")
    chunk_size: int = Field(default=512, gt=0, examples=[512])
    chunk_overlap: int = Field(default=50, ge=0, examples=[50])
    extract_images: bool = Field(default=True)
    image_dir: str = Field(default="./workspace/images")

class OrchestratorConfig(BaseModel):
    """调度层配置"""
    model_config = ConfigDict(strict=True)

    max_retry: int = Field(default=1, ge=0, examples=[1])
    max_total_tokens: int = Field(default=50000, gt=0, examples=[50000])
    max_step_tokens: int = Field(default=8000, gt=0, examples=[8000])
    consensus_threshold: float = Field(default=0.67, ge=0.0, le=1.0)

class PersistenceConfig(BaseModel):
    """状态持久化配置"""
    model_config = ConfigDict(strict=True)

    state_file: str = Field(default="./workspace/state.json")
    hash_algorithm: str = Field(default="sha256")

class LoggingConfig(BaseModel):
    """日志配置"""
    model_config = ConfigDict(strict=True)

    level: str = Field(default="INFO", pattern=r"^(DEBUG|INFO|WARNING|ERROR)$")
    file: str = Field(default="./workspace/pca.log")

class Config(BaseSettings):
    """根配置，从 config.yaml + 环境变量加载"""
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

---

## 子任务清单（15 个原子任务）

---

### T01 - 创建包结构与所有 `__init__.py`

| 字段 | 内容 |
|------|------|
| task_id | T01 |
| layer | core |
| task_name | 创建 pca_lite 包目录结构与空 `__init__.py` 文件 |
| description | 在项目根目录 `/mnt/c/Users/10954/Desktop/Projects/PCA/` 下创建完整的 Python 包目录结构。需要创建的目录和文件如下：<br><br>1. 创建目录 `pca_lite/`<br>2. 在 `pca_lite/` 下创建文件 `__init__.py`，内容为 `__version__ = "0.1.0"`<br>3. 在 `pca_lite/` 下创建文件 `__main__.py`，内容为 `from pca_lite.cli.app import app; app()`<br>4. 创建目录 `pca_lite/cli/`，在其中创建空文件 `__init__.py`<br>5. 创建目录 `pca_lite/core/`，在其中创建空文件 `__init__.py`<br>6. 创建目录 `pca_lite/orchestrator/`，在其中创建空文件 `__init__.py`<br>7. 创建目录 `pca_lite/workspace/`，在其中创建空文件 `__init__.py`<br><br>注意：`pca_lite/cli/app.py`、`pca_lite/core/enums.py`、`pca_lite/core/models.py`、`pca_lite/orchestrator/engine.py`、`pca_lite/workspace/manager.py` 这些文件在后续任务中创建，本任务不要创建它们。<br>本任务只创建目录 + `__init__.py` + `__main__.py`。 |
| input_spec | 无 |
| output_spec | 文件列表：<br>- `pca_lite/__init__.py`（含 `__version__`）<br>- `pca_lite/__main__.py`（含 app 调用）<br>- `pca_lite/cli/__init__.py`（空文件）<br>- `pca_lite/core/__init__.py`（空文件）<br>- `pca_lite/orchestrator/__init__.py`（空文件）<br>- `pca_lite/workspace/__init__.py`（空文件） |
| dependencies | [] |
| tech_constraint | - 使用 `pathlib.Path` 创建目录：`Path("pca_lite/cli").mkdir(parents=True, exist_ok=True)`<br>- 空 `__init__.py` 可以是空字符串，不含任何内容<br>- `__main__.py` 中的导入必须使用绝对导入 `from pca_lite.cli.app import app`<br>- 禁止使用相对导入 |
| acceptance_criteria | - `python -c "import pca_lite; print(pca_lite.__version__)"` 输出 `0.1.0`<br>- `python -c "from pca_lite.cli import app"` 不报 ImportError（即使 app.py 还未创建，`__init__.py` 存在即可）<br>- 所有 6 个目录存在且每个目录下有 `__init__.py` |
| stub_code | 见 description（文件创建任务，无函数签名） |

---

### T02 - 定义枚举类型

| 字段 | 内容 |
|------|------|
| task_id | T02 |
| layer | core |
| task_name | 在 `pca_lite/core/enums.py` 中定义三个枚举类型 |
| description | 在 `pca_lite/core/enums.py` 文件中定义以下三个枚举类。每个枚举必须继承 `str, Enum`（`str` 在前），以支持 JSON 序列化为字符串值。<br><br>**枚举 1：TaskStatus**<br>表示步骤执行状态，包含 5 个成员：<br>- `PENDING = "pending"` — 待执行<br>- `RUNNING = "running"` — 执行中<br>- `COMPLETED = "completed"` — 已完成<br>- `FAILED = "failed"` — 失败<br>- `SKIPPED = "skipped"` — 已跳过<br><br>**枚举 2：AgentType**<br>表示 Agent 角色类型，包含 5 个成员：<br>- `PREPROCESSOR = "preprocessor"` — 预处理<br>- `RESEARCHER = "researcher"` — 研究员<br>- `ANALYST = "analyst"` — 分析师<br>- `WRITER = "writer"` — 写作者<br>- `ORCHESTRATOR = "orchestrator"` — 调度器<br><br>**枚举 3：ReviewResult**<br>表示校验结果，包含 3 个成员：<br>- `PASS = "pass"` — 通过<br>- `FAIL = "fail"` — 失败<br>- `NEEDS_RETRY = "needs_retry"` — 需重试<br><br>文件开头添加 `from enum import Enum`。每个枚举类上方添加一行注释说明用途。 |
| input_spec | 无 |
| output_spec | 文件: `pca_lite/core/enums.py`，包含 3 个枚举类定义 |
| dependencies | [T01] |
| tech_constraint | - 必须继承 `(str, Enum)`，顺序不能反<br>- 每个枚举值必须是小写字符串<br>- 禁止使用 `IntEnum`<br>- 禁止使用 dataclasses 或 TypedDict |
| acceptance_criteria | - `from pca_lite.core.enums import TaskStatus` 能正常导入<br>- `TaskStatus.COMPLETED.value == "completed"` 返回 True<br>- `TaskStatus.COMPLETED == "completed"` 返回 True（因为继承了 str）<br>- `AgentType.WRITER.value == "writer"` 返回 True<br>- `ReviewResult.NEEDS_RETRY.value == "needs_retry"` 返回 True<br>- `TaskStatus("invalid")` 抛出 ValueError |
| stub_code | ```python<br>from enum import Enum<br><br># 任务执行状态<br>class TaskStatus(str, Enum):<br>    # TODO: 由下游模型实现<br>    pass<br><br># Agent 角色类型<br>class AgentType(str, Enum):<br>    # TODO: 由下游模型实现<br>    pass<br><br># 校验结果<br>class ReviewResult(str, Enum):<br>    # TODO: 由下游模型实现<br>    pass<br>``` |

---

### T03 - 定义核心数据模型（TaskPlan + LiteratureEntry + State）

| 字段 | 内容 |
|------|------|
| task_id | T03 |
| layer | core |
| task_name | 在 `pca_lite/core/models.py` 中定义 TaskPlan、Step、Constraints、Sources、LiteratureEntry、State、ValidationIssue、ValidationReport 八个 Pydantic 模型 |
| description | 在 `pca_lite/core/models.py` 中定义以下 8 个 Pydantic v2 模型。每个模型必须使用 `model_config = ConfigDict(strict=True)`。所有字段必须使用 `Field(...)` 显式标注。<br><br>**文件开头导入**：<br>```python<br>from pathlib import Path<br>from pydantic import BaseModel, Field, ConfigDict<br>from pca_lite.core.enums import AgentType<br>```<br><br>**模型 1：Step**<br>TaskPlan 中的单个执行步骤。字段：<br>- `id: str` — 必填，正则 `^step_\w+$`，示例 `"step_0"`<br>- `agent: AgentType` — 必填，枚举类型<br>- `task: str` — 必填，min_length=1, max_length=500，示例 `"文档预处理与索引构建"`<br>- `tools: list[str]` — 可选，默认空列表，示例 `["pdf_parser"]`<br>- `input_from: list[str]` — 可选，默认空列表，示例 `["step_0"]`<br>- `output: str` — 必填，示例 `"literature_pool.json"`<br>- `parallel_group: str | None` — 可选，默认 None，示例 `"fetch"`<br><br>**模型 2：Constraints**<br>执行约束参数。字段：<br>- `max_retry: int` — 默认 1，范围 0-10<br>- `max_total_tokens: int` — 默认 50000，>0<br>- `max_step_tokens: int` — 默认 8000，>0<br>- `consensus_threshold: float` — 默认 0.67，范围 0.0-1.0<br><br>**模型 3：Sources**<br>文献来源。字段：<br>- `local_files: list[Path]` — 默认空列表<br>- `search_queries: list[str]` — 默认空列表<br><br>**模型 4：TaskPlan**<br>完整执行计划。字段：<br>- `topic: str` — 必填，min_length=1, max_length=500<br>- `created_at: str` — 必填，示例 `"2026-05-05T10:00:00"`<br>- `review_type: str` — 默认 `"default"`，正则 `^(default|comparison|timeline|meta_analysis)$`<br>- `sources: Sources` — 必填<br>- `steps: list[Step]` — 必填，min_length=1<br>- `constraints: Constraints` — 默认 factory=Constraints<br><br>**模型 5：LiteratureEntry**<br>单篇文献条目。字段：<br>- `index: int` — 必填，ge=1（从 1 开始）<br>- `title: str` — 必填，min_length=1, max_length=1000<br>- `authors: list[str]` — 默认空列表<br>- `year: int | None` — 默认 None，ge=1900, le=2100<br>- `source: str` — 必填，正则 `^(local_pdf|web_search)$`<br>- `file_path: Path | None` — 默认 None<br>- `page_range: list[int] | None` — 默认 None<br>- `doi: str | None` — 默认 None<br>- `url: str | None` — 默认 None<br>- `abstract: str | None` — 默认 None<br>- `key_findings: list[str]` — 默认空列表<br>- `l1_summary: str | None` — 默认 None<br>- `figures: list[Path]` — 默认空列表<br>- `relevance_score: float` — 默认 0.0，范围 0.0-1.0<br>- `preliminary_cluster: str | None` — 默认 None<br>- `vector_chunk_ids: list[str]` — 默认空列表<br><br>**模型 6：State**<br>断点续作状态。字段：<br>- `plan_version: str` — 默认 `"1.0"`<br>- `current_step: str` — 必填<br>- `completed_steps: list[str]` — 默认空列表<br>- `retry_counts: dict[str, int]` — 默认空字典<br>- `workspace_files: dict[str, str]` — 默认空字典，description 为 "filename -> sha256 hash"<br>- `vector_index_hash: str` — 默认空字符串<br>- `timestamp: str` — 必填<br><br>**模型 7：ValidationIssue**<br>单个校验问题。字段：<br>- `location: str` — 必填<br>- `problem: str` — 必填，min_length=1<br>- `suggestion: str` — 默认空字符串<br>- `severity: str` — 默认 `"medium"`，正则 `^(low|medium|high)$`<br><br>**模型 8：ValidationReport**<br>校验报告。字段：<br>- `pass_: bool` — 必填，使用 `alias="pass"`<br>- `issues: list[ValidationIssue]` — 默认空列表<br>- `severity: str` — 默认 `"medium"`，正则 `^(low|medium|high)$` |
| input_spec | 无 |
| output_spec | 文件: `pca_lite/core/models.py`，包含 8 个 Pydantic 模型定义 |
| dependencies | [T02] |
| tech_constraint | - 必须使用 pydantic v2 的 `BaseModel` + `Field` + `ConfigDict`<br>- 每个模型必须有 `model_config = ConfigDict(strict=True)`<br>- 禁止使用 `class Config:` 内部类（那是 v1 写法）<br>- 禁止使用 dataclasses, TypedDict, LangChain<br>- `ValidationReport.pass_` 必须使用 `Field(..., alias="pass")`<br>- TaskPlan 中引用 Sources 时使用字符串前向引用 `"Sources"`（因为 Sources 定义在 TaskPlan 之后）或调整定义顺序<br>- Path 字段使用 `pathlib.Path` 而非 `str`<br>- 所有带示例的字段必须提供 `examples=[...]` |
| acceptance_criteria | - `from pca_lite.core.models import TaskPlan, LiteratureEntry, State, ValidationReport` 能正常导入<br>- `LiteratureEntry(index=1, title="test", source="local_pdf")` 成功实例化<br>- `LiteratureEntry(index=0, title="test", source="local_pdf")` 抛出 ValidationError（因为 ge=1）<br>- `LiteratureEntry(index=1, title="", source="local_pdf")` 抛出 ValidationError（因为 min_length=1）<br>- `Step(id="step_0", agent=AgentType.RESEARCHER, task="test", output="x.json")` 成功实例化<br>- `Step(id="invalid", agent=AgentType.RESEARCHER, task="test", output="x.json")` 抛出 ValidationError（正则不匹配）<br>- `TaskPlan(topic="test", created_at="2026-05-05", sources=Sources(), steps=[Step(id="step_0", agent=AgentType.RESEARCHER, task="test", output="x.json")])` 成功实例化<br>- `ValidationReport(pass_=True)` 成功实例化（注意 alias 使用） |
| stub_code | 见上方"核心数据结构"节的完整定义（models.py 部分） |

---

### T04 - 定义配置模型（嵌套 Config 类）

| 字段 | 内容 |
|------|------|
| task_id | T04 |
| layer | core |
| task_name | 在 `pca_lite/core/models.py` 文件末尾追加 11 个配置相关 Pydantic 模型和 Config 根类 |
| description | 在已有的 `pca_lite/core/models.py` 文件末尾追加以下 11 个模型。这些模型组成配置的嵌套结构。<br><br>**必须追加的导入**（文件开头）：<br>```python<br>from pydantic_settings import BaseSettings<br>```<br><br>**模型 1：RetryConfig**<br>- `max_attempts: int` — 默认 3，ge=1<br>- `backoff: str` — 默认 `"exponential"`，正则 `^(fixed|exponential)$`<br>- `initial_delay: float` — 默认 1.0，ge=0<br>- `max_delay: float` — 默认 30.0，ge=0<br><br>**模型 2：LLMConfig**<br>- `provider: str` — 必填，正则 `^(openai|anthropic|ollama)$`<br>- `base_url: str` — 必填，min_length=1<br>- `api_key: str` — 必填，min_length=1<br>- `model: str` — 必填，min_length=1<br>- `temperature: float` — 默认 0.3，范围 0.0-2.0<br>- `max_tokens: int` — 默认 4096，>0<br>- `timeout: int` — 默认 120，>0<br>- `retry: RetryConfig` — 默认 factory=RetryConfig<br><br>**模型 3：EmbeddingConfig**<br>- `mode: str` — 必填，正则 `^(local|api)$`<br>- `api_base_url: str` — 默认空字符串<br>- `api_key: str` — 默认空字符串<br>- `api_model: str` — 默认空字符串<br>- `local_model: str` — 默认空字符串<br>- `local_device: str` — 默认 `"cpu"`，正则 `^(cpu|cuda|mps)$`<br>- `dimensions: int | None` — 默认 None，>0<br>- `batch_size: int` — 默认 64，>0<br>- `mrl_enabled: bool` — 默认 False<br>- `mrl_dimensions: list[int]` — 默认空列表<br><br>**模型 4：RerankerConfig**<br>- `mode: str` — 默认空字符串，正则 `^(local|api|)$`<br>- `local_model: str` — 默认空字符串<br>- `local_device: str` — 默认 `"cpu"`<br>- `api_provider: str` — 默认空字符串<br>- `api_base_url: str` — 默认空字符串<br>- `api_key: str` — 默认空字符串<br>- `api_model: str` — 默认空字符串<br>- `top_k: int` — 默认 5，>0<br>- `recall_multiplier: int` — 默认 4，>0<br><br>**模型 5：VectorDBConfig**<br>- `engine: str` — 默认 `"chroma"`，正则 `^(chroma|milvus_lite|faiss)$`<br>- `persist_dir: str` — 默认 `"./workspace/vector_index"`<br>- `collection_name: str` — 默认 `"papers"`<br><br>**模型 6：SearchConfig**<br>- `provider: str` — 默认空字符串<br>- `api_key: str` — 默认空字符串<br>- `base_url: str` — 默认空字符串<br>- `max_results: int` — 默认 15，>0<br><br>**模型 7：ParserConfig**<br>- `pdf_engine: str` — 默认 `"pymupdf"`，正则 `^(pymupdf|pdfplumber)$`<br>- `chunk_size: int` — 默认 512，>0<br>- `chunk_overlap: int` — 默认 50，>=0<br>- `extract_images: bool` — 默认 True<br>- `image_dir: str` — 默认 `"./workspace/images"`<br><br>**模型 8：OrchestratorConfig**<br>- `max_retry: int` — 默认 1，>=0<br>- `max_total_tokens: int` — 默认 50000，>0<br>- `max_step_tokens: int` — 默认 8000，>0<br>- `consensus_threshold: float` — 默认 0.67，范围 0.0-1.0<br><br>**模型 9：PersistenceConfig**<br>- `state_file: str` — 默认 `"./workspace/state.json"`<br>- `hash_algorithm: str` — 默认 `"sha256"`<br><br>**模型 10：LoggingConfig**<br>- `level: str` — 默认 `"INFO"`，正则 `^(DEBUG|INFO|WARNING|ERROR)$`<br>- `file: str` — 默认 `"./workspace/pca.log"`<br><br>**模型 11：Config（根配置）**<br>继承 `pydantic_settings.BaseSettings`（不是 `BaseModel`）。<br>- `model_config = ConfigDict(yaml_file="config.yaml", env_prefix="PCA_")`<br>- `llm: LLMConfig` — 必填<br>- `llm_lite: LLMConfig | None` — 默认 None<br>- `embedding: EmbeddingConfig` — 必填<br>- `reranker: RerankerConfig` — 默认 factory=RerankerConfig<br>- `vector_db: VectorDBConfig` — 默认 factory=VectorDBConfig<br>- `search: SearchConfig` — 默认 factory=SearchConfig<br>- `parser: ParserConfig` — 默认 factory=ParserConfig<br>- `orchestrator: OrchestratorConfig` — 默认 factory=OrchestratorConfig<br>- `persistence: PersistenceConfig` — 默认 factory=PersistenceConfig<br>- `logging: LoggingConfig` — 默认 factory=LoggingConfig |
| input_spec | 无 |
| output_spec | 文件: `pca_lite/core/models.py`（在 T03 基础上追加），新增 11 个模型定义 |
| dependencies | [T03] |
| tech_constraint | - Config 必须继承 `pydantic_settings.BaseSettings`，其他 10 个模型继承 `BaseModel`<br>- Config 的 `model_config` 必须包含 `yaml_file="config.yaml"` 和 `env_prefix="PCA_"`<br>- 所有可选字段必须有默认值（使用 `Field(default=...)` 或 `Field(default_factory=...)`）<br>- 禁止使用 `class Config:` 内部类<br>- 禁止硬编码任何路径或 API Key |
| acceptance_criteria | - `from pca_lite.core.models import Config, LLMConfig, EmbeddingConfig` 能正常导入<br>- `Config.__fields__["llm"]` 存在且类型为 LLMConfig<br>- `Config.__fields__["embedding"]` 存在且类型为 EmbeddingConfig<br>- `RetryConfig()` 成功实例化，所有字段为默认值<br>- `LLMConfig(provider="openai", base_url="https://api.openai.com/v1", api_key="sk-test", model="gpt-4o")` 成功实例化<br>- `LLMConfig(provider="invalid", base_url="x", api_key="x", model="x")` 抛出 ValidationError（正则不匹配） |
| stub_code | 见上方"核心数据结构"节的完整定义（配置模型部分） |

---

### T05 - 创建 config.yaml 模板与 pyproject.toml

| 字段 | 内容 |
|------|------|
| task_id | T05 |
| layer | core |
| task_name | 创建 config.yaml 配置模板和 pyproject.toml 项目元数据文件 |
| description | 在项目根目录创建两个文件：<br><br>**文件 1：config.yaml**<br>创建完整的配置模板文件。所有核心字段（llm 下的 provider/base_url/api_key/model，embedding 下的 mode）的值为空字符串。所有可选字段保留默认值。每个配置节上方添加中文注释说明用途。文件格式必须与以下结构完全一致：<br><br>```yaml<br># ============================================================<br># PCA-Lite 配置文件<br># ============================================================<br># 核心字段：必须填写，否则无法启动<br># 可选字段：有默认值，不填也能跑，填了则覆盖<br><br># ---------- LLM（主推理模型）[核心] ----------<br>llm:<br>  provider: ""                    # openai | anthropic | ollama<br>  base_url: ""                    # API 端点地址<br>  api_key: ""                     # API Key，支持环境变量引用: "${PCA_LLM_API_KEY}"<br>  model: ""                       # 模型名称<br>  temperature: 0.3                # 可选，默认 0.3<br>  max_tokens: 4096                # 可选，默认 4096<br>  timeout: 120                    # 可选，默认 120 秒<br>  retry:<br>    max_attempts: 3<br>    backoff: "exponential"<br>    initial_delay: 1.0<br>    max_delay: 30.0<br># ---------- LLM（轻量模型）[可选] ----------<br># 不填则复用 llm 配置<br>llm_lite:<br>  provider: ""<br>  base_url: ""<br>  api_key: ""<br>  model: ""<br>  temperature: 0.3<br>  max_tokens: 1024<br>  timeout: 60<br>  retry:<br>    max_attempts: 3<br>    backoff: "exponential"<br>    initial_delay: 1.0<br>    max_delay: 30.0<br># ---------- 嵌入模型（Embedding）[核心] ----------<br>embedding:<br>  mode: ""                        # local | api<br>  api_base_url: ""<br>  api_key: ""<br>  api_model: ""<br>  local_model: ""<br>  local_device: "cpu"              # cpu | cuda | mps<br>  dimensions:                     # 向量维度<br>  batch_size: 64<br>  mrl_enabled: false<br>  mrl_dimensions: []<br># ---------- 重排序模型（Reranker）[可选] ----------<br># 不填则禁用重排序<br>reranker:<br>  mode: ""                        # local | api<br>  local_model: ""<br>  local_device: "cpu"<br>  api_provider: ""<br>  api_base_url: ""<br>  api_key: ""<br>  api_model: ""<br>  top_k: 5<br>  recall_multiplier: 4<br># ---------- 向量数据库 [可选] ----------<br>vector_db:<br>  engine: "chroma"<br>  persist_dir: "./workspace/vector_index"<br>  collection_name: "papers"<br># ---------- 网络搜索 [可选] ----------<br>search:<br>  provider: ""<br>  api_key: ""<br>  base_url: ""<br>  max_results: 15<br># ---------- 文档解析 [可选] ----------<br>parser:<br>  pdf_engine: "pymupdf"<br>  chunk_size: 512<br>  chunk_overlap: 50<br>  extract_images: true<br>  image_dir: "./workspace/images"<br># ---------- 调度层 [可选] ----------<br>orchestrator:<br>  max_retry: 1<br>  max_total_tokens: 50000<br>  max_step_tokens: 8000<br>  consensus_threshold: 0.67<br># ---------- 状态持久化 [可选] ----------<br>persistence:<br>  state_file: "./workspace/state.json"<br>  hash_algorithm: "sha256"<br># ---------- 日志 [可选] ----------<br>logging:<br>  level: "INFO"<br>  file: "./workspace/pca.log"<br>```<br><br>**文件 2：pyproject.toml**<br>使用 PEP 621 `[project]` 格式（不使用 setup.py）。内容：<br><br>```toml<br>[build-system]<br>requires = ["setuptools>=68.0", "wheel"]<br>build-backend = "setuptools.backends._legacy:_Backend"<br><br>[project]<br>name = "pca-lite"<br>version = "0.1.0"<br>description = "面向论文综述的多 Agent 协作框架"<br>readme = "README.md"<br>license = {text = "MIT"}<br>requires-python = ">=3.10"<br>dependencies = [<br>    "pydantic>=2.0",<br>    "pydantic-settings>=2.0",<br>    "typer>=0.9",<br>    "rich>=13.0",<br>    "httpx>=0.25",<br>    "pyyaml>=6.0",<br>    "pymupdf>=1.23",<br>    "chromadb>=0.4",<br>    "sentence-transformers>=2.2",<br>]<br><br>[project.scripts]<br>pca = "pca_lite.cli.app:app"<br><br>[tool.setuptools.packages.find]<br>include = ["pca_lite*"]<br>``` |
| input_spec | 无 |
| output_spec | 文件: `config.yaml`（项目根目录）, `pyproject.toml`（项目根目录） |
| dependencies | [] |
| tech_constraint | - config.yaml 中 llm.provider / llm.base_url / llm.api_key / llm.model / embedding.mode 的值必须是空字符串 `""`<br>- config.yaml 中可选字段的值必须是合理的默认值（如 `temperature: 0.3`，`chunk_size: 512`）<br>- pyproject.toml 必须使用 `[project]` 格式（PEP 621），禁止使用 `[metadata]`<br>- CLI 入口点必须定义为 `pca = "pca_lite.cli.app:app"`<br>- Python 版本要求 `>=3.10`<br>- 禁止在 dependencies 中引入 LangChain/LangGraph 依赖<br>- config.yaml 不要放在 `pca_lite/` 目录内，放在项目根目录 |
| acceptance_criteria | - `cat config.yaml` 输出包含 `llm:` 和 `embedding:` 两个顶级 key<br>- `grep 'provider: ""' config.yaml` 能匹配到（核心字段为空）<br>- `grep 'chunk_size: 512' config.yaml` 能匹配到（可选字段有默认值）<br>- `pip install -e .` 能成功安装（需要 pyproject.toml 语法正确）<br>- `pca --help` 输出帮助信息（需要 cli/app.py 已存在，可先用 T08 创建） |
| stub_code | 见 description（文件创建任务，无函数签名） |

---

### T06 - 实现工作区目录初始化

| 字段 | 内容 |
|------|------|
| task_id | T06 |
| layer | workspace |
| task_name | 实现 `pca_lite/workspace/manager.py` 中的 WorkspaceManager 类和 init_workspace 方法 |
| description | 在 `pca_lite/workspace/manager.py` 中实现 `WorkspaceManager` 类。<br><br>**类定义**：<br>```python<br>from pathlib import Path<br>from pydantic import BaseModel<br>from pca_lite.core.models import State<br><br>class WorkspaceManager:<br>    def __init__(self, workspace_dir: Path):<br>        self.workspace_dir = Path(workspace_dir)<br><br>    def init_workspace(self) -> None:<br>        """创建工作区目录结构和初始 state.json"""<br>        pass<br>```<br><br>**init_workspace 方法的详细行为**：<br>1. 创建目录 `self.workspace_dir`（如果不存在）<br>2. 创建子目录 `self.workspace_dir / "raw_pdfs"`（如果不存在）<br>3. 创建子目录 `self.workspace_dir / "preprocessed"`（如果不存在）<br>4. 创建子目录 `self.workspace_dir / "vector_index"`（如果不存在）<br>5. 检查 `self.workspace_dir / "state.json"` 是否已存在：<br>   - 已存在 → 跳过，不覆盖<br>   - 不存在 → 创建初始 State 对象（current_step 设为空字符串 `""`，timestamp 设为当前时间 `datetime.now().isoformat()`），用 `model_dump_json(indent=2)` 序列化后写入文件<br><br>**文件写入方式**：使用 `with open(path, "w", encoding="utf-8") as f: f.write(content)` 确保句柄关闭。<br><br>**所有路径操作使用 `pathlib.Path`**，禁止使用字符串拼接路径。 |
| input_spec | `workspace_dir`: Path 类型，必填，示例 `"./workspace/"` |
| output_spec | 副作用：在磁盘上创建目录结构和 state.json 文件。无返回值。 |
| dependencies | [T03] |
| tech_constraint | - 必须使用 pathlib.Path 处理所有路径<br>- 所有 `mkdir` 调用必须加 `parents=True, exist_ok=True`<br>- state.json 写入使用 Pydantic 的 `model_dump_json(indent=2)`<br>- 禁止使用 `json.dump` 直接写入 Pydantic 对象<br>- 文件写入必须使用 `with open(...) as f:` 确保句柄关闭<br>- 如果 state.json 已存在，不能覆盖（幂等性） |
| acceptance_criteria | - `WorkspaceManager(Path("./test_ws")).init_workspace()` 后，`./test_ws/`、`./test_ws/raw_pdfs/`、`./test_ws/preprocessed/`、`./test_ws/vector_index/` 四个目录存在<br>- `./test_ws/state.json` 文件存在且内容是合法 JSON<br>- `State.model_validate_json(open("./test_ws/state.json").read())` 能成功反序列化<br>- 连续调用两次 `init_workspace()` 不报错（幂等性）<br>- 第二次调用后 state.json 内容未被覆盖 |
| stub_code | ```python<br>from pathlib import Path<br>from pca_lite.core.models import State<br><br>class WorkspaceManager:<br>    def __init__(self, workspace_dir: Path):<br>        self.workspace_dir = Path(workspace_dir)<br><br>    def init_workspace(self) -> None:<br>        """创建工作区目录结构和初始 state.json"""<br>        # TODO: 由下游模型实现<br>        pass<br>``` |

---

### T07 - 实现工作区 JSON 读写

| 字段 | 内容 |
|------|------|
| task_id | T07 |
| layer | workspace |
| task_name | 在 WorkspaceManager 中实现 read_json 和 write_json 方法 |
| description | 在 `pca_lite/workspace/manager.py` 的 `WorkspaceManager` 类中追加两个方法。<br><br>**方法 1：read_json**<br>```python<br>def read_json(self, filename: str) -> dict:<br>    """读取工作区中的 JSON 文件，返回字典"""<br>    pass<br>```<br>行为：<br>1. 构造完整路径：`self.workspace_dir / filename`<br>2. 检查文件是否存在，不存在则抛出 `FileNotFoundError`，错误消息为 `f"工作区文件不存在: {path}"`<br>3. 用 `open(path, "r", encoding="utf-8")` 读取文件内容<br>4. 用 `json.loads()` 解析为 Python 字典<br>5. 返回字典<br><br>**方法 2：write_json**<br>```python<br>def write_json(self, filename: str, data: BaseModel) -> None:<br>    """将 Pydantic 模型写入工作区 JSON 文件（原子写入）"""<br>    pass<br>```<br>行为：<br>1. 构造完整路径：`self.workspace_dir / filename`<br>2. 调用 `data.model_dump_json(indent=2)` 获取格式化的 JSON 字符串<br>3. **原子写入**：<br>   a. 构造临时文件路径：`path.with_suffix(".tmp")`<br>   b. 写入临时文件：`with open(tmp_path, "w", encoding="utf-8") as f: f.write(json_str)`<br>   c. 用 `tmp_path.replace(path)` 原子替换目标文件<br>4. 调用 `self._update_state_hash(filename, path)` 更新 state.json 中的 hash<br><br>**方法 3（内部方法）：_update_state_hash**<br>```python<br>def _update_state_hash(self, filename: str, filepath: Path) -> None:<br>    """更新 state.json 中对应文件的 SHA-256 hash"""<br>    pass<br>```<br>行为：<br>1. 调用 `self.compute_hash(filepath)` 计算文件 hash<br>2. 读取 `state.json`（用 `self.read_json("state.json")`）<br>3. 更新 `state["workspace_files"][filename] = f"sha256:{hash_value}"`<br>4. 用 `json.dumps(state, indent=2, ensure_ascii=False)` 序列化<br>5. 原子写入 `state.json`（与 write_json 相同的临时文件 + replace 方式） |
| input_spec | `filename`: str 类型，必填，示例 `"literature_pool.json"`<br>`data`: BaseModel 类型，必填（write_json 的参数） |
| output_spec | read_json 返回 dict<br>write_json 无返回值，副作用：写入文件 + 更新 state.json 中的 hash |
| dependencies | [T06] |
| tech_constraint | - read_json 使用 `json.loads()` 而非 Pydantic 反序列化（因为不知道具体模型类型）<br>- write_json 使用 Pydantic 的 `model_dump_json(indent=2)` 而非 `json.dumps(data.dict())`<br>- 原子写入：先写 `.tmp` 文件，再用 `Path.replace()` 覆盖，防止中途崩溃导致文件损坏<br>- SHA-256 使用 `hashlib.sha256()`，分块读取（8192 字节），禁止一次性加载大文件到内存<br>- 文件写入必须使用 `with open(...) as f:` 确保句柄关闭<br>- 禁止使用 `json.dump` 直接操作 Pydantic 对象 |
| acceptance_criteria | - 创建一个 LiteratureEntry 对象，write_json 后文件存在且内容是合法 JSON<br>- read_json 读回后字典内容与原始对象一致<br>- write_json 后 state.json 中 `workspace_files["literature_pool.json"]` 包含 `"sha256:"` 前缀<br>- read_json 读取不存在的文件时抛出 FileNotFoundError<br>- 原子写入验证：在写入过程中 kill 进程，不会产生损坏的 JSON 文件（目标文件要么是旧内容，要么是新内容，不会是半截） |
| stub_code | ```python<br>import json<br>import hashlib<br>from pathlib import Path<br>from pydantic import BaseModel<br><br>class WorkspaceManager:<br>    def __init__(self, workspace_dir: Path):<br>        self.workspace_dir = Path(workspace_dir)<br><br>    def read_json(self, filename: str) -> dict:<br>        """读取工作区中的 JSON 文件"""<br>        # TODO: 由下游模型实现<br>        pass<br><br>    def write_json(self, filename: str, data: BaseModel) -> None:<br>        """将 Pydantic 模型写入工作区 JSON 文件（原子写入）"""<br>        # TODO: 由下游模型实现<br>        pass<br><br>    def _update_state_hash(self, filename: str, filepath: Path) -> None:<br>        """更新 state.json 中对应文件的 SHA-256 hash"""<br>        # TODO: 由下游模型实现<br>        pass<br>``` |

---

### T08 - 实现 SHA-256 计算与完整性校验

| 字段 | 内容 |
|------|------|
| task_id | T08 |
| layer | workspace |
| task_name | 在 WorkspaceManager 中实现 compute_hash 和 verify_integrity 方法 |
| description | 在 `pca_lite/workspace/manager.py` 的 `WorkspaceManager` 类中追加两个方法。<br><br>**方法 1：compute_hash**<br>```python<br>def compute_hash(self, filepath: Path) -> str:<br>    """计算文件的 SHA-256 hash 值（不含前缀）"""<br>    pass<br>```<br>行为：<br>1. 检查文件是否存在，不存在则抛出 `FileNotFoundError`<br>2. 创建 `hashlib.sha256()` 对象<br>3. 用 `open(filepath, "rb")` 以二进制模式打开文件<br>4. 分块读取，每次 8192 字节：`while chunk := f.read(8192): hasher.update(chunk)`<br>5. 返回 `hasher.hexdigest()`（64 位十六进制字符串，不含 "sha256:" 前缀）<br><br>**方法 2：verify_integrity**<br>```python<br>def verify_integrity(self, state: State) -> list[str]:<br>    """校验工作区文件完整性，返回被篡改的文件名列表"""<br>    pass<br>```<br>行为：<br>1. 初始化空列表 `tampered = []`<br>2. 遍历 `state.workspace_files` 字典的每个 key（文件名）和 value（格式为 `"sha256:xxxx"`）：<br>   a. 构造完整路径：`self.workspace_dir / filename`<br>   b. 检查文件是否存在，不存在则将 filename 加入 tampered 列表，继续下一个<br>   c. 调用 `self.compute_hash(path)` 计算当前 hash<br>   d. 从 value 中提取记录的 hash：`recorded_hash = value.replace("sha256:", "")`<br>   e. 比较：如果 `current_hash != recorded_hash`，将 filename 加入 tampered 列表<br>3. 返回 tampered 列表<br><br>**关键细节**：state.workspace_files 中的值格式是 `"sha256:abcdef..."`，提取时用 `.replace("sha256:", "")` 去掉前缀。 |
| input_spec | `filepath`: Path 类型（compute_hash 的参数）<br>`state`: State 类型（verify_integrity 的参数） |
| output_spec | compute_hash 返回 str（64 位十六进制）<br>verify_integrity 返回 list[str]（被篡改的文件名列表，空列表表示全部通过） |
| dependencies | [T07] |
| tech_constraint | - SHA-256 使用 `hashlib.sha256()`<br>- 文件读取必须分块（8192 字节），禁止 `f.read()` 一次性加载<br>- 以二进制模式 `"rb"` 读取，确保跨平台 hash 一致<br>- 文件操作必须使用 `with open(...) as f:` 确保句柄关闭<br>- verify_integrity 中的 state.workspace_files 的 value 格式为 `"sha256:xxxx"`，需要去掉前缀再比较 |
| acceptance_criteria | - 创建一个已知内容的文件，compute_hash 返回固定的 64 位十六进制字符串<br>- 同一文件调用两次 compute_hash 返回相同结果<br>- 文件不存在时 compute_hash 抛出 FileNotFoundError<br>- verify_integrity 在所有文件未修改时返回空列表<br>- 手动修改一个文件内容后，verify_integrity 返回包含该文件名的列表<br>- verify_integrity 在 state.workspace_files 中的文件不存在时，将该文件名加入返回列表 |
| stub_code | ```python<br>import hashlib<br>from pathlib import Path<br><br>class WorkspaceManager:<br>    def compute_hash(self, filepath: Path) -> str:<br>        """计算文件的 SHA-256 hash"""<br>        # TODO: 由下游模型实现<br>        pass<br><br>    def verify_integrity(self, state: State) -> list[str]:<br>        """校验工作区文件完整性"""<br>        # TODO: 由下游模型实现<br>        pass<br>``` |

---

### T09 - 实现调度层：计划生成

| 字段 | 内容 |
|------|------|
| task_id | T09 |
| layer | orchestrator |
| task_name | 在 `pca_lite/orchestrator/engine.py` 中实现 OrchestratorEngine 类和 load_or_create_plan 方法 |
| description | 在 `pca_lite/orchestrator/engine.py` 中实现 `OrchestratorEngine` 类。<br><br>**类定义**：<br>```python<br>from pathlib import Path<br>from datetime import datetime<br>from pca_lite.core.models import TaskPlan, Step, Constraints, Sources, State<br>from pca_lite.core.enums import TaskStatus, AgentType<br>from pca_lite.workspace.manager import WorkspaceManager<br><br>class OrchestratorEngine:<br>    def __init__(self, workspace: WorkspaceManager):<br>        self.workspace = workspace<br><br>    def load_or_create_plan(self, topic: str, files: list[Path]) -> TaskPlan:<br>        """根据用户输入生成 TaskPlan（Week 1 阶段使用硬编码模板）"""<br>        pass<br>```<br><br>**load_or_create_plan 方法的详细行为**：<br>Week 1 阶段不调用 LLM，直接构造硬编码的 TaskPlan 模板。接收参数：<br>- `topic: str` — 用户输入的主题<br>- `files: list[Path]` — 用户提供的本地 PDF 文件列表<br><br>返回一个 TaskPlan 对象，字段值如下：<br>- `topic` = 传入的 topic 参数<br>- `created_at` = `datetime.now().isoformat()`<br>- `review_type` = `"default"`<br>- `sources` = `Sources(local_files=files, search_queries=[])`<br>- `constraints` = `Constraints()`（使用全部默认值）<br>- `steps` = 一个包含 3 个 Step 的列表：<br>  1. `Step(id="step_0", agent=AgentType.ORCHESTRATOR, task="初始化工作区", tools=[], input_from=[], output="state.json")`<br>  2. `Step(id="step_1", agent=AgentType.RESEARCHER, task="文献检索与校验（Week 1 stub）", tools=[], input_from=["step_0"], output="literature_pool.json")`<br>  3. `Step(id="step_2", agent=AgentType.WRITER, task="综述撰写（Week 1 stub）", tools=[], input_from=["step_1"], output="draft.md")` |
| input_spec | `topic`: str 类型，必填，示例 `"LLM Agent 综述"`<br>`files`: list[Path] 类型，必填（可为空列表） |
| output_spec | 返回 TaskPlan 对象 |
| dependencies | [T03, T06] |
| tech_constraint | - 必须使用 `datetime.now().isoformat()` 生成时间戳<br>- Steps 列表中的 id 必须符合正则 `^step_\w+$`<br>- Steps 列表中的 agent 必须使用 AgentType 枚举值<br>- Week 1 阶段不调用 LLM，直接硬编码<br>- 禁止使用任何 Agent 框架（LangChain, CrewAI 等） |
| acceptance_criteria | - `engine.load_or_create_plan("test", [])` 返回的 TaskPlan 对象 topic 字段为 `"test"`<br>- 返回的 TaskPlan 包含 3 个 Step<br>- 每个 Step 的 id 符合正则 `^step_\w+$`<br>- `sources.local_files` 为空列表<br>- 传入 `[Path("a.pdf")]` 后 `sources.local_files` 包含该路径 |
| stub_code | ```python<br>from pathlib import Path<br>from pca_lite.core.models import TaskPlan, Step, Sources, Constraints<br>from pca_lite.core.enums import AgentType<br>from pca_lite.workspace.manager import WorkspaceManager<br><br>class OrchestratorEngine:<br>    def __init__(self, workspace: WorkspaceManager):<br>        self.workspace = workspace<br><br>    def load_or_create_plan(self, topic: str, files: list[Path]) -> TaskPlan:<br>        """根据用户输入生成 TaskPlan"""<br>        # TODO: 由下游模型实现<br>        pass<br>``` |

---

### T10 - 实现调度层：步骤执行与状态机

| 字段 | 内容 |
|------|------|
| task_id | T10 |
| layer | orchestrator |
| task_name | 在 OrchestratorEngine 中实现 execute_plan、execute_step 方法和状态机逻辑 |
| description | 在 `pca_lite/orchestrator/engine.py` 的 `OrchestratorEngine` 类中追加两个方法。<br><br>**方法 1：execute_plan**<br>```python<br>def execute_plan(self, plan: TaskPlan) -> State:<br>    """按顺序执行 TaskPlan 中的所有步骤"""<br>    pass<br>```<br>行为：<br>1. 读取 state.json 获取当前状态（调用 `self.workspace.read_json("state.json")`），用 `State.model_validate()` 反序列化<br>2. 如果 state.completed_steps 不为空，说明是恢复执行，跳过已完成步骤<br>3. 遍历 `plan.steps` 列表中的每个 Step：<br>   a. 检查该 step.id 是否在 `state.completed_steps` 中，如果是则跳过（打印日志 `"跳过已完成步骤: {step.id}"`）<br>   b. 检查依赖：遍历 `step.input_from` 中的每个依赖 step_id，如果该 step_id 不在 `state.completed_steps` 中，抛出 `ValueError(f"依赖未满足: {step.id} 依赖 {step_id}，但 {step_id} 未完成")`<br>   c. 更新 `state.current_step = step.id`，更新 `state.timestamp = datetime.now().isoformat()`<br>   d. 将 state 的 status 设为 RUNNING（在 state 对象中不直接有 status 字段，通过 current_step 体现）<br>   e. 持久化：调用 `self.workspace.write_json("state.json", state)`<br>   f. 调用 `result = self.execute_step(step)` 执行步骤<br>   g. 执行成功：将 step.id 加入 `state.completed_steps`，持久化 state<br>   h. 执行失败（execute_step 抛出异常）：<br>      - 获取当前重试次数：`state.retry_counts.get(step.id, 0)`<br>      - 如果 < plan.constraints.max_retry：<br>        * `state.retry_counts[step.id] = current + 1`<br>        * 打印日志 `"步骤 {step.id} 失败，重试 ({current+1}/{max_retry})"`<br>        * 回到步骤 3f 重新执行（用 while 循环实现重试）<br>      - 如果 >= max_retry：<br>        * 打印日志 `"步骤 {step.id} 超过最大重试次数，标记失败"`<br>        * 将 step.id 加入 `state.completed_steps`（标记为已处理，不再重试）<br>        * 持久化 state<br>4. 返回最终的 state 对象<br><br>**方法 2：execute_step**<br>```python<br>def execute_step(self, step: Step) -> dict:<br>    """执行单个步骤（Week 1 阶段为 stub）"""<br>    pass<br>```<br>行为（Week 1 stub）：<br>1. 打印日志：`print(f"[EXEC] 步骤 {step.id}: {step.task}")`<br>2. 等待 0.1 秒（模拟执行）：`import time; time.sleep(0.1)`<br>3. 返回空字典 `{}`<br><br>**重试逻辑伪代码**：<br>```python<br>retry_count = state.retry_counts.get(step.id, 0)<br>while True:<br>    try:<br>        result = self.execute_step(step)<br>        break  # 成功，跳出重试循环<br>    except Exception as e:<br>        retry_count += 1<br>        state.retry_counts[step.id] = retry_count<br>        if retry_count > plan.constraints.max_retry:<br>            print(f"[FAIL] 步骤 {step.id} 超过最大重试次数")<br>            break<br>        print(f"[RETRY] 步骤 {step.id} 失败，重试 ({retry_count}/{plan.constraints.max_retry})")<br>``` |
| input_spec | `plan`: TaskPlan 类型（execute_plan 的参数）<br>`step`: Step 类型（execute_step 的参数） |
| output_spec | execute_plan 返回 State 对象<br>execute_step 返回 dict（Week 1 为空字典） |
| dependencies | [T07, T09] |
| tech_constraint | - 每步执行前后必须调用 workspace.write_json 持久化 state<br>- 步骤间依赖检查：step.input_from 中的所有 step_id 必须在 completed_steps 中，否则抛出 ValueError<br>- 失败重试时 retry_counts[step_id] += 1，超过 max_retry 则停止重试<br>- Week 1 阶段 execute_step 为 stub（打印日志 + 返回空 dict）<br>- 使用 Python 内置 `logging` 模块或 `print` 记录执行日志<br>- 禁止使用任何 Agent 框架 |
| acceptance_criteria | - 构造一个包含 3 个 step 的 TaskPlan，调用 execute_plan 后 state.json 中 completed_steps 包含全部 3 个 step_id<br>- 第 2 个 step 抛出异常时，retry_counts["step_1"] 正确递增<br>- retry_counts 超过 max_retry 后该步骤停止重试<br>- 依赖检查：step_1b 依赖 step_0 未完成时，抛出 ValueError<br- execute_step 返回空字典 |
| stub_code | ```python<br>import time<br>from pca_lite.core.models import TaskPlan, Step, State<br><br>class OrchestratorEngine:<br>    def execute_plan(self, plan: TaskPlan) -> State:<br>        """按顺序执行 TaskPlan 中的所有步骤"""<br>        # TODO: 由下游模型实现<br>        pass<br><br>    def execute_step(self, step: Step) -> dict:<br>        """执行单个步骤（Week 1 为 stub）"""<br>        # TODO: 由下游模型实现<br>        pass<br>``` |

---

### T11 - 实现调度层：断点恢复

| 字段 | 内容 |
|------|------|
| task_id | T11 |
| layer | orchestrator |
| task_name | 在 OrchestratorEngine 中实现 resume 方法 |
| description | 在 `pca_lite/orchestrator/engine.py` 的 `OrchestratorEngine` 类中追加 resume 方法。<br><br>**方法：resume**<br>```python<br>def resume(self) -> State:<br>    """从 state.json 恢复执行，跳过已完成步骤"""<br>    pass<br>```<br>行为：<br>1. 调用 `self.workspace.read_json("state.json")` 读取 state<br>2. 用 `State.model_validate(state_dict)` 反序列化为 State 对象<br>3. 调用 `self.workspace.verify_integrity(state)` 校验文件完整性<br>4. 如果 tampered 列表不为空：<br>   a. 打印警告：`print(f"[WARN] 以下文件已被修改: {tampered}")`<br>   b. 打印提示：`print("[WARN] 建议从头执行，当前将跳过这些文件继续")`<br>5. 打印恢复信息：`print(f"[RESUME] 从步骤 {state.current_step} 恢复，已完成: {state.completed_steps}")`<br>6. 返回 state 对象<br><br>**注意**：resume 方法只返回 state 对象，不自动重新执行。调用方（CLI 层）需要根据 state 决定是否调用 execute_plan。<br>完整的恢复流程由 CLI 层（T14）编排：<br>1. 调用 resume() 获取 state<br>2. 如果有 tampered 文件，提示用户确认<br>3. 重新构造 TaskPlan<br>4. 调用 execute_plan(plan) 继续执行（execute_plan 内部会跳过已完成步骤） |
| input_spec | 无参数（使用 self.workspace 中的工作区路径） |
| output_spec | 返回 State 对象<br>副作用：打印恢复日志和完整性校验结果 |
| dependencies | [T08, T10] |
| tech_constraint | - 使用 State.model_validate() 反序列化 JSON 字典<br>- 使用 workspace.verify_integrity() 校验文件完整性<br>- tampered 列表不为空时打印警告但不中断<br>- 所有输出使用 print（Week 1 不引入 Rich） |
| acceptance_criteria | - 调用 resume() 后返回的 State 对象包含正确的 completed_steps<br>- workspace 中的文件被篡改时，resume 打印警告信息<br>- workspace 中的文件未被篡改时，resume 正常返回 state<br>- state.json 不存在时，read_json 抛出 FileNotFoundError（向上冒泡） |
| stub_code | ```python<br>from pca_lite.core.models import State<br><br>class OrchestratorEngine:<br>    def resume(self) -> State:<br>        """从 state.json 恢复执行"""<br>        # TODO: 由下游模型实现<br>        pass<br>``` |

---

### T12 - 实现配置加载与校验逻辑

| 字段 | 内容 |
|------|------|
| task_id | T12 |
| layer | cli |
| task_name | 在 `pca_lite/cli/app.py` 中实现 load_config、validate_config 函数 |
| description | 在 `pca_lite/cli/app.py` 文件中实现两个函数。此时该文件还不会包含 Typer 应用（T14 创建），本任务只添加这两个函数。<br><br>**函数 1：load_config**<br>```python<br>from pathlib import Path<br>from pca_lite.core.models import Config<br><br>DEFAULT_CONFIG_PATH = Path.home() / ".pca" / "config.yaml"<br><br>def load_config(config_path: Path | None = None) -> Config:<br>    """加载配置文件，不存在则引导创建"""<br>    pass<br>```<br>行为：<br>1. 确定配置路径：<br>   - 如果 `config_path` 不为 None，使用传入的路径<br>   - 否则使用 `DEFAULT_CONFIG_PATH`（`~/.pca/config.yaml`）<br>2. 展开路径：`resolved_path = path.expanduser().resolve()`<br>3. 检查文件是否存在：<br>   - 不存在 → 调用 `interactive_setup()` 引导用户创建，返回 Config 对象<br>   - 存在 → 继续步骤 4<br>4. 读取文件内容，用正则 `\$\{(\w+)\}` 替换环境变量引用：<br>   ```python<br>   import re<br>   import os<br>   content = resolved_path.read_text(encoding="utf-8")<br>   def replace_env(match):<br>       var_name = match.group(1)<br>       return os.environ.get(var_name, match.group(0))  # 环境变量不存在则保留原样<br>   content = re.sub(r'\$\{(\w+)\}', replace_env, content)<br>   ```<br>5. 将替换后的内容写入临时文件，用 pydantic-settings 的 YAML 加载机制加载为 Config 对象<br>   （具体实现：写入临时文件 → `Config(_yaml_file=str(tmp_path))` 或使用 `yaml.safe_load` + `Config(**data)`）<br>6. 调用 `validate_config(config)` 校验<br>7. 如果校验失败（返回的错误列表不为空），打印所有错误后 `raise SystemExit(1)`<br>8. 返回 Config 对象<br><br>**函数 2：validate_config**<br>```python<br>def validate_config(config: Config) -> list[str]:<br>    """校验配置，返回错误消息列表（空列表表示通过）"""<br>    pass<br>```<br>行为：<br>1. 初始化空列表 `errors = []`<br>2. 检查核心字段（这些字段的值不能为空字符串）：<br>   - `config.llm.provider` 为空 → 添加 `"llm.provider 不能为空"`<br>   - `config.llm.base_url` 为空 → 添加 `"llm.base_url 不能为空"`<br>   - `config.llm.api_key` 为空 → 添加 `"llm.api_key 不能为空"`<br>   - `config.llm.model` 为空 → 添加 `"llm.model 不能为空"`<br>   - `config.embedding.mode` 为空 → 添加 `"embedding.mode 不能为空"`<br>3. 模式检查：<br>   - 如果 `config.embedding.mode == "local"` 且 `config.embedding.local_model` 为空 → 添加 `"embedding.mode 为 local 时 local_model 必须填写"`<br>   - 如果 `config.embedding.mode == "local"` 且 `Path(config.embedding.local_model).expanduser().resolve()` 不存在 → 添加 `"embedding.local_model 路径不存在: {path}"`<br>   - 如果 `config.embedding.mode == "api"` 且 `config.embedding.api_base_url` 为空 → 添加 `"embedding.mode 为 api 时 api_base_url 必须填写"`<br>4. 返回 errors 列表 |
| input_spec | `config_path`: Path | None 类型，可选，默认 None |
| output_spec | load_config 返回 Config 对象<br>validate_config 返回 list[str]（错误消息列表） |
| dependencies | [T03, T04] |
| tech_constraint | - 路径展开必须使用 `Path.expanduser().resolve()`<br>- 环境变量替换使用正则 `r'\$\{(\w+)\}'` + `os.environ.get()`<br>- YAML 读取使用 `pyyaml`（`import yaml`）<br>- 核心字段检查使用字符串空值判断（`if not value.strip()`）<br>- 禁止硬编码任何路径或 API Key<br>- validate_config 中的路径存在性检查必须先 expanduser().resolve() |
| acceptance_criteria | - config.yaml 存在且合法时，load_config 返回 Config 实例，所有字段正确映射<br>- config.yaml 中有 `${PCA_LLM_API_KEY}` 且环境变量存在时，api_key 字段被正确替换<br>- config.yaml 中有 `${PCA_LLM_API_KEY}` 且环境变量不存在时，api_key 字段保留原始 `${PCA_LLM_API_KEY}` 字符串<br>- 核心字段缺失时 validate_config 返回包含缺失字段名的错误列表<br>- embedding.mode=local 且 local_model 路径不存在时 validate_config 返回错误<br>- validate_config 通过时返回空列表 |
| stub_code | ```python<br>from pathlib import Path<br>from pca_lite.core.models import Config<br><br>DEFAULT_CONFIG_PATH = Path.home() / ".pca" / "config.yaml"<br><br>def load_config(config_path: Path | None = None) -> Config:<br>    """加载配置文件，不存在则引导创建"""<br>    # TODO: 由下游模型实现<br>    pass<br><br>def validate_config(config: Config) -> list[str]:<br>    """校验配置，返回错误列表"""<br>    # TODO: 由下游模型实现<br>    pass<br>``` |

---

### T13 - 实现交互式配置引导

| 字段 | 内容 |
|------|------|
| task_id | T13 |
| layer | cli |
| task_name | 在 `pca_lite/cli/app.py` 中实现 interactive_setup 函数 |
| description | 在 `pca_lite/cli/app.py` 文件中追加 `interactive_setup` 函数。<br><br>**函数**：<br>```python<br>from rich.prompt import Prompt, Confirm<br>from rich.console import Console<br><br>console = Console()<br><br>def interactive_setup() -> Config:<br>    """交互式引导用户填写核心配置字段"""<br>    pass<br>```<br>行为：<br>1. 打印欢迎信息：`console.print("[bold]PCA-Lite 首次运行配置引导[/bold]")`<br>2. 逐项询问核心字段，使用 `Prompt.ask()`：<br>   - `provider = Prompt.ask("LLM Provider", choices=["openai", "anthropic", "ollama"])`<br>   - `base_url = Prompt.ask("LLM API 端点地址")`<br>   - `api_key = Prompt.ask("LLM API Key", password=True)` （password=True 隐藏输入）<br>   - `model = Prompt.ask("LLM 模型名称")`<br>   - `embedding_mode = Prompt.ask("嵌入模型模式", choices=["api", "local"])`<br>3. 如果 embedding_mode == "local"：<br>   - `local_model = Prompt.ask("本地嵌入模型路径")`<br>   - 检查路径是否存在：`if not Path(local_model).expanduser().resolve().exists(): print("警告: 路径不存在，可能影响后续使用")`<br>   - 打印警告但不阻止（用户可能稍后下载模型）<br>4. 如果 embedding_mode == "api"：<br>   - `api_base_url = Prompt.ask("嵌入模型 API 端点")`<br>   - `api_key = Prompt.ask("嵌入模型 API Key", password=True)`<br>   - `api_model = Prompt.ask("嵌入模型名称")`<br>5. 使用收集的数据构造 Config 对象的子模型：<br>   ```python<br>   from pca_lite.core.models import (LLMConfig, EmbeddingConfig, RetryConfig,<br>                                      VectorDBConfig, RerankerConfig, SearchConfig,<br>                                      ParserConfig, OrchestratorConfig, PersistenceConfig,<br>                                      LoggingConfig, Config)<br>   llm_config = LLMConfig(provider=provider, base_url=base_url, api_key=api_key, model=model)<br>   embedding_config = EmbeddingConfig(mode=embedding_mode, ...)<br>   config = Config(llm=llm_config, embedding=embedding_config, ...)<br>   ```<br>   可选字段使用默认值（不传入，让 Pydantic 使用 default_factory）<br>6. 确认保存：`if Confirm.ask("是否保存配置到 ~/.pca/config.yaml?"):`<br>7. 创建目录：`config_dir = Path.home() / ".pca"; config_dir.mkdir(parents=True, exist_ok=True)`<br>8. 写入文件：<br>   - 用 `yaml.dump()` 将 config 的字典表示写入 YAML 文件<br>   - 或者用字符串模板写入（更可控）<br>9. 打印成功信息：`console.print("[green]配置已保存到 {config_path}[/green]")`<br>10. 返回 Config 对象 |
| input_spec | 无参数 |
| output_spec | 返回 Config 对象<br>副作用：创建 `~/.pca/config.yaml` 文件 |
| dependencies | [T12] |
| tech_constraint | - 使用 `rich.prompt.Prompt` 和 `rich.prompt.Confirm` 进行交互<br>- 使用 `rich.console.Console` 输出彩色文本<br>- api_key 输入必须使用 `password=True` 隐藏<br- 路径展开使用 `Path.expanduser().resolve()`<br>- YAML 写入使用 `yaml.dump()`<br>- 创建目录时使用 `mkdir(parents=True, exist_ok=True)`<br>- embedding.mode=local 时路径不存在只打印警告，不阻止流程 |
| acceptance_criteria | - 在交互式输入下能正常收集所有核心字段<br>- api_key 输入不回显（password=True）<br>- 调用后 `~/.pca/config.yaml` 文件存在<br- 生成的 config.yaml 中 llm.provider 等核心字段有值<br>- 路径不存在时打印警告但不抛异常 |
| stub_code | ```python<br>from rich.prompt import Prompt, Confirm<br>from rich.console import Console<br>from pca_lite.core.models import Config<br><br>console = Console()<br><br>def interactive_setup() -> Config:<br>    """交互式引导用户填写配置"""<br>    # TODO: 由下游模型实现<br>    pass<br>``` |

---

### T14 - 实现 CLI 入口（Typer + Rich）

| 字段 | 内容 |
|------|------|
| task_id | T14 |
| layer | cli |
| task_name | 在 `pca_lite/cli/app.py` 中实现 Typer 应用和所有 CLI 命令 |
| description | 在 `pca_lite/cli/app.py` 文件中实现完整的 Typer CLI 应用。本任务在 T12、T13 之后执行，此时文件中已有 load_config、validate_config、interactive_setup 函数。本任务在文件顶部追加 Typer 应用定义和命令函数。<br><br>**文件结构**（最终 app.py 应包含的完整内容顺序）：<br>1. 导入区（typer, rich, pathlib 等）<br>2. `app = typer.Typer(help="PCA-Lite: 面向论文综述的多 Agent 协作框架")`<br>3. `console = Console()`<br>4. load_config 函数（T12）<br>5. validate_config 函数（T12）<br>6. interactive_setup 函数（T13）<br>7. run 命令函数<br>8. config_cmd 命令函数<br><br>**命令 1：run**<br>```python<br>@app.command()<br>def run(<br>    topic: str = typer.Option(None, "--topic", "-t", help="综述主题"),<br>    files: list[Path] = typer.Option([], "--files", "-f", help="本地 PDF 文件路径"),<br>    config_path: Path = typer.Option(None, "--config", "-c", help="配置文件路径"),<br>    resume: Path = typer.Option(None, "--resume", "-r", help="断点恢复工作区路径"),<br>):<br>    """执行论文综述任务"""<br>    pass<br>```<br>行为：<br>1. 互斥检查：如果 `topic` 和 `resume` 同时提供，打印错误 `"错误: --topic 和 --resume 不能同时使用"` 并 `raise typer.Exit(1)`<br>2. 如果 `resume` 不为 None（恢复模式）：<br>   a. 从 workspace 读取配置（或使用默认配置）<br>   b. 创建 WorkspaceManager(resume)<br>   c. 创建 OrchestratorEngine(workspace)<br>   d. 调用 `engine.resume()` 获取 state<br>   e. 打印恢复信息<br>   f. 结束<br>3. 如果 `topic` 不为 None（新任务模式）：<br>   a. 调用 `config = load_config(config_path)` 加载配置<br>   b. 创建 WorkspaceManager(Path("./workspace"))<br>   c. 调用 `workspace.init_workspace()` 初始化工作区<br>   d. 创建 OrchestratorEngine(workspace)<br>   e. 调用 `plan = engine.load_or_create_plan(topic, files)`<br>   f. 打印 TaskPlan 摘要（topic、step 数量、review_type）<br>   g. 调用 `state = engine.execute_plan(plan)`<br>   h. 打印最终结果（completed_steps 列表）<br>4. 如果两者都为 None，打印 `"错误: 必须提供 --topic 或 --resume"` 并 `raise typer.Exit(1)`<br><br>**命令 2：config（子命令）**<br>```python<br>@app.command(name="config")<br>def config_cmd(<br>    action: str = typer.Argument(help="操作: show | init"),<br>):<br>    """管理配置文件"""<br>    pass<br>```<br>行为：<br>- `action == "show"`：<br>  1. 调用 `config = load_config()` 加载配置<br>  2. 打印配置信息，**api_key 必须脱敏**：显示前 4 位 + `"***"`（如果 api_key 长度 <= 4，显示 `"***"`）<br>  3. 使用 Rich 的 `Console.print` 和 `Panel` 渲染<br>- `action == "init"`：<br>  1. 调用 `interactive_setup()`<br>  2. 打印成功信息<br>- 其他值：打印 `"错误: 未知操作 '{action}'，支持 show | init"` 并退出<br><br>**api_key 脱敏逻辑**：<br>```python<br>def mask_key(key: str) -> str:<br>    if len(key) <= 4:<br>        return "***"<br>    return key[:4] + "***"<br>``` |
| input_spec | CLI 参数：--topic (str), --files (list[Path]), --config (Path), --resume (Path) |
| output_spec | 终端输出：执行进度、日志、最终结果 |
| dependencies | [T12, T13, T09, T10, T11] |
| tech_constraint | - 必须使用 `typer.Typer()` 定义应用<br>- 必须使用 `rich.console.Console` 输出<br>- api_key 在 `config show` 中必须脱敏<br>- `--topic` 和 `--resume` 互斥，同时提供时报错并退出<br>- `--files` 为可选列表参数，默认空列表<br>- 退出使用 `raise typer.Exit(code=1)` 而非 `sys.exit()`<br>- WorkspaceManager 初始化时传入 `Path("./workspace")`（Week 1 固定路径） |
| acceptance_criteria | - `python -m pca_lite run --topic "test"` 能启动执行流程<br>- `python -m pca_lite run --resume ./workspace/` 能从断点恢复<br>- `python -m pca_lite config show` 输出配置且 api_key 脱敏<br>- `python -m pca_lite config init` 触发交互式引导<br>- `--topic` 和 `--resume` 同时提供时打印错误信息并退出<br>- `python -m pca_lite` 不带参数时打印帮助信息 |
| stub_code | ```python<br>import typer<br>from pathlib import Path<br>from rich.console import Console<br><br>app = typer.Typer(help="PCA-Lite: 面向论文综述的多 Agent 协作框架")<br>console = Console()<br><br>def mask_key(key: str) -> str:<br>    """脱敏 API Key"""<br>    # TODO: 由下游模型实现<br>    pass<br><br>@app.command()<br>def run(<br>    topic: str = typer.Option(None, "--topic", "-t", help="综述主题"),<br>    files: list[Path] = typer.Option([], "--files", "-f", help="本地 PDF 文件"),<br>    config_path: Path = typer.Option(None, "--config", "-c", help="配置文件路径"),<br>    resume: Path = typer.Option(None, "--resume", "-r", help="断点恢复工作区路径"),<br>):<br>    """执行论文综述任务"""<br>    # TODO: 由下游模型实现<br>    pass<br><br>@app.command(name="config")<br>def config_cmd(<br>    action: str = typer.Argument(help="show | init"),<br>):<br>    """管理配置文件"""<br>    # TODO: 由下游模型实现<br>    pass<br>``` |

---

### T15 - 创建 __main__.py 入口

| 字段 | 内容 |
|------|------|
| task_id | T15 |
| layer | cli |
| task_name | 编写 `pca_lite/__main__.py` 入口文件 |
| description | 确认 `pca_lite/__main__.py` 文件内容正确。该文件在 T01 已创建，内容为 `from pca_lite.cli.app import app; app()`。本任务验证该文件的导入链能正常工作。<br><br>如果 T01 创建的文件内容有误，本任务修正它。正确内容：<br>```python<br>from pca_lite.cli.app import app<br><br>app()<br>```<br><br>注意：只导入 `app` 对象并调用，不要有其他代码。 |
| input_spec | 无 |
| output_spec | 文件: `pca_lite/__main__.py`（内容为 2 行） |
| dependencies | [T14] |
| tech_constraint | - 必须使用绝对导入 `from pca_lite.cli.app import app`<br>- 禁止使用相对导入<br>- 文件中只能有这两行代码，不要添加 if __name__ == "__main__" 等额外代码（`python -m` 调用时不需要） |
| acceptance_criteria | - `python -m pca_lite --help` 输出 Typer 帮助信息<br>- `python -c "from pca_lite.__main__ import app; print(type(app))"` 输出 `<class 'typer.Typer'>` |
| stub_code | 见 description（2 行代码） |

---

## 子任务依赖图

```
T01 (包结构)
 ├── T02 (枚举)
 │   └── T03 (核心模型)
 │       └── T04 (配置模型)
 │           └── T12 (配置加载)
 │               └── T13 (交互式引导)
 │                   └── T14 (CLI 入口)
 │                       └── T15 (__main__)
 ├── T06 (工作区初始化)
 │   └── T07 (JSON 读写)
 │       └── T08 (SHA-256 校验)
 ├── T05 (config.yaml + pyproject.toml) [无依赖]
 └── T09 (计划生成) [依赖 T03, T06]
     └── T10 (步骤执行)
         └── T11 (断点恢复)
             └── T14 (CLI 入口)
```

**执行顺序**（按层并行）：

```
Layer 1（并行）: T01
Layer 2（并行）: T02, T05
Layer 3（并行）: T03
Layer 4（并行）: T04, T06
Layer 5（并行）: T12, T07, T09
Layer 6（并行）: T13, T08, T10
Layer 7:         T14 (依赖 T13, T10, T11)
Layer 8:         T15
```

实际执行建议：
- T01 → T02 → T03 → T04 → T05 可以串行（都是 core 层，简单清晰）
- T06 → T07 → T08 串行（workspace 层）
- T09 → T10 → T11 串行（orchestrator 层）
- T12 → T13 串行（配置加载逻辑）
- T14 最后执行（集成所有模块）
- T15 验证

---

## 集成规则

**入口文件启动流程**：
```
python -m pca_lite
  → __main__.py: from pca_lite.cli.app import app; app()
  → cli/app.py: Typer 解析命令行参数
  → 根据子命令路由：
    - run → load_config() → WorkspaceManager → OrchestratorEngine.execute_plan(plan)
    - config show → load_config() → 打印配置（脱敏）
    - config init → interactive_setup()
```

**import 路径规范**：
- 所有内部导入使用绝对导入：`from pca_lite.core.models import TaskPlan`
- 禁止使用相对导入（`from .models import ...`）
- 跨模块引用只通过 core 层的模型，不直接引用其他模块的内部实现
- 示例：orchestrator/engine.py 引用 workspace.manager 时用 `from pca_lite.workspace.manager import WorkspaceManager`

**配置加载顺序**：
1. 环境变量（`PCA_` 前缀，由 pydantic-settings 自动处理）
2. config.yaml（由 `--config` 参数或 `~/.pca/config.yaml` 默认路径指定）
3. `.env` 文件（如果存在）
4. CLI 参数（`--topic`, `--files` 等，仅影响运行时行为，不写入 Config 对象）

优先级：CLI 参数 > 环境变量 > config.yaml
