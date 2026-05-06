"""Config page with language switch."""
import re
from pathlib import Path

import streamlit as st
import yaml

from pca_lite.web.i18n import T, get_locale, set_locale, SUPPORTED_LOCALES

CONFIG_DIR = Path.home() / ".pca"
CONFIG_PATH = CONFIG_DIR / "config.yaml"


def _load_config() -> dict:
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH, encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    return {}


def _save_config(config_data: dict) -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        yaml.dump(config_data, f, allow_unicode=True, default_flow_style=False)


def _mask_api_keys(raw: str) -> str:
    return re.sub(r"api_key: [^\n]+", "api_key: ****", raw)


def render() -> None:
    st.header(f"⚙️ {T('config.title')}")

    config_data = _load_config()

    # Language selector in sidebar
    current_locale = get_locale()
    new_locale = st.sidebar.selectbox(
        T("config.label_language"),
        SUPPORTED_LOCALES,
        index=SUPPORTED_LOCALES.index(current_locale),
        format_func=lambda x: T(f"config.lang_{x}"),
    )
    if new_locale != current_locale:
        set_locale(new_locale)
        st.rerun()

    # Pre-fill from existing config
    llm = config_data.get("llm", {})
    emb = config_data.get("embedding", {})
    search = config_data.get("search", {})

    with st.form("config_form"):
        st.subheader(T("config.section_llm"))
        provider = st.selectbox(
            T("config.label_provider"),
            ["openai", "anthropic", "ollama"],
            index=["openai", "anthropic", "ollama"].index(llm.get("provider", "openai"))
            if llm.get("provider") in ["openai", "anthropic", "ollama"]
            else 0,
        )
        base_url = st.text_input(T("config.label_api_base"), value=llm.get("base_url", ""))
        api_key = st.text_input(
            T("config.label_api_key"), value=llm.get("api_key", ""), type="password",
        )
        model = st.text_input(T("config.label_model"), value=llm.get("model", ""))

        st.subheader(T("config.section_embedding"))
        emb_mode = st.selectbox(
            T("config.label_embedding_mode"),
            ["api", "local"],
            index=0 if emb.get("mode") != "local" else 1,
        )
        emb_api_base = st.text_input(
            T("config.label_embedding_api_base"), value=emb.get("api_base_url", ""),
        )
        emb_api_key = st.text_input(
            T("config.label_embedding_api_key"), value=emb.get("api_key", ""), type="password",
        )
        emb_model = st.text_input(
            T("config.label_embedding_model"), value=emb.get("api_model", ""),
        )
        emb_local = st.text_input(
            T("config.label_embedding_local_path"), value=emb.get("local_model", ""),
        )

        st.subheader(T("config.section_search"))
        semantic_api_key = st.text_input(
            T("config.label_search_api_key"),
            value=search.get("semantic_scholar_api_key", "") or "",
            type="password",
        )

        st.divider()
        submitted = st.form_submit_button(T("config.btn_save"))

        if submitted:
            config_data["llm"] = {
                "provider": provider,
                "base_url": base_url,
                "api_key": api_key,
                "model": model,
            }
            config_data["embedding"] = {
                "mode": emb_mode,
                "api_base_url": emb_api_base,
                "api_key": emb_api_key,
                "api_model": emb_model,
                "local_model": emb_local,
            }
            config_data.setdefault("search", {})["semantic_scholar_api_key"] = semantic_api_key
            config_data.setdefault("ui", {})["locale"] = get_locale()
            _save_config(config_data)
            st.success(T("config.saved"))

    if CONFIG_PATH.exists():
        st.divider()
        st.subheader(T("config.display_title"))
        with open(CONFIG_PATH, encoding="utf-8") as f:
            raw = f.read()
        st.code(_mask_api_keys(raw), language="yaml")
