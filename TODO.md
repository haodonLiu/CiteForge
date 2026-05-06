# PCA-Lite 实现清单

## Week 1：CLI 骨架 ✅ 已完成

| 任务 | 状态 | 文件 |
|------|------|------|
| T01 包结构 + `__init__.py` | ✅ | `pca_lite/__init__.py`, `__main__.py` |
| T02 枚举定义 | ✅ | `pca_lite/core/enums.py` |
| T03 核心数据模型 | ✅ | `pca_lite/core/models.py` |
| T04 配置模型 | ✅ | `pca_lite/core/models.py` (末尾) |
| T05 config.yaml + pyproject.toml | ✅ | `config.yaml`, `pyproject.toml` |
| T06 工作区初始化 | ✅ | `pca_lite/workspace/manager.py` |
| T07 JSON 读写 | ✅ | `pca_lite/workspace/manager.py` |
| T08 SHA-256 完整性校验 | ✅ | `pca_lite/workspace/manager.py` |
| T09 计划生成 | ✅ | `pca_lite/orchestrator/engine.py` |
| T10 步骤执行 + 状态机 | ✅ | `pca_lite/orchestrator/engine.py` |
| T11 断点恢复 | ✅ | `pca_lite/orchestrator/engine.py` |
| T12 配置加载 | ✅ | `pca_lite/cli/app.py` |
| T13 交互式配置引导 | ✅ | `pca_lite/cli/app.py` |
| T14 CLI 入口 (Typer) | ✅ | `pca_lite/cli/app.py` |
| T15 `__main__.py` 验证 | ✅ | `pca_lite/__main__.py` |

---

## Week 2：预处理层 + Researcher Agent ✅ 已完成

### 预处理层 (Ingestion)

| 功能 | 状态 | 文件 |
|------|------|------|
| PDF 文本提取 (PyMuPDF) | ✅ | `pca_lite/ingestion/parser.py` |
| 元数据提取 (正则) | ✅ | `pca_lite/ingestion/metadata.py` |
| 文本分块 (chunking) | ✅ | `pca_lite/ingestion/splitter.py` |
| 向量化索引 (Chroma) | ✅ | `pca_lite/retrieval/vector_store.py` |
| 本地 Embedding 模型封装 | ✅ | `pca_lite/llm/embedding.py` |

### Agent

| 功能 | 状态 | 文件 |
|------|------|------|
| Researcher Agent | ✅ | `pca_lite/agents/researcher.py` + `pca_lite/prompts/researcher.md` |
| Web Search 工具 | ✅ | `pca_lite/search/semantic_scholar.py` |

### Provider 抽象层

| 功能 | 状态 | 文件 |
|------|------|------|
| OpenAI Provider | ✅ | `pca_lite/llm/providers/openai.py` |
| Anthropic Provider | ✅ | `pca_lite/llm/providers/anthropic.py` |
| Ollama Provider | ✅ | `pca_lite/llm/providers/ollama.py` |
| Provider 统一接口 | ✅ | `pca_lite/llm/base.py` |

---

## Week 3：Agent 协作 + 引用溯源 ✅ 已完成

| 功能 | 状态 | 文件 |
|------|------|------|
| Analyst Agent | ✅ | `pca_lite/agents/analyst.py` + `pca_lite/prompts/analyst.md` |
| Writer Agent | ✅ | `pca_lite/agents/writer.py` + `pca_lite/prompts/writer.md` |
| 引用溯源锁 | ✅ | literature_pool.json 1-based index 映射 |
| P0 重排序 (Reranker) | ✅ | `pca_lite/retrieval/reranker.py` |
| 交叉校验 (1 轮重试) | ✅ | Orchestrator 中实现 |

---

## Week 4：增强 + 人机回环 ✅ 已完成

| 功能 | 状态 | 文件 |
|------|------|------|
| L1/L2 自动摘要 | ✅ | `pca_lite/ingestion/summarizer.py` |
| 质量评分 (relevance_score) | ✅ | `pca_lite/retrieval/scorer.py` |
| 去重 + 粗聚类 | ✅ | `pca_lite/ingestion/dedup.py` |
| 并行执行 (parallel_group) | ✅ | `pca_lite/orchestrator/engine.py` |
| 人机回环 CLI 版 (3 节点) | ✅ | `pca_lite/cli/app.py` (Confirm checkpoints) |
| P1 混合检索 (BM25 + 向量) | ✅ | `pca_lite/retrieval/hybrid_search.py` |

---

## Week 5-6：Web UI ✅ 已完成

| 功能 | 状态 | 文件 |
|------|------|------|
| Web UI 框架 (Streamlit) | ✅ | `pca_lite/web/app.py` |
| 配置页面 | ✅ | `pca_lite/web/pages/config_page.py` |
| 文献管理页面 | ✅ | `pca_lite/web/pages/documents.py` |
| 执行监控页面 | ✅ | `pca_lite/web/pages/monitoring.py` |
| 终稿展示 + 导出 | ✅ | `pca_lite/web/pages/preview.py` |
| Web UI 入口点 | ✅ | `pca-web` CLI command |

---

## 技术债务 / 待办

- [x] 添加 `pca_lite/agents/` 目录结构 ✅
- [x] 添加 `pca_lite/llm/providers/` 目录结构 ✅
- [x] 添加 `pca_lite/ingestion/` 目录结构 ✅
- [x] 添加 `pca_lite/retrieval/` 目录结构 ✅
- [x] 添加 `pca_lite/prompts/` Jinja2 模板（Agent System Prompts）✅
- [x] 添加 `pca_lite/search/` 目录结构（Web Search provider）✅
- [x] 添加单元测试（tests/test_scorer.py）✅ 部分完成
- [ ] 完善 `cli/app.py` 的 error handling（目前大部分异常直接抛出）
- [ ] 配置 pydantic-settings BaseSettings 的 yaml_file 路径处理
- [ ] `interactive_setup()` 写入 yaml 后 key 是明文，需加密或用环境变量引用
- [ ] 添加 BibTeX 导出功能 (preview page)
- [ ] 添加真实执行触发器（Web UI 中调用 OrchestratorEngine）
- [ ] 集成测试（end-to-end）