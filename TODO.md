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

## Week 2：预处理层 + Researcher Agent ❌ 未实现

### 预处理层 (Ingestion)

| 功能 | 状态 | 说明 |
|------|------|------|
| PDF 文本提取 (PyMuPDF) | ❌ | 需实现 `pca_lite/ingestion/parser.py` |
| 元数据提取 (正则) | ❌ | 标题/作者/年份/DOI 正则匹配 |
| 文本分块 (chunking) | ❌ | `RecursiveCharacterTextSplitter` |
| 向量化索引 (Chroma) | ❌ | 需实现 `pca_lite/retrieval/vector_store.py` |
| 本地 Embedding 模型封装 | ❌ | 需实现 `pca_lite/llm/embedding.py` |

### Agent

| 功能 | 状态 | 说明 |
|------|------|------|
| Researcher Agent | ❌ | `pca_lite/agents/researcher.py` + System Prompt |
| Web Search 工具 | ❌ | Semantic Scholar / arXiv API |

### Provider 抽象层

| 功能 | 状态 | 说明 |
|------|------|------|
| OpenAI Provider | ❌ | `pca_lite/llm/providers/openai.py` |
| Anthropic Provider | ❌ | `pca_lite/llm/providers/anthropic.py` |
| Ollama Provider | ❌ | `pca_lite/llm/providers/ollama.py` |
| Provider 统一接口 | ❌ | `pca_lite/llm/base.py` |

---

## Week 3：Agent 协作 + 引用溯源 ❌ 未实现

| 功能 | 状态 | 说明 |
|------|------|------|
| Analyst Agent | ❌ | `pca_lite/agents/analyst.py` + System Prompt |
| Writer Agent | ❌ | `pca_lite/agents/writer.py` + System Prompt |
| 交叉校验 (1 轮重试) | ❌ | Orchestrator 中实现 |
| 引用溯源锁 | ❌ | literature_pool.json 1-based index 映射 |
| P0 重排序 (Reranker) | ❌ | `pca_lite/retrieval/reranker.py` |

---

## Week 4：增强 + 人机回环 ❌ 未实现

| 功能 | 状态 | 说明 |
|------|------|------|
| L1/L2 自动摘要 | ❌ | 轻量模型生成摘要 |
| 质量评分 | ❌ | relevance_score 计算 |
| 去重 + 粗聚类 | ❌ | DOI/标题去重 + K-Means/HDBSCAN |
| 并行执行 (parallel_group) | ❌ | Orchestrator 并发调度 |
| 状态持久化断点续作 | ❌ | SHA-256 校验 + resume |
| 人机回环 CLI 版 (3 节点) | ❌ | CLI 交互确认 |
| P1 混合检索 (BM25 + 向量) | ❌ | 关键词 + 向量混合 |

---

## Week 5-6：Web UI ❌ 未实现

| 功能 | 状态 | 说明 |
|------|------|------|
| Web UI 框架 | ❌ | Streamlit 或 Gradio |
| 配置页面 | ❌ | 可视化填写 config.yaml |
| 文献管理页面 | ❌ | 文件上传、列表展示 |
| 执行监控页面 | ❌ | TaskPlan 可视化 + 日志 |
| 人机回环 Web 版 | ❌ | 计划确认、初稿预览 |
| 终稿展示 + 导出 | ❌ | Markdown 渲染、BibTeX 导出 |

---

## 技术债务 / 待办

- [ ] 完善 `cli/app.py` 的 error handling（目前大部分异常直接抛出）
- [ ] 添加 `pca_lite/agents/` 目录结构
- [ ] 添加 `pca_lite/llm/providers/` 目录结构
- [ ] 添加 `pca_lite/ingestion/` 目录结构
- [ ] 添加 `pca_lite/retrieval/` 目录结构
- [ ] 添加 `pca_lite/prompts/` Jinja2 模板（Agent System Prompts）
- [ ] 添加单元测试（目前无 tests/）
- [ ] 配置 pydantic-settings BaseSettings 的 yaml_file 路径处理
- [ ] `interactive_setup()` 写入 yaml 后 key 是明文，需加密或用环境变量引用
