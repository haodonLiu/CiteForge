# CiteForge：面向论文综述的多 Agent 协作框架

## 一、定位与目标

CiteForge 是一个面向论文综述撰写的多 Agent 协作框架，CLI 先行，Web UI 后续跟进。核心目标：

1. **引用可靠**：综述中的每一条引用都必须可溯源，杜绝幻觉引用
2. **多 Agent 分工**：研究员负责检索校验，分析师负责主题聚类与逻辑校验，写作者负责结构化撰写
3. **人机协作**：在关键节点暂停，让用户确认中间结果，防止偏差累积
4. **断点续作**：长综述执行过程中崩溃可从断点恢复，不从头重跑

适用场景：论文综述、文献调研报告、领域现状分析。不适用：简单问答、实时对话、低 Token 预算任务。

---

## 二、架构总览

四层三角色，通过共享工作区通信。

```
┌──────────────────────────────────────────────────┐
│                用户接口 (CLI 先行 / Web UI 后续)   │
│                                                    │
│  输入: 主题描述 + 本地文件 + 参数配置               │
│  输出: Markdown 综述 + 引用列表 + 执行日志          │
│                                                    │
│  Web UI 页面（V1.1）:                              │
│  · 配置页面：可视化填写/编辑 config.yaml            │
│  · 任务创建：上传文件、设定主题、选择模板            │
│  · 文献管理：列表展示、筛选、批量操作               │
│  · 执行监控：TaskPlan 可视化、实时日志、状态追踪    │
│  · 人机回环：计划确认、初稿预览、修改意见提交        │
│  · 终稿展示：Markdown 渲染、引用列表、导出下载      │
└───────────────────────┬──────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────┐
│          第零层：预处理层 (Ingestion Layer)          │
│          纯工程层，不依赖 LLM Agent                 │
│                                                    │
│  1. 文档解析 → 2. 元数据提取 → 3. 向量化索引        │
│  4. 自动摘要 → 5. 质量评分 → 6. 去重/粗聚类        │
└───────────────────────┬──────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────┐
│              调度层 (Orchestrator)                  │
│                                                    │
│  · 生成结构化执行计划 (TaskPlan)                    │
│  · 识别无依赖子任务，并发调度                       │
│  · 每步执行后触发交叉校验                          │
│  · 维护共享工作区，管理状态持久化                    │
│  · 在人机回环节点暂停，等待用户确认                  │
│  · 通过向量检索管理上下文窗口                       │
└──────┬──────────────┬──────────────┬──────────────┘
       │              │              │
┌──────▼─────┐ ┌──────▼─────┐ ┌─────▼───────┐
│  研究员     │ │  分析师     │ │  写作者      │
│ Researcher  │ │ Analyst    │ │  Writer     │
│             │ │            │ │             │
│ · 校验预处理│ │ · 主题聚类  │ │ · 撰写综述  │
│   结果      │ │ · 逻辑校验  │ │ · 管理引用  │
│ · 补充网络  │ │ · 引用核对  │ │ · 格式输出  │
│   检索      │ │ · 冲突检测  │ │ · 图表生成  │
│ · 精化元数据│ │            │ │             │
└──────┬─────┘ └──────┬─────┘ └─────┬───────┘
       │              │              │
┌──────▼──────────────▼──────────────▼───────────┐
│                  工具层 (Tools)                   │
│                                                  │
│  文件: PDF 解析 / Markdown 读写 / 图片提取       │
│  网络: Semantic Scholar / arXiv / Tavily         │
│  向量: 嵌入模型 / Chroma / FAISS                 │
│  多模态: 图片理解 (Vision API) / 图表生成        │
└──────────────────────────────────────────────────┘
```

### Provider 统一抽象层

所有 LLM/Embedding/Reranker 调用通过统一接口封装，屏蔽底层 provider 差异：

```python
class BaseProvider(ABC):
    async def chat(self, messages, **kwargs) -> str: ...
    async def embed(self, texts) -> list[list[float]]: ...
    async def rerank(self, query, docs) -> list[float]: ...

class OpenAIProvider(BaseProvider): ...
class AnthropicProvider(BaseProvider): ...
class OllamaProvider(BaseProvider): ...   # 本地模型统一走 Ollama/vLLM HTTP 接口
```

- `llm` / `llm_lite` 使用 `chat()` 接口
- `embedding` 使用 `embed()` 接口
- `reranker` 使用 `rerank()` 接口
- 本地模型（如 Qwen3-Embedding、Qwen3-Reranker）通过 Ollama 或 vLLM 暴露 HTTP 接口，用同一个 `OllamaProvider` 封装，不需要为每种模型写不同的客户端

---

## 三、预处理层（Ingestion Layer）

