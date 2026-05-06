"""Document management page."""
import json
from pathlib import Path

import streamlit as st

WORKSPACE_DIR = Path.home() / ".pca" / "workspace"


def render() -> None:
    st.header("📄 文献管理")

    tab_upload, tab_list = st.tabs(["上传 PDF", "文献列表"])

    with tab_upload:
        st.info("上传 PDF 文件到工作区")
        uploaded = st.file_uploader(
            "选择 PDF 文件", type=["pdf"], accept_multiple_files=True,
        )
        if uploaded:
            WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)
            raw_dir = WORKSPACE_DIR / "raw_pdfs"
            raw_dir.mkdir(exist_ok=True)
            for f in uploaded:
                dest = raw_dir / f.name
                dest.write_bytes(f.getvalue())
                st.success(f"已保存: {f.name}")
            st.info(f"共上传 {len(uploaded)} 个文件")

        st.divider()
        topic = st.text_input("综述主题", placeholder="例如: LLM Agent 协作架构综述")
        search_queries = st.text_area(
            "搜索关键词（每行一个）",
            placeholder="multi-agent LLM\nautonomous agents\nRAG systems",
        )
        if st.button("🔍 搜索补充文献"):
            st.info("搜索功能需要 Semantic Scholar API key，请在配置页面填写。")

    with tab_list:
        pool_path = WORKSPACE_DIR / "literature_pool.json"
        if pool_path.exists():
            with open(pool_path) as f:
                data = json.load(f)
            entries = data if isinstance(data, list) else data.get("entries", [])

            st.success(f"共 {len(entries)} 篇文献")
            for entry in entries:
                with st.expander(f"[{entry.get('index', '?')}] {entry.get('title', 'Unknown')[:60]}"):
                    cols = st.columns([1, 1, 1, 1])
                    cols[0].metric("年份", entry.get("year", "—"))
                    cols[1].metric("来源", entry.get("source", "—"))
                    cols[2].metric("摘要", "✓" if entry.get("abstract") else "✗")
                    cols[3].metric("评分", f"{entry.get('relevance_score', 0):.2f}")
                    if entry.get("abstract"):
                        st.text(entry["abstract"][:200])
        else:
            st.info("尚未生成文献池，请先在执行监控页面运行流程")