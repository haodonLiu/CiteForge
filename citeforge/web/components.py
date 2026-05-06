"""Reusable UI components for CiteForge Web pages.

All components use the i18n T() function for text rendering.
Import this module in every page file.
"""
import json
import re
from pathlib import Path

import streamlit as st

from citeforge.core.consts import FILE_DRAFT, FILE_LITERATURE_POOL, FILE_STATE
from citeforge.web.i18n import T


# ── Workspace ────────────────────────────────────────────


WORKSPACE_DIR = Path.home() / ".pca" / "workspace"


# ── Log phase emoji map ──────────────────────────────────


_PHASE_EMOJI = {
    "started": "▶",
    "step_started": "▸",
    "step_completed": "✓",
    "step_skipped": "⏭",
    "step_failed": "✗",
    "error": "⚠",
    "user_stopped": "⏹",
    "all_completed": "■",
}


# ── Page structure ───────────────────────────────────────


def page_header(title_key: str, icon: str = "") -> None:
    """Render a page title with optional icon."""
    label = T(title_key)
    st.header(f"{icon} {label}" if icon else label)


# ── Buttons ──────────────────────────────────────────────


def button_row(*labels_disabled: tuple[str, bool]) -> list:
    """Render a row of buttons.

    Args:
        *labels_disabled: Tuples of (label_translation_key, disabled).

    Returns:
        List of button click results in order.
    """
    n = len(labels_disabled)
    cols = st.columns(n)
    results = []
    for i, (label_key, disabled) in enumerate(labels_disabled):
        clicked = cols[i].button(
            T(label_key),
            disabled=disabled,
            use_container_width=True,
        )
        results.append(clicked)
    return results


# ── Execution log ────────────────────────────────────────


def render_log_expander(log: list, expanded: bool = True) -> None:
    """Render execution log in an expander with phase-colored text."""
    if not log:
        return

    with st.expander(T("monitoring.log_expander"), expanded=expanded):
        for ev in log[-20:]:
            phase = ev.get("phase", "?")
            msg = ev.get("msg", str(ev))
            icon = _PHASE_EMOJI.get(phase, "○")
            step = ev.get("step", "")
            line = f"{icon} [{phase}] {msg}" + (f" → {step}" if step else "")

            if phase == "step_failed":
                st.error(line)
            elif phase == "all_completed":
                st.success(line)
            else:
                st.text(line)


# ── State display ────────────────────────────────────────


def render_state_metrics(state: dict) -> None:
    """Render 3-column metric cards for execution state."""
    col1, col2, col3 = st.columns(3)
    col1.metric(
        T("monitoring.state_current_step"),
        state.get("current_step", "—"),
    )
    col2.metric(
        T("monitoring.state_completed"),
        len(state.get("completed_steps", [])),
    )
    ts = state.get("timestamp", "—")
    col3.metric(
        T("monitoring.state_timestamp"),
        str(ts)[:19] if ts else "—",
    )


def render_completed_steps(step_ids: list[str]) -> None:
    """Render completed steps as a success list."""
    for step_id in step_ids:
        st.success(f"✓ {step_id}")


def render_retry_counts(retry: dict) -> None:
    """Render retry counts as warning messages."""
    if not retry:
        return
    st.subheader(T("monitoring.retry_title"))
    for step_id, count in retry.items():
        st.warning(T("monitoring.retry_format", step=step_id, count=count))


def render_workspace_files(files: dict) -> None:
    """Render workspace files with hash display."""
    if not files:
        return
    for fname, fhash in files.items():
        short = str(fhash or "—")[:16] if fhash else "—"
        st.text(T("monitoring.workspace_file_format", name=fname, hash=short))


# ── Literature pool ───────────────────────────────────────


def render_literature_pool(pool_path: Path) -> None:
    """Render literature pool from a JSON file."""
    if not pool_path.exists():
        st.info(T("documents.pool_empty"))
        return

    with open(pool_path, encoding="utf-8") as f:
        data = json.load(f)

    entries = data if isinstance(data, list) else data.get("entries", [])

    st.success(T("documents.pool_count", n=len(entries)))

    for entry in entries:
        render_entry_card(entry)


def render_entry_card(entry: dict) -> None:
    """Render a single literature entry as an expander card."""
    index = entry.get("index", "?")
    title = entry.get("title", "—")
    year = entry.get("year", "—")
    source = entry.get("source", "—")
    abstract = entry.get("abstract")
    score = entry.get("relevance_score", 0.0)
    status = entry.get("verification_status", "unknown")

    status_label = {
        "verified": T("documents.pool_entry_verified"),
        "pending": T("documents.pool_entry_pending"),
        "failed": T("documents.pool_entry_failed"),
    }.get(status, status)

    abstract_label = (
        T("documents.pool_entry_abstract_present")
        if abstract
        else T("documents.pool_entry_no_abstract")
    )

    with st.expander(f"[{index}] {title}", expanded=False):
        col1, col2 = st.columns(2)
        col1.text(T("documents.pool_entry_year") + f": {year}")
        col1.text(T("documents.pool_entry_source") + f": {source}")
        col2.text(T("documents.pool_entry_abstract") + f": {abstract_label}")
        col2.text(T("documents.pool_entry_score") + f": {score:.2f}")
        st.text(f"Status: {status_label}")


# ── File actions ─────────────────────────────────────────


def render_file_actions(ws_dir: Path) -> None:
    """Render draft.md and literature_pool.json quick-view buttons."""
    col1, col2 = st.columns(2)

    if col1.button(T("monitoring.btn_view_draft")):
        draft_path = ws_dir / FILE_DRAFT
        if draft_path.exists():
            st.code(draft_path.read_text(encoding="utf-8")[:1000], language="markdown")
        else:
            st.info(T("monitoring.draft_not_exist"))

    if col2.button(T("monitoring.btn_view_pool")):
        pool_path = ws_dir / FILE_LITERATURE_POOL
        if pool_path.exists():
            with open(pool_path, encoding="utf-8") as f:
                st.json(f)
        else:
            st.info(T("monitoring.pool_not_exist"))


# ── Citation check ───────────────────────────────────────


def render_citation_check(content: str, pool_size: int) -> None:
    """Check and display citation validity."""
    st.subheader(T("preview.citation_title"))

    citation_pattern = re.compile(r"\[(\d+(?:-\d+)?)\]")
    citations = citation_pattern.findall(content)
    invalid = []

    for c in citations:
        if "-" in c:
            parts = c.split("-")
            try:
                for idx in range(int(parts[0]), int(parts[1]) + 1):
                    if idx < 1 or idx > pool_size:
                        invalid.append(f"{idx}")
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
        st.error(T("preview.citation_invalid", n=len(set(invalid))))
    else:
        st.success(T("preview.citation_valid", n=len(citations)))