预处理层是 CiteForge 处理大规模文献的基础设施。它是纯工程层，不经过 LLM，负责把"原始文件"转化为"Agent 可消费的结构化数据"。

### 六个步骤

#### 1. 文档解析（Document Parsing）

- **PDF**：PyMuPDF / pdfplumber 提取文本，保留章节结构（标题层级）
- **Word/TXT**：直接读取，按段落切分
- **图片**：提取内嵌图片，保存到 `workspace/images/` 并生成索引
- **批量处理**：支持一次上传 50+ 文件，逐个异步解析，每完成一个写入进度日志

输出：每篇文献的原始文本块 `raw_chunks.json`

#### 2. 元数据提取（Metadata Extraction）

不调用 LLM，用规则引擎 + 正则表达式提取：

- 标题（PDF 第一页大号字体或第一行）
- 作者、年份、期刊/会议（标准学术格式正则）
- DOI / arXiv ID（正则匹配 `10.xxxx` 或 `arXiv:xxxx`）
- 页数、文件大小、语言检测

无法提取的字段：标记为 `"pending"`，留给 Researcher Agent 后续补全。

#### 3. 向量化索引（Vector Indexing）

RAG 的核心环节，也是处理大量文献的关键机制：

- 用 `RecursiveCharacterTextSplitter`（LangChain）将每篇文献切分为段落级 chunk（512 tokens，10%-20% 重叠），按 `\n\n` → `\n` → `。` → 递归切分
- 用嵌入模型生成向量，支持 API 和本地两种模式（见第十三节配置）：
  - **API 模式**：OpenAI `text-embedding-3-small`（质量高，需网络）
  - **本地模式**：用户自行下载模型后填写本地路径，离线可用
- 存入 Chroma（零配置、本地持久化，适合 <1000 篇）或 Milvus Lite（适合 >1000 篇）

目的：后续 Agent 不需要"读全文"，只需要"检索相关段落"。

#### 4. 自动摘要（Auto-Summarization）

对每篇文献生成两级摘要：

- **L1 快速摘要**（~100 字）：研究问题 + 核心结论，由轻量模型或规则生成
- **L2 深度摘要**（~300 字）：方法 + 实验 + 局限，由主 LLM 在预处理阶段批量生成（可离线跑，不阻塞用户）

存储：`literature_pool.json` 中的 `abstract` 和 `key_findings` 字段由预处理层预填充，Researcher Agent 在此基础上校验和补充。

#### 5. 质量评分（Quality Scoring）

给每篇文献打一个相关度预评分（0-1），帮助后续筛选：

- 基于用户主题与文献标题/摘要的向量相似度
- 基于引用次数（如果网络搜索已返回元数据）
- 基于文件来源（本地文件默认 0.8，网络搜索按引擎置信度）

输出：`literature_pool.json` 中的 `relevance_score`，供人机回环节点排序展示。

#### 6. 去重与粗聚类（Deduplication & Clustering）

- **去重**：相同 DOI / 相同标题的文献自动合并，保留版本最新的 PDF
- **粗聚类**：基于向量相似度做初步聚类（K-Means 或 HDBSCAN），给每篇文献预打 `preliminary_cluster` 标签

目的：Analyst Agent 做主题聚类时，不是从零开始，而是在预处理聚类结果上精化。

### 预处理层上下文窗口效果

| 阶段 | 数据量 | Agent 看到的内容 | 是否撑爆窗口 |
|------|--------|-----------------|-------------|
| 预处理 | 100 篇 x 20 页 | 纯工程处理，不经过 LLM | N/A |
| Researcher | 100 篇 | literature_pool.json（元数据+摘要，约 5k tokens） | 否 |
| Analyst 聚类 | 100 篇 | 元数据 + 预聚类标签 | 否 |
| Writer 撰写 | 100 篇 | 向量检索 + 重排序 Top-K 相关段落（按主题） | 否 |
| Analyst 校验 | 100 篇 | 按段落校验，只加载待校验段落引用的具体文献片段 | 否 |

---

## 四、核心数据结构

### TaskPlan（执行计划）

调度层接收用户输入后生成，贯穿整个执行过程。

