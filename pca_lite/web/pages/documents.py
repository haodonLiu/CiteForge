"""Document management page."""
import json
from pathlib import Path

import streamlit as st

from pca_lite.core.consts import DIR_RAW_PDFS, FILE_LITERATURE_POOL
from pca_lite.web.i18n import T
from pca_lite.web.components import WORKSPACE_DIR


def render() -> None:
    st.header(f"📄 {T('documents.title')}")

    tab_upload, tab_list = st.tabs([T("documents.tab_upload"), T("documents.tab_list")])

    with tab_upload:
        st.info(T("documents.upload_hint"))
        uploaded = st.file_uploader(
            T("documents.upload_title"),
            type=["pdf"],
            accept_multiple_files=True,
        )
        if uploaded:
            WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)
            raw_dir = WORKSPACE_DIR / DIR_RAW_PDFS
            raw_dir.mkdir(exist_ok=True)
            for f in uploaded:
                dest = raw_dir / f.name
                dest.write_bytes(f.getvalue())
                st.success(f"✓ {f.name}")
            st.info(f"{T('documents.pool_count', n=len(uploaded))}")

        st.divider()
        topic = st.text_input(
            T("documents.topic_label"),
            placeholder=T("documents.topic_placeholder"),
        )
        keywords = st.text_area(
            T("documents.keywords_label"),
            placeholder=T("documents.keywords_placeholder"),
        )
        if st.button(f"🔍 {T('documents.search_button')}"):
            st.info("搜索功能需要 Semantic Scholar API key，请在配置页面填写。")

        if topic:
            st.session_state["execution_topic"] = topic

    with tab_list:
        pool_path = WORKSPACE_DIR / FILE_LITERATURE_POOL
        if pool_path.exists():
            with open(pool_path, encoding="utf-8") as f:
                data = json.load(f)
            entries = data if isinstance(data, list) else data.get("entries", [])

            st.success(T("documents.pool_count", n=len(entries)))
            for entry in entries:
                _render_entry(entry)
        else:
            st.info(T("monitoring.not_initialized"))


def _render_entry(entry: dict) -> None:
    index = entry.get("index", "?")
    title = entry.get("title", "Unknown")[:60]
    year = entry.get("year", "—")
    source = entry.get("source", "—")
    has_abstract = bool(entry.get("abstract"))
    score = entry.get("relevance_score", 0.0)

    with st.expander(f"[{index}] {title}"):
        cols = st.columns([1, 1, 1, 1])
        cols[0].metric(T("documents.pool_entry_year"), year)
        cols[1].metric(T("documents.pool_entry_source"), source)
        cols[2].metric(
            T("documents.pool_entry_abstract"),
            "✓" if has_abstract else "✗",
        )
        cols[3].metric(T("documents.pool_entry_score"), f"{score:.2f}")
        if has_abstract:
            st.text(entry["abstract"][:200])
