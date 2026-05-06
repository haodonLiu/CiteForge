"""Config page."""
import os
from pathlib import Path

import streamlit as st
import yaml

CONFIG_DIR = Path.home() / ".pca"
CONFIG_PATH = CONFIG_DIR / "config.yaml"


def render() -> None:
    st.header("⚙️ 配置")

    config_path = CONFIG_PATH
    if config_path.exists():
        with open(config_path) as f:
            existing = yaml.safe_load(f) or {}
    else:
        existing = {}

    with st.form("config_form"):
        st.subheader("LLM 配置")
        provider = st.selectbox(
            "Provider", ["openai", "anthropic", "ollama"],
            index=["openai", "anthropic", "ollama"].index(existing.get("llm", {}).get("provider", "openai"))
            if existing.get("llm", {}).get("provider") in ["openai", "anthropic", "ollama"] else 0,
        )
        base_url = st.text_input("API Base URL", value=existing.get("llm", {}).get("base_url", ""))
        api_key = st.text_input("API Key", value=existing.get("llm", {}).get("api_key", ""), type="password")
        model = st.text_input("Model Name", value=existing.get("llm", {}).get("model", ""))

        st.subheader("Embedding 配置")
        emb_mode = st.selectbox("Embedding Mode", ["api", "local"],
            index=0 if existing.get("embedding", {}).get("mode") != "local" else 1)
        emb_api_base = st.text_input("Embedding API Base URL",
            value=existing.get("embedding", {}).get("api_base_url", ""))
        emb_api_key = st.text_input("Embedding API Key", value=existing.get("embedding", {}).get("api_key", ""), type="password")
        emb_model = st.text_input("Embedding Model Name",
            value=existing.get("embedding", {}).get("api_model", ""))
        emb_local = st.text_input("Local Model Path",
            value=existing.get("embedding", {}).get("local_model", ""))

        st.subheader("搜索配置")
        semantic_api_key = st.text_input(
            "Semantic Scholar API Key (可选)",
            value=existing.get("search", {}).get("semantic_scholar_api_key", "") or "",
            type="password",
        )

        submitted = st.form_submit_button("💾 保存配置")
        if submitted:
            config_data = {
                "llm": {
                    "provider": provider,
                    "base_url": base_url,
                    "api_key": api_key,
                    "model": model,
                },
                "embedding": {
                    "mode": emb_mode,
                    "api_base_url": emb_api_base,
                    "api_key": emb_api_key,
                    "api_model": emb_model,
                    "local_model": emb_local,
                },
                "search": {
                    "semantic_scholar_api_key": semantic_api_key,
                },
            }
            CONFIG_DIR.mkdir(parents=True, exist_ok=True)
            with open(CONFIG_PATH, "w") as f:
                yaml.dump(config_data, f, allow_unicode=True, default_flow_style=False)
            st.success(f"配置已保存到 {CONFIG_PATH}")

    if config_path.exists():
        st.divider()
        st.subheader("当前配置")
        with open(config_path) as f:
            raw = f.read()
        masked = raw
        import re
        masked = re.sub(r"api_key: [^\n]+", "api_key: ****", masked)
        st.code(masked, language="yaml")