```json
{
  "topic": "LLM Agent 协作架构综述",
  "created_at": "2026-05-05T10:00:00",
  "review_type": "default",
  "sources": {
    "local_files": ["paper1.pdf", "paper2.pdf"],
    "search_queries": ["multi-agent LLM collaboration", "agent orchestration"]
  },
  "steps": [
    {
      "id": "step_0",
      "agent": "preprocessor",
      "task": "文档预处理与索引构建",
      "tools": ["pdf_parser", "vector_indexer", "summarizer"],
      "input_from": [],
      "output": "literature_pool.json + vector_index/",
      "parallel_group": null
    },
    {
      "id": "step_1a",
      "agent": "researcher",
      "task": "校验预处理结果，补全缺失元数据",
      "tools": ["web_search"],
      "input_from": ["step_0"],
      "output": "local_verified.json",
      "parallel_group": "fetch"
    },
    {
      "id": "step_1b",
      "agent": "researcher",
      "task": "网络搜索补充文献（新文献同样经过预处理）",
      "tools": ["web_search"],
      "input_from": ["step_0"],
      "output": "web_entries.json",
      "parallel_group": "fetch"
    },
    {
      "id": "step_1_merge",
      "agent": "orchestrator",
      "task": "合并文献池 + 重排索引 + 完整性校验",
      "tools": [],
      "input_from": ["step_1a", "step_1b"],
      "output": "literature_pool.json",
      "parallel_group": null
    },
    {
      "id": "step_2",
      "agent": "analyst",
      "task": "在预聚类基础上精化主题聚类",
      "tools": [],
      "input_from": ["step_1_merge"],
      "output": "topics.json",
      "parallel_group": null
    },
    {
      "id": "step_3",
      "agent": "writer",
      "task": "基于主题分析撰写综述初稿",
      "tools": ["markdown_writer", "vector_search"],
      "input_from": ["step_1_merge", "step_2"],
      "output": "draft.md",
      "parallel_group": null
    },
    {
      "id": "step_4",
      "agent": "analyst",
      "task": "引用精确性逐条核对",
      "tools": ["vector_search"],
      "input_from": ["step_3", "step_1_merge"],
      "output": "citation_report.json",
      "parallel_group": null
    },
    {
      "id": "step_5",
      "agent": "writer",
      "task": "整合校验结果，生成终稿",
      "tools": ["markdown_writer"],
      "input_from": ["step_3", "step_4"],
      "output": "final_review.md",
      "parallel_group": null
    }
  ],
  "constraints": {
    "max_retry": 1,
    "max_total_tokens": 50000,
    "max_step_tokens": 8000,
    "consensus_threshold": 0.67
  }
}
```

### 并行调度规则

TaskPlan 中同一 `parallel_group` 内的步骤无输入依赖，可并发执行。调度层规则：

1. 识别所有 `parallel_group` 相同的步骤，检查它们的 `input_from` 是否均指向已完成的步骤
2. 将组内步骤并发提交给 Agent
3. 等待组内全部完成后，才进入下一步
4. 组内任一步骤失败：整体回滚该组，不进入后续步骤，由调度层决定重试或降级

### 综述模板

Writer 的输出结构由 `review_type` 字段决定，不强制固定：

| 模板 | 结构 | 适用场景 |
|------|------|---------|
| `default` | 引言 → 主题分析 → 研究空白 → 结论与展望 | 通用综述 |
| `comparison` | 引言 → 方法对比矩阵 → 各方法优劣 → 推荐与展望 | 方法对比综述 |
| `timeline` | 引言 → 早期工作 → 关键突破 → 当前前沿 → 未来方向 | 技术演进综述 |
| `meta_analysis` | 引言 → 纳入标准 → 定量汇总 → 偏差分析 → 结论 | 元分析综述 |

调度层根据用户描述自动选择模板，用户可在 Phase 0 确认时修改。

### Workspace（共享工作区）

```
workspace/
├── raw_pdfs/               # 原始文件备份
├── preprocessed/
│   ├── raw_chunks.json     # 段落级原始切片
│   ├── chunks/             # 向量化用的段落切片
│   ├── embeddings/         # 向量索引文件
│   └── metadata.json       # 批量提取的元数据
├── vector_index/           # 向量数据库（Chroma/FAISS）
├── literature_pool.json    # 预处理层输出（预填充，有序数组）
├── topics.json             # 主题分析（Analyst 输出）
├── draft.md                # 综述初稿（Writer 输出）
├── citation_report.json    # 引用校验报告（Analyst 输出）
├── final_review.md         # 终稿
└── state.json              # 执行状态（用于断点续作）
```

### literature_pool.json（文献池）

有序数组格式。Writer 输出的 `[n]` 严格对应数组第 `n-1` 项（1-based 索引）。数组顺序即引用编号，不可重排。预处理层预填充大部分字段，Researcher Agent 后续校验和补全。

```json
[
  {
    "index": 1,
    "title": "Building Effective Autonomous Agents",
    "authors": ["Andrew Karpathy"],
    "year": 2025,
    "source": "local_pdf",
    "file_path": "paper1.pdf",
    "page_range": [1, 15],
    "doi": "10.xxxx/xxxxx",
    "url": "https://arxiv.org/abs/xxxx",
    "abstract": "（L2 深度摘要，预处理层预填充）",
    "key_findings": ["..."],
    "l1_summary": "（L1 快速摘要）",
    "figures": ["figure_1_path"],
    "relevance_score": 0.92,
    "preliminary_cluster": "agent_architecture",
    "vector_chunk_ids": ["chunk_001", "chunk_002", "chunk_003"]
  }
]
```

