"""Internationalization (i18n) support for CiteForge Web UI.

Locale precedence:
1. ~/.pca/config.yaml  → ui.locale
2. PCA_UI_LOCALE env var
3. default "zh"
"""
import os
from pathlib import Path

import yaml

SUPPORTED_LOCALES = ("zh", "en")
DEFAULT_LOCALE = "zh"

_translations: dict[str, dict] = {}
_current_locale: str = DEFAULT_LOCALE


def _yaml_to_dict(data: dict) -> dict:
    """Flatten nested YAML dict into dot-notation keys."""
    result: dict = {}

    def _flatten(obj, prefix=""):
        if isinstance(obj, dict):
            for k, v in obj.items():
                _flatten(v, f"{prefix}{k}." if prefix else f"{k}.")
        elif isinstance(obj, list):
            result[prefix.rstrip(".")] = obj
        else:
            result[prefix.rstrip(".")] = obj

    _flatten(data)
    return result


# Load all locale files at import time
def _load_translations() -> None:
    global _translations
    _locales_dir = Path(__file__).parent / "locales"
    for _locale in SUPPORTED_LOCALES:
        _path = _locales_dir / f"{_locale}.yaml"
        if _path.exists():
            with open(_path, encoding="utf-8") as _f:
                _translations[_locale] = _yaml_to_dict(yaml.safe_load(_f) or {})


def _load_locale() -> str:
    """Determine current locale from config, env, or default."""
    cfg_path = Path.home() / ".pca" / "config.yaml"
    if cfg_path.exists():
        try:
            with open(cfg_path, encoding="utf-8") as f:
                cfg = yaml.safe_load(f) or {}
            locale = cfg.get("ui", {}).get("locale", "")
            if locale in SUPPORTED_LOCALES:
                return locale
        except Exception:
            pass

    env_locale = os.environ.get("PCA_UI_LOCALE", "")
    if env_locale in SUPPORTED_LOCALES:
        return env_locale

    return DEFAULT_LOCALE


def get_locale() -> str:
    """Return the currently active locale."""
    return _current_locale


def set_locale(locale: str) -> None:
    """Set the active locale (persisted to ~/.pca/config.yaml)."""
    global _current_locale
    if locale not in SUPPORTED_LOCALES:
        raise ValueError(f"Unsupported locale: {locale}. Supported: {SUPPORTED_LOCALES}")

    _current_locale = locale
    _persist_locale(locale)


def _persist_locale(locale: str) -> None:
    """Write locale preference to ~/.pca/config.yaml."""
    cfg_path = Path.home() / ".pca" / "config.yaml"
    cfg_path.parent.mkdir(parents=True, exist_ok=True)

    if cfg_path.exists():
        with open(cfg_path, encoding="utf-8") as f:
            cfg = yaml.safe_load(f) or {}
    else:
        cfg = {}

    if "ui" not in cfg:
        cfg["ui"] = {}
    cfg["ui"]["locale"] = locale

    with open(cfg_path, "w", encoding="utf-8") as f:
        yaml.dump(cfg, f, allow_unicode=True, default_flow_style=False)


def T(key: str, **kwargs) -> str:
    """Translate a dot-notation key.

    Args:
        key: Dot-notation key, e.g. "nav.home", "monitoring.btn_start"
        **kwargs: Format arguments for placeholders, e.g. n=5

    Returns:
        Translated string, or the key itself if not found.
    """
    locale = get_locale()
    translations = _translations.get(locale, {})
    text = translations.get(key, key)

    if kwargs:
        try:
            text = text.format(**kwargs)
        except (KeyError, ValueError):
            pass

    return text


# Initialize at import time
_load_translations()
_current_locale = _load_locale()
