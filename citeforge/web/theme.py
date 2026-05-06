"""Monochrome black & white theme for CiteForge Web UI."""

THEME_CSS = """
<style>
/* ── CSS Variables ─────────────────────────────────── */
:root {
    --pca-bg: #ffffff;
    --pca-bg-alt: #f5f5f5;
    --pca-border: #d0d0d0;
    --pca-text: #1a1a1a;
    --pca-text-muted: #666666;
    --pca-accent: #333333;
    --pca-accent-hover: #000000;
    --pca-btn-bg: #ffffff;
    --pca-btn-border: #1a1a1a;
    --pca-btn-hover: #f0f0f0;
    --pca-sidebar-bg: #fafafa;
    --pca-metric-bg: #f5f5f5;
}

/* ── Dark mode (system preference) ────────────────── */
@media (prefers-color-scheme: dark) {
    :root {
        --pca-bg: #0d0d0d;
        --pca-bg-alt: #1a1a1a;
        --pca-border: #3a3a3a;
        --pca-text: #f0f0f0;
        --pca-text-muted: #999999;
        --pca-accent: #e0e0e0;
        --pca-accent-hover: #ffffff;
        --pca-btn-bg: #1a1a1a;
        --pca-btn-border: #e0e0e0;
        --pca-btn-hover: #2a2a2a;
        --pca-sidebar-bg: #111111;
        --pca-metric-bg: #1a1a1a;
    }
}

/* ── Base ───────────────────────────────────────────── */
.stApp {
    background-color: var(--pca-bg) !important;
    color: var(--pca-text) !important;
}

/* ── Sidebar ───────────────────────────────────────── */
section[data-testid="stSidebar"] {
    background-color: var(--pca-sidebar-bg) !important;
    border-right: 1px solid var(--pca-border);
}

/* ── Text ──────────────────────────────────────────── */
.stMarkdown, .stText, p, span, li, label {
    color: var(--pca-text) !important;
}

/* ── Headers ───────────────────────────────────────── */
h1, h2, h3, h4 {
    color: var(--pca-text) !important;
}

/* ── Dividers ──────────────────────────────────────── */
hr {
    border-color: var(--pca-border) !important;
}

/* ── Buttons ───────────────────────────────────────── */
.stButton > button {
    border: 1.5px solid var(--pca-btn-border) !important;
    background-color: var(--pca-btn-bg) !important;
    color: var(--pca-text) !important;
    font-weight: 500 !important;
    border-radius: 4px !important;
    transition: border-color 0.15s, background-color 0.15s !important;
}
.stButton > button:hover {
    border-color: var(--pca-accent-hover) !important;
    background-color: var(--pca-btn-hover) !important;
    color: var(--pca-text) !important;
}
.stButton > button:disabled {
    border-color: var(--pca-border) !important;
    color: var(--pca-text-muted) !important;
    opacity: 0.6 !important;
}

/* ── Download Button ───────────────────────────────── */
.stDownloadButton > button {
    border: 1.5px solid var(--pca-btn-border) !important;
    background-color: var(--pca-btn-bg) !important;
    color: var(--pca-text) !important;
    font-weight: 500 !important;
}
.stDownloadButton > button:hover {
    border-color: var(--pca-accent-hover) !important;
    background-color: var(--pca-btn-hover) !important;
}

/* ── Inputs / Text Areas ───────────────────────────── */
.stTextInput > div > div > input,
.stTextArea > div > div > textarea,
.stNumberInput > div > div > input,
.stSelectbox > div > div > div,
.stMultiselect > div > div {
    border: 1px solid var(--pca-border) !important;
    background-color: var(--pca-bg) !important;
    color: var(--pca-text) !important;
    border-radius: 4px !important;
}
.stTextInput > div > div > input:focus,
.stTextArea > div > div > textarea:focus {
    border-color: var(--pca-accent) !important;
    box-shadow: none !important;
}

/* ── Tabs ──────────────────────────────────────────── */
.stTabs [data-baseweb="tab-list"] {
    border-bottom: 1px solid var(--pca-border);
}
.stTabs [data-baseweb="tab"] {
    color: var(--pca-text-muted) !important;
    border-bottom: 2px solid transparent;
}
.stTabs [aria-selected="true"] {
    color: var(--pca-text) !important;
    border-bottom-color: var(--pca-accent) !important;
}

/* ── Expanders ─────────────────────────────────────── */
.streamlit-expander-header {
    border: 1px solid var(--pca-border) !important;
    border-radius: 4px !important;
    background-color: var(--pca-bg-alt) !important;
}
.streamlit-expander-content {
    border: 1px solid var(--pca-border) !important;
    border-top: none !important;
    border-radius: 0 0 4px 4px !important;
}

/* ── Metrics ───────────────────────────────────────── */
.stMetric {
    background-color: var(--pca-metric-bg) !important;
    border: 1px solid var(--pca-border) !important;
    border-radius: 4px !important;
    padding: 0.75rem !important;
}

/* ── Forms ─────────────────────────────────────────── */
.stForm {
    border: 1px solid var(--pca-border) !important;
    border-radius: 4px !important;
    padding: 1rem !important;
    background-color: var(--pca-bg-alt) !important;
}

/* ── Code blocks ───────────────────────────────────── */
.stCodeBlock {
    border: 1px solid var(--pca-border) !important;
    border-radius: 4px !important;
}

/* ── Success / Warning / Error ─────────────────────── */
.stSuccess {
    border-left: 3px solid #333333 !important;
    background-color: var(--pca-bg-alt) !important;
}
.stWarning {
    border-left: 3px solid #666666 !important;
    background-color: var(--pca-bg-alt) !important;
}
.stError {
    border-left: 3px solid #1a1a1a !important;
    background-color: var(--pca-bg-alt) !important;
}
.stInfo {
    border-left: 3px solid #999999 !important;
    background-color: var(--pca-bg-alt) !important;
}

/* ── Tables ────────────────────────────────────────── */
[data-testid="stTable"] {
    border: 1px solid var(--pca-border) !important;
    border-radius: 4px !important;
}

/* ── Progress bars ─────────────────────────────────── */
.stProgress > div > div > div > div {
    background-color: var(--pca-accent) !important;
}

/* ── Spinner ───────────────────────────────────────── */
.stSpinner > div {
    border-color: var(--pca-accent) !important;
}

/* ── Navigation radio (sidebar) ───────────────────── */
.stRadio > div {
    border: 1px solid var(--pca-border) !important;
    border-radius: 4px !important;
    padding: 0.5rem !important;
    background-color: var(--pca-bg-alt) !important;
}

/* ── Slider ─────────────────────────────────────────── */
.stSlider > div > div > div > div {
    background-color: var(--pca-border) !important;
}
.stSlider [data-testid="stThumbValue"] {
    color: var(--pca-text) !important;
}

/* ── Scrollbar ──────────────────────────────────────── */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
::-webkit-scrollbar-track {
    background: var(--pca-bg-alt) !important;
}
::-webkit-scrollbar-thumb {
    background: var(--pca-border) !important;
    border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
    background: var(--pca-text-muted) !important;
}
</style>
"""
