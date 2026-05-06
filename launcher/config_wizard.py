# CiteForge GUI Launcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a one-click Windows launcher that packages CiteForge into a standalone exe with GUI for project setup and config, then launches the Streamlit Web UI.

**Architecture:** Bootstrap script (start.bat) → venv setup → GUI launcher (ttkbootstrap) → Config wizard (first run) → Launch Streamlit Web UI in project folder.

**Tech Stack:** Python 3.10+, ttkbootstrap, PyInstaller, tkinter (built-in)

---

## File Structure

```
launcher/
├── __init__.py
├── config_wizard.py     # 4-step first-time config wizard
├── main_launcher.py     # Main GUI window (project/topic/files/launch)
├── requirements.txt    # ttkbootstrap
start.bat               # Bootstrap: check Python, venv, pip install
build.bat              # PyInstaller build command
citeforge.spec          # PyInstaller spec file
```

---

## Task 1: Create Launcher Directory and Dependencies

**Files:**
- Create: `launcher/__init__.py`
- Create: `launcher/requirements.txt`
- Modify: `pyproject.toml` (add launcher dependencies)

- [ ] **Step 1: Create launcher directory**

```bash
mkdir -p launcher
touch launcher/__init__.py
```

- [ ] **Step 2: Create launcher/requirements.txt**

```
ttkbootstrap>=1.10.0
```

- [ ] **Step 3: Add launcher deps to pyproject.toml**

Add to `[project.optional-dependencies]`:
```toml
[project.optional-dependencies]
launcher = [
    "ttkbootstrap>=1.10.0",
]
```

- [ ] **Step 4: Commit**

```bash
git add launcher/ pyproject.toml
git commit -m "feat: create launcher directory structure"
```

---

## Task 2: Create Config Wizard

**Files:**
- Create: `launcher/config_wizard.py`

- [ ] **Step 1: Write config_wizard.py**

