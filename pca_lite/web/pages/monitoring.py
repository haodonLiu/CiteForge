"""Execution monitoring page."""
import json
from pathlib import Path

import streamlit as st

WORKSPACE_DIR = Path.home() / ".pca" / "workspace"


def render() -> None:
    st.header("🚀 执行监控")

    state_path = WORKSPACE_DIR / "state.json"

    st.info("请使用 CLI 执行: `python -m pca_lite run -t 'topic' --files file.pdf`")

    if state_path.exists():
        with open(state_path) as f:
            state = json.load(f)

        st.subheader("当前状态")
        cols = st.columns(3)
        cols[0].metric("当前步骤", state.get("current_step", "—"))
        cols[1].metric("已完成", len(state.get("completed_steps", [])))
        ts = state.get("timestamp", "—")
        ts_str = str(ts)[:19] if ts else "—"
        cols[2].metric("时间戳", ts_str)

        st.subheader("已完成步骤")
        for step_id in state.get("completed_steps", []):
            st.success(f"✓ {step_id}")

        retry = state.get("retry_counts", {})
        if retry:
            st.subheader("重试计数")
            for step_id, count in retry.items():
                st.warning(f"{step_id}: {count} 次重试")

        st.subheader("workspace 文件")
        files = state.get("workspace_files", {})
        for fname, fhash in files.items():
            fhash_str = str(fhash)[:16] if fhash else "—"
            st.text(f"{fname}: {fhash_str}...")
    else:
        st.info("工作区尚未初始化，请先创建配置并上传文献")