**引用映射规则**：`[1]` → `literature_pool[0]`，`[7]` → `literature_pool[6]`。Analyst 校验和 Writer 撰写均遵循此规则。

---

## 五、执行流程

### Phase 0：计划生成

```
用户输入 → 调度层生成 TaskPlan → 展示给用户确认
                                         │
                              ┌───────────┴───────────┐
                              │ 用户确认 / 修改计划     │
                              └───────────┬───────────┘
                                          │
                                     开始执行
```

### Phase 0.5：文档预处理（预处理层）

```
用户上传的本地文件
    │
    ▼
step_0: 预处理层执行（纯工程，无 LLM 调用）
    · 文档解析 → 元数据提取 → 向量化索引
    · 自动摘要（L1+L2） → 质量评分 → 去重/粗聚类
    · 输出：literature_pool.json（预填充）+ vector_index/
    │
    ▼
⏸ 人机回环节点 1：展示文献列表（按 relevance_score 排序）
    · 用户可批量操作：
      - 删除明显不相关的文献
      - 标记"必读"文献（提升权重）
      - 补充遗漏的 PDF 或 URL
    · 确认后进入 Researcher 补充检索阶段
```

### Phase 1：文献补充与校验（Researcher）

并行执行两个子任务：

```
parallel_group "fetch":
├─ step_1a: Researcher 校验预处理结果
│   · 抽查 L2 摘要是否准确
│   · 补全 "pending" 字段（元数据缺失项）
│   · 输出 local_verified.json
│
└─ step_1b: Researcher 网络搜索补充
    · 基于用户主题 + 本地文献关键词搜索
    · Semantic Scholar API / arXiv API / Tavily
    · 新文献同样经过预处理层处理
    · 输出 web_entries.json

         │ 全部完成
         ▼
step_1_merge: 调度层合并 + 重排索引
    · 合并两个列表，按 relevance_score 降序排列
    · 重新分配连续 index (1, 2, 3, ...)
    · 更新向量索引
    · 自动校验：每篇文献必填字段是否完整
    · 输出 literature_pool.json
```

### Phase 2：主题聚类（Analyst）

```
literature_pool.json + vector_index → Analyst 分析
    · 输入：文献池元数据 + 预聚类标签，不加载全文
    · 在预处理粗聚类基础上精化
    · 按研究方向/方法论/时间线聚类
    · 识别研究脉络与空白
    · 输出 topics.json
         │
         ▼
交叉校验（分层检查）：
    · 调度层自动检查：literature_pool 中每篇文献是否都出现在 topics.json 中
    · Researcher 补充检查：是否有重要文献未被纳入任何主题
    · 通过 → 进入 Phase 3
    · 不通过 → 返回 Analyst 修正（最多 1 次重试）
    · 重试仍不通过 → 调度器标记风险，强制推进
```

### Phase 3：综述撰写（Writer）

```
literature_pool.json + topics.json + vector_index → Writer 撰写
    · 按主题分块，每轮通过向量检索 + 重排序加载当前主题下的 Top-K 相关段落
    · 按选定模板 (review_type) 组织综述结构
    · 每条引用必须对应 literature_pool 中的确切条目
    · 输出 draft.md（含 [1]-[n] 引用标记）
         │
         ▼
交叉校验（完整性检查）：
    · Analyst 检查：每段论述是否有文献支撑
    · Analyst 检查：引用标记格式是否正确（[n] 中的 n 在合法范围内）
    · 不检查引用内容精确性（留给 Phase 4）
    · 通过 → 进入 Phase 4
    · 不通过 → 返回 Writer 修正（最多 1 次重试）
```

### Phase 4：引用核对（Analyst）

```
draft.md + literature_pool.json + vector_index → Analyst 逐条精查
    · 每个 [n] 是否真实对应 literature_pool 第 n-1 项
    · 通过向量检索加载引用涉及的原文段落，核对内容一致性
    · 输出 citation_report.json
         │
         ▼
⏸ 人机回环节点 2：展示引用已锁定的初稿，用户确认结构与内容方向
    · 此时引用准确性已由 Analyst 保障
    · 用户只需确认主题结构和叙述逻辑
    · 可提出修改意见后再进入终稿
```

### Phase 5：终稿生成（Writer）

