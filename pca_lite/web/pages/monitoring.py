"""Execution monitoring page with real pipeline trigger."""
import json
import threading
from pathlib import Path

import streamlit as st

from pca_lite.core.consts import FILE_DRAFT, FILE_LITERATURE_POOL, FILE_STATE
from pca_lite.core.exceptions import PipelineError
from pca_lite.web.i18n import T
from pca_lite.web.components import WORKSPACE_DIR, render_log_expander, render_state_metrics


def render() -> None:
    st.header(f"🚀 {T('monitoring.title')}")

    state_path = WORKSPACE_DIR / FILE_STATE
    pool_path = WORKSPACE_DIR / FILE_LITERATURE_POOL

    topic = st.session_state.get("execution_topic", "")
    selected_files = st.session_state.get("execution_files", [])

    if not topic:
        topic = st.text_input(
            T("monitoring.topic_label"),
            placeholder=T("monitoring.topic_placeholder"),
        )
        st.session_state["execution_topic"] = topic

    st.subheader(T("monitoring.control_title"))

    if "execution_active" not in st.session_state:
        st.session_state["execution_active"] = False
    if "execution_log" not in st.session_state:
        st.session_state["execution_log"] = []

    cols = st.columns([1, 1, 1])
    start_clicked = cols[0].button(
        f"▶ {T('monitoring.btn_start')}",
        disabled=st.session_state["execution_active"],
        use_container_width=True,
    )
    resume_clicked = cols[1].button(
        f"🔄 {T('monitoring.btn_resume')}",
        use_container_width=True,
    )
    stop_clicked = cols[2].button(
        f"⏹ {T('monitoring.btn_stop')}",
        disabled=not st.session_state["execution_active"],
        use_container_width=True,
    )

    if stop_clicked:
        st.session_state["execution_active"] = False
        st.session_state["execution_log"].append(
            {"phase": "user_stopped", "msg": T("monitoring.phase_user_stopped")}
        )

    if start_clicked and topic:
        st.session_state["execution_active"] = True
        st.session_state["execution_log"].append(
            {"phase": "started", "msg": f"{T('monitoring.phase_started')}: {topic}"}
        )

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
            except PipelineError as e:
                st.session_state["execution_log"].append({"phase": "error", "msg": str(e)})
                st.session_state["execution_active"] = False
                st.rerun()

        threading.Thread(target=run_in_thread, daemon=True).start()
        st.rerun()

    if resume_clicked and state_path.exists():
        st.info("恢复功能即将可用")

    log = st.session_state.get("execution_log", [])
    if log:
        st.subheader(T("monitoring.log_title"))
        render_log_expander(log, expanded=True)

    st.divider()
    st.subheader(T("monitoring.state_title"))

    if state_path.exists():
        with open(state_path, encoding="utf-8") as f:
            state = json.load(f)

        render_state_metrics(state)

        st.subheader(T("monitoring.completed_title"))
        for step_id in state.get("completed_steps", []):
            st.success(f"✓ {step_id}")

        retry = state.get("retry_counts", {})
        if retry:
            st.subheader(T("monitoring.retry_title"))
            for step_id, count in retry.items():
                st.warning(
                    T("monitoring.retry_format", step=step_id, count=count)
                )

        files = state.get("workspace_files", {})
        if files:
            st.subheader(T("monitoring.workspace_title"))
            for fname, fhash in files.items():
                short = str(fhash or "—")[:16] if fhash else "—"
                st.text(
                    T("monitoring.workspace_file_format", name=fname, hash=short)
                )

        if pool_path.exists():
            with open(pool_path, encoding="utf-8") as f:
                pool = json.load(f)
            entries = pool if isinstance(pool, list) else pool.get("entries", [])
            st.metric(T("monitoring.pool_size"), len(entries))
    else:
        st.info(T("monitoring.not_initialized"))

    st.divider()
    st.subheader(T("monitoring.actions_title"))
    c1, c2 = st.columns(2)
    if c1.button(T("monitoring.btn_view_draft")):
        draft = WORKSPACE_DIR / FILE_DRAFT
        if draft.exists():
            st.code(draft.read_text(encoding="utf-8")[:1000], language="markdown")
        else:
            st.info(T("monitoring.draft_not_exist"))
    if c2.button(T("monitoring.btn_view_pool")):
        if pool_path.exists():
            with open(pool_path, encoding="utf-8") as f:
                st.json(f)
        else:
            st.info(T("monitoring.pool_not_exist"))
