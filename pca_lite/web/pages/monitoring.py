"""Execution monitoring page with real pipeline trigger."""
import json
from pathlib import Path

import streamlit as st


def render() -> None:
    st.header("🚀 执行监控")

    WORKSPACE_DIR = Path.home() / ".pca" / "workspace"
    state_path = WORKSPACE_DIR / "state.json"
    pool_path = WORKSPACE_DIR / "literature_pool.json"

    # Load topic from documents page session state
    topic = st.session_state.get("execution_topic", "")
    selected_files = st.session_state.get("execution_files", [])

    if not topic:
        topic = st.text_input("综述主题", placeholder="例如: LLM Agent 协作架构综述")
        st.session_state["execution_topic"] = topic

    st.subheader("执行控制")

    if "execution_active" not in st.session_state:
        st.session_state["execution_active"] = False
    if "execution_log" not in st.session_state:
        st.session_state["execution_log"] = []

    cols = st.columns([1, 1, 1])
    start_clicked = cols[0].button("▶️ 开始执行", disabled=st.session_state["execution_active"])
    resume_clicked = cols[1].button("🔄 恢复执行")
    stop_clicked = cols[2].button("⏹ 停止", disabled=not st.session_state["execution_active"])

    if stop_clicked:
        st.session_state["execution_active"] = False
        st.session_state["execution_log"].append({"phase": "user_stopped", "msg": "用户停止执行"})

    if start_clicked and topic:
        st.session_state["execution_active"] = True
        st.session_state["execution_log"].append({"phase": "started", "msg": f"开始执行: {topic}"})

        def callback(event: dict) -> None:
            st.session_state["execution_log"].append(event)
            if event.get("phase") in ("all_completed", "step_failed"):
                st.session_state["execution_active"] = False
            st.rerun()

        def run_in_thread() -> None:
            from pca_lite.web.execution import run_execution
            try:
                run_execution(
                    topic=topic,
                    files=selected_files,
                    workspace_dir=WORKSPACE_DIR,
                    callback=callback,
                )
            except Exception as e:
                st.session_state["execution_log"].append({"phase": "error", "msg": str(e)})
                st.session_state["execution_active"] = False
                st.rerun()

        import threading
        threading.Thread(target=run_in_thread, daemon=True).start()
        st.rerun()

    if resume_clicked and state_path.exists():
        st.info("恢复功能即将可用")

    # Execution log display
    log = st.session_state.get("execution_log", [])
    if log:
        st.subheader("执行日志")
        log_expander = st.expander("查看详细日志", expanded=True)
        with log_expander:
            for ev in log[-20:]:
                phase = ev.get("phase", "?")
                msg = ev.get("msg", str(ev))
                color = {
                    "started": "🟢",
                    "step_started": "🔵",
                    "step_completed": "✅",
                    "step_skipped": "⏭",
                    "step_failed": "❌",
                    "error": "🔴",
                    "user_stopped": "⏹",
                    "all_completed": "🏁",
                }.get(phase, "⚪")
                step = ev.get("step", "")
                log_msg = f"{color} [{phase}] {msg}" + (f" → {step}" if step else "")
                if phase == "step_failed":
                    log_expander.error(log_msg)
                elif phase == "all_completed":
                    log_expander.success(log_msg)
                else:
                    log_expander.text(log_msg)

    # State display
    st.divider()
    st.subheader("当前状态")

    if state_path.exists():
        with open(state_path) as f:
            state = json.load(f)

        col1, col2, col3 = st.columns(3)
        col1.metric("当前步骤", state.get("current_step", "—"))
        col2.metric("已完成", len(state.get("completed_steps", [])))
        ts = state.get("timestamp", "—")
        col3.metric("时间戳", str(ts)[:19] if ts else "—")

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
            st.text(f"{fname}: {str(fhash or '—')[:16]}...")

        if pool_path.exists():
            with open(pool_path) as f:
                pool = json.load(f)
            entries = pool if isinstance(pool, list) else pool.get("entries", [])
            st.metric("文献池大小", len(entries))
    else:
        st.info("工作区尚未初始化，请先配置并上传文献")

    st.divider()
    st.subheader("快捷操作")
    c1, c2 = st.columns(2)
    if c1.button("📂 查看 draft.md"):
        draft = WORKSPACE_DIR / "draft.md"
        if draft.exists():
            st.code(draft.read_text(encoding="utf-8")[:1000], language="markdown")
        else:
            st.info("draft.md 尚不存在")
    if c2.button("📊 查看 literature_pool.json"):
        if pool_path.exists():
            with open(pool_path) as f:
                st.json(f)
        else:
            st.info("文献池尚不存在")