```
draft.md + citation_report.json + 用户修改意见 → Writer 整合

    调度层判断用户修改类型：
    │
    ├── 小修改（措辞调整、段落重排）
    │      │
    │      ▼
    │   Writer 直接吸收修改，生成终稿
    │
    └── 大修改（新增论点、结构调整）
           │
           ▼
        step_3_retry: 回流到 Phase 3
           · Researcher 补充检索新增论点所需的文献
           · Writer 重写受影响的段落
           · Analyst 重新校验引用
           · 重新进入人机回环节点 2
           │
           ▼
        确认后进入终稿

终稿输出：
    · 修正引用错误
    · 补充缺失引用
    · 生成 references.bib
    · 输出 final_review.md
```

> **V1.1 特性**：MVP 阶段仅支持小修改直接吸收。大修改回流路径在 V1.1 实现。

---

## 六、引用防幻觉机制

这是本框架的核心约束，贯穿所有 Agent。

### 约束规则

| 阶段 | 规则 | 实现方式 |
|------|------|---------|
| 预处理层 | 每篇文献保留原始出处 | LiteratureEntry 强制包含 URL/DOI/页码 |
| Researcher | 校验预处理结果的准确性 | 抽查摘要、补全缺失字段 |
| Writer | 只能引用 literature_pool 中的条目 | System Prompt 约束 + 输出格式校验 |
| Analyst (Phase 3) | 检查引用完整性 | 每段论述是否有文献支撑、标记格式是否正确 |
| Analyst (Phase 4) | 检查引用精确性 | [n] 是否与文献池第 n-1 项完全对应、内容是否与原文一致 |

### Writer 的 System Prompt 约束

```
你只能使用工作区中 literature_pool.json 提供的文献。
禁止引用任何外部知识或训练数据中的论文。
每条引用必须对应 JSON 数组中的确切索引位置：[1] 对应数组第 0 项，[2] 对应第 1 项，依此类推。
如果文献池中没有足够支撑某个论点的文献，明确标注"需补充检索"，不要编造引用。
```

### 输出格式校验

Writer 输出的 draft.md 必须通过正则校验：

- 所有 `[n]` 中的 n 必须在 `1` 到 `len(literature_pool)` 之间
- 不能出现未在 literature_pool 中登记的文献信息

---

## 七、上下文窗口管理与检索策略

预处理层通过预计算解决上下文瓶颈。各阶段 Agent 只接触必要的数据子集。

### 检索策略（三级递进）

基础向量检索准确率约 60%-70%，通过以下策略可提升到 90%+：

| 优先级 | 策略 | 作用 | 实现成本 |
|--------|------|------|----------|
| P0 | 重排序（Rerank） | 向量检索召回 4 倍候选，交叉编码器精排取 Top-K | 低（本地开源模型） |
| P1 | 混合检索 | 向量相似度 + BM25 关键词匹配同时检索，合并结果 | 中 |
| P2 | 查询扩展 | 用 LLM 把主题关键词扩展成更详细的检索查询 | 低（1 次额外 API 调用） |
| P3 | Parent-Child 分块 | 小块用于检索，大块用于生成 | 中 |

重排序模型支持本地和 API 两种模式（见第十三节配置）：
- **本地模式**：用户自行下载模型后填写本地路径，支持 HuggingFace Cross-Encoder 格式（如 `cross-encoder/ms-marco-MiniLM-L-6-v2` 或 `BAAI/bge-reranker-v2-m3`）。模型目录需包含 `config.json`、`pytorch_model.bin` 或 `model.safetensors`
- **API 模式**：Cohere Rerank API 或兼容接口，适合无 GPU 环境

**P0 重排序（必做）**：

Writer 在撰写"主题 X"时：

1. 从 `topics.json` 获取主题 X 的关键词
2. 向量检索召回 4 倍候选（如 Top-20）
3. 用交叉编码器对候选精排
4. 取 Top-5 最相关段落塞进上下文

```python
from sentence_transformers import CrossEncoder

reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

def search_with_rerank(query, collection, top_k=5):
    candidates = collection.query(query_texts=[query], n_results=top_k * 4)
    docs = candidates["documents"][0]
    pairs = [[query, doc] for doc in docs]
    scores = reranker.predict(pairs)
    reranked = sorted(zip(docs, scores), key=lambda x: x[1], reverse=True)
    return [doc for doc, score in reranked[:top_k]]
```

**P1 混合检索（文献量 >50 篇时启用）**：

向量相似度 + BM25 关键词匹配同时检索，合并结果。解决纯向量检索对专业术语匹配不足的问题。

### 各阶段数据加载

| 阶段 | 输入数据 | 加载方式 |
|------|---------|---------|
| Analyst 聚类 | literature_pool | 只加载元数据（标题 + 摘要 + 关键发现 + 预聚类标签），不加载全文 |
| Writer 撰写 | literature_pool + topics + vector_index | 按主题向量检索 + 重排序，加载 Top-K 相关段落 |
| Analyst 引用核对 | draft.md + literature_pool + vector_index | 按段落向量检索，只加载待校验引用涉及的原文片段 |

