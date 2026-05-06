# CiteForge 实现清单

## Week 1：CLI 骨架 ✅ 已完成

| 任务 | 状态 | 文件 |
|------|------|------|
| T01 包结构 + `__init__.py` | ✅ | `citeforge/__init__.py`, `__main__.py` |
| T02 枚举定义 | ✅ | `citeforge/core/enums.py` |
| T03 核心数据模型 | ✅ | `citeforge/core/models.py` |
| T04 配置模型 | ✅ | `citeforge/core/models.py` (末尾) |
| T05 config.yaml + pyproject.toml | ✅ | `config.yaml`, `pyproject.toml` |
| T06 工作区初始化 | ✅ | `citeforge/workspace/manager.py` |
| T07 JSON 读写 | ✅ | `citeforge/workspace/manager.py` |
| T08 SHA-256 完整性校验 | ✅ | `citeforge/workspace/manager.py` |
| T09 计划生成 | ✅ | `citeforge/orchestrator/engine.py` |
| T10 步骤执行 + 状态机 | ✅ | `citeforge/orchestrator/engine.py` |
| T11 断点恢复 | ✅ | `citeforge/orchestrator/engine.py` |
| T12 配置加载 | ✅ | `citeforge/cli/app.py` |
| T13 交互式配置引导 | ✅ | `citeforge/cli/app.py` |
| T14 CLI 入口 (Typer) | ✅ | `citeforge/cli/app.py` |
| T15 `__main__.py` 验证 | ✅ | `citeforge/__main__.py` |

---

## Week 2：预处理层 + Researcher Agent ✅ 已完成

### 预处理层 (Ingestion)

| 功能 | 状态 | 文件 |
|------|------|------|
| PDF 文本提取 (PyMuPDF) | ✅ | `citeforge/ingestion/parser.py` |
| 元数据提取 (正则) | ✅ | `citeforge/ingestion/metadata.py` |
| 文本分块 (chunking) | ✅ | `citeforge/ingestion/splitter.py` |
| 向量化索引 (Chroma) | ✅ | `citeforge/retrieval/vector_store.py` |
| 本地 Embedding 模型封装 | ✅ | `citeforge/llm/embedding.py` |
| L1/L2 自动摘要 | ✅ | `citeforge/ingestion/summarizer.py` |

### Agent

| 功能 | 状态 | 文件 |
|------|------|------|
| Researcher Agent | ✅ | `citeforge/agents/researcher.py` + `citeforge/prompts/researcher.md` |
| Web Search 工具 | ✅ | `citeforge/search/semantic_scholar.py` |

### Provider 抽象层

| 功能 | 状态 | 文件 |
|------|------|------|
| OpenAI Provider | ✅ | `citeforge/llm/providers/openai.py` |
| Anthropic Provider | ✅ | `citeforge/llm/providers/anthropic.py` |
| Ollama Provider | ✅ | `citeforge/llm/providers/ollama.py` |
| Provider 统一接口 | ✅ | `citeforge/llm/base.py` |

---

## Week 3：Agent 协作 + 引用溯源 ✅ 已完成

| 功能 | 状态 | 文件 |
|------|------|------|
| Analyst Agent | ✅ | `citeforge/agents/analyst.py` + `citeforge/prompts/analyst.md` |
| Writer Agent | ✅ | `citeforge/agents/writer.py` + `citeforge/prompts/writer.md` |
| 引用溯源锁 | ✅ | literature_pool.json 1-based index 映射 |
| P0 重排序 (Reranker) | ✅ | `citeforge/retrieval/reranker.py` |
| 交叉校验 (1 轮重试) | ✅ | Orchestrator 中实现 |

---

## Week 4：增强 + 人机回环 ✅ 已完成

| 功能 | 状态 | 文件 |
|------|------|------|
| 质量评分 (relevance_score) | ✅ | `citeforge/retrieval/scorer.py` |
| 去重 + 粗聚类 | ✅ | `citeforge/ingestion/dedup.py` |
| 并行执行 (parallel_group) | ✅ | `citeforge/orchestrator/engine.py` |
| 人机回环 CLI 版 (3 节点) | ✅ | `citeforge/cli/app.py` (Confirm checkpoints) |
| P1 混合检索 (BM25 + 向量) | ✅ | `citeforge/retrieval/hybrid_search.py` |

---

## Week 5-6：Web UI ✅ 已完成

| 功能 | 状态 | 文件 |
|------|------|------|
| Web UI 框架 (Streamlit) | ✅ | `citeforge/web/app.py` |
| 配置页面 | ✅ | `citeforge/web/pages/config_page.py` |
| 文献管理页面 | ✅ | `citeforge/web/pages/documents.py` |
| 执行监控页面 | ✅ | `citeforge/web/pages/monitoring.py` |
| 终稿展示 + 导出 | ✅ | `citeforge/web/pages/preview.py` |
| Web UI 入口点 | ✅ | `pca-web` CLI command |

---

## 技术债务 / 待办

- [x] 添加 `citeforge/agents/` 目录结构 ✅
- [x] 添加 `citeforge/llm/providers/` 目录结构 ✅
- [x] 添加 `citeforge/ingestion/` 目录结构 ✅
- [x] 添加 `citeforge/retrieval/` 目录结构 ✅
- [x] 添加 `citeforge/prompts/` Jinja2 模板（Agent System Prompts）✅
- [x] 添加 `citeforge/search/` 目录结构（Web Search provider）✅
- [x] 添加 `citeforge/export/` 目录结构（BibTeX 导出）✅
- [x] 添加单元测试（tests/test_scorer.py）✅
- [x] 完善 `cli/app.py` 的 error handling ✅
- [x] `interactive_setup()` 支持环境变量引用 ✅
- [x] 添加 BibTeX 导出功能 ✅
- [ ] 配置 pydantic-settings BaseSettings 的 yaml_file 路径处理
- [x] 添加真实执行触发器（Web UI 中调用 OrchestratorEngine）✅
- [ ] 集成测试（end-to-end）