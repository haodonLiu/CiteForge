"""CiteForge Web UI — Streamlit application."""
import sys
from pathlib import Path

import streamlit as st

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

st.set_page_config(
    page_title="CiteForge",
    page_icon="📚",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Apply monochrome theme
from citeforge.web.theme import THEME_CSS
st.markdown(THEME_CSS, unsafe_allow_html=True)

# i18n must be imported after theme so locale is initialized
from citeforge.web.i18n import T

st.title(f"📚 {T('app.title')}")
st.caption(T("app.tagline"))

NAV_PAGES = [
    ("home", "🏠"),
    ("config_page", "⚙️"),
    ("documents", "📄"),
    ("monitoring", "🚀"),
    ("preview", "📝"),
]

# Icons are locale-invariant — use them as stable keys
NAV_ICON_MAP = {icon: name for name, icon in NAV_PAGES}

st.sidebar.title("导航")
nav_icons = [icon for _, icon in NAV_PAGES]
labels = [T(f"nav.{name}") for name, _ in NAV_PAGES]

# Determine selected index — use session_state to survive reruns
if "nav_index" not in st.session_state:
    st.session_state.nav_index = 0

selected_icon = st.sidebar.radio("导航", nav_icons, index=st.session_state.nav_index)
selected_idx = nav_icons.index(selected_icon)
st.session_state.nav_index = selected_idx

module_name = NAV_ICON_MAP[nav_icons[selected_idx]]

PAGES = {
    "home": ("citeforge.web.pages", "home"),
    "config_page": ("citeforge.web.pages", "config_page"),
    "documents": ("citeforge.web.pages", "documents"),
    "monitoring": ("citeforge.web.pages", "monitoring"),
    "preview": ("citeforge.web.pages", "preview"),
}

# Display label alongside icon
st.sidebar.caption(labels[selected_idx])

if module_name in PAGES:
    module_path, name = PAGES[module_name]
    module = __import__(module_path, fromlist=[name])
    getattr(module, "render")()


if __name__ == "__main__":
    import subprocess

    subprocess.run(
        [sys.executable, "-m", "streamlit", "run", __file__, "--server.port", "8501"]
    )