### Token 预算监控

两级约束，由 `constraints` 字段控制：

- **`max_total_tokens`（50000）**：任务总预算，调度层累计所有步骤的 Token 消耗，达到 80% 时提前进入收尾流程
- **`max_step_tokens`（8000）**：单步上下文上限，调度层在每轮 LLM 调用前估算输入 Token 数，超出时自动将当前主题拆分为子块

---

## 八、Agent 角色定义

### Researcher（研究员）

**职责**：校验预处理结果、补充网络检索、精化元数据

**System Prompt 要点**：
- 你是学术文献研究员，专注于校验和补充，而非从零阅读
- 校验预处理层的 L2 摘要是否准确反映了原文核心内容
- 网络搜索时使用学术 API，优先获取同行评审文献
- 补全预处理层标记为 "pending" 的元数据字段
- 无法确定的信息保留 `"pending"`，不要猜测

**可用工具**：web_search, image_reader

### Analyst（分析师）

**职责**：主题聚类、逻辑校验、引用核对

**System Prompt 要点**：
- 你是学术分析师，专注于发现模式、检测矛盾、验证准确性
- 聚类时在预处理粗聚类基础上精化，以研究方法和核心发现为依据
- Phase 3 校验：检查引用完整性（每段是否有文献支撑、标记格式是否正确）
- Phase 4 校验：检查引用精确性（[n] 是否与文献池第 n-1 项完全对应、内容是否与原文一致）
- 发现问题时指出具体位置和原因，不要笼统批评

**可用工具**：vector_search（Phase 4 引用核对时按需检索原文段落）

### Writer（写作者）

**职责**：结构化撰写、引用管理、格式输出

**System Prompt 要点**：
- 你是学术综述写作者，擅长将分散的文献组织成连贯的叙述
- 严格遵守引用防幻觉约束（见第六节）
- 按选定模板 (review_type) 组织综述结构
- 通过向量检索获取当前主题的相关文献段落，不加载全部文献
- 每个主题段落必须有文献支撑，无支撑的论点标注待补充
- 输出格式：Markdown，引用使用 [n] 数字标记

**可用工具**：markdown_writer, vector_search, chart_generator

---

## 九、交叉校验机制

### 校验流程

```
Agent X 完成子任务
       │
       ▼
调度层选择校验 Agent Y（与 X 不同）
       │
       ▼
Y 读取工作区中的输出文件 + 输入文件（通过向量检索按需加载）
       │
       ▼
Y 生成校验报告：{pass: bool, issues: [...]}
       │
       ├── pass = true → 进入下一步
       │
       └── pass = false
              │
              ├── retry_count < max_retry
              │      │
              │      ▼
              │   返回 X 修改 → 重新校验
              │
              └── retry_count >= max_retry
                     │
                     ▼
                  调度器介入：标记风险 + 强制合并或降级输出
```

### 校验层级

| 校验类型 | 执行者 | 检查内容 | 触发时机 |
|---------|--------|---------|---------|
| 完整性校验 | 调度层自动 | 文献池每篇文献是否都被纳入 topics.json | Phase 2 |
| 缺失检查 | Researcher | 是否有重要文献未被纳入任何主题 | Phase 2 |
| 引用完整性 | Analyst | 每段论述是否有文献支撑、标记格式是否正确 | Phase 3 |
| 引用精确性 | Analyst | [n] 是否与文献池第 n-1 项完全对应、内容是否一致 | Phase 4 |

### 校验 Prompt 模板

**Phase 3 校验（完整性）**：

```
请检查以下综述初稿：
1. 每个主题段落是否有至少一条文献引用支撑？
2. 所有 [n] 标记中的 n 是否在合法范围内（1 到 {pool_size}）？
3. 是否有明显缺失的论述（如提出论点但无文献支持）？

输出格式：
{
  "pass": true/false,
  "issues": [
    {"location": "第X段", "problem": "...", "suggestion": "..."}
  ],
  "severity": "low/medium/high"
}
```

**Phase 4 校验（精确性）**：

```
请逐条核对以下综述中的引用：

对每个 [n]：
1. literature_pool.json 中第 {n-1} 项的标题是否与引用上下文一致？
2. 通过向量检索获取该文献的原文段落，引用中的观点是否与原文一致？
3. 是否存在张冠李戴（将 A 文献的观点归到 B 文献）？

输出格式：
{
  "pass": true/false,
  "issues": [
    {"citation": "[n]", "problem": "...", "expected": "...", "actual": "..."}
  ],
  "severity": "low/medium/high"
}
```

---

## 十、状态持久化与断点续作

### 持久化内容

调度层在每步执行完成后写入 state.json：

