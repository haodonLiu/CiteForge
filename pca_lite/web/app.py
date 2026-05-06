"""PCA-Lite Web UI — Streamlit application."""
import os
import sys
from pathlib import Path

import streamlit as st

st.set_page_config(
    page_title="PCA-Lite",
    page_icon="📚",
    layout="wide",
    initial_sidebar_state="expanded",
)

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

st.title("📚 PCA-Lite")
st.caption("多 Agent 协作文献综述框架")

st.sidebar.title("导航")
page = st.sidebar.radio(
    "选择页面",
    [
        "🏠 首页",
        "⚙️ 配置",
        "📄 文献管理",
        "🚀 执行监控",
        "📝 终稿预览",
    ],
)


if page == "🏠 首页":
    from pca_lite.web.pages import home

    home.render()

elif page == "⚙️ 配置":
    from pca_lite.web.pages import config_page

    config_page.render()

elif page == "📄 文献管理":
    from pca_lite.web.pages import documents

    documents.render()

elif page == "🚀 执行监控":
    from pca_lite.web.pages import monitoring

    monitoring.render()

elif page == "📝 终稿预览":
    from pca_lite.web.pages import preview

    preview.render()


if __name__ == "__main__":
    import subprocess
    import sys
    subprocess.run([sys.executable, "-m", "streamlit", "run", __file__, "--server.port", "8501"])