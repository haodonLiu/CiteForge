"""Home page."""
import streamlit as st

from citeforge.web.i18n import T


def render() -> None:
    st.header(f"📖 {T('home.welcome')}")

    st.subheader(T("home.workflow_title"))
    cols = st.columns(4)
    for i, col in enumerate(cols, 1):
        col.markdown(
            f"**{i}. {T(f'home.workflow_step{i}')}**",
            unsafe_allow_html=True,
        )

    st.divider()

    st.subheader(T("home.features_title"))
    feat_cols = st.columns(2)
    features = [
        ("home.feature_citation", "home.feature_citation_desc"),
        ("home.feature_resume", "home.feature_resume_desc"),
        ("home.feature_human", "home.feature_human_desc"),
        ("home.feature_parallel", "home.feature_parallel_desc"),
    ]
    for i, ((feat_key, desc_key), col) in enumerate(zip(features, feat_cols * 2)):
        col.markdown(f"**{T(feat_key)}**")
        col.caption(T(desc_key))

    st.divider()

    st.subheader(T("home.agent_title"))
    agent_cols = st.columns(3)
    agents = [
        ("home.agent_researcher", "home.agent_researcher_desc"),
        ("home.agent_analyst", "home.agent_analyst_desc"),
        ("home.agent_writer", "home.agent_writer_desc"),
    ]
    for (name_key, desc_key), col in zip(agents, agent_cols):
        col.markdown(f"**{T(name_key)}**")
        col.caption(T(desc_key))

    st.divider()

    st.subheader(T("home.quickstart"))
    for i in range(1, 5):
        st.markdown(f"{i}. {T(f'home.quickstart_step{i}')}")