```json
{
  "plan_version": "1.0",
  "current_step": "step_3",
  "completed_steps": ["step_0", "step_1a", "step_1b", "step_1_merge", "step_2"],
  "retry_counts": {"step_3": 0},
  "workspace_files": {
    "literature_pool.json": "sha256:abcdef1234567890...",
    "topics.json": "sha256:fedcba0987654321..."
  },
  "vector_index_hash": "sha256:1122334455667788...",
  "timestamp": "2026-05-05T10:30:00"
}
```

### hash 算法

`workspace_files` 和 `vector_index_hash` 中的 hash 值使用 **SHA-256** 对文件内容计算。断点恢复时重新计算当前文件的 hash，与 state.json 中记录的 hash 比对：

- 一致 → 文件未被篡改，可安全恢复
- 不一致 → 文件已被修改，提示用户确认是否从头执行

### 断点恢复

```bash
# 首次执行
pca run --topic "LLM Agent 综述" --files paper1.pdf paper2.pdf

# 中断后恢复
pca run --resume ./workspace/

# 恢复流程：
# 1. 读取 state.json
# 2. 重新计算 workspace_files 和 vector_index 的 SHA-256
# 3. 与记录的 hash 比对，确认文件完整性
# 4. 跳过 completed_steps 中的步骤
# 5. 从 current_step 继续执行
```

---

## 十一、人机回环节点

| 节点 | 暂停时机 | 展示内容 | 用户操作 |
|------|---------|---------|---------|
| 确认计划 | Phase 0 结束 | TaskPlan 全文 + 推荐模板 | 确认 / 修改步骤 / 切换模板 |
| 筛选文献 | Phase 0.5 结束 | literature_pool.json 表格视图（按 relevance_score 排序） | 批量删除 / 标记必读 / 补充遗漏 |
| 确认方向 | Phase 4 结束 | 引用已锁定的初稿（结构 + 叙述逻辑） | 提修改意见 / 确认进入终稿 |

---

## 十二、MVP 实现路径

CLI 先行，Web UI 后续跟进。

### Week 1：CLI 骨架

- CLI 入口（`pca run`）
- 配置系统：config.yaml 加载、环境变量引用、首次运行交互式引导、字段校验
- 调度层：TaskPlan 生成 + 顺序执行
- 共享工作区：本地 JSON 文件读写

### Week 2：预处理层 + Researcher

- 预处理层：PDF 解析（PyMuPDF）+ 元数据提取 + 文本分块 + 向量化索引（Chroma + 嵌入模型）
- Researcher Agent：预处理结果校验 + 网络补充检索
- Provider 抽象层：OpenAI / Anthropic / Ollama 统一接口

### Week 3：Agent 协作 + 引用溯源

- Analyst + Writer Agent
- 中转通信 + 交叉校验（1 轮重试）
- 引用溯源锁（有序数组 + index 映射）
- P0 重排序（本地或 API，由配置决定）

### Week 4：增强 + 人机回环

- 自动摘要（L1+L2）+ 质量评分 + 去重粗聚类
- 并行执行（parallel_group 调度）
- 状态持久化（断点续作 `--resume`，SHA-256 校验）
- 人机回环 CLI 版（3 个确认节点，终端交互）
- P1 混合检索（BM25 + 向量）

### Week 5-6：Web UI

- Web UI 框架选型（Streamlit 或 Gradio 快速搭建）
- 配置页面：可视化填写/编辑 config.yaml
- 文献管理：文件上传、列表展示、批量操作
- 执行监控：TaskPlan 可视化、实时日志、状态追踪
- 人机回环 Web 版：计划确认、初稿预览、修改意见提交
- 终稿页面：Markdown 渲染预览、引用列表、导出下载

---

## 十三、配置文件（config.yaml）

所有 API 端点、模型参数、运行时行为统一在 `config.yaml` 中管理。分为核心必填和可选两层，可选字段有合理默认值，不填也能跑。CLI 通过 `--config path/to/config.yaml` 指定，未指定时读取 `~/.pca/config.yaml`。

