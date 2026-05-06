"""Draft preview and export page."""
from pathlib import Path

import streamlit as st

WORKSPACE_DIR = Path.home() / ".pca" / "workspace"
DRAFT_PATH = WORKSPACE_DIR / "draft.md"


def render() -> None:
    st.header("📝 终稿预览与导出")

    if DRAFT_PATH.exists():
        content = DRAFT_PATH.read_text(encoding="utf-8")

        tab_preview, tab_markdown = st.tabs(["预览", "原始 Markdown"])

        with tab_preview:
            st.markdown(content)

        with tab_markdown:
            st.code(content, language="markdown")

        col1, col2 = st.columns(2)
        with col1:
            if st.button("📥 下载 Markdown"):
                st.download_button(
                    "下载 draft.md",
                    data=content.encode("utf-8"),
                    file_name="literature_review.md",
                    mime="text/markdown",
                )
        with col2:
            if st.button("📦 导出 BibTeX"):
                st.info("BibTeX 导出功能即将实现")

        st.divider()
        st.subheader("引用检查")
        import re
        citations = re.findall(r"\[(\d+(?:-\d+)?)\]", content)
        pool_path = WORKSPACE_DIR / "literature_pool.json"
        if pool_path.exists():
            import json
            with open(pool_path) as f:
                pool = json.load(f)
            entries = pool if isinstance(pool, list) else pool.get("entries", [])
            pool_size = len(entries)
            invalid = []
            for c in citations:
                if "-" in c:
                    parts = c.split("-")
                    try:
                        for idx in range(int(parts[0]), int(parts[1]) + 1):
                            if idx < 1 or idx > pool_size:
                                invalid.append(c)
                                break
                    except ValueError:
                        invalid.append(c)
                else:
                    try:
                        idx = int(c)
                        if idx < 1 or idx > pool_size:
                            invalid.append(c)
                    except ValueError:
                        invalid.append(c)
            if invalid:
                st.error(f"发现 {len(invalid)} 个无效引用: {set(invalid)}")
            else:
                st.success(f"所有 {len(citations)} 个引用均有效")
        else:
            st.warning("文献池不存在，无法验证引用")
    else:
        st.info("draft.md 尚不存在，请在执行监控页面运行生成流程")