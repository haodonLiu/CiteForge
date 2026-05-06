# PCA-Lite GUI Launcher Design

**Date:** 2026-05-06
**Status:** Approved

## Overview

Create a single-click launcher that packages PCA-Lite into a standalone Windows exe. The launcher provides a GUI for project setup and config, then launches the Streamlit Web UI.

## Components

### 1. Start Script (`start.bat`)

- Checks Python 3.10+ availability
- Creates/activates `.venv` if not present
- Installs dependencies: `pip install -e .`
- Launches GUI launcher

### 2. GUI Launcher (`launcher/main_launcher.py`)

**Framework:** Custom tkinter + ttkbootstrap (modern Windows 11 style)

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│  📁 项目文件夹   [Browse] [New Folder]               │
│                                                      │
│  📝 Review Topic    [____________________________]  │
│                                                      │
│  📄 PDF Files   [Add Files] [Clear]                 │
│                 (Selected: file1.pdf, ... )          │
│                                                      │
│  ⚙️ Configuration  [First-time Setup Wizard]       │
│                                                      │
│              [🚀 Launch Web UI]                       │
└─────────────────────────────────────────────────────┘
```

**Behavior:**
- First run → launches config wizard (API Key, Embedding mode)
- Config saved to `~/.pca/config.yaml`
- "Launch" → runs `streamlit run pca_lite/web/app.py --server.port 8501` in project folder

### 3. Config Wizard (`launcher/config_wizard.py`)

- Step 1: LLM Provider selection (openai/anthropic/ollama)
- Step 2: API Key and endpoint
- Step 3: Embedding mode (api/local) + model path/credentials
- Validates and saves to `~/.pca/config.yaml`

### 4. PyInstaller Spec (`launcher/pca_lite.spec`)

- `--onefile --console` (console window for errors)
- Includes Python runtime + venv
- Icon: default or custom

## File Structure

```
launcher/
├── __init__.py
├── main_launcher.py      # Main GUI window
├── config_wizard.py      # First-time setup wizard
├── requirements.txt      # ttkbootstrap, etc.
start.bat                 # Bootstrap script
build.bat                # PyInstaller build command
pca_lite.spec            # PyInstaller spec file
```

## Launch Flow

```
start.bat
  → Check Python
  → Create .venv if missing
  → pip install -e .
  → python -m launcher.main_launcher
      → Check config exists?
          → No → config_wizard.py
      → GUI main window
          → Launch clicked → subprocess.Popen(streamlit)
```

## Implementation Tasks

1. Create `launcher/` directory with `__init__.py`
2. Implement `config_wizard.py` (4-step wizard)
3. Implement `main_launcher.py` (project folder + topic + files + launch)
4. Create `start.bat` (bootstrap)
5. Create `build.bat` (PyInstaller build)
6. Create `pca_lite.spec`
7. Test full flow: start.bat → GUI → launch → Streamlit opens

## Dependencies (for launcher)

- `ttkbootstrap` (modern UI)
- `pyinstaller` (packaging)
- Standard library: `subprocess`, `pathlib`, `tkinter`