```python
"""First-time configuration wizard for CiteForge."""
import tkinter as tk
from tkinter import ttk, messagebox
from pathlib import Path
import yaml

CONFIG_PATH = Path.home() / ".pca" / "config.yaml"


class ConfigWizard(tk.Toplevel):
    def __init__(self, parent):
        super().__init__(parent)
        self.title("CiteForge 首次配置向导")
        self.geometry("600x450")
        self.resizable(False, False)

        self.provider_var = tk.StringVar(value="openai")
        self.base_url_var = tk.StringVar(value="https://api.openai.com/v1")
        self.api_key_var = tk.StringVar()
        self.model_var = tk.StringVar(value="gpt-4o")
        self.emb_mode_var = tk.StringVar(value="api")
        self.emb_api_url_var = tk.StringVar()
        self.emb_api_key_var = tk.StringVar()
        self.emb_api_model_var = tk.StringVar()
        self.emb_local_model_var = tk.StringVar()

        self.current_step = 0
        self.steps = [self._step_llm_provider, self._step_llm_details,
                      self._step_embedding, self._step_confirm]
        self._show_step(0)

    def _show_step(self, step):
        for widget in self.winfo_children():
            widget.destroy()

        self.steps[step]()

    def _step_llm_provider(self):
        ttk.Label(self, text="步骤 1/4: LLM Provider",
                  font=("Segoe UI", 14, "bold")).pack(pady=20)
        ttk.Label(self, text="选择您使用的 LLM 服务提供商:",
                  font=("Segoe UI", 10)).pack(pady=10)

        for provider in ["openai", "anthropic", "ollama"]:
            ttk.Radiobutton(self, text=provider.upper(),
                           variable=self.provider_var,
                           value=provider,
                           width=20).pack(pady=5)

        ttk.Button(self, text="下一步", command=lambda: self._show_step(1)).pack(pady=20)

    def _step_llm_details(self):
        ttk.Label(self, text="步骤 2/4: LLM 配置",
                  font=("Segoe UI", 14, "bold")).pack(pady=20)

        frame = ttk.Frame(self)
        frame.pack(pady=10, padx=40, fill="x")

        ttk.Label(frame, text="API Endpoint:").grid(row=0, column=0, sticky="w", pady=5)
        ttk.Entry(frame, textvariable=self.base_url_var, width=50).grid(row=0, column=1, pady=5)

        ttk.Label(frame, text="API Key:").grid(row=1, column=0, sticky="w", pady=5)
        ttk.Entry(frame, textvariable=self.api_key_var, show="*", width=50).grid(row=1, column=1, pady=5)

        ttk.Label(frame, text="Model:").grid(row=2, column=0, sticky="w", pady=5)
        ttk.Entry(frame, textvariable=self.model_var, width=50).grid(row=2, column=1, pady=5)

        btn_frame = ttk.Frame(self)
        btn_frame.pack(pady=20)
        ttk.Button(btn_frame, text="上一步", command=lambda: self._show_step(0)).pack(side="left", padx=10)
        ttk.Button(btn_frame, text="下一步", command=lambda: self._show_step(2)).pack(side="left", padx=10)

    def _step_embedding(self):
        ttk.Label(self, text="步骤 3/4: 嵌入模型配置",
                  font=("Segoe UI", 14, "bold")).pack(pady=20)

        ttk.Radiobutton(self, text="API 模式 (OpenAI/Cohere 等)",
                       variable=self.emb_mode_var, value="api").pack(pady=5)
        ttk.Radiobutton(self, text="本地模式 (本地模型路径)",
                       variable=self.emb_mode_var, value="local").pack(pady=5)

        emb_frame = ttk.Frame(self)
        emb_frame.pack(pady=10, padx=40, fill="x")

        if self.emb_mode_var.get() == "api":
            ttk.Label(emb_frame, text="API URL:").grid(row=0, column=0, sticky="w", pady=5)
            ttk.Entry(emb_frame, textvariable=self.emb_api_url_var, width=40).grid(row=0, column=1, pady=5)
            ttk.Label(emb_frame, text="API Key:").grid(row=1, column=0, sticky="w", pady=5)
            ttk.Entry(emb_frame, textvariable=self.emb_api_key_var, show="*", width=40).grid(row=1, column=1, pady=5)
            ttk.Label(emb_frame, text="Model:").grid(row=2, column=0, sticky="w", pady=5)
            ttk.Entry(emb_frame, textvariable=self.emb_api_model_var, width=40).grid(row=2, column=1, pady=5)
        else:
            ttk.Label(emb_frame, text="本地模型路径:").grid(row=0, column=0, sticky="w", pady=5)
            ttk.Entry(emb_frame, textvariable=self.emb_local_model_var, width=40).grid(row=0, column=1, pady=5)

        btn_frame = ttk.Frame(self)
        btn_frame.pack(pady=20)
        ttk.Button(btn_frame, text="上一步", command=lambda: self._show_step(1)).pack(side="left", padx=10)
        ttk.Button(btn_frame, text="下一步", command=lambda: self._show_step(3)).pack(side="left", padx=10)

    def _step_confirm(self):
        ttk.Label(self, text="步骤 4/4: 确认配置",
                  font=("Segoe UI", 14, "bold")).pack(pady=20)

        summary = f"""LLM Provider: {self.provider_var.get()}
API Endpoint: {self.base_url_var.get()}
Model: {self.model_var.get()}
Embedding Mode: {self.emb_mode_var.get()}
"""
        ttk.Label(self, text=summary, justify="left", font=("Segoe UI", 10)).pack(pady=10)

        btn_frame = ttk.Frame(self)
        btn_frame.pack(pady=20)
        ttk.Button(btn_frame, text="上一步", command=lambda: self._show_step(2)).pack(side="left", padx=10)
        ttk.Button(btn_frame, text="保存", command=self._save_config).pack(side="left", padx=10)

    def _save_config(self):
        config = {
            "llm": {
                "provider": self.provider_var.get(),
                "base_url": self.base_url_var.get(),
                "api_key": self.api_key_var.get(),
                "model": self.model_var.get(),
                "temperature": 0.3,
                "max_tokens": 4096,
                "timeout": 120,
                "retry": {"max_attempts": 3, "backoff": "exponential",
                         "initial_delay": 1.0, "max_delay": 30.0}
            },
            "embedding": {
                "mode": self.emb_mode_var.get(),
                "api_base_url": self.emb_api_url_var.get(),
                "api_key": self.emb_api_key_var.get(),
                "api_model": self.emb_api_model_var.get(),
                "local_model": self.emb_local_model_var.get(),
                "local_device": "cpu",
                "batch_size": 64,
                "mrl_enabled": False,
                "mrl_dimensions": []
            },
            "vector_db": {"engine": "chroma", "persist_dir": "./workspace/vector_index"},
            "search": {"max_results": 15},
            "parser": {"pdf_engine": "pymupdf", "chunk_size": 512, "chunk_overlap": 50},
            "orchestrator": {"max_retry": 1, "max_total_tokens": 50000},
            "persistence": {"state_file": "./workspace/state.json"},
            "logging": {"level": "INFO", "file": "./workspace/pca.log"}
        }

        CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            yaml.dump(config, f, allow_unicode=True, default_flow_style=False)

        messagebox.showinfo("成功", f"配置已保存到 {CONFIG_PATH}")
        self.destroy()


def check_config_exists() -> bool:
    return CONFIG_PATH.exists()


def run_wizard():
    root = tk.Tk()
    root.withdraw()
    wizard = ConfigWizard(root)
    wizard.grab_set()
    root.wait_window()