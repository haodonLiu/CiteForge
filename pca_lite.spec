# -*- mode: python ; coding: utf-8 -*-

import sys
import os
from pathlib import Path

block_cipher = None

# Get project root
project_root = Path(SPECPATH).parent

a = Analysis(
    ['launcher/main_launcher.py'],
    pathex=[str(project_root)],
    binaries=[],
    datas=[
        (str(project_root / 'pca_lite'), 'pca_lite'),
        (str(project_root / 'config.yaml'), '.'),
    ],
    hiddenimports=[
        'pca_lite',
        'pca_lite.core',
        'pca_lite.core.models',
        'pca_lite.core.enums',
        'pca_lite.core.consts',
        'pca_lite.core.exceptions',
        'pca_lite.workspace',
        'pca_lite.workspace.manager',
        'pca_lite.orchestrator',
        'pca_lite.orchestrator.engine',
        'pca_lite.agents',
        'pca_lite.agents.researcher',
        'pca_lite.agents.analyst',
        'pca_lite.agents.writer',
        'pca_lite.ingestion',
        'pca_lite.retrieval',
        'pca_lite.llm',
        'pca_lite.search',
        'pca_lite.web',
        'pca_lite.web.app',
        'pca_lite.export',
        'launcher.config_wizard',
        'launcher.main_launcher',
        'ttkbootstrap',
        'yaml',
        'pydantic',
        'pydantic_settings',
        'typer',
        'rich',
        'httpx',
        'streamlit',
        'chromadb',
        'pymupdf',
        'sentence_transformers',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='pca_lite_launcher',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

# Alternative: single file executable (slower startup but single file)
# Uncomment below for onefile mode:
# exe = EXE(pyz, a.scripts, a.binaries, a.zipfiles, [],
#           name='pca_lite_launcher',
#           debug=False,
#           runtime_tmpdir=None,
#           console=True,
#           onefile=True,
#           icon='')  # Add icon path here if needed