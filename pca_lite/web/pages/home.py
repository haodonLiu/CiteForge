"""Home page."""
import streamlit as st


def render() -> None:
    st.header("欢迎使用 PCA-Lite")
    st.markdown("""
    **PCA-Lite** 是一个基于多 Agent 协作的学术文献综述生成框架。

    ### 工作流程

    1. **配置** — 设置 LLM Provider 和 Embedding 模型
    2. **上传文献** — 上传 PDF 文件或输入搜索关键词
    3. **执行** — 启动多 Agent 协作流程（Researcher → Analyst → Writer）
    4. **预览** — 查看并导出最终综述

    ### 核心特性

    - **引用防幻觉** — 所有引用映射到 `literature_pool.json` 的 1-based index
    - **断点续作** — SHA-256 完整性校验，任意步骤可恢复
    - **人机回环** — 计划确认、初稿预览、终稿确认三处人工确认节点
    - **并行执行** — 支持 Agent 节点并行调度
    """)
    st.divider()

    col1, col2, col3 = st.columns(3)
    with col1:
        st.info("**Researcher Agent** — 校验 + 补充文献")
    with col2:
        st.info("**Analyst Agent** — 主题聚类 + 发现提取")
    with col3:
        st.info("**Writer Agent** — 综述撰写 + 引用溯源")

    st.divider()
    st.markdown("#### 快速开始")
    st.info("请使用左侧导航栏切换到相应页面")