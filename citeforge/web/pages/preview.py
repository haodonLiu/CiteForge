"""Draft preview and export page."""
import re
from pathlib import Path

import streamlit as st

from citeforge.core.consts import FILE_DRAFT, FILE_LITERATURE_POOL
from citeforge.export.bibtex import export_literature_pool
from citeforge.web.i18n import T
from citeforge.web.components import WORKSPACE_DIR, render_citation_check


def render() -> None:
    st.header(f"📝 {T('preview.title')}")

    draft_path = WORKSPACE_DIR / FILE_DRAFT

    if draft_path.exists():
        content = draft_path.read_text(encoding="utf-8")

        tab_preview, tab_markdown = st.tabs(
            [T("preview.tab_preview"), T("preview.tab_markdown")]
        )

        with tab_preview:
            st.markdown(content)

        with tab_markdown:
            st.code(content, language="markdown")

        col1, col2 = st.columns(2)
        with col1:
            st.download_button(
                f"📥 {T('preview.download_md')}",
                data=content.encode("utf-8"),
                file_name="literature_review.md",
                mime="text/markdown",
            )
        with col2:
            pool_path = WORKSPACE_DIR / FILE_LITERATURE_POOL
            if st.button(f"📦 {T('preview.export_bibtex')}") and pool_path.exists():
                try:
                    bibtex = export_literature_pool(pool_path)
                    st.download_button(
                        "references.bib",
                        data=bibtex.encode("utf-8"),
                        file_name="references.bib",
                        mime="application/x-bibtex",
                    )
                except OSError as e:
                    st.error(f"{T('preview.bibtex_export_failed')}: {e}")

        st.divider()

        pool_path = WORKSPACE_DIR / FILE_LITERATURE_POOL
        if pool_path.exists():
            import json

            with open(pool_path, encoding="utf-8") as f:
                pool = json.load(f)
            entries = pool if isinstance(pool, list) else pool.get("entries", [])
            pool_size = len(entries)
            render_citation_check(content, pool_size)
        else:
            st.warning("文献池不存在，无法验证引用")
    else:
        st.info(T("monitoring.draft_not_exist"))
