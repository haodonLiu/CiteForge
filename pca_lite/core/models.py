from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from pydantic_settings import BaseSettings

from pca_lite.core.enums import AgentType


# ─── Execution Plan ────────────────────────────────────────────────────────


class Step(BaseModel):
    model_config = ConfigDict(strict=True)

    id: str = Field(..., pattern=r"^step_\w+$", examples=["step_0"])
    agent: AgentType
    task: str = Field(..., min_length=1, max_length=500, examples=["文档预处理与索引构建"])
    tools: list[str] = Field(default_factory=list, examples=[["pdf_parser"]])
    input_from: list[str] = Field(default_factory=list, examples=[["step_0"]])
    output: str = Field(..., examples=["literature_pool.json"])
    parallel_group: str | None = Field(default=None, examples=["fetch"])


class Constraints(BaseModel):
    model_config = ConfigDict(strict=True)

    max_retry: int = Field(default=1, ge=0, le=10, examples=[1])
    max_total_tokens: int = Field(default=50000, gt=0, examples=[50000])
    max_step_tokens: int = Field(default=8000, gt=0, examples=[8000])
    consensus_threshold: float = Field(default=0.67, ge=0.0, le=1.0, examples=[0.67])


class Sources(BaseModel):
    model_config = ConfigDict(strict=True)

    local_files: list[Path] = Field(default_factory=list, examples=[["paper1.pdf"]])
    search_queries: list[str] = Field(default_factory=list, examples=[["multi-agent LLM"]])


class TaskPlan(BaseModel):
    model_config = ConfigDict(strict=True)

    topic: str = Field(..., min_length=1, max_length=500, examples=["LLM Agent 协作架构综述"])
    created_at: str = Field(..., examples=["2026-05-05T10:00:00"])
    review_type: str = Field(
        default="default",
        pattern=r"^(default|comparison|timeline|meta_analysis)$",
        examples=["default"],
    )
    sources: Sources
    steps: list[Step] = Field(..., min_length=1)
    constraints: Constraints = Field(default_factory=Constraints)


# ─── Literature Entry ─────────────────────────────────────────────────────────


class LiteratureEntry(BaseModel):
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


# ─── Breakpoint Resume State ─────────────────────────────────────────────────


class State(BaseModel):
    model_config = ConfigDict(strict=True)

    plan_version: str = Field(default="1.0", examples=["1.0"])
    current_step: str = Field(..., examples=["step_3"])
    completed_steps: list[str] = Field(default_factory=list, examples=[["step_0", "step_1a"]])
    retry_counts: dict[str, int] = Field(default_factory=dict, examples=[{"step_3": 0}])
    workspace_files: dict[str, str] = Field(
        default_factory=dict,
        description="filename -> sha256 hash",
        examples=[{"literature_pool.json": "sha256:abcdef1234567890"}],
    )
    vector_index_hash: str = Field(default="", examples=["sha256:1122334455667788"])
    timestamp: str = Field(..., examples=["2026-05-05T10:30:00"])


# ─── Validation Report ────────────────────────────────────────────────────────


class ValidationIssue(BaseModel):
    model_config = ConfigDict(strict=True)

    location: str = Field(..., examples=["第2段"])
    problem: str = Field(..., min_length=1, examples=["缺少文献引用支撑"])
    suggestion: str = Field(default="", examples=["添加 [3] 引用"])
    severity: str = Field(default="medium", pattern=r"^(low|medium|high)$")


class ValidationReport(BaseModel):
    model_config = ConfigDict(strict=True)

    pass_: bool = Field(..., alias="pass")
    issues: list[ValidationIssue] = Field(default_factory=list)
    severity: str = Field(default="medium", pattern=r"^(low|medium|high)$")


# ─── Config Models ────────────────────────────────────────────────────────────


class RetryConfig(BaseModel):
    model_config = ConfigDict(strict=True)

    max_attempts: int = Field(default=3, ge=1, examples=[3])
    backoff: str = Field(default="exponential", pattern=r"^(fixed|exponential)$")
    initial_delay: float = Field(default=1.0, ge=0, examples=[1.0])
    max_delay: float = Field(default=30.0, ge=0, examples=[30.0])


class LLMConfig(BaseModel):
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
    model_config = ConfigDict(strict=True)

    engine: str = Field(default="chroma", pattern=r"^(chroma|milvus_lite|faiss)$")
    persist_dir: str = Field(default="./workspace/vector_index")
    collection_name: str = Field(default="papers")


class SearchConfig(BaseModel):
    model_config = ConfigDict(strict=True)

    provider: str = Field(default="", examples=["semantic_scholar"])
    api_key: str = Field(default="")
    base_url: str = Field(default="")
    max_results: int = Field(default=15, gt=0, examples=[15])


class ParserConfig(BaseModel):
    model_config = ConfigDict(strict=True)

    pdf_engine: str = Field(default="pymupdf", pattern=r"^(pymupdf|pdfplumber)$")
    chunk_size: int = Field(default=512, gt=0, examples=[512])
    chunk_overlap: int = Field(default=50, ge=0, examples=[50])
    extract_images: bool = Field(default=True)
    image_dir: str = Field(default="./workspace/images")


class OrchestratorConfig(BaseModel):
    model_config = ConfigDict(strict=True)

    max_retry: int = Field(default=1, ge=0, examples=[1])
    max_total_tokens: int = Field(default=50000, gt=0, examples=[50000])
    max_step_tokens: int = Field(default=8000, gt=0, examples=[8000])
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