```yaml
# ============================================================
# CiteForge 配置文件
# ============================================================
# 核心字段：必须填写，否则无法启动
# 可选字段：有默认值，不填也能跑，填了则覆盖

# ---------- LLM（主推理模型）[核心] ----------
llm:
  provider: ""                    # openai | anthropic | ollama
  base_url: ""                    # API 端点地址
  api_key: ""                     # API Key，支持环境变量引用: "${PCA_LLM_API_KEY}"
  model: ""                       # 模型名称
  temperature: 0.3                # 可选，默认 0.3
  max_tokens: 4096                # 可选，默认 4096
  timeout: 120                    # 可选，默认 120 秒
  retry:                          # 可选，API 调用失败重试策略
    max_attempts: 3               # 最大重试次数，默认 3
    backoff: "exponential"        # fixed | exponential，默认 exponential
    initial_delay: 1.0            # 初始延迟（秒），默认 1.0
    max_delay: 30.0               # 最大延迟（秒），默认 30.0

# ---------- LLM（轻量模型）[可选] ----------
# 不填则复用 llm 配置（不区分轻重模型）
llm_lite:
  provider: ""
  base_url: ""
  api_key: ""                     # 支持: "${PCA_LLM_LITE_API_KEY}"
  model: ""
  temperature: 0.3
  max_tokens: 1024
  timeout: 60
  retry:
    max_attempts: 3
    backoff: "exponential"
    initial_delay: 1.0
    max_delay: 30.0

# ---------- 嵌入模型（Embedding）[核心] ----------
embedding:
  mode: ""                        # local | api
  # --- api 模式 ---
  api_base_url: ""
  api_key: ""                     # 支持: "${PCA_EMBEDDING_API_KEY}"
  api_model: ""
  # --- local 模式（填写本地模型目录的绝对路径）---
  local_model: ""                 # 如: /home/user/models/bge-small-en
  local_device: ""                # cpu | cuda | mps
  # --- 通用 ---
  dimensions:                     # 向量维度，需与模型匹配
  batch_size: 64                  # 可选，默认 64
  mrl_enabled: false              # 可选，是否启用 MRL（Matryoshka），默认 false
  mrl_dimensions: []              # 可选，MRL 可用维度列表，如 [256, 512, 1024]

# ---------- 重排序模型（Reranker）[可选] ----------
# 不填则禁用重排序（向量检索后直接取 Top-K）
reranker:
  mode: ""                        # local | api
  # --- local 模式 ---
  # 支持 HuggingFace Cross-Encoder 格式
  # 模型目录需包含: config.json, pytorch_model.bin 或 model.safetensors
  local_model: ""                 # 如: /home/user/models/ms-marco-MiniLM-L-6-v2
  local_device: ""                # cpu | cuda | mps
  # --- api 模式 ---
  api_provider: ""                # cohere | custom
  api_base_url: ""
  api_key: ""                     # 支持: "${PCA_RERANKER_API_KEY}"
  api_model: ""
  # --- 通用 ---
  top_k: 5                        # 可选，默认 5
  recall_multiplier: 4            # 可选，默认 4

# ---------- 向量数据库 [可选] ----------
vector_db:
  engine: "chroma"                # 可选，默认 chroma | milvus_lite | faiss
  persist_dir: "./workspace/vector_index"  # 可选
  collection_name: "papers"       # 可选

# ---------- 网络搜索 [可选] ----------
# 不填则禁用网络搜索（只处理本地文件）
search:
  provider: ""                    # semantic_scholar | arxiv | tavily | serpapi
  api_key: ""                     # 支持: "${PCA_SEARCH_API_KEY}"
  base_url: ""                    # 搜索 API 端点
  max_results: 15                 # 可选，默认 15

# ---------- 文档解析 [可选] ----------
parser:
  pdf_engine: "pymupdf"           # 可选，默认 pymupdf | pdfplumber
  chunk_size: 512                 # 可选，默认 512
  chunk_overlap: 50               # 可选，默认 50
  extract_images: true            # 可选，默认 true
  image_dir: "./workspace/images" # 可选

# ---------- 调度层 [可选] ----------
orchestrator:
  max_retry: 1                    # 可选，默认 1
  max_total_tokens: 50000         # 可选，默认 50000
  max_step_tokens: 8000           # 可选，默认 8000
  consensus_threshold: 0.67       # 可选，默认 0.67

# ---------- 状态持久化 [可选] ----------
persistence:
  state_file: "./workspace/state.json"  # 可选
  hash_algorithm: "sha256"              # 可选

# ---------- 日志 [可选] ----------
logging:
  level: "INFO"                   # 可选，默认 INFO
  file: "./workspace/pca.log"     # 可选
```

### 配置校验

启动时对 config.yaml 做完整性校验：

1. **核心字段检查**：`llm`、`embedding` 下的核心字段不可为空，空则报错并列出缺失字段
2. **模式检查**：`embedding.mode` 和 `reranker.mode` 为 `local` 时，对应 `local_model` 路径必须存在且包含必要文件；为 `api` 时，`base_url` 和 `api_key` 必须填写
3. **类型检查**：数值字段不可填入字符串，布尔字段不可填入非 true/false 值
4. **首次运行引导**：若 `~/.pca/config.yaml` 不存在，CLI 以交互式问答引导用户填写核心字段，可选字段使用默认值，完成后自动生成配置文件

### API Key 安全

- `api_key` 字段支持环境变量引用：`api_key: "${PCA_LLM_API_KEY}"`
- config.yaml 应加入 `.gitignore`
